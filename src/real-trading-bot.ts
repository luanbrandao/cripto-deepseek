import { BinancePublicClient } from './clients/binance-public-client';
import { BinancePrivateClient } from './clients/binance-private-client';
import { DeepSeekService } from './clients/deepseek-client';
import { TradeStorage, Trade } from './storage/trade-storage';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
}

const TRADE_AMOUNT_USD = 20;
const MIN_CONFIDENCE = 70;

async function parseDeepSeekAnalysis(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
  const analysisLower = analysis.toLowerCase();

  if (analysisLower.includes('strong buy') || analysisLower.includes('breakout above')) {
    return { action: 'BUY', confidence: 85, reason: 'DeepSeek AI: Sinal forte de compra', symbol, price };
  }

  if (analysisLower.includes('buy') || analysisLower.includes('bullish')) {
    return { action: 'BUY', confidence: 75, reason: 'DeepSeek AI: Tendência de alta identificada', symbol, price };
  }

  if (analysisLower.includes('strong sell') || analysisLower.includes('break below')) {
    return { action: 'SELL', confidence: 80, reason: 'DeepSeek AI: Sinal forte de venda', symbol, price };
  }

  if (analysisLower.includes('sell') || analysisLower.includes('bearish')) {
    return { action: 'SELL', confidence: 70, reason: 'DeepSeek AI: Tendência de baixa identificada', symbol, price };
  }

  return { action: 'HOLD', confidence: 50, reason: 'DeepSeek AI: Mercado indefinido', symbol, price };
}

