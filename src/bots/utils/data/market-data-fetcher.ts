import { BinancePublicClient } from '../../../core/clients/binance-public-client';
import { logMarketInfo } from '../logging/market-data-logger';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';

export async function getMarketData(binancePublic: BinancePublicClient, symbol: string) {
  const price = await binancePublic.getPrice(symbol);
  const stats = await binancePublic.get24hrStats(symbol);
  const klines = await binancePublic.getKlines(symbol, TradingConfigManager.getConfig().CHART.TIMEFRAME, TradingConfigManager.getConfig().CHART.PERIODS);

  logMarketInfo(symbol, price, stats);

  return { price, stats, klines };
}
