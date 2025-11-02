import { BaseTradingBot } from './base-trading-bot';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from './utils/trade-validators';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { analyzeWithSmartTrade } from './analyzers/smart-trade-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from './utils/env-validator';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';
import { TradeExecutor } from './services/trade-executor';
import EmaAnalyzer from '../analyzers/emaAnalyzer';

dotenv.config();

export class SmartTradingBot extends BaseTradingBot {
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL SMART TRADING BOT', 'Análise Dupla (EMA + DeepSeek AI) + Múltiplas Moedas');
  }

  private async executeAndSave(decision: any) {
    const orderResult = await TradeExecutor.executeRealTrade(decision, this.binancePrivate);
    await this.saveTradeHistory(decision, orderResult);

    if (orderResult) {
      console.log('\n🎯 SMART TRADE EXECUTADO COM SUCESSO!');
      console.log('📱 Monitore a posição');
      console.log('⚠️  Trading automatizado envolve riscos!');
    }

    return orderResult;
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await analyzeWithSmartTrade(this.deepseek!, symbol, marketData);
  }

  async executeTrade() {
    this.logBotInfo();

    try {
      if (!await checkActiveTradesLimit(this.binancePrivate)) {
        return null;
      }

      const symbols = this.getSymbols();
      
      // Filtrar símbolos com EMA de alta primeiro
      const validSymbols = [];
      for (const symbol of symbols) {
        const klines = await this.binancePublic.getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
        const prices = klines.map((k: any) => parseFloat(k[4]));
        const currentPrice = prices[prices.length - 1];
        const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });
        
        if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
          validSymbols.push(symbol);
        }
      }
      
      if (validSymbols.length === 0) {
        console.log('\n⏸️ Nenhuma moeda com EMA de alta encontrada');
        return null;
      }
      
      const bestAnalysis = await analyzeMultipleSymbols(
        validSymbols,
        this.binancePublic,
        this.analyzeWithSmartTradeLogic.bind(this),
        this.binancePrivate,
        false,
        TRADING_CONFIG.FILES.SMART_BOT
      );
      
      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de trade encontrada');
        return null;
      }

      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(bestAnalysis.symbol);
      if (!validateTrendAnalysis(trendAnalysis)) {
        return null;
      }

      if (!validateDeepSeekDecision(bestAnalysis.decision)) {
        return null;
      }

      const boostedDecision = boostConfidence(bestAnalysis.decision);

      console.log('🔍 Validação final de Risk/Reward antes da execução...');
      
      // Calcular target e stop prices baseados na confiança
      const riskPercent = boostedDecision.confidence >= 80 ? 0.5 : boostedDecision.confidence >= 75 ? 1.0 : 1.5;
      const targetPrice = boostedDecision.price * (1 + (riskPercent * 2) / 100);
      const stopPrice = boostedDecision.price * (1 - riskPercent / 100);
      
      const riskRewardResult = calculateRiskRewardDynamic(boostedDecision.price, targetPrice, stopPrice, boostedDecision.action);
      
      if (!riskRewardResult.isValid) {
        console.log('❌ Trade cancelado - Risk/Reward insuficiente');
        return null;
      }

      return await this.executeAndSave(boostedDecision);

    } catch (error) {
      console.error('❌ Erro no Smart Trading Bot:', error);
      return null;
    }
  }

  private async saveTradeHistory(decision: any, orderResult: any) {
    const trade = createTradeRecord(decision, orderResult, TRADING_CONFIG.FILES.SMART_BOT);
    saveTradeHistory(trade, TRADING_CONFIG.FILES.SMART_BOT);
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const smartBot = new SmartTradingBot(apiKey, apiSecret);
    await smartBot.executeTrade();
  }

  logBotStartup(
    'Smart Bot',
    '🧠 Análise dupla: EMA + DeepSeek AI para máxima precisão'
  ).then(() => main());
}