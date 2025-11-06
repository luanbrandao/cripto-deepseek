import { BinancePublicClient } from '../../core/clients/binance-public-client';

async function biancenPublicApi() {
  const binancePublic = new BinancePublicClient();

  try {
    // Obter preço do Bitcoin
    const btcPrice = await binancePublic.getPrice('BTCUSDT');
    console.log('BTC Price:', btcPrice);

    // Obter estatísticas 24h
    const btcStats = await binancePublic.get24hrStats('BTCUSDT');
    console.log('BTC 24h Stats:', btcStats);

    // Obter order book
    const orderBook = await binancePublic.getOrderBook('BTCUSDT', 10);
    console.log('Order Book (top 10):', orderBook);

    // Obter dados de candlestick (1h, últimas 24 horas)
    const klines = await binancePublic.getKlines('BTCUSDT', '1h', 24);
    console.log('24h Klines:', klines);

  } catch (error) {
    console.error('Error:', error);
  }
}

export { biancenPublicApi };