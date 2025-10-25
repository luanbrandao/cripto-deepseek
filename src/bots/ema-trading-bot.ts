import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { TradeExecutor } from './services/trade-executor';
import { RiskManager } from './services/risk-manager';
import { TRADING_CONFIG } from './config/trading-config';
import EmaAnalyzer from '../analyzers/emaAnalyzer';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
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
    console.log('🚀 EMA TRADING BOT - ESTRATÉGIA EMA 12/26');
    console.log('⚠️  ATENÇÃO: Este bot executará ordens reais na Binance!');
    console.log(`💵 Valor por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%\n`);
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const klines = await this.binancePublic.getKlines(symbol, '1h', 26);
    const prices = klines.map((k: any) => parseFloat(k[4])); // Close prices
    const currentPrice = prices[prices.length - 1];

    const price = await this.binancePublic.getPrice(symbol);
    const stats = await this.binancePublic.get24hrStats(symbol);

    console.log(`💰 ${symbol}: $${parseFloat(price.price).toLocaleString()}`);
    console.log(`📈 Variação 24h: ${parseFloat(stats.priceChangePercent).toFixed(2)}%`);
    console.log(`📊 Volume 24h: ${parseFloat(stats.volume).toLocaleString()} ${symbol}`);

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
    if (decision.action === 'HOLD') {
      console.log('⏸️ EMA recomenda aguardar - mercado sem sinal claro');
      return false;
    }

    if (decision.confidence < TRADING_CONFIG.MIN_CONFIDENCE) {
      console.log(`⏸️ Confiança ${decision.confidence}% < ${TRADING_CONFIG.MIN_CONFIDENCE}% mínimo`);
      return false;
    }

    console.log(`✅ Sinal EMA aprovado: ${decision.action} com ${decision.confidence}% confiança`);
    return true;
  }

  private async executeAndSave(decision: TradeDecision) {
    const orderResult = await TradeExecutor.executeRealTrade(decision, this.binancePrivate);
    await this.saveTradeHistory(decision, orderResult);

    if (orderResult) {
      console.log('\n🎯 EMA TRADE EXECUTADO COM SUCESSO!');
      console.log('📱 Monitore a posição');
      console.log('⚠️  Trading automatizado envolve riscos!');
    }

    return orderResult;
  }

  async executeTrade(symbol: string = 'BTCUSDT') {
    this.logBotInfo();

    try {
      // 1. Obter dados de mercado
      const marketData = await this.getMarketData(symbol);

      // 2. Analisar com EMA
      const decision = this.analyzeWithEma(symbol, marketData);

      // 3. Validar decisão
      if (!this.validateDecision(decision)) {
        return null;
      }

      // 4. Executar trade
      return await this.executeAndSave(decision);

    } catch (error) {
      console.error('❌ Erro no EMA Trading Bot:', error);
      return null;
    }
  }

  private async saveTradeHistory(decision: TradeDecision, orderResult: any) {
    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);

    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: decision.symbol,
      action: decision.action,
      price: decision.price,
      entryPrice: decision.price,
      targetPrice: decision.action === 'BUY' 
        ? decision.price * (1 + rewardPercent) 
        : decision.price * (1 - rewardPercent),
      stopPrice: decision.action === 'BUY' 
        ? decision.price * (1 - riskPercent) 
        : decision.price * (1 + riskPercent),
      amount: orderResult ? TRADING_CONFIG.TRADE_AMOUNT_USD : 0,
      balance: 0,
      crypto: 0,
      reason: decision.reason,
      confidence: decision.confidence,
      status: orderResult ? 'pending' : 'completed',
      riskReturn: {
        potentialGain: decision.price * rewardPercent,
        potentialLoss: decision.price * riskPercent,
        riskRewardRatio: rewardPercent / riskPercent
      }
    };

    if (orderResult) {
      trade.result = undefined;
      trade.exitPrice = undefined;
      trade.actualReturn = undefined;
    }

    const tradesFile = path.join(__dirname, 'trades/emaTradingBot.json');
    TradeStorage.saveTrades([trade], tradesFile);
    console.log('\n💾 Trade salvo no histórico: emaTradingBot.json');
  }
}

async function main() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ Chaves da Binance não encontradas no .env');
    return;
  }

  const emaBot = new EmaTradingBot(apiKey, apiSecret);
  await emaBot.executeTrade('BTCUSDT');
}

console.log('⚠️  ATENÇÃO: EMA Bot executará ordens REAIS na Binance!');
console.log('📊 Estratégia: Médias Móveis Exponenciais (EMA 12/26)');
console.log('🛑 Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');

setTimeout(() => {
  main();
}, 5000);