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
  
  return {
    resistance: resistances.length > 0 ? Math.min(...resistances) : currentPrice * 1.05,
    support: supports.length > 0 ? Math.max(...supports) : currentPrice * 0.95,
    allResistances: resistances.slice(0, 3),
    allSupports: supports.slice(-3)
  };
}

/**
 * Encontra extremos locais (máximas e mínimas)
 */
export function findLocalExtrema(prices: number[], type: 'max' | 'min'): number[] {
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
 * Encontra pontos de pivô para análise avançada
 */
export function findPivotPoints(
  candles: Array<{high: number, low: number, timestamp: number}>, 
  period: number = 3
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