import { TradingConfigManager } from '../../core/config/trading-config-manager';
import { TechnicalCalculator } from '../../../shared/calculations';

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

    // Calculate multiple EMAs - Algorithm constants
    const ema12Period = 12;
    const ema26Period = 26;
    const ema50Period = 50;
    const ema100Period = 100;
    const ema200Period = 200;
    
    const ema12 = TechnicalCalculator.calculateEMA(prices, ema12Period);
    const ema26 = TechnicalCalculator.calculateEMA(prices, ema26Period);
    const ema50 = TechnicalCalculator.calculateEMA(prices, ema50Period);
    const ema100 = TechnicalCalculator.calculateEMA(prices, ema100Period);
    const ema200 = TechnicalCalculator.calculateEMA(prices, ema200Period);

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
    const config = TradingConfigManager.getConfig();
    const momentumThreshold = (config.VALIDATION_SCORES?.MIN_VALID_SCORE || 60);
    const strengthThreshold = (config.VALIDATION_SCORES?.VOLUME_ADEQUATE || 80) - 5;
    const rsiMin = config.RSI?.OVERSOLD_THRESHOLD + 5 || 30;
    const rsiMax = config.RSI?.OVERBOUGHT_THRESHOLD + 5 || 80;
    
    return (
      analysis.shortTerm.trend === 'UP' &&
      analysis.mediumTerm.trend === 'UP' &&
      analysis.longTerm.trend === 'UP' &&
      analysis.momentum > momentumThreshold &&
      analysis.overallStrength > strengthThreshold &&
      analysis.rsi > rsiMin && analysis.rsi < rsiMax
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
    const config = TradingConfigManager.getConfig();
    const momentumThreshold = (config.VALIDATION_SCORES?.VOLUME_LOW || 40);
    const strengthThreshold = (config.VALIDATION_SCORES?.MIN_VALID_SCORE || 60);
    
    return (
      analysis.shortTerm.trend === 'UP' &&
      (analysis.mediumTerm.trend === 'UP' || analysis.longTerm.trend === 'UP') &&
      analysis.momentum > momentumThreshold &&
      analysis.overallStrength > strengthThreshold
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
      return { type: 'BULL_MARKET', confidence: TradingConfigManager.getConfig().HIGH_CONFIDENCE };
    }

    const config = TradingConfigManager.getConfig();
    const moderateBullConfidence = (config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50) + 20;
    const bearMarketConfidence = (config.VALIDATION_SCORES?.VOLUME_ADEQUATE || 80);
    const sidewaysConfidence = (config.VALIDATION_SCORES?.MIN_VALID_SCORE || 60);
    
    if (this.isModerateUptrend(analysis)) {
      return { type: 'BULL_MARKET', confidence: moderateBullConfidence };
    }

    if (analysis.shortTerm.trend === 'DOWN' && analysis.mediumTerm.trend === 'DOWN') {
      return { type: 'BEAR_MARKET', confidence: bearMarketConfidence };
    }

    return { type: 'SIDEWAYS', confidence: sidewaysConfidence };
  }



  private determineTrend(current: number, fast: number, slow: number): string {
    if (current > fast && fast > slow) return 'UP';
    if (current < fast && fast < slow) return 'DOWN';
    return 'SIDEWAYS';
  }

  private calculateTrendStrength(current: number, fast: number, slow: number): number {
    const fastSlowDiff = Math.abs(fast - slow) / slow * 100;
    const currentFastDiff = Math.abs(current - fast) / fast * 100;

    // Trend strength calculation weights - Algorithm constants
    const fastSlowWeight = 0.6;
    const currentFastWeight = 0.4;
    const strengthMultiplier = 10;
    const maxStrength = 100;
    
    const strength = (fastSlowDiff * fastSlowWeight) + (currentFastDiff * currentFastWeight);
    return Math.min(maxStrength, strength * strengthMultiplier);
  }

  private calculateMomentum(prices: number[]): number {
    const minMomentumPeriod = 14; // Algorithm constant
    const defaultMomentum = 50; // Algorithm constant
    const momentumWindow = 7; // Algorithm constant
    
    if (prices.length < minMomentumPeriod) return defaultMomentum;

    const recent = prices.slice(-momentumWindow);
    const previous = prices.slice(-minMomentumPeriod, -momentumWindow);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b) / previous.length;

    const momentum = ((recentAvg - previousAvg) / previousAvg) * 100;
    const baseMomentum = 50; // Algorithm constant
    const momentumMultiplier = 5; // Algorithm constant
    return Math.max(0, Math.min(100, baseMomentum + momentum * momentumMultiplier));
  }

  private calculateRSI(prices: number[], period = 14): number {
    const defaultRSI = 50; // Algorithm constant
    if (prices.length < period + 1) return defaultRSI;

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

    const maxRSI = 100; // Algorithm constant
    if (avgLoss === 0) return maxRSI;

    const rs = avgGain / avgLoss;
    return maxRSI - (maxRSI / (1 + rs));
  }

  private calculateVolumeStrength(volumes: number[]): number {
    const config = TradingConfigManager.getConfig();
    const defaultVolumeStrength = config.VALIDATION_SCORES?.MIN_VALID_SCORE || 60;
    const minDataPoints = 20; // Algorithm constant
    const volumeMultiplier = 50; // Algorithm constant
    
    if (volumes.length < minDataPoints) return defaultVolumeStrength;

    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b) / 5;
    const avgVolume = volumes.slice(-minDataPoints).reduce((a, b) => a + b) / minDataPoints;

    const volumeRatio = recentVolume / avgVolume;
    return Math.min(100, Math.max(0, volumeRatio * volumeMultiplier));
  }

  private calculateOverallStrength(
    shortStrength: number,
    mediumStrength: number,
    momentum: number,
    rsi: number,
    volumeStrength: number
  ): number {
    // Weighted average - Algorithm constants
    const weights = {
      short: 0.3,
      medium: 0.25,
      momentum: 0.2,
      rsi: 0.15,
      volume: 0.1
    };

    // RSI normalization (50 = neutral, higher/lower = stronger) - Algorithm constants
    const rsiNeutral = 50;
    const rsiMultiplier = 2;
    const maxRSINormalized = 100;
    const minRSINormalized = 0;
    
    const normalizedRSI = rsi > rsiNeutral ? 
      Math.min(maxRSINormalized, (rsi - rsiNeutral) * rsiMultiplier + rsiNeutral) : 
      Math.max(minRSINormalized, rsi * rsiMultiplier);

    return (
      shortStrength * weights.short +
      mediumStrength * weights.medium +
      momentum * weights.momentum +
      normalizedRSI * weights.rsi +
      volumeStrength * weights.volume
    );
  }
}