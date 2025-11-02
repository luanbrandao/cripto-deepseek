import { TradeDecision } from '../types/trading';

interface SentimentAnalysis {
  bullishScore: number;
  bearishScore: number;
  neutralScore: number;
  confidence: number;
}

interface TechnicalSignals {
  breakout: boolean;
  support: boolean;
  resistance: boolean;
  momentum: number;
  volume: number;
}

export class AdvancedAnalysisParser {
  private static readonly BULLISH_KEYWORDS = [
    'strong buy', 'breakout above', 'bullish momentum', 'upward trend',
    'positive momentum', 'strong support', 'buying pressure', 'accumulation',
    'golden cross', 'bullish divergence', 'higher highs', 'strong volume'
  ];

  private static readonly BEARISH_KEYWORDS = [
    'strong sell', 'break below', 'bearish momentum', 'downward trend',
    'negative momentum', 'weak support', 'selling pressure', 'distribution',
    'death cross', 'bearish divergence', 'lower lows', 'weak volume'
  ];

  private static readonly CONFIDENCE_BOOSTERS = [
    'strong', 'confirmed', 'clear', 'significant', 'substantial',
    'decisive', 'convincing', 'robust', 'solid', 'definitive'
  ];

  static async parseWithAdvancedSentiment(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    const sentiment = this.calculateSentiment(analysis);
    const technicalSignals = this.extractTechnicalSignals(analysis);
    const confidenceFactors = this.analyzeConfidenceFactors(analysis);

    const action = this.determineAction(sentiment, technicalSignals);
    const confidence = this.calculateDynamicConfidence(sentiment, confidenceFactors, technicalSignals);
    const reason = this.generateDetailedReason(analysis, sentiment, technicalSignals);

    return {
      action,
      confidence,
      reason,
      symbol,
      price
    };
  }

  private static calculateSentiment(analysis: string): SentimentAnalysis {
    const analysisLower = analysis.toLowerCase();
    let bullishScore = 0;
    let bearishScore = 0;

    // Count bullish signals
    this.BULLISH_KEYWORDS.forEach(keyword => {
      const matches = (analysisLower.match(new RegExp(keyword, 'g')) || []).length;
      bullishScore += matches * (keyword.includes('strong') ? 2 : 1);
    });

    // Count bearish signals
    this.BEARISH_KEYWORDS.forEach(keyword => {
      const matches = (analysisLower.match(new RegExp(keyword, 'g')) || []).length;
      bearishScore += matches * (keyword.includes('strong') ? 2 : 1);
    });

    const totalScore = bullishScore + bearishScore;
    const neutralScore = Math.max(0, 10 - totalScore);

    return {
      bullishScore,
      bearishScore,
      neutralScore,
      confidence: Math.min(95, Math.max(50, totalScore * 8))
    };
  }

  private static extractTechnicalSignals(analysis: string): TechnicalSignals {
    const analysisLower = analysis.toLowerCase();

    return {
      breakout: /breakout|break.*above|breakthrough/i.test(analysis),
      support: /support.*hold|strong.*support|bounce.*support/i.test(analysis),
      resistance: /resistance.*break|above.*resistance/i.test(analysis),
      momentum: this.extractMomentumScore(analysisLower),
      volume: this.extractVolumeScore(analysisLower)
    };
  }

  private static extractMomentumScore(analysis: string): number {
    if (analysis.includes('strong momentum') || analysis.includes('accelerating')) return 90;
    if (analysis.includes('momentum') || analysis.includes('trending')) return 75;
    if (analysis.includes('weak momentum') || analysis.includes('slowing')) return 30;
    return 50;
  }

  private static extractVolumeScore(analysis: string): number {
    if (analysis.includes('high volume') || analysis.includes('strong volume')) return 85;
    if (analysis.includes('volume') || analysis.includes('activity')) return 70;
    if (analysis.includes('low volume') || analysis.includes('weak volume')) return 40;
    return 60;
  }

  private static analyzeConfidenceFactors(analysis: string): number {
    const analysisLower = analysis.toLowerCase();
    let confidenceBoost = 0;

    this.CONFIDENCE_BOOSTERS.forEach(booster => {
      if (analysisLower.includes(booster)) {
        confidenceBoost += 3;
      }
    });

    // Additional confidence factors
    if (analysisLower.includes('multiple indicators')) confidenceBoost += 5;
    if (analysisLower.includes('confluence')) confidenceBoost += 4;
    if (analysisLower.includes('confirmation')) confidenceBoost += 3;

    return Math.min(15, confidenceBoost);
  }

  private static determineAction(sentiment: SentimentAnalysis, signals: TechnicalSignals): 'BUY' | 'SELL' | 'HOLD' {
    const bullishSignals = sentiment.bullishScore + (signals.breakout ? 2 : 0) + (signals.support ? 1 : 0);
    const bearishSignals = sentiment.bearishScore;

    if (bullishSignals >= 3 && bullishSignals > bearishSignals * 1.5) {
      return 'BUY';
    }
    
    if (bearishSignals >= 3 && bearishSignals > bullishSignals * 1.5) {
      return 'SELL';
    }

    return 'HOLD';
  }

  private static calculateDynamicConfidence(
    sentiment: SentimentAnalysis, 
    confidenceFactors: number, 
    signals: TechnicalSignals
  ): number {
    let baseConfidence = sentiment.confidence;
    
    // Technical signals boost
    if (signals.breakout) baseConfidence += 5;
    if (signals.support) baseConfidence += 3;
    if (signals.momentum > 80) baseConfidence += 4;
    if (signals.volume > 80) baseConfidence += 3;

    // Confidence factors boost
    baseConfidence += confidenceFactors;

    return Math.min(95, Math.max(50, baseConfidence));
  }

  private static generateDetailedReason(
    analysis: string, 
    sentiment: SentimentAnalysis, 
    signals: TechnicalSignals
  ): string {
    const reasons = [];

    if (sentiment.bullishScore > sentiment.bearishScore) {
      reasons.push('DeepSeek AI: Sinais predominantemente bullish');
    } else if (sentiment.bearishScore > sentiment.bullishScore) {
      reasons.push('DeepSeek AI: Sinais predominantemente bearish');
    }

    if (signals.breakout) reasons.push('Breakout confirmado');
    if (signals.support) reasons.push('Suporte forte identificado');
    if (signals.momentum > 75) reasons.push('Momentum positivo');
    if (signals.volume > 75) reasons.push('Volume confirmativo');

    return reasons.length > 0 ? reasons.join(' + ') : 'Análise AI avançada';
  }
}