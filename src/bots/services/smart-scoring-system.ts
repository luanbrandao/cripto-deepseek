import { AdvancedEmaAnalyzer } from './advanced-ema-analyzer';
import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

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

    // Weighted average calculation
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

    // Bonus for strong trends
    if (this.emaAnalyzer.isStrongUptrend(analysis)) {
      score += 15;
    } else if (this.emaAnalyzer.isModerateUptrend(analysis)) {
      score += 8;
    }

    // RSI bonus/penalty
    if (analysis.rsi > 30 && analysis.rsi < 70) {
      score += 5; // Healthy RSI range
    } else if (analysis.rsi > 80 || analysis.rsi < 20) {
      score -= 10; // Extreme RSI levels
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateAiScore(aiAnalysis: AIAnalysis): number {
    let score = aiAnalysis.confidence;

    // Sentiment adjustment
    if (aiAnalysis.sentiment > 50) {
      score += (aiAnalysis.sentiment - 50) * 0.3;
    } else if (aiAnalysis.sentiment < -50) {
      score -= Math.abs(aiAnalysis.sentiment + 50) * 0.3;
    }

    // Technical signals bonus
    score += aiAnalysis.technicalSignals * 0.2;

    return Math.min(100, Math.max(0, score));
  }

  private calculateVolumeScore(technicalData: TechnicalData): number {
    if (!technicalData.volumes || technicalData.volumes.length < 20) {
      return 60; // Default score when volume data unavailable
    }

    const recentVolume = technicalData.volumes.slice(-5);
    const avgVolume = technicalData.volumes.slice(-20);
    
    const recentAvg = recentVolume.reduce((a, b) => a + b) / recentVolume.length;
    const overallAvg = avgVolume.reduce((a, b) => a + b) / avgVolume.length;
    
    const volumeRatio = recentAvg / overallAvg;
    
    // Score based on volume ratio
    if (volumeRatio > 1.5) return UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE;      // High volume
    if (volumeRatio > 1.2) return 75;      // Above average
    if (volumeRatio > 0.8) return 60;      // Normal
    if (volumeRatio > 0.5) return 40;      // Below average
    return 25;                             // Low volume
  }

  private calculateMomentumScore(technicalData: TechnicalData): number {
    const prices = technicalData.prices;
    if (prices.length < 14) return 50;

    // Price momentum (last 7 vs previous 7)
    const recent = prices.slice(-7);
    const previous = prices.slice(-14, -7);
    
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b) / previous.length;
    
    const priceChange = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    // Volatility check
    const volatility = this.calculateVolatility(recent);
    
    let momentumScore = 50 + (priceChange * 10);
    
    // Adjust for volatility (high volatility reduces score)
    if (volatility > 5) {
      momentumScore -= 15;
    } else if (volatility < 2) {
      momentumScore += 10;
    }

    return Math.min(100, Math.max(0, momentumScore));
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }

    const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100;
  }

  private calculateAdjustedConfidence(finalScore: number, aiConfidence: number): number {
    // Base confidence from final score
    let confidence = finalScore;

    // Adjust based on AI confidence
    const aiWeight = 0.4;
    confidence = confidence * (1 - aiWeight) + aiConfidence * aiWeight;

    // Score-based adjustments
    if (finalScore > UNIFIED_TRADING_CONFIG.MEDIUM_CONFIDENCE) confidence += 5;
    if (finalScore > UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE) confidence += 5;
    if (finalScore < 40) confidence -= 10;

    return Math.min(95, Math.max(50, confidence));
  }

  private getRecommendation(finalScore: number, aiAction: string): SmartScore['recommendation'] {
    if (finalScore >= UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE && aiAction === 'BUY') return 'STRONG_BUY';
    if (finalScore >= 75 && aiAction === 'BUY') return 'BUY';
    if (finalScore >= UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE && aiAction === 'SELL') return 'STRONG_SELL';
    if (finalScore >= 75 && aiAction === 'SELL') return 'SELL';
    return 'HOLD';
  }

  // Adaptive filtering based on market conditions
  getAdaptiveThreshold(marketCondition: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS'): number {
    switch (marketCondition) {
      case 'BULL_MARKET':
        return 65; // Lower threshold in bull market
      case 'BEAR_MARKET':
        return UNIFIED_TRADING_CONFIG.MEDIUM_CONFIDENCE; // Higher threshold in bear market
      case 'SIDEWAYS':
        return 75; // Medium threshold in sideways market
      default:
        return 75;
    }
  }
}