async function executeRealTrade(decision: TradeDecision, binancePrivate: BinancePrivateClient) {
  console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
  console.log(`📊 Confiança: ${decision.confidence}%`);
  console.log(`💭 Razão: ${decision.reason}`);

  if (decision.action === 'HOLD' || decision.confidence < MIN_CONFIDENCE) {
    console.log(`⏸️ Trade não executado - Confiança ${decision.confidence}% < ${MIN_CONFIDENCE}% mínimo`);
    return null;
  }

  try {
    const accountInfo = await binancePrivate.getAccountInfo();
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT');
    const usdtFree = parseFloat(usdtBalance?.free || '0');

    console.log(`💰 Saldo USDT disponível: $${usdtFree.toFixed(2)}`);

    if (decision.action === 'BUY' && usdtFree < TRADE_AMOUNT_USD) {
      console.log(`❌ Saldo insuficiente para compra. Necessário: $${TRADE_AMOUNT_USD}, Disponível: $${usdtFree.toFixed(2)}`);
      return null;
    }

    if (decision.action === 'SELL') {
      const baseAsset = decision.symbol.replace('USDT', '');
      const assetBalance = accountInfo.balances.find((b: any) => b.asset === baseAsset);
      const assetFree = parseFloat(assetBalance?.free || '0');
      const assetValueUSD = assetFree * decision.price;

      console.log(`🪙 Saldo ${baseAsset}: ${assetFree.toFixed(6)} (~$${assetValueUSD.toFixed(2)})`);

      if (assetValueUSD < TRADE_AMOUNT_USD) {
        console.log(`❌ Saldo insuficiente de ${baseAsset} para venda. Necessário: ~$${TRADE_AMOUNT_USD}`);
        return null;
      }
    }

    console.log(`\n🚨 EXECUTANDO ORDEM REAL NA BINANCE 🚨`);
    console.log(`📝 ${decision.action} ${decision.symbol} - Valor: $${TRADE_AMOUNT_USD}`);

    const orderResult = await binancePrivate.createMarketOrder(
      decision.symbol,
      decision.action,
      TRADE_AMOUNT_USD
    );

    console.log('✅ Ordem executada com sucesso!');
    console.log(`🆔 Order ID: ${orderResult.orderId}`);
    console.log(`💱 Quantidade: ${orderResult.executedQty}`);
    console.log(`💰 Preço médio: $${orderResult.fills?.[0]?.price || decision.price}`);

    // Criar ordens de stop loss e take profit
    const executedQty = parseFloat(orderResult.executedQty);
    const avgPrice = parseFloat(orderResult.fills?.[0]?.price || decision.price);

    try {
      if (decision.action === 'BUY') {
        // Take Profit (venda com limite acima do preço atual)
        const takeProfitPrice = (avgPrice * 1.02).toFixed(2);
        const tpOrder = await binancePrivate.createLimitOrder(
          decision.symbol,
          'SELL',
          executedQty,
          parseFloat(takeProfitPrice)
        );
        console.log(`🎯 Take Profit criado: ${tpOrder.orderId} @ $${takeProfitPrice}`);

        // Stop Loss automático
        const stopLossPrice = (avgPrice * 0.98).toFixed(2);
        const slOrder = await binancePrivate.createStopLossOrder(
          decision.symbol,
          'SELL',
          executedQty,
          parseFloat(stopLossPrice)
        );
        console.log(`🛑 Stop Loss criado: ${slOrder.orderId} @ $${stopLossPrice}`);

      } else if (decision.action === 'SELL') {
        // Para vendas, criar ordens inversas
        const takeProfitPrice = (avgPrice * 0.98).toFixed(2);
        const tpOrder = await binancePrivate.createLimitOrder(
          decision.symbol,
          'BUY',
          executedQty,
          parseFloat(takeProfitPrice)
        );
        console.log(`🎯 Take Profit criado: ${tpOrder.orderId} @ $${takeProfitPrice}`);

        const stopLossPrice = (avgPrice * 1.02).toFixed(2);
        const slOrder = await binancePrivate.createStopLossOrder(
          decision.symbol,
          'BUY',
          executedQty,
          parseFloat(stopLossPrice)
        );
        console.log(`🛑 Stop Loss criado: ${slOrder.orderId} @ $${stopLossPrice}`);
      }
    } catch (tpError: any) {
      console.log('⚠️ Erro ao criar Take Profit automático:', tpError.response?.data?.msg || tpError.message);
      console.log('📱 Configure stop loss e take profit manualmente');
    }

    return orderResult;

  } catch (error: any) {
    console.error('❌ Erro ao executar ordem real:', error.response?.data || error.message);
    return null;
  }
}

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
  console.log(`💵 Valor por trade: $${TRADE_AMOUNT_USD}`);
  console.log(`📊 Confiança mínima: ${MIN_CONFIDENCE}%\n`);

  try {
    const symbol = 'BTCUSDT';
    const price = await binancePublic.getPrice(symbol);
    const stats = await binancePublic.get24hrStats(symbol);
    const klines = await binancePublic.getKlines(symbol, '1h', 24);

    console.log(`💰 ${symbol}: $${parseFloat(price.price).toLocaleString()}`);
    console.log(`📈 Variação 24h: ${parseFloat(stats.priceChangePercent).toFixed(2)}%`);
    console.log(`📊 Volume 24h: ${parseFloat(stats.volume).toLocaleString()} BTC`);

    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    const analysis = await deepseek.analyzeMarket(
      { price, stats, klines },
      `Analyze ${symbol} market data including 24h klines. Provide a CLEAR trading recommendation: BUY, SELL, or HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators.`
    );

    console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
    console.log(analysis.substring(0, 500) + '...');

    const decision = await parseDeepSeekAnalysis(analysis, symbol, parseFloat(price.price));
    const orderResult = await executeRealTrade(decision, binancePrivate);

    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: decision.symbol,
      action: decision.action,
      price: decision.price,
      entryPrice: decision.price,
      targetPrice: decision.action === 'BUY' ? decision.price * 1.02 : decision.price * 0.98,
      stopPrice: decision.action === 'BUY' ? decision.price * 0.98 : decision.price * 1.02,
      amount: orderResult ? TRADE_AMOUNT_USD : 0,
      balance: 0,
      crypto: 0,
      reason: decision.reason,
      confidence: decision.confidence,
      status: orderResult ? 'pending' : 'completed',
      riskReturn: {
        potentialGain: decision.price * 0.02,
        potentialLoss: decision.price * 0.02,
        riskRewardRatio: 1.0
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