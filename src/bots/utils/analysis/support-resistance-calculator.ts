/**
 * Calculadora de Suporte e Resistência centralizada
 * Elimina duplicação entre price-calculator.ts e supportResistanceAnalyzer.ts
 */

export interface SupportResistanceLevels {
  resistance: number;
  support: number;
  allResistances: number[];
  allSupports: number[];
}

/**
 * Versão simplificada para price-calculator
 */
export function findSupportResistanceLevels(klines: any[], currentPrice: number): SupportResistanceLevels {
  const highs = klines.map(k => parseFloat(k[2]));
  const lows = klines.map(k => parseFloat(k[3]));
  
  const resistances = findLocalExtrema(highs, 'max').filter(r => r > currentPrice);
  const supports = findLocalExtrema(lows, 'min').filter(s => s < currentPrice);
  
  const resistanceFallbackMultiplier = 1.05; // Algorithm constant
  const supportFallbackMultiplier = 0.95; // Algorithm constant
  const maxLevelsToReturn = 3; // Algorithm constant
  
  return {
    resistance: resistances.length > 0 ? Math.min(...resistances) : currentPrice * resistanceFallbackMultiplier,
    support: supports.length > 0 ? Math.max(...supports) : currentPrice * supportFallbackMultiplier,
    allResistances: resistances.slice(0, maxLevelsToReturn),
    allSupports: supports.slice(-maxLevelsToReturn)
  };
}

/**
 * Encontra extremos locais (máximas e mínimas)
 */
export function findLocalExtrema(prices: number[], type: 'max' | 'min'): number[] {
  const extrema = [];
  const compareFn = type === 'max' ? (a: number, b: number) => a > b : (a: number, b: number) => a < b;
  
  const lookbackPeriod = 2; // Algorithm constant
  for (let i = lookbackPeriod; i < prices.length - lookbackPeriod; i++) {
    if (compareFn(prices[i], prices[i-1]) && compareFn(prices[i], prices[i-lookbackPeriod]) && 
        compareFn(prices[i], prices[i+1]) && compareFn(prices[i], prices[i+lookbackPeriod])) {
      extrema.push(prices[i]);
    }
  }
  
  return type === 'max' ? extrema.sort((a, b) => b - a) : extrema.sort((a, b) => a - b);
}

/**
 * Encontra pontos de pivô para análise avançada
 */
export function findPivotPoints(
  candles: Array<{high: number, low: number, timestamp: number}>, 
  period: number = 3 // Algorithm constant - default pivot period
): Array<{price: number, type: 'high' | 'low', timestamp: number}> {
  const pivots: Array<{price: number, type: 'high' | 'low', timestamp: number}> = [];
  
  for (let i = period; i < candles.length - period; i++) {
    const current = candles[i];
    
    let isHigh = true;
    let isLow = true;
    
    for (let j = i - period; j <= i + period; j++) {
      if (j !== i) {
        if (candles[j].high >= current.high) isHigh = false;
        if (candles[j].low <= current.low) isLow = false;
      }
    }
    
    if (isHigh) {
      pivots.push({
        price: current.high,
        type: 'high',
        timestamp: current.timestamp
      });
    }
    
    if (isLow) {
      pivots.push({
        price: current.low,
        type: 'low',
        timestamp: current.timestamp
      });
    }
  }
  
  return pivots;
}