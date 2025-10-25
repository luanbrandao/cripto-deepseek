import { BinancePublicClient } from './clients/binance-public-client';
import { DeepSeekService } from './clients/deepseek-client';
import { biancenPublicApi } from './examples/binance-public-api';
import { TradeStorage, Trade } from './storage/trade-storage';
import * as path from 'path';

async function main() {
  const binancePublic = new BinancePublicClient();
  const deepseek = new DeepSeekService();

  try {
    // Usar cliente público da Binance
    const btcPrice = await binancePublic.getPrice('SOLUSDT');
    const btcStats = await binancePublic.get24hrStats('SOLUSDT');

    console.log('BTC Price:', btcPrice);
    console.log('BTC 24h Stats:', btcStats);

    // Analisar com DeepSeek
    const analysis = await deepseek.analyzeMarket(
      { price: btcPrice, stats: btcStats },
      'Analyze this Bitcoin market data and provide trading insights.'
    );

    console.log('DeepSeek Analysis:', analysis);

    // Salvar trade no histórico
    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: 'SOLUSDT',
      action: 'ANALYSIS',
      price: parseFloat(btcPrice.price),
      entryPrice: parseFloat(btcPrice.price),
      targetPrice: parseFloat(btcPrice.price) * 1.02,
      stopPrice: parseFloat(btcPrice.price) * 0.98,
      amount: 0,
      balance: 0,
      crypto: 0,
      reason: 'DeepSeek AI Analysis',
      confidence: 75,
      status: 'completed',
      riskReturn: {
        potentialGain: parseFloat(btcPrice.price) * 0.02,
        potentialLoss: parseFloat(btcPrice.price) * 0.02,
        riskRewardRatio: 1.0
      },
      result: 'win',
      exitPrice: parseFloat(btcPrice.price),
      actualReturn: 0
    };

    const tradesFile = path.join(__dirname, 'trades/deepseekTrades.json');
    TradeStorage.saveTrades([trade], tradesFile);
    console.log('💾 Trade salvo no histórico');

    // Executar exemplo público
    console.log('\n--- Public Client Example ---');
    await biancenPublicApi();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();