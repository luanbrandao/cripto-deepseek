import { BaseTradingBot } from './base-trading-bot';
import { TradeDecision, validateTrade, calculateRiskReward } from './utils/trade-validators';
import { validateTradingConditions } from './utils/bot-initializer';
import { executeAndSaveTradeWithValidation, handleBotError } from './utils/bot-executor';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { logMarketInfo } from './utils/market-data-logger';
import { validateBinanceKeys } from './utils/env-validator';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import EmaAnalyzer from '../analyzers/emaAnalyzer';
import * as dotenv from 'dotenv';

dotenv.config();

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

export class EmaTradingBot extends BaseTradingBot {
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, false);
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL EMA TRADING BOT', `Médias Móveis Exponenciais (EMA ${TRADING_CONFIG.EMA.FAST_PERIOD}/${TRADING_CONFIG.EMA.SLOW_PERIOD}) + Múltiplas Moedas`);
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const klines = await this.binancePublic.getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.binancePublic.getPrice(symbol);
    const stats = await this.binancePublic.get24hrStats(symbol);

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

  private validateDecision(decision: TradeDecision): boolean {
    const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
    return validateTrade(decision, riskPercent, rewardPercent);
  }

  private async executeAndSave(decision: TradeDecision) {
    return await executeAndSaveTradeWithValidation(
      decision,
      this.binancePrivate,
      TRADING_CONFIG.FILES.EMA_BOT,
      'EMA'
    );
  }

  async executeTrade() {
    this.logBotInfo();

    try {
      if (!await validateTradingConditions(this.binancePrivate)) {
        return null;
      }

      const symbols = this.getSymbols();
      const bestAnalysis = await analyzeMultipleSymbols(
        symbols,
        this.binancePublic,
        null, // No DeepSeek for EMA bot
        async (analysis: string, symbol: string, price: number) => {
          const marketData = await this.getMarketData(symbol);
          return this.analyzeWithEma(symbol, marketData);
        },
        this.binancePrivate
      );
      
      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade EMA encontrada');
        return null;
      }
      
      const decision = bestAnalysis.decision;
      
      if (!this.validateDecision(decision)) {
        return null;
      }

      return await this.executeAndSave(decision);

    } catch (error) {
      return handleBotError('Multi-Symbol EMA Trading Bot', error);
    }
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