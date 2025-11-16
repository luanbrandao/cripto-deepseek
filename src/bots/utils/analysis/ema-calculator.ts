/**
 * @deprecated Use TechnicalCalculator.calculateEMA from shared/calculations instead
 * This file is kept for backward compatibility
 */
import { TechnicalCalculator } from '../../../shared/calculations';

export function calculateEMA(prices: number[], period: number): number {
  return TechnicalCalculator.calculateEMA(prices, period);
}