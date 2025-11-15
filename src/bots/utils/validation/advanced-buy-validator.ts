// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para validador unificado
// Este arquivo mantém compatibilidade com imports antigos

import { 
  validateAdvancedTrend,
  validateAdvancedDecision,
  validateAdvancedRiskReward,
  boostAdvancedConfidence,
  getAdvancedThreshold,
  validateAdvancedStrength
} from './unified-advanced-validator';

/**
 * @deprecated Use validateAdvancedTrend from unified-advanced-validator instead
 */
export function validateAdvancedBullishTrend(trendAnalysis: any, isSimulation = false): boolean {
  return validateAdvancedTrend(trendAnalysis, { direction: 'UP', isSimulation });
}

/**
 * @deprecated Use validateAdvancedDecision from unified-advanced-validator instead
 */
export function validateAdvancedBuyDecision(decision: any): boolean {
  return validateAdvancedDecision(decision, 'BUY');
}

/**
 * @deprecated Use validateAdvancedRiskReward from unified-advanced-validator instead
 */
export function validateAdvancedBuyRiskReward(decision: any): boolean {
  return validateAdvancedRiskReward(decision);
}

/**
 * @deprecated Use boostAdvancedConfidence from unified-advanced-validator instead
 */
export function boostAdvancedBuyConfidence(decision: any) {
  return boostAdvancedConfidence(decision, { direction: 'BUY' });
}

/**
 * @deprecated Use getAdvancedThreshold from unified-advanced-validator instead
 */
export function getAdvancedBuyThreshold(marketType: string): number {
  return getAdvancedThreshold(marketType, 'BUY');
}

/**
 * @deprecated Use validateAdvancedStrength from unified-advanced-validator instead
 */
export function validateAdvancedBuyStrength(analysis: any, threshold: number): boolean {
  return validateAdvancedStrength(analysis, threshold, 'BUY');
}
