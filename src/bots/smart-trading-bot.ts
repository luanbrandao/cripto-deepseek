import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { TradeExecutor } from './services/trade-executor';
import { AnalysisParser } from './services/analysis-parser';
import { RiskManager } from './services/risk-manager';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

class SmartTradingBot {
  private binancePublic: BinancePublicClient;
  private binancePrivate: BinancePrivateClient;
  private deepseek: DeepSeekService;
  private trendAnalyzer: MarketTrendAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    this.binancePublic = new BinancePublicClient();
    this.binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
    this.deepseek = new DeepSeekService();
    this.trendAnalyzer = new MarketTrendAnalyzer();
  }


  private logBotInfo() {
    console.log('🚀 SMART TRADING BOT - ANÁLISE DUPLA (EMA + DEEPSEEK AI)');
    console.log('⚠️  ATENÇÃO: Este bot executará ordens reais na Binance!');
    console.log(`💵 Valor por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%\n`);
  }

  private async getMarketData(symbol: string) {
    const price = await this.binancePublic.getPrice(symbol);
    const stats = await this.binancePublic.get24hrStats(symbol);
    const klines = await this.binancePublic.getKlines(symbol, '1h', 24);

    this.logMarketInfo(symbol, price, stats);
    
    return { price, stats, klines };
  }

  private logMarketInfo(symbol: string, price: any, stats: any) {
    console.log(`💰 ${symbol}: $${parseFloat(price.price).toLocaleString()}`);
    console.log(`📈 Variação 24h: ${parseFloat(stats.priceChangePercent).toFixed(2)}%`);
    console.log(`📊 Volume 24h: ${parseFloat(stats.volume).toLocaleString()} ${symbol}`);
  }

  private async analyzeWithDeepSeek(symbol: string, marketData: any) {
    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    
    const analysis = await this.deepseek.analyzeMarket(
      marketData,
      `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`
    );

    console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
    console.log(analysis.substring(0, 500) + '...');

    return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
  }

  private validateTrendAnalysis(trendAnalysis: any): boolean {
    if (!trendAnalysis.isUptrend) {
      console.log('❌ MERCADO NÃO ESTÁ EM TENDÊNCIA DE ALTA');
      console.log('⏸️ Trading cancelado - aguardando condições favoráveis');
      console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
      return false;
    }

    console.log('✅ TENDÊNCIA DE ALTA CONFIRMADA PELO EMA');
    console.log('🎯 Prosseguindo com análise DeepSeek AI...\n');
    return true;
  }

  private validateDeepSeekDecision(decision: any): boolean {
    if (decision.action !== 'BUY') {
      console.log('⏸️ DeepSeek não recomenda compra - aguardando');
      return false;
    }
    return true;
  }

  private boostConfidence(decision: any) {
    const boostedConfidence = Math.min(95, decision.confidence + 10);
    decision.confidence = boostedConfidence;
    decision.reason = `${decision.reason} + Tendência de alta confirmada pelo EMA`;
    
    console.log('🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM COMPRA!');
    return decision;
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

  async executeTrade(symbol: string = 'BTCUSDT') {
    this.logBotInfo();

    try {
      // 1. Verificar trades ativos
      if (!await checkActiveTradesLimit(this.binancePrivate)) {
        return null;
      }

      // 2. Verificar tendência com EMA
      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
      if (!this.validateTrendAnalysis(trendAnalysis)) {
        return null;
      }

      // 3. Obter dados de mercado e analisar com DeepSeek
      const marketData = await this.getMarketData(symbol);
      const decision = await this.analyzeWithDeepSeek(symbol, marketData);

      // 4. Validar decisão do DeepSeek
      if (!this.validateDeepSeekDecision(decision)) {
        return null;
      }

      // 5. Boost de confiança e executar trade
      const boostedDecision = this.boostConfidence(decision);
      return await this.executeAndSave(boostedDecision);

    } catch (error) {
      console.error('❌ Erro no Smart Trading Bot:', error);
      return null;
    }
  }

  private async saveTradeHistory(decision: any, orderResult: any) {
    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);

    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: decision.symbol,
      action: decision.action,
      price: decision.price,
      entryPrice: decision.price,
      targetPrice: decision.price * (1 + rewardPercent),
      stopPrice: decision.price * (1 - riskPercent),
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

    const tradesFile = path.join(__dirname, 'trades/smartTradingBot.json');
    TradeStorage.saveTrades([trade], tradesFile);
    console.log('\n💾 Trade salvo no histórico: smartTradingBot.json');
  }
}

async function main() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ Chaves da Binance não encontradas no .env');
    return;
  }

  const smartBot = new SmartTradingBot(apiKey, apiSecret);
  await smartBot.executeTrade('BTCUSDT');
}

console.log('⚠️  ATENÇÃO: Smart Bot executará ordens REAIS na Binance!');
console.log('🧠 Análise dupla: EMA + DeepSeek AI para máxima precisão');
console.log('🛑 Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');

setTimeout(() => {
  main();
}, 5000);