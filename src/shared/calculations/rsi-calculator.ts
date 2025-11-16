/**
 * 🎯 RSI CALCULATOR
 * Centralized Relative Strength Index calculations
 */

export class RSICalculator {
  /**
   * Calculate RSI for given period
   */
  static calculate(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate RSI with smoothed averages (Wilder's method)
   */
  static calculateSmoothed(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let avgGain = 0;
    let avgLoss = 0;

    // Initial calculation
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) avgGain += change;
      else avgLoss += Math.abs(change);
    }

    avgGain /= period;
    avgLoss /= period;

    // Smoothed calculation
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Get RSI signal interpretation
   */
  static getSignal(rsi: number, oversoldThreshold: number = 30, overboughtThreshold: number = 70): {
    signal: 'oversold' | 'overbought' | 'neutral';
    strength: 'strong' | 'moderate' | 'weak';
    score: number;
  } {
    let signal: 'oversold' | 'overbought' | 'neutral';
    let strength: 'strong' | 'moderate' | 'weak';
    let score: number;

    if (rsi <= oversoldThreshold) {
      signal = 'oversold';
      strength = rsi <= 20 ? 'strong' : 'moderate';
      score = 100 - rsi;
    } else if (rsi >= overboughtThreshold) {
      signal = 'overbought';
      strength = rsi >= 80 ? 'strong' : 'moderate';
      score = rsi;
    } else {
      signal = 'neutral';
      strength = 'weak';
      score = 50;
    }

    return { signal, strength, score };
  }

  /**
   * Calculate RSI divergence
   */
  static calculateDivergence(prices: number[], rsiValues: number[]): {
    hasDivergence: boolean;
    type: 'bullish' | 'bearish' | 'none';
    strength: number;
  } {
    if (prices.length < 10 || rsiValues.length < 10) {
      return { hasDivergence: false, type: 'none', strength: 0 };
    }

    const recentPrices = prices.slice(-5);
    const recentRSI = rsiValues.slice(-5);
    const previousPrices = prices.slice(-10, -5);
    const previousRSI = rsiValues.slice(-10, -5);

    const priceChange = (recentPrices[4] - recentPrices[0]) / recentPrices[0];
    const rsiChange = recentRSI[4] - recentRSI[0];

    const hasDivergence = (priceChange > 0 && rsiChange < 0) || (priceChange < 0 && rsiChange > 0);
    
    if (!hasDivergence) {
      return { hasDivergence: false, type: 'none', strength: 0 };
    }

    const type = (priceChange < 0 && rsiChange > 0) ? 'bullish' : 'bearish';
    const strength = Math.abs(priceChange) * Math.abs(rsiChange) * 100;

    return { hasDivergence: true, type, strength };
  }
}