/**
 * 🔬 CONSOLIDATED ANALYZER SERVICE
 * Unified service for all analysis patterns and methods
 */

import { TechnicalAnalyzerFactory, AnalyzerType, TechnicalAnalysisResult, MarketDataInput, TradingConfigManager } from '../../core';
import { AdvancedAnalysisService, AdvancedAnalysisResult } from './advanced-analysis-service';
import { DeepSeekService } from '../../core/clients/deepseek-client';

export interface ConsolidatedAnalysisResult {
  technical: {
    individual: TechnicalAnalysisResult[];
    consensus: TechnicalAnalysisResult;
    agreement: number;
  };
  advanced?: AdvancedAnalysisResult;
  ai?: any;
  final: {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
    score: number;
  };
}

export interface AnalysisConfig {
  patterns?: AnalyzerType[];
  includeAdvanced?: boolean;
  includeAI?: boolean;
  symbol?: string;
  customConfigs?: Partial<Record<AnalyzerType, any>>;
}

export class ConsolidatedAnalyzerService {
  private advancedService: AdvancedAnalysisService;

  constructor() {
    this.advancedService = new AdvancedAnalysisService();
  }

  /**
   * 🎯 COMPREHENSIVE ANALYSIS
   */
  async analyzeComprehensive(
    marketData: MarketDataInput,
    config: AnalysisConfig = {}
  ): Promise<ConsolidatedAnalysisResult> {
    const {
      patterns = ['ema', 'momentum', 'volume'],
      includeAdvanced = true,
      includeAI = false,
      symbol = 'BTCUSDT',
      customConfigs = {}
    } = config;

    // Technical Analysis
    const technicalResult = TechnicalAnalyzerFactory.analyzeMultiple(
      patterns,
      marketData,
      customConfigs as Record<AnalyzerType, any>
    );

    let advancedResult: AdvancedAnalysisResult | undefined;
    let aiResult: any;

    // Advanced Analysis (if requested and data available)
    if (includeAdvanced && marketData.price24h && marketData.price24h.length >= 26) {
      const technicalData = {
        prices: marketData.price24h,
        volumes: marketData.volumes,
        currentPrice: marketData.currentPrice
      };

      const aiAnalysis = {
        confidence: technicalResult.consensus.confidence,
        action: technicalResult.consensus.action,
        sentiment: technicalResult.consensus.action === 'BUY' ? 60 :
          technicalResult.consensus.action === 'SELL' ? -60 : 0, // Algorithm constants
        technicalSignals: technicalResult.consensus.confidence
      };

      advancedResult = this.advancedService.analyzeComprehensive(technicalData, aiAnalysis);
    }

    // AI Analysis (if requested)
    if (includeAI && symbol) {
      try {
        // Use DeepSeek service directly
        const deepseek = new DeepSeekService();
        const prompt = `Analyze ${symbol} market data and provide BUY/SELL/HOLD recommendation with confidence percentage.`;
        try {
          const response = await deepseek.analyzeMarket(marketData, prompt, 'smartBot', symbol);
          aiResult = {
            action: response.action || 'HOLD',
            confidence: response.confidence || 50,
            reason: response.reason || 'AI analysis'
          };
        } catch (error) {
          const config = TradingConfigManager.getConfig();
          aiResult = {
            action: 'HOLD',
            confidence: config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50,
            reason: 'AI analysis failed'
          };
        }
      } catch (error) {
        console.log('⚠️ AI analysis failed, continuing with technical analysis only');
      }
    }

    // Generate Final Recommendation
    const final = this.generateFinalRecommendation(
      technicalResult,
      advancedResult,
      aiResult
    );

    return {
      technical: {
        individual: technicalResult.results,
        consensus: technicalResult.consensus,
        agreement: technicalResult.agreement
      },
      advanced: advancedResult,
      ai: aiResult,
      final
    };
  }

  /**
   * 🎯 QUICK TECHNICAL ANALYSIS
   */
  analyzeQuickTechnical(
    marketData: MarketDataInput,
    patterns: AnalyzerType[] = ['ema']
  ): { individual: TechnicalAnalysisResult[]; consensus: TechnicalAnalysisResult; agreement: number } {
    const result = TechnicalAnalyzerFactory.analyzeMultiple(patterns, marketData);
    return {
      individual: result.results,
      consensus: result.consensus,
      agreement: result.agreement
    };
  }

  /**
   * 🎯 SINGLE PATTERN ANALYSIS
   */
  analyzeSinglePattern(
    pattern: AnalyzerType,
    marketData: MarketDataInput,
    config?: any
  ): TechnicalAnalysisResult {
    return TechnicalAnalyzerFactory.analyze(pattern, marketData, config);
  }

  /**
   * 🎯 VALIDATE ANALYSIS REQUIREMENTS
   */
  validateAnalysisRequirements(
    patterns: AnalyzerType[],
    marketData: MarketDataInput
  ): {
    valid: AnalyzerType[];
    invalid: AnalyzerType[];
    canProceed: boolean;
  } {
    const valid: AnalyzerType[] = [];
    const invalid: AnalyzerType[] = [];

    for (const pattern of patterns) {
      if (TechnicalAnalyzerFactory.validateMarketData(pattern, marketData)) {
        valid.push(pattern);
      } else {
        invalid.push(pattern);
      }
    }

    return {
      valid,
      invalid,
      canProceed: valid.length > 0
    };
  }

