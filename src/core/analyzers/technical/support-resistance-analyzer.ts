/**
 * 📊 SUPPORT RESISTANCE ANALYZER
 * Moved and optimized from src/analyzers/supportResistanceAnalyzer.ts
 */

import { TechnicalCalculator } from '../../../shared/calculations';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

interface SupportResistanceLevel {
  price: number;
  touches: number;
  strength: number;
  type: 'support' | 'resistance';
  isZone: boolean;
  zoneRange?: { min: number; max: number };
}

interface MarketData {
  candles: Candle[];
  currentPrice: number;
}

interface AnalysisResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  suggested_amount: number;
  levels: SupportResistanceLevel[];
}

export default class SupportResistanceAnalyzer {
  private tolerance: number;
  private minTouches: number;
  private lookbackPeriods: number;

  constructor(config: { tolerance?: number; minTouches?: number; lookbackPeriods?: number } = {}) {
    const srConfig = TradingConfigManager.getBotConfig().SUPPORT_RESISTANCE;
    this.tolerance = config.tolerance || srConfig?.MAX_DISTANCE || 0.005;
    this.minTouches = config.minTouches || srConfig?.MIN_TOUCHES || 2;
    this.lookbackPeriods = config.lookbackPeriods || 30;
  }

  analyze(marketData: MarketData, isSimulation: boolean = true): AnalysisResult {
    const { candles, currentPrice } = marketData;

    if (!isSimulation) {
      return {
        action: 'HOLD',
        confidence: 0,
        reason: 'Analisador configurado apenas para simulação',
        suggested_amount: 0,
        levels: []
      };
    }

    if (!candles || candles.length < this.getMinCandlesRequired()) {
      return {
        action: 'HOLD',
        confidence: 0,
        reason: `Dados insuficientes: ${candles?.length || 0} candles (mínimo ${this.getMinCandlesRequired()})`,
        suggested_amount: 0,
        levels: []
      };
    }

    const actualLookback = Math.min(this.lookbackPeriods, candles.length);
    const levels = this.identifySupportResistanceLevels(candles, actualLookback);
    const psychologicalLevels = this.identifyPsychologicalLevels(currentPrice);
    const allLevels = [...levels, ...psychologicalLevels];
    const analysis = this.analyzeCurrentSituation(currentPrice, allLevels, candles);

    return {
      action: analysis.action,
      confidence: analysis.confidence,
      reason: analysis.reason,
      suggested_amount: analysis.confidence / 100,
      levels: allLevels
    };
  }

  private identifySupportResistanceLevels(candles: Candle[], lookbackPeriods?: number): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const actualLookback = lookbackPeriods || this.lookbackPeriods;
    const recentCandles = candles.slice(-actualLookback);

    const pivots = TechnicalCalculator.findPivotPoints(recentCandles);
    const priceGroups = this.groupSimilarPrices(pivots);

    priceGroups.forEach(group => {
      if (group.prices.length >= this.minTouches) {
        const avgPrice = group.prices.reduce((sum, p) => sum + p.price, 0) / group.prices.length;
        const touches = group.prices.length;

        const isResistance = group.prices.some(p => p.type === 'high');
        const isSupport = group.prices.some(p => p.type === 'low');

        let type: 'support' | 'resistance';
        if (isResistance && isSupport) {
          type = avgPrice > candles[candles.length - 1].close ? 'resistance' : 'support';
        } else {
          type = isResistance ? 'resistance' : 'support';
        }

        const strength = this.calculateLevelStrength(touches, group.prices);

        levels.push({
          price: avgPrice,
          touches,
          strength,
          type,
          isZone: group.prices.length > 3,
          zoneRange: group.prices.length > 3 ? {
            min: Math.min(...group.prices.map(p => p.price)),
            max: Math.max(...group.prices.map(p => p.price))
          } : undefined
        });
      }
    });

