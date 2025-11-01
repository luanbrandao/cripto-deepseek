import { BaseTradingBot } from './base-trading-bot';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { calculateRiskReward } from './utils/trade-validators';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { analyzeWithDeepSeek } from './utils/deepseek-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from './utils/env-validator';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';
import { TradeExecutor } from './services/trade-executor';

dotenv.config();

export class SmartTradingBot extends BaseTradingBot {
  private trendAnalyzer: MarketTrendAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
    this.trendAnalyzer = new MarketTrendAnalyzer();
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

  async executeTrade() {
    this.logBotInfo();

    try {
      if (!await checkActiveTradesLimit(this.binancePrivate)) {
        return null;
      }

      const symbols = this.getSymbols();
      const bestAnalysis = await analyzeMultipleSymbols(
        symbols,
        this.binancePublic,
        this.deepseek!,
        async (analysis: string, symbol: string, price: number) => {
          return await analyzeWithDeepSeek(this.deepseek!, symbol, { price: { price: price.toString() }, stats: {} });
        }
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
      const { riskPercent, rewardPercent } = calculateRiskReward(boostedDecision.confidence);
      console.log(`📊 R/R calculado: ${(rewardPercent * 100).toFixed(1)}%/${(riskPercent * 100).toFixed(1)}% (${(rewardPercent / riskPercent).toFixed(1)}:1)`);

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