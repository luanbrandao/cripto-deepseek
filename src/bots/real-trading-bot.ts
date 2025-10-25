import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { TradeExecutor } from './services/trade-executor';
import { AnalysisParser } from './services/analysis-parser';
import { RiskManager } from './services/risk-manager';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';

dotenv.config();

async function main() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ Chaves da Binance não encontradas no .env');
    return;
  }

  const binancePublic = new BinancePublicClient();
  const binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
  const deepseek = new DeepSeekService();

  console.log('🚀 INICIANDO BOT DE TRADING REAL COM DEEPSEEK AI');
  console.log('⚠️  ATENÇÃO: Este bot executará ordens reais na Binance!');
  console.log(`💵 Valor por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
  console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%`);
  console.log(`🎯 Risk/Reward: Dinâmico (mínimo ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1 para executar)\n`);

  try {
    if (!await checkActiveTradesLimit(binancePrivate)) {
      return;
    }

    const symbol = 'BNBUSDT';
    const price = await binancePublic.getPrice(symbol);
    const stats = await binancePublic.get24hrStats(symbol);
    const klines = await binancePublic.getKlines(symbol, '1h', 24);

    console.log(`💰 ${symbol}: $${parseFloat(price.price).toLocaleString()}`);
    console.log(`📈 Variação 24h: ${parseFloat(stats.priceChangePercent).toFixed(2)}%`);
    console.log(`📊 Volume 24h: ${parseFloat(stats.volume).toLocaleString()} ${symbol}`);

    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    const analysis = await deepseek.analyzeMarket(
      { price, stats, klines },
      `Analyze ${symbol} market data including 24h klines. Provide a CLEAR trading recommendation: BUY, SELL, or HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators.`
    );

    console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
    console.log(analysis.substring(0, 500) + '...');

    const decision = await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(price.price));
    const orderResult = await TradeExecutor.executeRealTrade(decision, binancePrivate);

    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);

    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: decision.symbol,
      action: decision.action,
      price: decision.price,
      entryPrice: decision.price,
      targetPrice: decision.action === 'BUY' ? decision.price * (1 + rewardPercent) : decision.price * (1 - rewardPercent),
      stopPrice: decision.action === 'BUY' ? decision.price * (1 - riskPercent) : decision.price * (1 + riskPercent),
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

    const tradesFile = path.join(__dirname, 'trades/realTradingBot.json');
    TradeStorage.saveTrades([trade], tradesFile);
    console.log('\n💾 Trade salvo no histórico: realTradingBot.json');

    if (orderResult) {
      console.log('\n🎯 TRADE EXECUTADO COM SUCESSO!');
      console.log('📱 Monitore a posição e defina stop loss/take profit manualmente');
      console.log('⚠️  Lembre-se: Trading automatizado envolve riscos!');
    }

  } catch (error) {
    console.error('❌ Erro no Trading Bot:', error);
  }
}

console.log('⚠️  ATENÇÃO: Este bot executará ordens REAIS na Binance!');
console.log('💰 Certifique-se de que entende os riscos envolvidos');
console.log('🛑 Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');

setTimeout(() => {
  main();
}, 5000);