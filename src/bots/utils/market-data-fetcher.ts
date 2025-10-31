import { BinancePublicClient } from '../../clients/binance-public-client';
import { logMarketInfo } from './market-data-logger';
import { TRADING_CONFIG } from '../config/trading-config';

export async function getMarketData(binancePublic: BinancePublicClient, symbol: string) {
  const price = await binancePublic.getPrice(symbol);
  const stats = await binancePublic.get24hrStats(symbol);
  const klines = await binancePublic.getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);

  logMarketInfo(symbol, price, stats);
  
  return { price, stats, klines };
}