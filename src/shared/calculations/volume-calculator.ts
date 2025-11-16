/**
 * 📊 VOLUME CALCULATOR
 * Centralized volume analysis calculations
 */

export class VolumeCalculator {
  /**
   * Calculate volume ratio (recent vs average)
   */
  static calculateVolumeRatio(volumes: number[], recentPeriods: number = 3, avgPeriods: number = 20): {
    ratio: number;
    recentVolume: number;
    avgVolume: number;
    signal: 'high' | 'normal' | 'low';
  } {
    if (volumes.length < avgPeriods) {
      return { ratio: 1, recentVolume: 0, avgVolume: 0, signal: 'normal' };
    }

    const recentVolume = volumes.slice(-recentPeriods).reduce((a, b) => a + b, 0) / recentPeriods;
    const avgVolume = volumes.slice(-avgPeriods).reduce((a, b) => a + b, 0) / avgPeriods;
    const ratio = recentVolume / avgVolume;

    let signal: 'high' | 'normal' | 'low';
    if (ratio >= 1.5) signal = 'high';
    else if (ratio >= 0.8) signal = 'normal';
    else signal = 'low';

    return { ratio, recentVolume, avgVolume, signal };
  }

  /**
   * Calculate volume trend
   */
  static calculateVolumeTrend(volumes: number[], period: number = 10): {
    trend: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    change: number;
  } {
    if (volumes.length < period * 2) {
      return { trend: 'stable', strength: 0, change: 0 };
    }

    const recent = volumes.slice(-period);
    const previous = volumes.slice(-period * 2, -period);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / period;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / period;
    const change = (recentAvg - previousAvg) / previousAvg;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (change > 0.1) trend = 'increasing';
    else if (change < -0.1) trend = 'decreasing';
    else trend = 'stable';

    const strength = Math.min(100, Math.abs(change) * 100);

    return { trend, strength, change };
  }

  /**
   * Calculate volume volatility
   */
  static calculateVolumeVolatility(volumes: number[]): {
    volatility: number;
    consistency: number;
    anomalies: number[];
  } {
    if (volumes.length < 10) {
      return { volatility: 0, consistency: 100, anomalies: [] };
    }

    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const volatility = Math.sqrt(variance) / avgVolume * 100;
    const consistency = Math.max(0, 100 - volatility);

    // Detect anomalies (volumes > 3x average)
    const anomalies = volumes
      .map((vol, index) => ({ volume: vol, index }))
      .filter(item => item.volume > avgVolume * 3)
      .map(item => item.index);

    return { volatility, consistency, anomalies };
  }

  /**
   * Calculate volume-price correlation
   */
  static calculateVolumePriceCorrelation(prices: number[], volumes: number[]): {
    correlation: number;
    strength: 'strong' | 'moderate' | 'weak';
    direction: 'positive' | 'negative' | 'neutral';
  } {
    if (prices.length !== volumes.length || prices.length < 10) {
      return { correlation: 0, strength: 'weak', direction: 'neutral' };
    }

    const priceChanges = prices.slice(1).map((price, i) => price - prices[i]);
    const volumeChanges = volumes.slice(1).map((vol, i) => vol - volumes[i]);

    const n = priceChanges.length;
    const sumPriceChanges = priceChanges.reduce((a, b) => a + b, 0);
    const sumVolumeChanges = volumeChanges.reduce((a, b) => a + b, 0);
    const sumPriceVol = priceChanges.reduce((sum, price, i) => sum + price * volumeChanges[i], 0);
    const sumPriceSquared = priceChanges.reduce((sum, price) => sum + price * price, 0);
    const sumVolumeSquared = volumeChanges.reduce((sum, vol) => sum + vol * vol, 0);

    const numerator = n * sumPriceVol - sumPriceChanges * sumVolumeChanges;
    const denominator = Math.sqrt((n * sumPriceSquared - sumPriceChanges * sumPriceChanges) * 
                                  (n * sumVolumeSquared - sumVolumeChanges * sumVolumeChanges));

    const correlation = denominator === 0 ? 0 : numerator / denominator;

    let strength: 'strong' | 'moderate' | 'weak';
    if (Math.abs(correlation) >= 0.7) strength = 'strong';
    else if (Math.abs(correlation) >= 0.4) strength = 'moderate';
    else strength = 'weak';

    let direction: 'positive' | 'negative' | 'neutral';
    if (correlation > 0.1) direction = 'positive';
    else if (correlation < -0.1) direction = 'negative';
    else direction = 'neutral';

    return { correlation, strength, direction };
  }

  /**
   * Calculate On-Balance Volume (OBV)
   */
  static calculateOBV(prices: number[], volumes: number[]): number[] {
    if (prices.length !== volumes.length || prices.length < 2) {
      return [];
    }

    const obv = [volumes[0]];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv.push(obv[i - 1] + volumes[i]);
      } else if (prices[i] < prices[i - 1]) {
        obv.push(obv[i - 1] - volumes[i]);
      } else {
        obv.push(obv[i - 1]);
      }
    }

    return obv;
  }
}