import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';
import { calculateEMA } from '../utils/analysis/ema-calculator';

interface AdvancedEmaAnalysis {
  shortTerm: { ema12: number; ema26: number; trend: string; strength: number };
  mediumTerm: { ema50: number; ema100: number; trend: string; strength: number };
  longTerm: { ema200: number; trend: string };
  momentum: number;
  overallStrength: number;
  rsi: number;
  volumeStrength: number;
}

interface MarketCondition {
  type: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS';
  confidence: number;
}

export class AdvancedEmaAnalyzer {
  private fastPeriod: number;
  private slowPeriod: number;

  constructor(config = { fastPeriod: 12, slowPeriod: 26 }) {
    this.fastPeriod = config.fastPeriod;
    this.slowPeriod = config.slowPeriod;
  }

  analyzeAdvanced(prices: number[], volumes?: number[]): AdvancedEmaAnalysis {
    const currentPrice = prices[prices.length - 1];

    // Calculate multiple EMAs
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const ema50 = calculateEMA(prices, 50);
    const ema100 = calculateEMA(prices, 100);
    const ema200 = calculateEMA(prices, 200);

    // Short-term analysis
    const shortTerm = {
      ema12,
      ema26,
      trend: this.determineTrend(currentPrice, ema12, ema26),
      strength: this.calculateTrendStrength(currentPrice, ema12, ema26)
    };

    // Medium-term analysis
    const mediumTerm = {
      ema50,
      ema100,
      trend: this.determineTrend(ema26, ema50, ema100),
      strength: this.calculateTrendStrength(ema26, ema50, ema100)
    };

    // Long-term analysis
    const longTerm = {
      ema200,
      trend: currentPrice > ema200 ? 'UP' : 'DOWN'
    };

    // Calculate momentum and RSI
    const momentum = this.calculateMomentum(prices);
    const rsi = this.calculateRSI(prices);
    const volumeStrength = volumes ? this.calculateVolumeStrength(volumes) : 60;

    // Overall strength calculation
    const overallStrength = this.calculateOverallStrength(
      shortTerm.strength,
      mediumTerm.strength,
      momentum,
      rsi,
      volumeStrength
    );

    return {
      shortTerm,
      mediumTerm,
      longTerm,
      momentum,
      overallStrength,
      rsi,
      volumeStrength
    };
  }

  isStrongUptrend(analysis: AdvancedEmaAnalysis): boolean {
    return (
      analysis.shortTerm.trend === 'UP' &&
      analysis.mediumTerm.trend === 'UP' &&
      analysis.longTerm.trend === 'UP' &&
      analysis.momentum > 60 &&
      analysis.overallStrength > 75 &&
      analysis.rsi > 30 && analysis.rsi < 80
    );
  }

  // isModerateUptrend(analysis: AdvancedEmaAnalysis): boolean {
  //   return (
  //     analysis.shortTerm.trend === 'UP' &&
  //     (analysis.mediumTerm.trend === 'UP' || analysis.mediumTerm.trend === 'SIDEWAYS' || analysis.longTerm.trend === 'UP') &&
  //     analysis.momentum > 25 &&
  //     analysis.overallStrength > 20
  //   );
  // }


  isModerateUptrend(analysis: AdvancedEmaAnalysis): boolean {
    return (
      analysis.shortTerm.trend === 'UP' &&
      (analysis.mediumTerm.trend === 'UP' || analysis.longTerm.trend === 'UP') &&
      analysis.momentum > 40 &&
      analysis.overallStrength > 60
    );
  }

  // isModerateUptrend(analysis: AdvancedEmaAnalysis): boolean {
  //   return (
  //     analysis.shortTerm.trend === 'UP' &&
  //     (analysis.mediumTerm.trend === 'UP' || analysis.mediumTerm.trend === 'SIDEWAYS' || analysis.longTerm.trend === 'UP') &&
  //     analysis.momentum > 25 &&
  //     analysis.overallStrength > 20
  //   );
  // }


  getMarketCondition(analysis: AdvancedEmaAnalysis): MarketCondition {
    if (this.isStrongUptrend(analysis)) {
      return { type: 'BULL_MARKET', confidence: UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE };
    }

    if (this.isModerateUptrend(analysis)) {
      return { type: 'BULL_MARKET', confidence: 70 };
    }

    if (analysis.shortTerm.trend === 'DOWN' && analysis.mediumTerm.trend === 'DOWN') {
      return { type: 'BEAR_MARKET', confidence: 80 };
    }

    return { type: 'SIDEWAYS', confidence: 60 };
  }



  private determineTrend(current: number, fast: number, slow: number): string {
    if (current > fast && fast > slow) return 'UP';
    if (current < fast && fast < slow) return 'DOWN';
    return 'SIDEWAYS';
  }

  private calculateTrendStrength(current: number, fast: number, slow: number): number {
    const fastSlowDiff = Math.abs(fast - slow) / slow * 100;
    const currentFastDiff = Math.abs(current - fast) / fast * 100;

    const strength = (fastSlowDiff * 0.6) + (currentFastDiff * 0.4);
    return Math.min(100, strength * 10);
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 14) return 50;

    const recent = prices.slice(-7);
    const previous = prices.slice(-14, -7);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b) / previous.length;

    const momentum = ((recentAvg - previousAvg) / previousAvg) * 100;
    return Math.max(0, Math.min(100, 50 + momentum * 5));
  }

  private calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateVolumeStrength(volumes: number[]): number {
    if (volumes.length < 20) return 60;

    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b) / 5;
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;

    const volumeRatio = recentVolume / avgVolume;
    return Math.min(100, Math.max(0, volumeRatio * 50));
  }

  private calculateOverallStrength(
    shortStrength: number,
    mediumStrength: number,
    momentum: number,
    rsi: number,
    volumeStrength: number
  ): number {
    // Weighted average
    const weights = {
      short: 0.3,
      medium: 0.25,
      momentum: 0.2,
      rsi: 0.15,
      volume: 0.1
    };

    // RSI normalization (50 = neutral, higher/lower = stronger)
    const normalizedRSI = rsi > 50 ? Math.min(100, (rsi - 50) * 2 + 50) : Math.max(0, rsi * 2);

    return (
      shortStrength * weights.short +
      mediumStrength * weights.medium +
      momentum * weights.momentum +
      normalizedRSI * weights.rsi +
      volumeStrength * weights.volume
    );
  }
}