/**
 * @deprecated Use TechnicalCalculator from shared/calculations instead
 * This file is kept for backward compatibility
 */
import { TechnicalCalculator } from '../../../shared/calculations';
import { calculateRiskReward } from './trade-validators';
import { RiskManager } from '../../services/risk-manager';

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

export function calculateTargetAndStopPricesRealMarket(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  volatility: number
) {
  const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(price, confidence);
  return TechnicalCalculator.calculateWithVolatility(price, riskPercent, rewardPercent, action, volatility);
}

export function calculateTargetAndStopPricesWithLevels(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  klines: any[]
) {
  const prices = klines.map(k => parseFloat(k[4]));
  const volatilityResult = TechnicalCalculator.calculateVolatility(prices);
  const volatility = volatilityResult.volatility;
  const srLevels = TechnicalCalculator.findBasicSRLevels(klines, price);
  
  const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(price, confidence);
  
  return TechnicalCalculator.calculateWithLevels(
    price, 
    riskPercent, 
    rewardPercent, 
    action, 
    { support: srLevels.support, resistance: srLevels.resistance },
    volatility
  );
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
