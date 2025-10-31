import { TradeDecision, validateTrade, calculateRiskReward } from './utils/trade-validators';
import { initializeBotClients, validateTradingConditions } from './utils/bot-initializer';
import { executeAndSaveTradeWithValidation, handleBotError } from './utils/bot-executor';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { logMarketInfo } from './utils/market-data-logger';
import EmaAnalyzer from '../analyzers/emaAnalyzer';
import * as dotenv from 'dotenv';
import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';

dotenv.config();

interface MarketData {
  price24h: number[];
  currentPrice: number;
}



class EmaTradingBot {
  private binancePublic: BinancePublicClient;
  private binancePrivate: BinancePrivateClient;
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    this.binancePublic = new BinancePublicClient();
    this.binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
    this.emaAnalyzer = new EmaAnalyzer({ fastPeriod: 12, slowPeriod: 26 });
  }

  private logBotInfo() {
    logBotHeader('EMA TRADING BOT', 'Médias Móveis Exponenciais (EMA 12/26)');
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const klines = await this.binancePublic.getKlines(symbol, '1h', 26);
    const prices = klines.map((k: any) => parseFloat(k[4])); // Close prices
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
    console.log('\n📊 Analisando mercado com EMA 12/26...');

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
      'emaTradingBot.json',
      'EMA'
    );
  }

  async executeTrade(symbol: string = 'BTCUSDT') {
    this.logBotInfo();

    try {
      // 1. Verificar trades ativos
      if (!await validateTradingConditions(this.binancePrivate)) {
        return null;
      }

      // 2. Obter dados de mercado
      const marketData = await this.getMarketData(symbol);

      // 3. Analisar com EMA
      const decision = this.analyzeWithEma(symbol, marketData);

      // 4. Validar decisão
      if (!this.validateDecision(decision)) {
        return null;
      }

      // 5. Executar trade
      return await this.executeAndSave(decision);

    } catch (error) {
      return handleBotError('EMA Trading Bot', error);
    }
  }


}

async function main() {
  const clients = await initializeBotClients();
  if (!clients) return;

  const emaBot = new EmaTradingBot(clients.binancePrivate.constructor.arguments[0], clients.binancePrivate.constructor.arguments[1]);
  await emaBot.executeTrade('BTCUSDT');
}

logBotStartup(
  'EMA Bot',
  '📊 Estratégia: Médias Móveis Exponenciais (EMA 12/26)'
).then(() => main());