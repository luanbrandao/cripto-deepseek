import { TradeDecision } from '../../bots/types/trading';

import { UNIFIED_TRADING_CONFIG } from '../config/unified-trading-config';

interface SentimentAnalysis {
  bullishScore: number;
  bearishScore: number;
  confidence: number;
}

interface TechnicalSignals {
  breakout: boolean;
  support: boolean;
  resistance: boolean;
  momentum: number;
  volume: number;
}

export class UnifiedAnalysisParser {
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

  static async parseBasic(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    const analysisLower = analysis.toLowerCase();

    // Recomendações explícitas (prioridade máxima)
    const explicitPatterns = [
      { pattern: /recommendation:\s*\*?\*?hold\*?\*?/i, action: 'HOLD', confidence: 60 },
      { pattern: /recommendation:\s*\*?\*?sell\*?\*?/i, action: 'SELL', confidence: 75 },
      { pattern: /recommendation:\s*\*?\*?buy\*?\*?/i, action: 'BUY', confidence: 75 }
    ];

    for (const { pattern, action, confidence } of explicitPatterns) {
      if (pattern.test(analysis)) {
        return { 
          action: action as any, 
          confidence, 
          reason: `DeepSeek AI: Recomendação de ${action.toLowerCase()}`, 
          symbol, 
          price 
        };
      }
    }

    // Sinais fortes
    if (analysisLower.includes('strong sell') || analysisLower.includes('break below')) {
      return { action: 'SELL', confidence: 80, reason: 'DeepSeek AI: Sinal forte de venda', symbol, price };
    }

    if (analysisLower.includes('strong buy') || analysisLower.includes('breakout above')) {
      return { action: 'BUY', confidence: 85, reason: 'DeepSeek AI: Sinal forte de compra', symbol, price };
    }

    // Tendências gerais
    if (analysisLower.includes('bearish trend') || (analysisLower.includes('sell') && !analysisLower.includes('oversell'))) {
      return { action: 'SELL', confidence: 70, reason: 'DeepSeek AI: Tendência de baixa', symbol, price };
    }

    if (analysisLower.includes('bullish trend') || (analysisLower.includes('buy') && !analysisLower.includes('overbuy'))) {
      return { action: 'BUY', confidence: 75, reason: 'DeepSeek AI: Tendência de alta', symbol, price };
    }

    return { action: 'HOLD', confidence: 50, reason: 'DeepSeek AI: Mercado indefinido', symbol, price };
  }

  static async parseAdvanced(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    const sentiment = this.calculateSentiment(analysis);
    const technicalSignals = this.extractTechnicalSignals(analysis);
    const confidenceFactors = this.analyzeConfidenceFactors(analysis);

    const action = this.determineAction(sentiment, technicalSignals);
    const confidence = this.calculateDynamicConfidence(sentiment, confidenceFactors, technicalSignals);
    const reason = this.generateDetailedReason(analysis, sentiment, technicalSignals);

    return { action, confidence, reason, symbol, price };
  }

  private static calculateSentiment(analysis: string): SentimentAnalysis {
    const analysisLower = analysis.toLowerCase();
    let bullishScore = 0;
    let bearishScore = 0;

    this.BULLISH_KEYWORDS.forEach(keyword => {
      const matches = (analysisLower.match(new RegExp(keyword, 'g')) || []).length;
      bullishScore += matches * (keyword.includes('strong') ? 2 : 1);
    });

    this.BEARISH_KEYWORDS.forEach(keyword => {
      const matches = (analysisLower.match(new RegExp(keyword, 'g')) || []).length;
      bearishScore += matches * (keyword.includes('strong') ? 2 : 1);
    });

    const totalScore = bullishScore + bearishScore;
    return {
      bullishScore,
      bearishScore,
      confidence: Math.min(UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE, Math.max(50, totalScore * 8))
    };
  }

  private static extractTechnicalSignals(analysis: string): TechnicalSignals {
    return {
      breakout: /breakout|break.*above|breakthrough/i.test(analysis),
      support: /support.*hold|strong.*support|bounce.*support/i.test(analysis),
      resistance: /resistance.*break|above.*resistance/i.test(analysis),
      momentum: this.extractMomentumScore(analysis.toLowerCase()),
      volume: this.extractVolumeScore(analysis.toLowerCase())
    };
  }

  private static extractMomentumScore(analysis: string): number {
    if (analysis.includes('strong momentum')) return UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE;
    if (analysis.includes('momentum')) return 75;
    if (analysis.includes('weak momentum')) return 30;
    return 50;
  }

  private static extractVolumeScore(analysis: string): number {
    if (analysis.includes('high volume')) return 85;
    if (analysis.includes('volume')) return 70;
    if (analysis.includes('low volume')) return 40;
    return 60;
  }

  private static analyzeConfidenceFactors(analysis: string): number {
    const analysisLower = analysis.toLowerCase();
    let confidenceBoost = 0;

    this.CONFIDENCE_BOOSTERS.forEach(booster => {
      if (analysisLower.includes(booster)) confidenceBoost += 3;
    });

    if (analysisLower.includes('multiple indicators')) confidenceBoost += 5;
    if (analysisLower.includes('confluence')) confidenceBoost += 4;
    if (analysisLower.includes('confirmation')) confidenceBoost += 3;

    return Math.min(15, confidenceBoost);
  }

  private static determineAction(sentiment: SentimentAnalysis, signals: TechnicalSignals): 'BUY' | 'SELL' | 'HOLD' {
    const bullishSignals = sentiment.bullishScore + (signals.breakout ? 2 : 0) + (signals.support ? 1 : 0);
    const bearishSignals = sentiment.bearishScore;

    if (bullishSignals >= 3 && bullishSignals > bearishSignals * 1.5) return 'BUY';
    if (bearishSignals >= 3 && bearishSignals > bullishSignals * 1.5) return 'SELL';
    return 'HOLD';
  }

  private static calculateDynamicConfidence(
    sentiment: SentimentAnalysis, 
    confidenceFactors: number, 
    signals: TechnicalSignals
  ): number {
    let baseConfidence = sentiment.confidence;
    
    if (signals.breakout) baseConfidence += 5;
    if (signals.support) baseConfidence += 3;
    if (signals.momentum > 80) baseConfidence += 4;
    if (signals.volume > 80) baseConfidence += 3;

    baseConfidence += confidenceFactors;
    return Math.min(UNIFIED_TRADING_CONFIG.HIGH_CONFIDENCE, Math.max(50, baseConfidence));
  }

  private static generateDetailedReason(
    analysis: string, 
    sentiment: SentimentAnalysis, 
    signals: TechnicalSignals
  ): string {
    const reasons = [];

    if (sentiment.bullishScore > sentiment.bearishScore) {
      reasons.push('Sinais predominantemente bullish');
    } else if (sentiment.bearishScore > sentiment.bullishScore) {
      reasons.push('Sinais predominantemente bearish');
    }

    if (signals.breakout) reasons.push('Breakout confirmado');
    if (signals.support) reasons.push('Suporte forte');
    if (signals.momentum > 75) reasons.push('Momentum positivo');
    if (signals.volume > 75) reasons.push('Volume confirmativo');

    return reasons.length > 0 ? `DeepSeek AI: ${reasons.join(' + ')}` : 'Análise AI avançada';
  }
}