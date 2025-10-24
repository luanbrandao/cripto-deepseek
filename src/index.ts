import { BinanceService } from './clients/binance-client';
import { DeepSeekService } from './clients/deepseek-client';

async function main() {
  const binance = new BinanceService();
  const deepseek = new DeepSeekService();

  try {
    // Obter dados do Bitcoin
    const btcPrice = await binance.getPrice('BTCUSDT');
    const btcStats = await binance.get24hrStats('BTCUSDT');

    console.log('BTC Price:', btcPrice);
    console.log('BTC 24h Stats:', btcStats);

    // Analisar com DeepSeek
    const analysis = await deepseek.analyzeMarket(
      { price: btcPrice, stats: btcStats },
      'Analyze this Bitcoin market data and provide trading insights.'
    );

    console.log('DeepSeek Analysis:', analysis);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();