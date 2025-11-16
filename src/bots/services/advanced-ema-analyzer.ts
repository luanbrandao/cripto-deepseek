import { TradingConfigManager } from '../../core/config/trading-config-manager';
import { TechnicalCalculator } from '../../shared/calculations';

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
    // Use centralized EMA analysis
    const emaAnalysis = TechnicalCalculator.calculateEMAAnalysis(prices);
    const momentumAnalysis = TechnicalCalculator.calculateMomentumAnalysis(prices);
    const rsiAnalysis = TechnicalCalculator.calculateRSIAnalysis(prices);
    const volumeAnalysis = volumes ? TechnicalCalculator.calculateVolumeAnalysis(volumes) : null;

    // Short-term analysis
    const shortTerm = {
      ema12: emaAnalysis.ema12,
      ema26: emaAnalysis.ema26,
      trend: emaAnalysis.trend,
      strength: emaAnalysis.strength
    };

    // Medium-term analysis
    const mediumTerm = {
      ema50: emaAnalysis.ema50 || 0,
      ema100: emaAnalysis.ema100 || 0,
      trend: this.determineMediumTrend(emaAnalysis),
      strength: this.calculateMediumStrength(emaAnalysis)
    };

    // Long-term analysis
    const longTerm = {
      ema200: emaAnalysis.ema200 || 0,
      trend: emaAnalysis.ema200 ? (prices[prices.length - 1] > emaAnalysis.ema200 ? 'UP' : 'DOWN') : 'UP'
    };

    // Use centralized calculations
    const momentum = momentumAnalysis.strength;
    const rsi = rsiAnalysis.value;
    const volumeStrength = volumeAnalysis ? volumeAnalysis.strength : 60;

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

  private determineMediumTrend(emaAnalysis: any): string {
    if (!emaAnalysis.ema50 || !emaAnalysis.ema100) return 'SIDEWAYS';
    
    if (emaAnalysis.ema26 > emaAnalysis.ema50 && emaAnalysis.ema50 > emaAnalysis.ema100) return 'UP';
    if (emaAnalysis.ema26 < emaAnalysis.ema50 && emaAnalysis.ema50 < emaAnalysis.ema100) return 'DOWN';
    return 'SIDEWAYS';
  }

  private calculateMediumStrength(emaAnalysis: any): number {
    if (!emaAnalysis.ema50 || !emaAnalysis.ema100) return 50;
    
    const diff = Math.abs(emaAnalysis.ema50 - emaAnalysis.ema100) / emaAnalysis.ema100 * 100;
    return Math.min(100, diff * 10);
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