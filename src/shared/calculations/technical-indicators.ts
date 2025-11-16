/**
 * 📈 TECHNICAL INDICATORS
 * Centralized technical analysis calculations
 */

export interface EMAResult {
  ema12: number;
  ema26: number;
  ema50?: number;
  ema100?: number;
  ema200?: number;
  crossover?: 'bullish' | 'bearish' | 'none';
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: number;
}

export interface RSIResult {
  value: number;
  signal: 'oversold' | 'overbought' | 'neutral';
  divergence?: boolean;
}

export interface MomentumResult {
  value: number;
  strength: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  acceleration?: number;
}

export interface VolumeResult {
  ratio: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  obv?: number;
}

export class TechnicalIndicators {
  // Algorithm constants
  private static readonly EMA_MULTIPLIER_NUMERATOR = 2;
  private static readonly EMA_COMPLEMENT_FACTOR = 1;
  private static readonly RSI_PERIOD = 14;
  private static readonly MOMENTUM_THRESHOLD = 0.005;
  private static readonly VOLUME_ANOMALY_MULTIPLIER = 3;

  /**
   * Calculate EMA with configurable periods
   */
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = this.EMA_MULTIPLIER_NUMERATOR / (period + this.EMA_COMPLEMENT_FACTOR);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (this.EMA_COMPLEMENT_FACTOR - multiplier));
    }

    return ema;
  }

  /**
   * Calculate multiple EMAs and crossover analysis
   */
  static calculateEMAAnalysis(prices: number[]): EMAResult {
    const currentPrice = prices[prices.length - 1];
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const ema50 = prices.length >= 50 ? this.calculateEMA(prices, 50) : undefined;
    const ema100 = prices.length >= 100 ? this.calculateEMA(prices, 100) : undefined;
    const ema200 = prices.length >= 200 ? this.calculateEMA(prices, 200) : undefined;

    // Determine crossover
    let crossover: 'bullish' | 'bearish' | 'none' = 'none';
    if (ema12 > ema26) {
      crossover = 'bullish';
    } else if (ema12 < ema26) {
      crossover = 'bearish';
    }

    // Determine trend
    let trend: 'UP' | 'DOWN' | 'SIDEWAYS';
    if (currentPrice > ema12 && ema12 > ema26) {
      trend = 'UP';
    } else if (currentPrice < ema12 && ema12 < ema26) {
      trend = 'DOWN';
    } else {
      trend = 'SIDEWAYS';
    }

    // Calculate trend strength
    const fastSlowDiff = Math.abs(ema12 - ema26) / ema26 * 100;
    const currentFastDiff = Math.abs(currentPrice - ema12) / ema12 * 100;
    const strength = Math.min(100, (fastSlowDiff * 0.6 + currentFastDiff * 0.4) * 10);

    return {
      ema12,
      ema26,
      ema50,
      ema100,
      ema200,
      crossover,
      trend,
      strength
    };
  }

  /**
   * Calculate RSI with smoothing options
   */
  static calculateRSI(prices: number[], period: number = this.RSI_PERIOD): RSIResult {
    if (prices.length < period + 1) {
      return { value: 50, signal: 'neutral' };
    }

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    let avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    let avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

    // Smoothed RSI calculation for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let signal: 'oversold' | 'overbought' | 'neutral';
    if (rsi > 70) signal = 'overbought';
    else if (rsi < 30) signal = 'oversold';
    else signal = 'neutral';

    return { value: rsi, signal };
  }

  /**
   * Calculate momentum with multiple periods
   */
  static calculateMomentum(prices: number[], period: number = 5): MomentumResult {
    if (prices.length < period) {
      return { value: 0, strength: 0, direction: 'neutral' };
    }

    const recent = prices.slice(-period);
    const momentum = (recent[period - 1] - recent[0]) / recent[0];

    let direction: 'bullish' | 'bearish' | 'neutral';
    if (momentum > this.MOMENTUM_THRESHOLD) direction = 'bullish';
    else if (momentum < -this.MOMENTUM_THRESHOLD) direction = 'bearish';
    else direction = 'neutral';

    const strength = Math.min(100, Math.abs(momentum) * 1000);

    // Calculate acceleration if enough data
    let acceleration: number | undefined;
    if (prices.length >= period * 2) {
      const previous = prices.slice(-period * 2, -period);
      const previousMomentum = (previous[period - 1] - previous[0]) / previous[0];
      acceleration = momentum - previousMomentum;
    }

    return { value: momentum, strength, direction, acceleration };
  }

  /**
   * Calculate volume analysis
   */
  static calculateVolumeAnalysis(volumes: number[], period: number = 10): VolumeResult {
    if (volumes.length < period) {
      return { ratio: 1, trend: 'stable', strength: 50 };
    }

    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
    const ratio = currentVolume / avgVolume;

    // Determine trend
    const recent = volumes.slice(-period);
    const previous = volumes.slice(-period * 2, -period);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.length > 0 ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAvg;
    
    const change = (recentAvg - previousAvg) / previousAvg;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (change > 0.2) trend = 'increasing';
    else if (change < -0.2) trend = 'decreasing';
    else trend = 'stable';

    const strength = Math.min(100, ratio * 10);

    // Calculate OBV if prices are available
    let obv: number | undefined;

    return { ratio, trend, strength, obv };
  }

  /**
   * Calculate On-Balance Volume (OBV)
   */
  static calculateOBV(prices: number[], volumes: number[]): number {
    if (prices.length !== volumes.length || prices.length < 2) {
      return 0;
    }

    let obv = 0;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
      // If prices are equal, OBV remains unchanged
    }

    return obv;
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    if (prices.length < period) {
      const currentPrice = prices[prices.length - 1];
      return {
        upper: currentPrice * 1.02,
        middle: currentPrice,
        lower: currentPrice * 0.98,
        bandwidth: 0.04
      };
    }

    const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upper = sma + (standardDeviation * stdDev);
    const lower = sma - (standardDeviation * stdDev);
    const bandwidth = (upper - lower) / sma;

    return {
      upper,
      middle: sma,
      lower,
      bandwidth
    };
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;

    // For signal line, we need MACD history (simplified calculation)
    const signalLine = macdLine; // Simplified - in real implementation, calculate EMA of MACD line
    const histogram = macdLine - signalLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
      crossover: macdLine > signalLine ? 'bullish' : 'bearish'
    };
  }

  /**
   * Calculate Average True Range (ATR)
   */
  static calculateATR(klines: any[], period: number = 14): number {
    if (klines.length < period + 1) return 0;

    const trueRanges: number[] = [];

    for (let i = 1; i < klines.length; i++) {
      const high = parseFloat(klines[i][2]);
      const low = parseFloat(klines[i][3]);
      const prevClose = parseFloat(klines[i - 1][4]);

      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);

      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  }
}