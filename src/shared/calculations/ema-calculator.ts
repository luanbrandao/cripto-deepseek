/**
 * 📈 EMA CALCULATOR
 * Centralized Exponential Moving Average calculations
 */

export class EMACalculator {
  /**
   * Calculate single EMA for given period
   */
  static calculate(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Calculate multiple EMAs at once
   */
  static calculateMultiple(prices: number[], periods: number[]): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    
    for (const period of periods) {
      result[`ema${period}`] = this.calculate(prices, period);
    }
    
    return result;
  }

  /**
   * Calculate EMA crossover signal
   */
  static calculateCrossover(prices: number[], fastPeriod: number, slowPeriod: number): {
    fastEMA: number;
    slowEMA: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    separation: number;
  } {
    const fastEMA = EMACalculator.calculate(prices, fastPeriod);
    const slowEMA = EMACalculator.calculate(prices, slowPeriod);
    const separation = Math.abs(fastEMA - slowEMA) / slowEMA;
    
    let signal: 'bullish' | 'bearish' | 'neutral';
    if (fastEMA > slowEMA) signal = 'bullish';
    else if (fastEMA < slowEMA) signal = 'bearish';
    else signal = 'neutral';
    
    return { fastEMA, slowEMA, signal, separation };
  }

  /**
   * Calculate EMA trend strength
   */
  static calculateTrendStrength(prices: number[], fastPeriod: number, slowPeriod: number): number {
    const currentPrice = prices[prices.length - 1];
    const fastEMA = EMACalculator.calculate(prices, fastPeriod);
    const slowEMA = EMACalculator.calculate(prices, slowPeriod);
    
    const fastSlowDiff = Math.abs(fastEMA - slowEMA) / slowEMA * 100;
    const currentFastDiff = Math.abs(currentPrice - fastEMA) / fastEMA * 100;
    
    const strength = (fastSlowDiff * 0.6) + (currentFastDiff * 0.4);
    return Math.min(100, strength * 10);
  }
}