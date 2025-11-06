import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { validateTrade, calculateRiskReward } from '../../utils/risk/trade-validators';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import { UNIFIED_TRADING_CONFIG } from '../../../shared/config/unified-trading-config';
import { BaseTradingBot } from '../../core/base-trading-bot';

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
      tradesFile: UNIFIED_TRADING_CONFIG.FILES.EMA_BOT
    };

    this.flowManager = new BotFlowManager(this, config);
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: UNIFIED_TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: UNIFIED_TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL EMA TRADING BOT v3.0 - REFATORADO', `Médias Móveis Exponenciais (EMA ${UNIFIED_TRADING_CONFIG.EMA.FAST_PERIOD}/${UNIFIED_TRADING_CONFIG.EMA.SLOW_PERIOD}) + Múltiplas Moedas`);
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const klines = await this.getBinancePublic().getKlines(symbol, UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME, UNIFIED_TRADING_CONFIG.CHART.PERIODS);
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
    console.log(`\n📊 Analisando mercado com EMA ${UNIFIED_TRADING_CONFIG.EMA.FAST_PERIOD}/${UNIFIED_TRADING_CONFIG.EMA.SLOW_PERIOD}...`);

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
  const main = async () => {
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