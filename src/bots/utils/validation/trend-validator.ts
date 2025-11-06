// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { 
  validateTrendAnalysis as unifiedValidateTrendAnalysis,
  validateDeepSeekDecision as unifiedValidateDeepSeekDecision,
  boostConfidence as unifiedBoostConfidence,
  validateRiskRewardRatio as unifiedValidateRiskRewardRatio
} from '../../../shared/validators/trend-validator';

/**
 * @deprecated Use validateTrendAnalysis from shared/validators/trend-validator instead
 */
export function validateTrendAnalysis(trendAnalysis: any, isSimulation = false): boolean {
  return unifiedValidateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation });
}

/**
 * @deprecated Use validateDeepSeekDecision from shared/validators/trend-validator instead
 */
export function validateDeepSeekDecision(decision: any): boolean {
  return unifiedValidateDeepSeekDecision(decision, 'BUY');
}

/**
 * @deprecated Use validateRiskRewardRatio from shared/validators/trend-validator instead
 */
export function validateRiskRewardRatio(decision: any): boolean {
  return unifiedValidateRiskRewardRatio(decision);
}

/**
 * @deprecated Use boostConfidence from shared/validators/trend-validator instead
 */
export function boostConfidence(decision: any) {
  return unifiedBoostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'BUY' });
}
