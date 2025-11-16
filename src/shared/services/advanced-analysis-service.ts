/**
 * 🧠 ADVANCED ANALYSIS SERVICE
 * Consolidates advanced EMA and smart scoring functionality
 */

import { AdvancedEmaAnalyzer } from '../../bots/services/advanced-ema-analyzer';
import { SmartScoringSystem, SmartScore, TechnicalData, AIAnalysis } from '../../bots/services/smart-scoring-system';
import { TradingConfigManager } from '../../core/config/trading-config-manager';

export interface AdvancedAnalysisResult {
  emaAnalysis: any;
  smartScore: SmartScore;
  marketCondition: {
    type: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS';
    confidence: number;
  };
  recommendation: {
    action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reason: string;
  };
  thresholds: {
    adaptive: number;
    minimum: number;
    high: number;
  };
}

export class AdvancedAnalysisService {
  private emaAnalyzer: AdvancedEmaAnalyzer;
  private scoringSystem: SmartScoringSystem;

  constructor() {
    this.emaAnalyzer = new AdvancedEmaAnalyzer();
    this.scoringSystem = new SmartScoringSystem();
  }

  /**
   * 🎯 COMPREHENSIVE ANALYSIS
   */
  analyzeComprehensive(
    technicalData: TechnicalData,
    aiAnalysis: AIAnalysis
  ): AdvancedAnalysisResult {
    // Advanced EMA Analysis
    const emaAnalysis = this.emaAnalyzer.analyzeAdvanced(
      technicalData.prices,
      technicalData.volumes
    );

    // Market Condition Assessment
    const marketCondition = this.emaAnalyzer.getMarketCondition(emaAnalysis);

    // Smart Score Calculation
    const smartScore = this.scoringSystem.calculateSmartScore(technicalData, aiAnalysis);

    // Adaptive Thresholds
    const adaptiveThreshold = this.scoringSystem.getAdaptiveThreshold(marketCondition.type);
    const config = TradingConfigManager.getConfig();

    const thresholds = {
      adaptive: adaptiveThreshold,
      minimum: config.MIN_CONFIDENCE,
      high: config.HIGH_CONFIDENCE
    };

    // Final Recommendation
    const recommendation = this.generateRecommendation(
      smartScore,
      marketCondition,
      thresholds
    );

    return {
      emaAnalysis,
      smartScore,
      marketCondition,
      recommendation,
      thresholds
    };
  }

  /**
   * 🎯 QUICK EMA ANALYSIS
   */
  analyzeEmaOnly(prices: number[], volumes?: number[]): {
    analysis: any;
    isStrongUptrend: boolean;
    isModerateUptrend: boolean;
    marketCondition: any;
  } {
    const analysis = this.emaAnalyzer.analyzeAdvanced(prices, volumes);
    
    return {
      analysis,
      isStrongUptrend: this.emaAnalyzer.isStrongUptrend(analysis),
      isModerateUptrend: this.emaAnalyzer.isModerateUptrend(analysis),
      marketCondition: this.emaAnalyzer.getMarketCondition(analysis)
    };
  }

  /**
   * 🎯 SMART SCORE ONLY
   */
  calculateSmartScoreOnly(
    technicalData: TechnicalData,
    aiAnalysis: AIAnalysis
  ): SmartScore {
    return this.scoringSystem.calculateSmartScore(technicalData, aiAnalysis);
  }

  /**
   * 🎯 MARKET CONDITION ASSESSMENT
   */
  assessMarketCondition(prices: number[], volumes?: number[]): {
    type: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS';
    confidence: number;
    adaptiveThreshold: number;
    details: any;
  } {
    const analysis = this.emaAnalyzer.analyzeAdvanced(prices, volumes);
    const condition = this.emaAnalyzer.getMarketCondition(analysis);
    const adaptiveThreshold = this.scoringSystem.getAdaptiveThreshold(condition.type);

    return {
      ...condition,
      adaptiveThreshold,
      details: analysis
    };
  }

