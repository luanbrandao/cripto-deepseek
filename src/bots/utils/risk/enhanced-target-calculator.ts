/**
 * @deprecated Use TechnicalCalculator.calculateEnhancedTargets from shared/calculations instead
 * This file is kept for backward compatibility
 */
import { TechnicalCalculator } from '../../../shared/calculations';

export class EnhancedTargetCalculator {
  constructor(private config: any) {}

  calculate(decision: any, currentPrice: number) {
    const { action, technicalLevels, confidence } = decision;
    
    if (!action || (action !== 'BUY' && action !== 'SELL')) {
      return null;
    }

    return TechnicalCalculator.calculateEnhancedTargets(
      currentPrice,
      confidence || 75,
      action,
      technicalLevels,
      this.config
    );
  }

  // Legacy methods removed - now using centralized calculations
}