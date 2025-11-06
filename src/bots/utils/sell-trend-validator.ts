// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { 
  validateTrendAnalysis as unifiedValidateTrendAnalysis,
  validateDeepSeekDecision as unifiedValidateDeepSeekDecision,
  boostConfidence as unifiedBoostConfidence
} from '../../shared/validators/trend-validator';

/**
 * @deprecated Use validateTrendAnalysis from shared/validators/trend-validator instead
 */
export function validateBearishTrendAnalysis(trendAnalysis: any, isSimulation = false): boolean {
  return unifiedValidateTrendAnalysis(trendAnalysis, { direction: 'DOWN', isSimulation });
}

/**
 * @deprecated Use validateDeepSeekDecision from shared/validators/trend-validator instead
 */
export function validateSellDecision(decision: any): boolean {
  return unifiedValidateDeepSeekDecision(decision, 'SELL');
}

/**
 * @deprecated Use boostConfidence from shared/validators/trend-validator instead
 */
export function boostSellConfidence(decision: any) {
  return unifiedBoostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'SELL' });
}