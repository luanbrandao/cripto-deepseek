import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { logMarketInfo } from './utils/market-data-logger';
import { validateBinanceKeys } from './utils/env-validator';
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

// Simulação completa de trading (inclui verificação de conta da Binance e DeepSeek, NÃO FAZ TRADE REAL)
// apenas testa se está tudo funcionando antes de executar o real-trading-bot
async function parseDeepSeekAnalysis(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
  const analysisLower = analysis.toLowerCase();

  // Detectar sinais de compra
  if (analysisLower.includes('buy') || analysisLower.includes('bullish') ||
    analysisLower.includes('uptrend') || analysisLower.includes('breakout above')) {
    return {
      action: 'BUY',
      confidence: 75,
      reason: 'DeepSeek AI sugere compra baseado na análise técnica',
      symbol,
      price
    };
  }

  // Detectar sinais de venda
  if (analysisLower.includes('sell') || analysisLower.includes('bearish') ||
    analysisLower.includes('downtrend') || analysisLower.includes('break below')) {
    return {
      action: 'SELL',
      confidence: 70,
      reason: 'DeepSeek AI sugere venda baseado na análise técnica',
      symbol,
      price
    };
  }

  // Padrão: HOLD
  return {
    action: 'HOLD',
    confidence: 50,
    reason: 'DeepSeek AI sugere aguardar - mercado indefinido',
    symbol,
    price
  };
}

async function executeTradeDecision(decision: TradeDecision, binancePrivate: BinancePrivateClient) {
  console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
  console.log(`📊 Confiança: ${decision.confidence}%`);
  console.log(`💭 Razão: ${decision.reason}`);

  if (decision.action === 'HOLD') {
    console.log('⏸️ Nenhuma ação executada - aguardando melhor oportunidade');
    return null;
  }

  try {
    // Verificar saldo da conta
    const accountInfo = await binancePrivate.getAccountInfo();
    console.log('✅ Conta verificada - executando trade simulado');

    // SIMULAÇÃO - não executa ordem real
    console.log('🚨 MODO SIMULAÇÃO - Ordem não executada na exchange');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} @ $${decision.price}`);

    return {
      orderId: 'SIMULATED_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED'
    };

  } catch (error) {
    console.error('❌ Erro ao executar trade:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 ANÁLISE DE MERCADO COM DEEPSEEK AI e API privada da Binance');
  console.log('🚀 NÃO EXECUTA TRADE REAIS');

  const tradesFile = path.join(__dirname, 'trades/aiTradingBot.json');
  if (!checkActiveSimulationTradesLimit(tradesFile)) {
    return;
  }

  const keys = validateBinanceKeys();
  if (!keys) return;

  const { apiKey, apiSecret } = keys;

  const binancePublic = new BinancePublicClient();
  const binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
  const deepseek = new DeepSeekService();

  console.log('🚀 Iniciando Trading Bot com DeepSeek AI');

  try {
    // Obter dados de mercado
    const symbol = 'BTCUSDT';
    const price = await binancePublic.getPrice(symbol);
    const stats = await binancePublic.get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    // Analisar com DeepSeek
    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    const analysis = await deepseek.analyzeMarket(
      { price, stats },
      `Analyze ${symbol} market data and provide a clear BUY, SELL, or HOLD recommendation with reasoning.`
    );

    console.log('\n📋 Análise DeepSeek:');
    console.log(analysis.substring(0, 300) + '...');

    // Interpretar análise e tomar decisão
    const decision = await parseDeepSeekAnalysis(analysis, symbol, parseFloat(price.price));

    // Executar trade (simulado)
    const orderResult = await executeTradeDecision(decision, binancePrivate);

    // Salvar no histórico
    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: decision.symbol,
      action: decision.action,
      price: decision.price,
      entryPrice: decision.price,
      targetPrice: decision.action === 'BUY' ? decision.price * 1.03 : decision.price * 0.97,
      stopPrice: decision.action === 'BUY' ? decision.price * 0.98 : decision.price * 1.02,
      amount: orderResult ? 100 : 0, // $100 simulado
      balance: 1000, // Saldo simulado
      crypto: 0,
      reason: decision.reason,
      confidence: decision.confidence,
      status: orderResult ? 'pending' : 'completed',
      riskReturn: {
        potentialGain: decision.price * 0.03,
        potentialLoss: decision.price * 0.02,
        riskRewardRatio: 1.5
      }
    };

    if (orderResult) {
      trade.result = 'win'; // Simulado
      trade.exitPrice = decision.price;
      trade.actualReturn = 0;
    }

    const tradesFile = path.join(__dirname, 'trades/aiTradingBot.json');
    TradeStorage.saveTrades([trade], tradesFile);
    console.log('\n💾 Trade salvo no histórico: aiTradingBot.json');

    console.log('\n✅ Execução completa do Trading Bot');

  } catch (error) {
    console.error('❌ Erro no Trading Bot:', error);
  }
}

main();