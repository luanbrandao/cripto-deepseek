import { TradeDecision, TechnicalLevels } from '../../bots/types/trading';

import { TradingConfigManager } from '../../shared/config/trading-config-manager';

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
    
    // 1. EXTRAIR RECOMENDAÇÃO EXPLÍCITA
    let action = null;
    
    // Padrões mais robustos para recomendações
    const recommendationPatterns = [
      /(?:recommendation|action):\s*\*?\*?([A-Z]+)\*?\*?/i,
      /\*\*recommendation:\s*([A-Z]+)\*\*/i,
      /##\s*recommendation:\s*\*?\*?([A-Z]+)\*?\*?/i,
      /recommendation\s*\*?\*?([A-Z]+)\*?\*?/i
    ];
    
    for (const pattern of recommendationPatterns) {
      const match = analysis.match(pattern);
      if (match && ['BUY', 'SELL', 'HOLD'].includes(match[1].toUpperCase())) {
        action = match[1].toUpperCase();
        break;
      }
    }
    
    // 2. EXTRAIR NÍVEL DE CONFIANÇA
    let confidence = 50;
    const confidencePatterns = [
      /confidence\s*level[:\s*]*([0-9]+)%/i,
      /confidence[:\s*]*([0-9]+)%/i,
      /([0-9]+)%\s*confidence/i,
      /confidence\s*level[:\s*]*medium-high/i,
      /confidence\s*level[:\s*]*medium/i,
      /confidence\s*level[:\s*]*high/i,
      /confidence\s*level[:\s*]*low/i
    ];
    
    for (const pattern of confidencePatterns) {
      const match = analysis.match(pattern);
      if (match) {
        if (match[1] && !isNaN(parseInt(match[1]))) {
          confidence = parseInt(match[1]);
        } else {
          // Mapear níveis textuais para valores numéricos
          const levelText = match[0].toLowerCase();
          if (levelText.includes('medium-high')) confidence = this.getMediumHighConfidence();
          else if (levelText.includes('high')) confidence = this.getHighConfidenceLevel();
          else if (levelText.includes('medium')) confidence = this.getMediumConfidence();
          else if (levelText.includes('low')) confidence = this.getLowConfidence();
        }
        break;
      }
    }
    
    // Ajustar confiança por palavras-chave
    if (analysisLower.includes('high confidence') || analysisLower.includes('strong confidence')) {
      confidence = Math.max(confidence, this.getStrongConfidenceLevel());
    } else if (analysisLower.includes('medium-high')) {
      confidence = Math.max(confidence, this.getMediumHighConfidence());
    } else if (analysisLower.includes('medium confidence')) {
      confidence = Math.max(confidence, this.getMediumConfidence());
    } else if (analysisLower.includes('low confidence') || analysisLower.includes('medium-low')) {
      confidence = Math.min(confidence, this.getMediumLowConfidence());
    }
    
    // 3. EXTRAIR PREÇOS E NÍVEIS TÉCNICOS
    const priceInfo = this.extractPriceInfo(analysis, price);
    
    // 4. EXTRAIR RAZÃO/JUSTIFICATIVA
    let reason = this.extractReason(analysis, action);
    
    // 5. DETERMINAR AÇÃO SE NÃO EXPLÍCITA
    if (!action || !['BUY', 'SELL', 'HOLD'].includes(action)) {
      const actionResult = this.determineActionFromContent(analysis, analysisLower);
      action = actionResult.action;
      if (!reason.includes(actionResult.reason)) {
        reason += ` | ${actionResult.reason}`;
      }
    }
    
    // 6. AJUSTAR CONFIANÇA BASEADA EM SINAIS TÉCNICOS
    confidence = this.adjustConfidenceBySignals(analysisLower, confidence);
    
    return {
      action: action as 'BUY' | 'SELL' | 'HOLD',
      confidence: Math.max(this.getMinConfidenceBound(), Math.min(confidence, this.getMaxConfidenceBound())),
      reason: reason || `DeepSeek AI: ${action?.toLowerCase() || 'análise'}`,
      symbol,
      price,
      technicalLevels: priceInfo
    };
  }
  
  private static extractPriceInfo(analysis: string, currentPrice: number) {
    const priceInfo: any = {};
    
    // Padrões mais robustos para extrair preços
    const pricePattern = /\$?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/g;
    
    // Extrair níveis de suporte
    const supportPatterns = [
      /(?:support|key support|strong support|immediate support|major support)[:\s~]*(?:around\s*)?\$?([0-9,]+(?:\.[0-9]+)?)/gi,
      /support[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/gi,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*(?:\([^)]*support[^)]*\))/gi
    ];
    
    const supportLevels = new Set<number>();
    supportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(analysis)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        const maxPriceMultiplier = 2; // Algorithm constant - sanity filter
        if (price > 0 && price < currentPrice * maxPriceMultiplier) {
          supportLevels.add(price);
        }
      }
    });
    
    if (supportLevels.size > 0) {
      priceInfo.support = Array.from(supportLevels).sort((a, b) => b - a); // Ordenar do maior para o menor
    }
    
    // Extrair níveis de resistência
    const resistancePatterns = [
      /(?:resistance|key resistance|strong resistance|immediate resistance|major resistance)[:\s~]*(?:around\s*)?\$?([0-9,]+(?:\.[0-9]+)?)/gi,
      /resistance[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/gi,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*(?:\([^)]*resistance[^)]*\))/gi
    ];
    
    const resistanceLevels = new Set<number>();
    resistancePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(analysis)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        const minPriceMultiplier = 0.5; // Algorithm constant - sanity filter
        const maxResistanceMultiplier = 3; // Algorithm constant - sanity filter
        if (price > currentPrice * minPriceMultiplier && price < currentPrice * maxResistanceMultiplier) {
          resistanceLevels.add(price);
        }
      }
    });
    
    if (resistanceLevels.size > 0) {
      priceInfo.resistance = Array.from(resistanceLevels).sort((a, b) => a - b); // Ordenar do menor para o maior
    }
    
    // Extrair targets
    const targetPatterns = [
      /target[:\s~]*(?:around\s*)?\$?([0-9,]+(?:\.[0-9]+)?)/gi,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*(?:target)/gi,
      /target\s*[12]?[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/gi
    ];
    
    const targetLevels = new Set<number>();
    targetPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(analysis)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        // Filtro mais rigoroso para targets - deve ser um preço realista - Algorithm constants
        const minTargetMultiplier = 0.1;
        const maxTargetMultiplier = 5;
        const minAbsolutePrice = 10;
        if (price > currentPrice * minTargetMultiplier && price < currentPrice * maxTargetMultiplier && price > minAbsolutePrice) {
          targetLevels.add(price);
        }
      }
    });
    
    if (targetLevels.size > 0) {
      priceInfo.targets = Array.from(targetLevels).sort((a, b) => a - b);
    }
    
    // Extrair stop loss
    const stopPatterns = [
      /stop[\s-]*loss[:\s~]*(?:around\s*)?\$?([0-9,]+(?:\.[0-9]+)?)/gi,
      /stop[:\s]*(?:above\s*)?\$?([0-9,]+(?:\.[0-9]+)?)/gi
    ];
    
    const stopLevels = new Set<number>();
    stopPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(analysis)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        const maxStopMultiplier = 2; // Algorithm constant
        if (price > 0 && price < currentPrice * maxStopMultiplier) {
          stopLevels.add(price);
        }
      }
    });
    
    if (stopLevels.size > 0) {
      priceInfo.stopLoss = Array.from(stopLevels).sort((a, b) => a - b);
    }
    
    return Object.keys(priceInfo).length > 0 ? priceInfo : undefined;
  }
  
  private static extractReason(analysis: string, action: string | null): string {
    // Procurar por seções de reasoning/rationale
    const reasoningPatterns = [
      /(?:reasoning|rationale)\s*(?:for\s*[A-Z]+\s*recommendation)?[:\s]*([^#\n]*)/i,
      /(?:why\s*[A-Z]+)[:\s]*([^#\n]*)/i,
      /summary[:\s]*([^#\n]*)/i
    ];
    
    for (const pattern of reasoningPatterns) {
      const match = analysis.match(pattern);
      if (match) {
        let reasoning = match[1].trim();
        // Limpar texto
        const maxReasoningLength = 120; // Algorithm constant
        reasoning = reasoning.replace(/^[-\s*]+/, '').substring(0, maxReasoningLength);
        if (reasoning.length > 0) {
          return `DeepSeek AI: ${reasoning}`;
        }
      }
    }
    
    // Procurar por primeira frase após "Key Observations"
    const observationsMatch = analysis.match(/key observations?[:\s]*\n?\s*(?:1\.\s*)?([^\n]*)/i);
    if (observationsMatch) {
      const maxObservationLength = 100; // Algorithm constant
      const observation = observationsMatch[1].trim().substring(0, maxObservationLength);
      if (observation.length > 10) {
        return `DeepSeek AI: ${observation}`;
      }
    }
    
    // Procurar por primeira frase significativa
    const sentences = analysis.split(/[.!?]/);
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      const minSentenceLength = 20; // Algorithm constant
      const maxSentenceLength = 150; // Algorithm constant
      if (cleanSentence.length > minSentenceLength && cleanSentence.length < maxSentenceLength && 
          !cleanSentence.includes('###') && !cleanSentence.includes('**')) {
        return `DeepSeek AI: ${cleanSentence}`;
      }
    }
    
    return action ? `DeepSeek AI: Recomendação ${action.toLowerCase()}` : 'DeepSeek AI: Análise técnica';
  }
  
  private static determineActionFromContent(analysis: string, analysisLower: string): { action: string, reason: string } {
    // Padrões de SELL
    if (analysisLower.includes('strong sell') || analysisLower.includes('sell bias')) {
      return { action: 'SELL', reason: 'Sinal forte de venda' };
    }
    
    if (analysisLower.includes('break below') || analysisLower.includes('breakdown below')) {
      return { action: 'SELL', reason: 'Quebra de suporte' };
    }
    
    if (analysisLower.includes('bearish momentum') || analysisLower.includes('downward trend')) {
      return { action: 'SELL', reason: 'Momentum bearish' };
    }
    
    // Padrões de BUY
    if (analysisLower.includes('strong buy') || analysisLower.includes('buy bias')) {
      return { action: 'BUY', reason: 'Sinal forte de compra' };
    }
    
    if (analysisLower.includes('breakout above') || analysisLower.includes('break above')) {
      return { action: 'BUY', reason: 'Quebra de resistência' };
    }
    
    if (analysisLower.includes('bullish momentum') || analysisLower.includes('upward trend')) {
      return { action: 'BUY', reason: 'Momentum bullish' };
    }
    
    // Padrões de HOLD
    if (analysisLower.includes('consolidation') || analysisLower.includes('sideways')) {
      return { action: 'HOLD', reason: 'Consolidação lateral' };
    }
    
    if (analysisLower.includes('wait for confirmation') || analysisLower.includes('await')) {
      return { action: 'HOLD', reason: 'Aguardar confirmação' };
    }
    
    if (analysisLower.includes('neutral') || analysisLower.includes('indecision')) {
      return { action: 'HOLD', reason: 'Mercado neutro' };
    }
    
    // Contar palavras-chave
    const sellKeywords = ['sell', 'bearish', 'decline', 'drop', 'fall', 'negative'];
    const buyKeywords = ['buy', 'bullish', 'rise', 'rally', 'positive', 'upward'];
    const holdKeywords = ['hold', 'wait', 'consolidation', 'neutral', 'sideways'];
    
    const sellCount = sellKeywords.reduce((count, word) => count + (analysisLower.split(word).length - 1), 0);
    const buyCount = buyKeywords.reduce((count, word) => count + (analysisLower.split(word).length - 1), 0);
    const holdCount = holdKeywords.reduce((count, word) => count + (analysisLower.split(word).length - 1), 0);
    
    if (sellCount > buyCount && sellCount > holdCount) {
      return { action: 'SELL', reason: 'Predominância de sinais bearish' };
    } else if (buyCount > sellCount && buyCount > holdCount) {
      return { action: 'BUY', reason: 'Predominância de sinais bullish' };
    } else {
      return { action: 'HOLD', reason: 'Sinais mistos ou neutros' };
    }
  }
  
  private static adjustConfidenceBySignals(analysisLower: string, baseConfidence: number): number {
    // Priorizar confiança explícita da IA - ajustes mínimos apenas
    let confidence = baseConfidence;
    
    // Boost apenas por sinais muito fortes - Algorithm constants
    const strongSignalBoost = 3;
    const confirmedBreakoutBoost = 2;
    const uncertaintyPenalty = 3;
    
    if (analysisLower.includes('strong buy') || analysisLower.includes('strong sell')) confidence += strongSignalBoost;
    if (analysisLower.includes('confirmed breakout')) confidence += confirmedBreakoutBoost;
    
    // Redução apenas por incertezas explícitas
    if (analysisLower.includes('uncertain') || analysisLower.includes('unclear')) confidence -= uncertaintyPenalty;
    
    return confidence;
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
      confidence: Math.min(TradingConfigManager.getConfig().HIGH_CONFIDENCE, Math.max(50, totalScore * 8)) // Algorithm constant - score multiplier
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
    if (analysis.includes('strong momentum')) return TradingConfigManager.getConfig().HIGH_CONFIDENCE;
    const momentumScore = 75; // Algorithm constant
    const weakMomentumScore = 30; // Algorithm constant
    const defaultMomentumScore = 50; // Algorithm constant
    
    if (analysis.includes('momentum')) return momentumScore;
    if (analysis.includes('weak momentum')) return weakMomentumScore;
    return defaultMomentumScore;
  }

  private static extractVolumeScore(analysis: string): number {
    const highVolumeScore = 85; // Algorithm constant
    const volumeScore = 70; // Algorithm constant
    const lowVolumeScore = 40; // Algorithm constant
    const defaultVolumeScore = 60; // Algorithm constant
    
    if (analysis.includes('high volume')) return highVolumeScore;
    if (analysis.includes('volume')) return volumeScore;
    if (analysis.includes('low volume')) return lowVolumeScore;
    return defaultVolumeScore;
  }

  private static analyzeConfidenceFactors(analysis: string): number {
    const analysisLower = analysis.toLowerCase();
    let confidenceBoost = 0;

    this.CONFIDENCE_BOOSTERS.forEach(booster => {
      const boosterValue = 3; // Algorithm constant
      if (analysisLower.includes(booster)) confidenceBoost += boosterValue;
    });

    const multipleIndicatorsBoost = 5; // Algorithm constant
    const confluenceBoost = 4; // Algorithm constant
    const confirmationBoost = 3; // Algorithm constant
    const maxConfidenceBoost = 15; // Algorithm constant
    
    if (analysisLower.includes('multiple indicators')) confidenceBoost += multipleIndicatorsBoost;
    if (analysisLower.includes('confluence')) confidenceBoost += confluenceBoost;
    if (analysisLower.includes('confirmation')) confidenceBoost += confirmationBoost;

    return Math.min(maxConfidenceBoost, confidenceBoost);
  }

  private static determineAction(sentiment: SentimentAnalysis, signals: TechnicalSignals): 'BUY' | 'SELL' | 'HOLD' {
    const breakoutWeight = 2; // Algorithm constant
    const supportWeight = 1; // Algorithm constant
    const bullishSignals = sentiment.bullishScore + (signals.breakout ? breakoutWeight : 0) + (signals.support ? supportWeight : 0);
    const bearishSignals = sentiment.bearishScore;

    const minSignalThreshold = 3; // Algorithm constant
    const signalMultiplier = 1.5; // Algorithm constant
    
    if (bullishSignals >= minSignalThreshold && bullishSignals > bearishSignals * signalMultiplier) return 'BUY';
    if (bearishSignals >= minSignalThreshold && bearishSignals > bullishSignals * signalMultiplier) return 'SELL';
    return 'HOLD';
  }

  private static calculateDynamicConfidence(
    sentiment: SentimentAnalysis,
    confidenceFactors: number,
    signals: TechnicalSignals
  ): number {
    let baseConfidence = sentiment.confidence;

    const breakoutConfidenceBoost = 5; // Algorithm constant
    const supportConfidenceBoost = 3; // Algorithm constant
    const momentumThreshold = 80; // Algorithm constant
    const momentumConfidenceBoost = 4; // Algorithm constant
    const volumeThreshold = 80; // Algorithm constant
    const volumeConfidenceBoost = 3; // Algorithm constant
    
    if (signals.breakout) baseConfidence += breakoutConfidenceBoost;
    if (signals.support) baseConfidence += supportConfidenceBoost;
    if (signals.momentum > momentumThreshold) baseConfidence += momentumConfidenceBoost;
    if (signals.volume > volumeThreshold) baseConfidence += volumeConfidenceBoost;

    baseConfidence += confidenceFactors;
    const minBaseConfidence = 50; // Algorithm constant
    return Math.min(TradingConfigManager.getConfig().HIGH_CONFIDENCE, Math.max(minBaseConfidence, baseConfidence));
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
    const momentumReasonThreshold = 75; // Algorithm constant
    const volumeReasonThreshold = 75; // Algorithm constant
    
    if (signals.momentum > momentumReasonThreshold) reasons.push('Momentum positivo');
    if (signals.volume > volumeReasonThreshold) reasons.push('Volume confirmativo');

    return reasons.length > 0 ? `DeepSeek AI: ${reasons.join(' + ')}` : 'Análise AI avançada';
  }

  // Algorithm constants as methods
  private static getMediumHighConfidence(): number {
    return 75; // Algorithm constant
  }

  private static getHighConfidenceLevel(): number {
    return 85; // Algorithm constant
  }

  private static getMediumConfidence(): number {
    return 65; // Algorithm constant
  }

  private static getLowConfidence(): number {
    return 45; // Algorithm constant
  }

  private static getStrongConfidenceLevel(): number {
    return 80; // Algorithm constant
  }

  private static getMediumLowConfidence(): number {
    return 55; // Algorithm constant
  }

  private static getMinConfidenceBound(): number {
    return 30; // Algorithm constant
  }

  private static getMaxConfidenceBound(): number {
    return 95; // Algorithm constant
  }
}