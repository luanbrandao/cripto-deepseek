/**
 * 🎯 SUPPORT & RESISTANCE CALCULATOR
 * Centralized support and resistance level calculations
 */

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
  timestamp?: number;
}

export interface PivotPoint {
  price: number;
  type: 'high' | 'low';
  timestamp: number;
  strength: number;
}

export class SupportResistanceCalculator {
  /**
   * Find basic support and resistance levels
   */
  static findBasicLevels(klines: any[], currentPrice: number): {
    resistance: number;
    support: number;
    allResistances: number[];
    allSupports: number[];
  } {
    const highs = klines.map(k => parseFloat(k[2] || k.high || k));
    const lows = klines.map(k => parseFloat(k[3] || k.low || k));
    
    const resistances = this.findLocalExtrema(highs, 'max').filter(r => r > currentPrice);
    const supports = this.findLocalExtrema(lows, 'min').filter(s => s < currentPrice);
    
    return {
      resistance: resistances.length > 0 ? Math.min(...resistances) : currentPrice * 1.05,
      support: supports.length > 0 ? Math.max(...supports) : currentPrice * 0.95,
      allResistances: resistances.slice(0, 3),
      allSupports: supports.slice(-3)
    };
  }

  /**
   * Find advanced support and resistance levels with strength
   */
  static findAdvancedLevels(klines: any[], tolerance: number = 0.002): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const pivots = this.findPivotPoints(klines);
    
    // Group similar price levels
    const groupedLevels = this.groupSimilarLevels(pivots, tolerance);
    
    for (const group of groupedLevels) {
      const avgPrice = group.reduce((sum, p) => sum + p.price, 0) / group.length;
      const touches = group.length;
      const strength = this.calculateGroupStrength(group, klines.length);
      const type = group[0].type === 'high' ? 'resistance' : 'support';
      
      levels.push({
        price: avgPrice,
        type,
        strength,
        touches,
        timestamp: group[group.length - 1].timestamp
      });
    }
    
    return levels.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Find pivot points in price data
   */
  static findPivotPoints(klines: any[], period: number = 3): PivotPoint[] {
    const pivots: PivotPoint[] = [];
    
    for (let i = period; i < klines.length - period; i++) {
      const current = klines[i];
      const high = parseFloat(current[2] || current.high || current);
      const low = parseFloat(current[3] || current.low || current);
      const timestamp = current[0] || current.timestamp || i;
      
      let isHigh = true;
      let isLow = true;
      
      // Check if current candle is a pivot high or low
      for (let j = i - period; j <= i + period; j++) {
        if (j !== i) {
          const compareHigh = parseFloat(klines[j][2] || klines[j].high || klines[j]);
          const compareLow = parseFloat(klines[j][3] || klines[j].low || klines[j]);
          
          if (compareHigh >= high) isHigh = false;
          if (compareLow <= low) isLow = false;
        }
      }
      
      if (isHigh) {
        pivots.push({
          price: high,
          type: 'high',
          timestamp,
          strength: SupportResistanceCalculator.calculatePivotStrength(klines, i, 'high', period)
        });
      }
      
      if (isLow) {
        pivots.push({
          price: low,
          type: 'low',
          timestamp,
          strength: SupportResistanceCalculator.calculatePivotStrength(klines, i, 'low', period)
        });
      }
    }
    
    return pivots;
  }

  /**
   * Find local extrema (peaks and valleys)
   */
  static findLocalExtrema(prices: number[], type: 'max' | 'min'): number[] {
    const extrema = [];
    const compareFn = type === 'max' ? (a: number, b: number) => a > b : (a: number, b: number) => a < b;
    
    for (let i = 2; i < prices.length - 2; i++) {
      if (compareFn(prices[i], prices[i-1]) && compareFn(prices[i], prices[i-2]) && 
          compareFn(prices[i], prices[i+1]) && compareFn(prices[i], prices[i+2])) {
        extrema.push(prices[i]);
      }
    }
    
    return type === 'max' ? extrema.sort((a, b) => b - a) : extrema.sort((a, b) => a - b);
  }

