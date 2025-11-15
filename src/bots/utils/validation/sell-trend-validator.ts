// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para shared/validators/trend-validator

import { 
  validateTrendAnalysis,
  validateDeepSeekDecision,
  boostConfidence
} from '../../../shared/validators/trend-validator';

/**
 * @deprecated Use validateTrendAnalysis from shared/validators/trend-validator instead
 */
export function validateBearishTrendAnalysis(trendAnalysis: any, isSimulation = false): boolean {
  return validateTrendAnalysis(trendAnalysis, { direction: 'DOWN', isSimulation });
}

/**
 * @deprecated Use validateDeepSeekDecision from shared/validators/trend-validator instead
 */
export function validateSellDecision(decision: any): boolean {
  return validateDeepSeekDecision(decision, 'SELL');
}

/**
 * @deprecated Use boostConfidence from shared/validators/trend-validator instead
 */
export function boostSellConfidence(decision: any) {
  return boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'SELL' });
}