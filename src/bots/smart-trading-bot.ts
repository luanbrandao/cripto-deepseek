import { BaseTradingBot } from './base-trading-bot';
import { BotFlowManager, BotConfig } from './utils/bot-flow-manager';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { calculateRiskRewardDynamic, validateConfidence } from './utils/trade-validators';
import { calculateTargetAndStopPrices } from './utils/price-calculator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { analyzeWithSmartTrade } from './analyzers/smart-trade-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from './utils/env-validator';
import EmaAnalyzer from '../analyzers/emaAnalyzer';

dotenv.config();

export class SmartTradingBot extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
    
    const config: BotConfig = {
      name: 'Smart Trading Bot',
      isSimulation: false,
      tradesFile: TRADING_CONFIG.FILES.SMART_BOT,
      requiresFiltering: true,
      requiresValidation: true
    };
    
    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL SMART TRADING BOT', 'Análise Dupla (EMA + DeepSeek AI) + Múltiplas Moedas');
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await analyzeWithSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByEma(symbols: string[]): Promise<string[]> {
    const validSymbols = [];
    
    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });
      
      if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
        validSymbols.push(symbol);
      }
    }
    
    return validSymbols;
  }

  private async validateSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;
    // 1. Validar tendência EMA
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, false)) return false; // false = real trading

    // 2. Validar decisão DeepSeek
    if (!validateDeepSeekDecision(decision)) return false;

    // 3. Aplicar boost inteligente
    const boostedDecision = boostConfidence(decision);

    // 4. Validação de confiança mínima (OBRIGATÓRIA)
    console.log('🔍 Validação de confiança mínima...');
    if (!validateConfidence(boostedDecision)) {
      console.log('❌ Trade cancelado - Confiança insuficiente');
      return false;
    }

    // 5. Validação de Risk/Reward
    console.log('🔍 Validação final de Risk/Reward antes da execução...');
    
    const { targetPrice, stopPrice } = calculateTargetAndStopPrices(
      boostedDecision.price, 
      boostedDecision.confidence, 
      boostedDecision.action
    );
    
    const riskRewardResult = calculateRiskRewardDynamic(
      boostedDecision.price, 
      targetPrice, 
      stopPrice, 
      boostedDecision.action
    );
    
    if (!riskRewardResult.isValid) {
      console.log('❌ Trade cancelado - Risk/Reward insuficiente');
      return false;
    }

    // Atualizar decisão com boost
    Object.assign(decision, boostedDecision);
    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeWithSmartTradeLogic.bind(this),
      this.filterSymbolsByEma.bind(this),
      this.validateSmartDecision.bind(this)
    );
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