  /**
   * 🎯 VALIDATE SIGNAL STRENGTH
   */
  validateSignalStrength(
    technicalData: TechnicalData,
    aiAnalysis: AIAnalysis,
    requiredConfidence: number = TradingConfigManager.getConfig().MEDIUM_CONFIDENCE
  ): {
    isValid: boolean;
    actualConfidence: number;
    reason: string;
    breakdown: {
      ema: number;
      ai: number;
      volume: number;
      momentum: number;
    };
  } {
    const smartScore = this.scoringSystem.calculateSmartScore(technicalData, aiAnalysis);
    
    const isValid = smartScore.confidence >= requiredConfidence;
    const reason = isValid 
      ? `Signal strength validated: ${smartScore.confidence.toFixed(1)}% ≥ ${requiredConfidence}%`
      : `Signal too weak: ${smartScore.confidence.toFixed(1)}% < ${requiredConfidence}%`;

    return {
      isValid,
      actualConfidence: smartScore.confidence,
      reason,
      breakdown: {
        ema: smartScore.emaScore,
        ai: smartScore.aiScore,
        volume: smartScore.volumeScore,
        momentum: smartScore.momentumScore
      }
    };
  }

  /**
   * 🔧 PRIVATE: Generate Final Recommendation
   */
  private generateRecommendation(
    smartScore: SmartScore,
    marketCondition: any,
    thresholds: any
  ): AdvancedAnalysisResult['recommendation'] {
    let finalConfidence = smartScore.confidence;
    let reason = `Smart Score: ${smartScore.finalScore.toFixed(1)}/100`;

    const config = TradingConfigManager.getConfig();
    const marketBoost = config.VALIDATION_SCORES?.EMA_ALIGNMENT / 8 || 5; // Algorithm constant
    const sidewaysPenalty = config.VALIDATION_SCORES?.EMA_ALIGNMENT / 8 || 5; // Algorithm constant
    
    // Market condition adjustment
    if (marketCondition.type === 'BULL_MARKET' && smartScore.recommendation.includes('BUY')) {
      finalConfidence += marketBoost;
      reason += ` | Bull market boost`;
    } else if (marketCondition.type === 'BEAR_MARKET' && smartScore.recommendation.includes('SELL')) {
      finalConfidence += marketBoost;
      reason += ` | Bear market boost`;
    } else if (marketCondition.type === 'SIDEWAYS') {
      finalConfidence -= sidewaysPenalty;
      reason += ` | Sideways penalty`;
    }

    // Threshold validation
    if (finalConfidence < thresholds.adaptive) {
      return {
        action: 'HOLD',
        confidence: finalConfidence,
        reason: `${reason} | Below adaptive threshold (${thresholds.adaptive}%)`
      };
    }

    // Cap confidence - Algorithm constants
    const maxConfidenceBonus = 15;
    const maxConfidence = config.HIGH_CONFIDENCE + maxConfidenceBonus;
    const minConfidence = config.VALIDATION_SCORES?.MIN_CONFIDENCE || config.MIN_CONFIDENCE;
    finalConfidence = Math.min(maxConfidence, Math.max(minConfidence, finalConfidence));

    return {
      action: smartScore.recommendation,
      confidence: finalConfidence,
      reason: `${reason} | Market: ${marketCondition.type}`
    };
  }

  /**
   * 🎯 GET ANALYSIS SUMMARY
   */
  getAnalysisSummary(result: AdvancedAnalysisResult): string {
    const { recommendation, smartScore, marketCondition, thresholds } = result;
    
    return [
      `🎯 Recommendation: ${recommendation.action} (${recommendation.confidence.toFixed(1)}%)`,
      `📊 Smart Score: ${smartScore.finalScore.toFixed(1)}/100`,
      `📈 Market: ${marketCondition.type} (${marketCondition.confidence}%)`,
      `🎚️ Threshold: ${thresholds.adaptive}% (adaptive)`,
      `💡 Reason: ${recommendation.reason}`
    ].join('\\n');
  }
}