    return levels.sort((a, b) => b.strength - a.strength);
  }

  private groupSimilarPrices(pivots: Array<{ price: number, type: 'high' | 'low', timestamp: number }>): Array<{ prices: Array<{ price: number, type: 'high' | 'low', timestamp: number }> }> {
    const groups: Array<{ prices: Array<{ price: number, type: 'high' | 'low', timestamp: number }> }> = [];

    pivots.forEach(pivot => {
      let addedToGroup = false;

      for (const group of groups) {
        const avgPrice = group.prices.reduce((sum, p) => sum + p.price, 0) / group.prices.length;
        const tolerance = avgPrice * this.tolerance;

        if (Math.abs(pivot.price - avgPrice) <= tolerance) {
          group.prices.push(pivot);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push({ prices: [pivot] });
      }
    });

    return groups;
  }

  private identifyPsychologicalLevels(currentPrice: number): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const config = TradingConfigManager.getConfig();
    const range = currentPrice * (config.MARKET_FILTERS.MIN_VOLATILITY / 100);

    const roundNumbers = [];

    if (currentPrice >= 1000) {
      const base = Math.floor(currentPrice / 100) * 100;
      for (let i = -3; i <= 3; i++) {
        roundNumbers.push(base + (i * 100));
      }
    } else if (currentPrice >= 100) {
      const base = Math.floor(currentPrice / 10) * 10;
      for (let i = -3; i <= 3; i++) {
        roundNumbers.push(base + (i * 10));
      }
    } else if (currentPrice >= 1) {
      const base = Math.floor(currentPrice);
      for (let i = -3; i <= 3; i++) {
        roundNumbers.push(base + i);
      }
    } else {
      const base = Math.floor(currentPrice * 10) / 10;
      for (let i = -3; i <= 3; i++) {
        roundNumbers.push(base + (i * 0.1));
      }
    }

    roundNumbers.forEach(price => {
      if (price > 0 && Math.abs(price - currentPrice) <= range) {
        levels.push({
          price,
          touches: this.minTouches,
          strength: 0.7,
          type: price > currentPrice ? 'resistance' : 'support',
          isZone: false
        });
      }
    });

    return levels;
  }

  private calculateLevelStrength(touches: number, prices: Array<{ price: number, type: 'high' | 'low', timestamp: number }>): number {
    let strength = 0;

    strength += Math.min(touches * this.getTouchesMultiplier(), this.getMaxTouchesScore());

    if (prices.length > 0 && prices[0].timestamp) {
      const now = Date.now();
      const avgAge = prices.reduce((sum, p) => sum + (now - (p.timestamp || now)), 0) / prices.length;
      const maxAge = this.getMaxAgeMs();
      const ageScore = Math.max(0, 1 - (avgAge / maxAge));
      strength += ageScore * this.getAgeScoreMultiplier();
    } else {
      strength += this.getDefaultAgeScore();
    }

    return Math.min(strength, 1);
  }

  private analyzeCurrentSituation(currentPrice: number, levels: SupportResistanceLevel[], candles: Candle[]): { action: 'BUY' | 'SELL' | 'HOLD', confidence: number, reason: string } {
    const config = TradingConfigManager.getConfig();
    const srConfig = TradingConfigManager.getBotConfig().SUPPORT_RESISTANCE;
    const tolerance = currentPrice * (srConfig?.MAX_DISTANCE || 0.005);
    const minConfidence = config.MIN_CONFIDENCE;
    const highConfidence = config.HIGH_CONFIDENCE;

    const nearbyLevels = levels.filter(level =>
      Math.abs(level.price - currentPrice) <= tolerance * 3 &&
      level.touches >= Math.min(this.minTouches, 2)
    );

    if (nearbyLevels.length === 0) {
      return {
        action: 'HOLD',
        confidence: this.getNeutralConfidence(),
        reason: 'Preço em área neutra, sem níveis significativos próximos'
      };
    }

    const recentCandles = candles.slice(-this.getRecentCandlesCount());
    const trend = this.analyzeTrend(recentCandles);

    const strongestLevel = nearbyLevels.reduce((prev, current) =>
      current.strength > prev.strength ? current : prev
    );

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = this.getDefaultConfidence();
    let reason = '';

    if (strongestLevel.type === 'support' && currentPrice <= strongestLevel.price + tolerance) {
      if (trend === 'down' || trend === 'sideways') {
        action = 'BUY';
        const baseConfidence = minConfidence + (strongestLevel.strength * this.getStrengthMultiplier()) + (strongestLevel.touches * this.getTouchesBonus());
        confidence = Math.min(highConfidence, baseConfidence);
        reason = `Preço próximo ao suporte forte em $${strongestLevel.price.toFixed(4)} (${strongestLevel.touches} toques)`;
      }
    } else if (strongestLevel.type === 'resistance' && currentPrice >= strongestLevel.price - tolerance) {
      if (trend === 'up' || trend === 'sideways') {
        action = 'SELL';
        const baseConfidence = minConfidence + (strongestLevel.strength * this.getStrengthMultiplier()) + (strongestLevel.touches * this.getTouchesBonus());
        confidence = Math.min(highConfidence, baseConfidence);
        reason = `Preço próximo à resistência forte em $${strongestLevel.price.toFixed(4)} (${strongestLevel.touches} toques)`;
      }
    }

    if (action !== 'HOLD' && confidence < minConfidence) {
      return {
        action: 'HOLD',
        confidence: this.getDefaultConfidence(),
        reason: `Sinal S/R rejeitado - confiança ${confidence.toFixed(0)}% < ${minConfidence}% mínimo ultra-conservador`
      };
    }

    return { action, confidence, reason };
  }

  private analyzeTrend(candles: Candle[]): 'up' | 'down' | 'sideways' {
    if (candles.length < 3) return 'sideways';

    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const change = (last - first) / first;

    const config = TradingConfigManager.getConfig();
    const trendThreshold = config.EMA_ADVANCED.MIN_TREND_STRENGTH;
    if (change > trendThreshold) return 'up';
    if (change < -trendThreshold) return 'down';
    return 'sideways';
  }

  // Algorithm constants as methods
  private getMinCandlesRequired(): number {
    return 10; // Algorithm constant
  }

  private getTouchesMultiplier(): number {
    return 0.25; // Algorithm constant
  }

  private getMaxTouchesScore(): number {
    return 0.8; // Algorithm constant
  }

  private getMaxAgeMs(): number {
    return 30 * 24 * 60 * 60 * 1000; // Algorithm constant - 30 days
  }

  private getAgeScoreMultiplier(): number {
    return 0.2; // Algorithm constant
  }

  private getDefaultAgeScore(): number {
    return 0.15; // Algorithm constant
  }

  private getNeutralConfidence(): number {
    return 30; // Algorithm constant
  }

  private getRecentCandlesCount(): number {
    return 10; // Algorithm constant
  }

  private getDefaultConfidence(): number {
    return 50; // Algorithm constant
  }

  private getStrengthMultiplier(): number {
    return 25; // Algorithm constant
  }

  private getTouchesBonus(): number {
    return 2; // Algorithm constant
  }
}