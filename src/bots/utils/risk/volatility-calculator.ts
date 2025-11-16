/**
 * @deprecated Use TechnicalCalculator.calculateVolatility from shared/calculations instead
 * This file is kept for backward compatibility
 */
import { TechnicalCalculator } from '../../../shared/calculations';

export function calculateVolatility(klines: any[]): number {
  const prices = klines.map(k => parseFloat(k[4]));
  return TechnicalCalculator.calculateVolatility(prices).volatility;
}

export async function calculateSymbolVolatility(
  binanceClient: any,
  symbol: string,
  timeframe: string,
  periods: number
): Promise<number> {
  const klines = await binanceClient.getKlines(symbol, timeframe, periods);
  return calculateVolatility(klines);
}
