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
export function validateAdvancedBearishTrend(trendAnalysis: any, isSimulation = false): boolean {
  return validateAdvancedTrend(trendAnalysis, { direction: 'DOWN', isSimulation });
}

/**
 * @deprecated Use validateAdvancedDecision from unified-advanced-validator instead
 */
export function validateAdvancedSellDecision(decision: any): boolean {
  return validateAdvancedDecision(decision, 'SELL');
}

/**
 * @deprecated Use validateAdvancedRiskReward from unified-advanced-validator instead
 */
export function validateAdvancedSellRiskReward(decision: any): boolean {
  return validateAdvancedRiskReward(decision);
}

/**
 * @deprecated Use boostAdvancedConfidence from unified-advanced-validator instead
 */
export function boostAdvancedSellConfidence(decision: any) {
  return boostAdvancedConfidence(decision, { direction: 'SELL' });
}

/**
 * @deprecated Use getAdvancedThreshold from unified-advanced-validator instead
 */
export function getAdvancedSellThreshold(marketType: string): number {
  return getAdvancedThreshold(marketType, 'SELL');
}

/**
 * @deprecated Use validateAdvancedStrength from unified-advanced-validator instead
 */
export function validateAdvancedSellStrength(analysis: any, threshold: number): boolean {
  return validateAdvancedStrength(analysis, threshold, 'SELL');
}
