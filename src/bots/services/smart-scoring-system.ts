import { AdvancedEmaAnalyzer } from './advanced-ema-analyzer';
import { TradingConfigManager } from '../../core';
import { TechnicalCalculator } from '../../shared/calculations';

export interface SmartScore {
  emaScore: number;        // 0-100 (peso: 35%)
  aiScore: number;         // 0-100 (peso: 40%)
  volumeScore: number;     // 0-100 (peso: 15%)
  momentumScore: number;   // 0-100 (peso: 10%)
  finalScore: number;      // Média ponderada
  confidence: number;      // Confiança final ajustada
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
}

export interface TechnicalData {
  prices: number[];
  volumes?: number[];
  currentPrice: number;
}

export interface AIAnalysis {
  confidence: number;
  action: string;
  sentiment: number; // -100 to 100
  technicalSignals: number; // 0-100
}

export class SmartScoringSystem {
  private emaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    this.emaAnalyzer = new AdvancedEmaAnalyzer();
  }

  calculateSmartScore(technicalData: TechnicalData, aiAnalysis: AIAnalysis): SmartScore {
    const emaScore = this.calculateEmaScore(technicalData);
    const aiScore = this.calculateAiScore(aiAnalysis);
    const volumeScore = this.calculateVolumeScore(technicalData);
    const momentumScore = this.calculateMomentumScore(technicalData);

    // Weighted average calculation - Algorithm constants
    const weights = { ema: 0.35, ai: 0.40, volume: 0.15, momentum: 0.10 };
    const finalScore = (
      emaScore * weights.ema +
      aiScore * weights.ai +
      volumeScore * weights.volume +
      momentumScore * weights.momentum
    );

    const confidence = this.calculateAdjustedConfidence(finalScore, aiAnalysis.confidence);
    const recommendation = this.getRecommendation(finalScore, aiAnalysis.action);

    return {
      emaScore,
      aiScore,
      volumeScore,
      momentumScore,
      finalScore,
      confidence,
      recommendation
    };
  }

  private calculateEmaScore(technicalData: TechnicalData): number {
    const analysis = this.emaAnalyzer.analyzeAdvanced(technicalData.prices, technicalData.volumes);

    let score = analysis.overallStrength;

    // Bonus for strong trends - Algorithm constants
    const strongTrendBonus = 15;
    const moderateTrendBonus = 8;
    if (this.emaAnalyzer.isStrongUptrend(analysis)) {
      score += strongTrendBonus;
    } else if (this.emaAnalyzer.isModerateUptrend(analysis)) {
      score += moderateTrendBonus;
    }

    // RSI bonus/penalty - Algorithm constants
    const healthyRsiMin = 30;
    const healthyRsiMax = 70;
    const extremeRsiHigh = 80;
    const extremeRsiLow = 20;
    const healthyRsiBonus = 5;
    const extremeRsiPenalty = 10;
    
    if (analysis.rsi > healthyRsiMin && analysis.rsi < healthyRsiMax) {
      score += healthyRsiBonus; // Healthy RSI range
    } else if (analysis.rsi > extremeRsiHigh || analysis.rsi < extremeRsiLow) {
      score -= extremeRsiPenalty; // Extreme RSI levels
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateAiScore(aiAnalysis: AIAnalysis): number {
    let score = aiAnalysis.confidence;

    // Sentiment adjustment - Algorithm constants
    const sentimentThreshold = 50;
    const sentimentMultiplier = 0.3;
    const technicalSignalsMultiplier = 0.2;
    
    if (aiAnalysis.sentiment > sentimentThreshold) {
      score += (aiAnalysis.sentiment - sentimentThreshold) * sentimentMultiplier;
    } else if (aiAnalysis.sentiment < -sentimentThreshold) {
      score -= Math.abs(aiAnalysis.sentiment + sentimentThreshold) * sentimentMultiplier;
    }

    // Technical signals bonus
    score += aiAnalysis.technicalSignals * technicalSignalsMultiplier;

    return Math.min(100, Math.max(0, score));
  }

  private calculateVolumeScore(technicalData: TechnicalData): number {
    const minVolumeDataPoints = 20; // Algorithm constant
    const defaultVolumeScore = 60; // Algorithm constant
    const recentVolumePeriod = 5; // Algorithm constant
    
    if (!technicalData.volumes || technicalData.volumes.length < minVolumeDataPoints) {
      return defaultVolumeScore; // Default score when volume data unavailable
    }

    const recentVolume = technicalData.volumes.slice(-recentVolumePeriod);
    const avgVolume = technicalData.volumes.slice(-minVolumeDataPoints);

    const recentAvg = recentVolume.reduce((a, b) => a + b) / recentVolume.length;
    const overallAvg = avgVolume.reduce((a, b) => a + b) / avgVolume.length;

    const volumeRatio = recentAvg / overallAvg;

    const config = TradingConfigManager.getConfig();
    const highVolumeMultiplier = config.VALIDATION_SCORES?.VOLUME_HIGH_MULTIPLIER || 1.5;
    const aboveAvgScore = config.VALIDATION_SCORES?.VOLUME_ADEQUATE - 5 || 75;
    const normalScore = config.VALIDATION_SCORES?.MIN_VALID_SCORE || 60;
    const belowAvgScore = config.VALIDATION_SCORES?.VOLUME_LOW || 40;
    const lowVolumeScore = config.VALIDATION_SCORES?.RSI_OVERBOUGHT + 5 || 25;
    
    // Score based on volume ratio - Algorithm constants
    const aboveAvgThreshold = 1.2;
    const normalThreshold = 0.8;
    const belowAvgThreshold = 0.5;
    
    if (volumeRatio > highVolumeMultiplier) return config.HIGH_CONFIDENCE;      // High volume
    if (volumeRatio > aboveAvgThreshold) return aboveAvgScore;      // Above average
    if (volumeRatio > normalThreshold) return normalScore;      // Normal
    if (volumeRatio > belowAvgThreshold) return belowAvgScore;      // Below average
    return lowVolumeScore;                             // Low volume
  }

  private calculateMomentumScore(technicalData: TechnicalData): number {
    const prices = technicalData.prices;
    const minMomentumDataPoints = 14; // Algorithm constant
    const defaultMomentumScore = 50; // Algorithm constant
    const momentumPeriod = 7; // Algorithm constant
    
    if (prices.length < minMomentumDataPoints) return defaultMomentumScore;

    // Price momentum (last 7 vs previous 7)
    const recent = prices.slice(-momentumPeriod);
    const previous = prices.slice(-minMomentumDataPoints, -momentumPeriod);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b) / previous.length;

    const priceChange = ((recentAvg - previousAvg) / previousAvg) * 100;

    // Volatility check
    const volatility = this.calculateVolatility(recent);

    const baseMomentumScore = 50; // Algorithm constant
    const priceChangeMultiplier = 10; // Algorithm constant
    let momentumScore = baseMomentumScore + (priceChange * priceChangeMultiplier);

    // Adjust for volatility (high volatility reduces score) - Algorithm constants
    const highVolatilityThreshold = 5;
    const lowVolatilityThreshold = 2;
    const highVolatilityPenalty = 15;
    const lowVolatilityBonus = 10;
    
    if (volatility > highVolatilityThreshold) {
      momentumScore -= highVolatilityPenalty;
    } else if (volatility < lowVolatilityThreshold) {
      momentumScore += lowVolatilityBonus;
    }

    return Math.min(100, Math.max(0, momentumScore));
  }

  private calculateVolatility(prices: number[]): number {
    return TechnicalCalculator.calculateVolatility(prices).volatility;
  }

  private calculateAdjustedConfidence(finalScore: number, aiConfidence: number): number {
    // Base confidence from final score
    let confidence = finalScore;

    // Adjust based on AI confidence - Algorithm constants
    const aiWeight = 0.4;
    confidence = confidence * (1 - aiWeight) + aiConfidence * aiWeight;

    // Score-based adjustments - Algorithm constants
    const mediumConfidenceBonus = 5;
    const highConfidenceBonus = 5;
    const lowScoreThreshold = 40;
    const lowScorePenalty = 10;
    
    if (finalScore > TradingConfigManager.getConfig().MEDIUM_CONFIDENCE) confidence += mediumConfidenceBonus;
    if (finalScore > TradingConfigManager.getConfig().HIGH_CONFIDENCE) confidence += highConfidenceBonus;
    if (finalScore < lowScoreThreshold) confidence -= lowScorePenalty;

    return Math.min(95, Math.max(50, confidence));
  }

  private getRecommendation(finalScore: number, aiAction: string): SmartScore['recommendation'] {
    const buyThreshold = 75; // Algorithm constant
    const sellThreshold = 75; // Algorithm constant
    
    if (finalScore >= TradingConfigManager.getConfig().HIGH_CONFIDENCE && aiAction === 'BUY') return 'STRONG_BUY';
    if (finalScore >= buyThreshold && aiAction === 'BUY') return 'BUY';
    if (finalScore >= TradingConfigManager.getConfig().HIGH_CONFIDENCE && aiAction === 'SELL') return 'STRONG_SELL';
    if (finalScore >= sellThreshold && aiAction === 'SELL') return 'SELL';
    return 'HOLD';
  }

  // Adaptive filtering based on market conditions
  getAdaptiveThreshold(marketCondition: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS'): number {
    switch (marketCondition) {
      case 'BULL_MARKET':
        return 65; // Algorithm constant - Lower threshold in bull market
      case 'BEAR_MARKET':
        return TradingConfigManager.getConfig().MEDIUM_CONFIDENCE; // Higher threshold in bear market
      case 'SIDEWAYS':
        return 75; // Algorithm constant - Medium threshold in sideways market
      default:
        return 75; // Algorithm constant - Default threshold
    }
  }
}