  /**
   * Calculate Fibonacci retracement levels
   */
  static calculateFibonacciLevels(high: number, low: number): {
    [key: string]: number;
  } {
    const diff = high - low;
    
    return {
      '0%': high,
      '23.6%': high - (diff * 0.236),
      '38.2%': high - (diff * 0.382),
      '50%': high - (diff * 0.5),
      '61.8%': high - (diff * 0.618),
      '78.6%': high - (diff * 0.786),
      '100%': low
    };
  }

  /**
   * Calculate group strength for pivot points
   */
  private static calculateGroupStrength(group: PivotPoint[], klinesLength: number): number {
    return Math.min(100, (group.length * 20) + (group.reduce((sum, p) => sum + p.strength, 0) / group.length));
  }

  /**
   * Calculate support/resistance strength based on price action
   */
  static calculateLevelStrength(level: SupportResistanceLevel, klines: any[]): number {
    let strength = 0;
    const tolerance = level.price * 0.001; // 0.1% tolerance
    
    for (const kline of klines) {
      const high = parseFloat(kline[2] || kline.high || kline);
      const low = parseFloat(kline[3] || kline.low || kline);
      const close = parseFloat(kline[4] || kline.close || kline);
      
      // Check if price tested the level
      if (level.type === 'resistance') {
        if (high >= level.price - tolerance && high <= level.price + tolerance) {
          strength += close < level.price ? 2 : 1; // Rejection adds more strength
        }
      } else {
        if (low >= level.price - tolerance && low <= level.price + tolerance) {
          strength += close > level.price ? 2 : 1; // Bounce adds more strength
        }
      }
    }
    
    return Math.min(100, strength * 5); // Normalize to 0-100
  }

  /**
   * Group similar price levels together
   */
  private static groupSimilarLevels(pivots: PivotPoint[], tolerance: number): PivotPoint[][] {
    const groups: PivotPoint[][] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < pivots.length; i++) {
      if (used.has(i)) continue;
      
      const group = [pivots[i]];
      used.add(i);
      
      for (let j = i + 1; j < pivots.length; j++) {
        if (used.has(j)) continue;
        
        const priceDiff = Math.abs(pivots[i].price - pivots[j].price) / pivots[i].price;
        if (priceDiff <= tolerance && pivots[i].type === pivots[j].type) {
          group.push(pivots[j]);
          used.add(j);
        }
      }
      
      if (group.length >= 2) { // Only consider levels with multiple touches
        groups.push(group);
      }
    }
    
    return groups;
  }

  /**
   * Calculate pivot point strength
   */
  private static calculatePivotStrength(klines: any[], index: number, type: 'high' | 'low', period: number): number {
    const current = parseFloat(klines[index][type === 'high' ? 2 : 3]);
    let strength = 0;
    
    // Compare with surrounding candles
    for (let i = index - period; i <= index + period; i++) {
      if (i !== index && i >= 0 && i < klines.length) {
        const compare = parseFloat(klines[i][type === 'high' ? 2 : 3]);
        const diff = type === 'high' ? current - compare : compare - current;
        if (diff > 0) strength += diff / current * 100;
      }
    }
    
    return Math.min(100, strength);
  }

  /**
   * Find dynamic support and resistance based on moving averages
   */
  static findDynamicLevels(prices: number[], periods: number[] = [20, 50, 200]): {
    [key: string]: {
      value: number;
      type: 'support' | 'resistance';
      strength: number;
    };
  } {
    const result: any = {};
    const currentPrice = prices[prices.length - 1];
    
    for (const period of periods) {
      if (prices.length < period) continue;
      
      const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
      const type = currentPrice > sma ? 'support' : 'resistance';
      const distance = Math.abs(currentPrice - sma) / currentPrice;
      const strength = Math.max(0, 100 - (distance * 1000)); // Closer = stronger
      
      result[`MA${period}`] = { value: sma, type, strength };
    }
    
    return result;
  }
}