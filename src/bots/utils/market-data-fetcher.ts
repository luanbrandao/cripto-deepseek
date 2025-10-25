import { BinancePublicClient } from '../../clients/binance-public-client';
import { logMarketInfo } from './market-data-logger';

export async function getMarketData(binancePublic: BinancePublicClient, symbol: string) {
  const price = await binancePublic.getPrice(symbol);
  const stats = await binancePublic.get24hrStats(symbol);
  const klines = await binancePublic.getKlines(symbol, '1h', 24);

  logMarketInfo(symbol, price, stats);
  
  return { price, stats, klines };
}