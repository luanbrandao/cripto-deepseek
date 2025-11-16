/**
 * 🚀 MOMENTUM CALCULATOR
 * Centralized momentum and rate of change calculations
 */

export class MomentumCalculator {
  /**
   * Calculate basic momentum (rate of change)
   */
  static calculateMomentum(prices: number[], period: number = 5): {
    momentum: number;
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;
  } {
    if (prices.length < period) {
      return { momentum: 0, direction: 'neutral', strength: 0 };
    }

    const recent = prices.slice(-period);
    const momentum = (recent[period - 1] - recent[0]) / recent[0];

    let direction: 'bullish' | 'bearish' | 'neutral';
    if (momentum > 0.005) direction = 'bullish';
    else if (momentum < -0.005) direction = 'bearish';
    else direction = 'neutral';

    const strength = Math.min(100, Math.abs(momentum) * 1000);

    return { momentum, direction, strength };
  }

  /**
   * Calculate multi-period momentum
   */
  static calculateMultiPeriodMomentum(prices: number[], periods: number[] = [3, 5, 10]): {
    [key: string]: {
      momentum: number;
      direction: 'bullish' | 'bearish' | 'neutral';
      strength: number;
    };
  } {
    const result: any = {};

    for (const period of periods) {
      result[`period${period}`] = this.calculateMomentum(prices, period);
    }

    return result;
  }

  /**
   * Calculate momentum acceleration
   */
  static calculateMomentumAcceleration(prices: number[], period: number = 5): {
    acceleration: number;
    trend: 'accelerating' | 'decelerating' | 'stable';
    strength: number;
  } {
    if (prices.length < period * 2) {
      return { acceleration: 0, trend: 'stable', strength: 0 };
    }

    const recent = this.calculateMomentum(prices.slice(-period), period);
    const previous = this.calculateMomentum(prices.slice(-period * 2, -period), period);

    const acceleration = recent.momentum - previous.momentum;

    let trend: 'accelerating' | 'decelerating' | 'stable';
    if (acceleration > 0.002) trend = 'accelerating';
    else if (acceleration < -0.002) trend = 'decelerating';
    else trend = 'stable';

    const strength = Math.min(100, Math.abs(acceleration) * 5000);

    return { acceleration, trend, strength };
  }

  /**
   * Calculate momentum with RSI integration
   */
  static calculateMomentumRSI(prices: number[], momentumPeriod: number = 5, rsiPeriod: number = 14): {
    momentum: number;
    rsi: number;
    combinedSignal: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
    score: number;
  } {
    const momentum = this.calculateMomentum(prices, momentumPeriod).momentum;
    
    // Simple RSI calculation
    const rsi = this.calculateSimpleRSI(prices, rsiPeriod);

    let combinedSignal: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
    let score: number;

    if (momentum > 0.01 && rsi > 50 && rsi < 70) {
      combinedSignal = 'strong_bullish';
      score = 90;
    } else if (momentum > 0.005 && rsi > 45) {
      combinedSignal = 'bullish';
      score = 70;
    } else if (momentum < -0.01 && rsi < 50 && rsi > 30) {
      combinedSignal = 'strong_bearish';
      score = 10;
    } else if (momentum < -0.005 && rsi < 55) {
      combinedSignal = 'bearish';
      score = 30;
    } else {
      combinedSignal = 'neutral';
      score = 50;
    }

    return { momentum, rsi, combinedSignal, score };
  }

  /**
   * Calculate Price Rate of Change (ROC)
   */
  static calculateROC(prices: number[], period: number = 10): number[] {
    if (prices.length < period + 1) return [];

    const roc: number[] = [];

    for (let i = period; i < prices.length; i++) {
      const rocValue = ((prices[i] - prices[i - period]) / prices[i - period]) * 100;
      roc.push(rocValue);
    }

    return roc;
  }

  /**
   * Calculate momentum divergence
   */
  static calculateMomentumDivergence(prices: number[], period: number = 5): {
    hasDivergence: boolean;
    type: 'bullish' | 'bearish' | 'none';
    strength: number;
  } {
    if (prices.length < period * 4) {
      return { hasDivergence: false, type: 'none', strength: 0 };
    }

    const recent = prices.slice(-period);
    const previous = prices.slice(-period * 2, -period);

    const recentMomentum = this.calculateMomentum(recent, period).momentum;
    const previousMomentum = this.calculateMomentum(previous, period).momentum;

    const priceChange = (recent[recent.length - 1] - previous[previous.length - 1]) / previous[previous.length - 1];
    const momentumChange = recentMomentum - previousMomentum;

    const hasDivergence = (priceChange > 0 && momentumChange < 0) || (priceChange < 0 && momentumChange > 0);

    if (!hasDivergence) {
      return { hasDivergence: false, type: 'none', strength: 0 };
    }

    const type = (priceChange < 0 && momentumChange > 0) ? 'bullish' : 'bearish';
    const strength = Math.abs(priceChange) * Math.abs(momentumChange) * 1000;

    return { hasDivergence: true, type, strength };
  }

  /**
   * Simple RSI calculation for internal use
   */
  private static calculateSimpleRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
}