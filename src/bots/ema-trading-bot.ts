import { BaseTradingBot } from './base-trading-bot';
import { BotFlowManager, BotConfig } from './utils/bot-flow-manager';
import { TradeDecision, validateTrade, calculateRiskReward } from './utils/trade-validators';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { logMarketInfo } from './utils/market-data-logger';
import { validateBinanceKeys } from './utils/env-validator';
import { TRADING_CONFIG } from './config/trading-config';
import EmaAnalyzer from '../analyzers/emaAnalyzer';
import * as dotenv from 'dotenv';

dotenv.config();

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

export class EmaTradingBot extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, false);
    
    const config: BotConfig = {
      name: 'Multi-Symbol EMA Trading Bot',
      isSimulation: false,
      tradesFile: TRADING_CONFIG.FILES.EMA_BOT,
      requiresValidation: true
    };
    
    this.flowManager = new BotFlowManager(this, config);
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL EMA TRADING BOT', `Médias Móveis Exponenciais (EMA ${TRADING_CONFIG.EMA.FAST_PERIOD}/${TRADING_CONFIG.EMA.SLOW_PERIOD}) + Múltiplas Moedas`);
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const klines = await this.getBinancePublic().getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    return {
      price24h: prices,
      currentPrice
    };
  }

  private analyzeWithEma(symbol: string, marketData: MarketData): TradeDecision {
    console.log(`\n📊 Analisando mercado com EMA ${TRADING_CONFIG.EMA.FAST_PERIOD}/${TRADING_CONFIG.EMA.SLOW_PERIOD}...`);

    const analysis = this.emaAnalyzer.analyze(marketData);

    console.log(`📈 Sinal EMA: ${analysis.action} (${analysis.confidence}%)`);
    console.log(`💭 Razão: ${analysis.reason}`);

    return {
      action: analysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: analysis.confidence,
      reason: analysis.reason,
      symbol,
      price: marketData.currentPrice
    };
  }

  private async analyzeSymbolWithEma(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return this.analyzeWithEma(symbol, fullMarketData);
  }

  private async validateEmaDecision(decision: TradeDecision): Promise<boolean> {
    const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
    return validateTrade(decision, riskPercent, rewardPercent);
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbolWithEma.bind(this),
      undefined,
      this.validateEmaDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const emaBot = new EmaTradingBot(apiKey, apiSecret);
    await emaBot.executeTrade();
  }

  logBotStartup(
    'EMA Bot',
    '📊 Estratégia: Médias Móveis Exponenciais (EMA 12/26)'
  ).then(() => main());
}