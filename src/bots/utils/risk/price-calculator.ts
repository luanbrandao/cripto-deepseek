import { calculateRiskReward } from './trade-validators';
import { calculateVolatility } from './volatility-calculator';
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
  const adjustedRisk = riskPercent * (1 + volatility / 2);
  const adjustedReward = rewardPercent * (1 + volatility / 2);
  
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
  const baseResult = calculateTargetAndStopPricesRealMarket(price, confidence, action, volatility);
  
  const optimizedTarget = adjustTargetToNearestLevel(
    baseResult.targetPrice, 
    action === 'BUY' ? levels.resistance : levels.support,
    price,
    action
  );
  
  const optimizedStop = adjustStopToProtectionLevel(
    baseResult.stopPrice,
    action === 'BUY' ? levels.support : levels.resistance,
    price,
    action
  );
  
  return {
    targetPrice: optimizedTarget,
    stopPrice: optimizedStop,
    riskPercent: baseResult.riskPercent,
    levels,
    originalTarget: baseResult.targetPrice,
    originalStop: baseResult.stopPrice,
    volatility
  };
}

// ============================================================================
// SUPPORT/RESISTANCE ANALYSIS (versão simplificada)
// Para análise completa, use supportResistanceAnalyzer.ts
// ============================================================================

function findSupportResistanceLevels(klines: any[], currentPrice: number) {
  const highs = klines.map(k => parseFloat(k[2]));
  const lows = klines.map(k => parseFloat(k[3]));
  
  const resistances = findLocalExtrema(highs, 'max').filter(r => r > currentPrice);
  const supports = findLocalExtrema(lows, 'min').filter(s => s < currentPrice);
  
  return {
    resistance: resistances.length > 0 ? Math.min(...resistances) : currentPrice * 1.05,
    support: supports.length > 0 ? Math.max(...supports) : currentPrice * 0.95,
    allResistances: resistances.slice(0, 3),
    allSupports: supports.slice(-3)
  };
}

function findLocalExtrema(prices: number[], type: 'max' | 'min'): number[] {
  const extrema = [];
  const compareFn = type === 'max' ? (a: number, b: number) => a > b : (a: number, b: number) => a < b;
  
  for (let i = 2; i < prices.length - 2; i++) {
    if (compareFn(prices[i], prices[i-1]) && compareFn(prices[i], prices[i-2]) && 
        compareFn(prices[i], prices[i+1]) && compareFn(prices[i], prices[i+2])) {
      extrema.push(prices[i]);
    }
  }
  
  return type === 'max' ? extrema.sort((a, b) => b - a) : extrema.sort((a, b) => a - b);
}

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
  
  if (Math.abs(distanceToLevel - distanceToTarget) < 0.002) {
    const buffer = currentPrice * 0.001;
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
  const buffer = currentPrice * 0.002;
  
  if (action === 'BUY') {
    const protectedStop = protectionLevel - buffer;
    return Math.min(calculatedStop, protectedStop);
  }
  
  const protectedStop = protectionLevel + buffer;
  return Math.max(calculatedStop, protectedStop);
}