  /**
   * 🎯 GET RECOMMENDED PATTERNS
   */
  getRecommendedPatterns(marketData: MarketDataInput): {
    conservative: AnalyzerType[];
    balanced: AnalyzerType[];
    aggressive: AnalyzerType[];
  } {
    const minCandlesRequired = 20; // Algorithm constant
    const minPricesRequired = 26; // Algorithm constant
    const minVolumesRequired = 20; // Algorithm constant
    
    const hasCandles = marketData.candles && marketData.candles.length >= minCandlesRequired;
    const hasPrices = marketData.price24h && marketData.price24h.length >= minPricesRequired;
    const hasVolumes = marketData.volumes && marketData.volumes.length >= minVolumesRequired;

    const conservative: AnalyzerType[] = [];
    const balanced: AnalyzerType[] = [];
    const aggressive: AnalyzerType[] = [];

    if (hasPrices) {
      conservative.push('ema');
      balanced.push('ema', 'momentum');
      aggressive.push('ema', 'momentum');
    }

    if (hasCandles) {
      balanced.push('123');
      aggressive.push('123', 'support-resistance');
    }

    if (hasVolumes) {
      aggressive.push('volume');
    }

    return { conservative, balanced, aggressive };
  }

  /**
   * 🔧 PRIVATE: Generate Final Recommendation
   */
  private generateFinalRecommendation(
    technical: any,
    advanced?: AdvancedAnalysisResult,
    ai?: any
  ): ConsolidatedAnalysisResult['final'] {
    const config = TradingConfigManager.getConfig();

    // Start with technical consensus
    let action = technical.consensus.action;
    let confidence = technical.consensus.confidence;
    let score = confidence;
    let reason = `Technical consensus: ${action} (${Math.round(technical.agreement * 100)}% agreement)`;

    // Advanced analysis boost
    if (advanced) {
      const minBoostThreshold = (config.VALIDATION_SCORES?.EMA_ALIGNMENT || 40) / 8;
      const advancedWeight = 0.3; // Algorithm constant
      const overrideThreshold = (config.VALIDATION_SCORES?.EMA_ALIGNMENT || 40) / 4; // Algorithm constant
      
      const advancedBoost = advanced.recommendation.confidence - confidence;
      if (Math.abs(advancedBoost) > minBoostThreshold) {
        confidence += advancedBoost * advancedWeight;
        reason += ` | Advanced: ${advanced.recommendation.action} (+${advancedBoost.toFixed(1)}%)`;
      }

      // Update action if advanced is more confident
      if (advanced.recommendation.confidence > confidence + overrideThreshold) {
        action = advanced.recommendation.action as any;
        reason += ` | Advanced override`;
      }
    }

    // AI analysis boost
    const aiConfidenceThreshold = (config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50) + 20;
    const aiBoostThreshold = (config.VALIDATION_SCORES?.EMA_ALIGNMENT || 40) / 8;
    const aiWeight = 0.2; // Algorithm constant
    
    if (ai && ai.confidence > aiConfidenceThreshold) {
      const aiBoost = ai.confidence - confidence;
      if (Math.abs(aiBoost) > aiBoostThreshold && ai.action === action) {
        confidence += aiBoost * aiWeight;
        reason += ` | AI: ${ai.action} (+${aiBoost.toFixed(1)}%)`;
      }
    }

    // Final validation - Algorithm constants
    const maxConfidenceBonus = 15;
    const maxConfidence = (config.HIGH_CONFIDENCE || 80) + maxConfidenceBonus;
    const minConfidence = config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50;
    confidence = Math.min(maxConfidence, Math.max(minConfidence, confidence));

    if (confidence < config.MIN_CONFIDENCE) {
      action = 'HOLD';
      reason += ` | Below minimum confidence (${config.MIN_CONFIDENCE}%)`;
    }

    return {
      action,
      confidence: Math.round(confidence),
      reason,
      score: Math.round(score)
    };
  }

  /**
   * 📊 GET ANALYSIS SUMMARY
   */
  getAnalysisSummary(result: ConsolidatedAnalysisResult): string {
    const lines = [
      `🎯 Final: ${result.final.action} (${result.final.confidence}%)`,
      `📊 Technical: ${result.technical.consensus.action} (${Math.round(result.technical.agreement * 100)}% agreement)`,
    ];

    if (result.advanced) {
      lines.push(`🧠 Advanced: ${result.advanced.recommendation.action} (${result.advanced.recommendation.confidence.toFixed(1)}%)`);
    }

    if (result.ai) {
      lines.push(`🤖 AI: ${result.ai.action} (${result.ai.confidence}%)`);
    }

    lines.push(`💡 Reason: ${result.final.reason}`);

    return lines.join('\\n');
  }
}