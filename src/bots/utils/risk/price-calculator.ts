import { calculateRiskReward } from './trade-validators';
import { calculateVolatility } from './volatility-calculator';
import { RiskManager } from '../../services/risk-manager';
import { findSupportResistanceLevels } from '../analysis/support-resistance-calculator';

// ============================================================================
// CORE FUNCTIONS - Cálculo de Preços (usando utils existentes)
// ============================================================================

/**
 * Calcula preços de target e stop para uma ação específica
 */
function calculatePricesForAction(
  price: number,
  riskPercent: number,
  rewardPercent: number,
  action: 'BUY' | 'SELL'
) {
  if (action === 'BUY') {
    return {
      targetPrice: price * (1 + rewardPercent),
      stopPrice: price * (1 - riskPercent)
    };
  }

  return {
    targetPrice: price * (1 - rewardPercent),
    stopPrice: price * (1 + riskPercent)
  };
}

/**
 * Calcula target e stop prices baseados na confiança (Ratio 2:1 fixo)
 * Usa RiskManager existente para cálculos
 */
export function calculateTargetAndStopPrices(price: number, confidence: number, action: 'BUY' | 'SELL') {
  const { riskPercent, rewardPercent } = calculateRiskReward(confidence);
  const { targetPrice, stopPrice } = calculatePricesForAction(price, riskPercent, rewardPercent, action);

  return { targetPrice, stopPrice, riskPercent: riskPercent * 100 };
}

/**
 * Calcula preços com volatilidade do mercado (Ratio dinâmico)
 * Usa RiskManager e volatility-calculator existentes
 */
export function calculateTargetAndStopPricesRealMarket(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  volatility: number
) {
  const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(price, confidence);

  // Ajustar com volatilidade
  const volatilityAdjustmentFactor = 0.5; // Algorithm constant
  const adjustedRisk = riskPercent * (1 + volatility / (1 / volatilityAdjustmentFactor));
  const adjustedReward = rewardPercent * (1 + volatility / (1 / volatilityAdjustmentFactor));

  const { targetPrice, stopPrice } = calculatePricesForAction(price, adjustedRisk, adjustedReward, action);

  return { targetPrice, stopPrice, riskPercent: adjustedRisk * 100 };
}

/**
 * Calcula preços com níveis de suporte/resistência
 * Usa volatility-calculator existente
 */
export function calculateTargetAndStopPricesWithLevels(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  klines: any[]
) {
  // Usar volatility-calculator existente
  const volatility = calculateVolatility(klines);
  const levels = findSupportResistanceLevels(klines, price);

  // Usar lógica própria baseada em níveis técnicos + volatilidade
  // Calcular risco baseado na distância aos níveis de suporte/resistência
  const supportDistance = Math.abs(price - levels.support) / price;
  const resistanceDistance = Math.abs(levels.resistance - price) / price;
  
  // Garantir ratio mínimo de 2:1 sempre
  const minRisk = 0.005; // Algorithm constant - 0.5%
  const maxRisk = 0.015; // Algorithm constant - 1.5%
  const volatilityDivisor = 100; // Algorithm constant
  const riskRewardRatio = 2.0; // Algorithm constant - 2:1 ratio
  
  const baseRisk = Math.max(minRisk, Math.min(maxRisk, volatility / volatilityDivisor));
  const adjustedRisk = baseRisk;
  const adjustedReward = adjustedRisk * riskRewardRatio;
  
  const baseResult = calculatePricesForAction(price, adjustedRisk, adjustedReward, action);
  const baseResultWithPercent = { ...baseResult, riskPercent: adjustedRisk * 100 };

  // Manter os preços calculados para garantir ratio 2:1
  return {
    targetPrice: baseResultWithPercent.targetPrice,
    stopPrice: baseResultWithPercent.stopPrice,
    riskPercent: baseResultWithPercent.riskPercent,
    levels,
    originalTarget: baseResultWithPercent.targetPrice,
    originalStop: baseResultWithPercent.stopPrice,
    volatility
  };
}

// ============================================================================
// SUPPORT/RESISTANCE ANALYSIS - Usa calculadora centralizada
// ============================================================================

// ============================================================================
// LEVEL ADJUSTMENT FUNCTIONS
// ============================================================================

function adjustTargetToNearestLevel(
  calculatedTarget: number,
  nearestLevel: number,
  currentPrice: number,
  action: 'BUY' | 'SELL'
): number {
  const distanceToLevel = Math.abs(nearestLevel - currentPrice) / currentPrice;
  const distanceToTarget = Math.abs(calculatedTarget - currentPrice) / currentPrice;

  const levelTargetTolerance = 0.002; // Algorithm constant
  const priceBuffer = 0.001; // Algorithm constant
  
  if (Math.abs(distanceToLevel - distanceToTarget) < levelTargetTolerance) {
    const buffer = currentPrice * priceBuffer;
    return action === 'BUY' ? nearestLevel - buffer : nearestLevel + buffer;
  }

  return calculatedTarget;
}

function adjustStopToProtectionLevel(
  calculatedStop: number,
  protectionLevel: number,
  currentPrice: number,
  action: 'BUY' | 'SELL'
): number {
  const protectionBuffer = 0.002; // Algorithm constant
  const buffer = currentPrice * protectionBuffer;

  if (action === 'BUY') {
    const protectedStop = protectionLevel - buffer;
    return Math.min(calculatedStop, protectedStop);
  }

  const protectedStop = protectionLevel + buffer;
  return Math.max(calculatedStop, protectedStop);
}
