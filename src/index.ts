import { BinancePublicClient } from './clients/binance-public-client';
import { DeepSeekService } from './clients/deepseek-client';
import { biancenPublicApi } from './examples/binance-public-api';

async function main() {
  const binancePublic = new BinancePublicClient();
  const deepseek = new DeepSeekService();

  try {
    // Usar cliente público da Binance
    const btcPrice = await binancePublic.getPrice('BTCUSDT');
    const btcStats = await binancePublic.get24hrStats('BTCUSDT');

    console.log('BTC Price:', btcPrice);
    console.log('BTC 24h Stats:', btcStats);

    // Analisar com DeepSeek
    const analysis = await deepseek.analyzeMarket(
      { price: btcPrice, stats: btcStats },
      'Analyze this Bitcoin market data and provide trading insights.'
    );

    console.log('DeepSeek Analysis:', analysis);

    // Executar exemplo público
    console.log('\n--- Public Client Example ---');
    await biancenPublicApi();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();