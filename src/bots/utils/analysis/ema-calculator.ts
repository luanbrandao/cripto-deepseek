/**
 * Calculadora EMA centralizada - elimina duplicação de código
 */
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const config = TradingConfigManager.getConfig().ALGORITHM;
  const multiplier = config.EMA_MULTIPLIER_NUMERATOR / (period + config.EMA_COMPLEMENT_FACTOR);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (config.EMA_COMPLEMENT_FACTOR - multiplier));
  }

  return ema;
}