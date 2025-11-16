/**
 * @deprecated Use TechnicalCalculator.findBasicSRLevels from shared/calculations instead
 * This file is kept for backward compatibility
 */
import { TechnicalCalculator } from '../../../shared/calculations';

export interface SupportResistanceLevels {
  resistance: number;
  support: number;
  allResistances: number[];
  allSupports: number[];
}

export function findSupportResistanceLevels(klines: any[], currentPrice: number): SupportResistanceLevels {
  const result = TechnicalCalculator.findBasicSRLevels(klines, currentPrice);
  return {
    resistance: result.resistance,
    support: result.support,
    allResistances: result.allResistances || [],
    allSupports: result.allSupports || []
  };
}

export function findLocalExtrema(prices: number[], type: 'max' | 'min'): number[] {
  return TechnicalCalculator.findLocalExtrema(prices, type);
}

export function findPivotPoints(
  candles: Array<{high: number, low: number, timestamp: number}>, 
  period: number = 3
): Array<{price: number, type: 'high' | 'low', timestamp: number}> {
  return TechnicalCalculator.findPivotPoints(candles, period);
}