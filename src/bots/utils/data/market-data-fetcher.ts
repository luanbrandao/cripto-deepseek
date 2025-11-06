import { BinancePublicClient } from '../../../core/clients/binance-public-client';
import { logMarketInfo } from '../logging/market-data-logger';
import { UNIFIED_TRADING_CONFIG } from '../../../shared/config/unified-trading-config';

export async function getMarketData(binancePublic: BinancePublicClient, symbol: string) {
  const price = await binancePublic.getPrice(symbol);
  const stats = await binancePublic.get24hrStats(symbol);
  const klines = await binancePublic.getKlines(symbol, UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME, UNIFIED_TRADING_CONFIG.CHART.PERIODS);

  logMarketInfo(symbol, price, stats);
  
  return { price, stats, klines };
}
