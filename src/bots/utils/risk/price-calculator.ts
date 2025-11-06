// ============================================================================
// CORE FUNCTIONS - Cálculo de Preços
// ============================================================================

/**
 * Calcula percentual de risco baseado na confiança
 */
function calculateRiskPercent(confidence: number): number {
  return confidence >= 80 ? 0.5 : confidence >= 75 ? 1.0 : 1.5;
}

/**
 * Calcula preços de target e stop para uma ação específica
 */
function calculatePricesForAction(
  price: number, 
  riskPercent: number, 
  rewardRatio: number, 
  action: 'BUY' | 'SELL'
) {
  if (action === 'BUY') {
    return {
      targetPrice: price * (1 + (riskPercent * rewardRatio) / 100),
      stopPrice: price * (1 - riskPercent / 100)
    };
  }
  
  return {
    targetPrice: price * (1 - (riskPercent * rewardRatio) / 100),
    stopPrice: price * (1 + riskPercent / 100)
  };
}

/**
 * Calcula target e stop prices baseados na confiança (Ratio 2:1 fixo)
 */
export function calculateTargetAndStopPrices(price: number, confidence: number, action: 'BUY' | 'SELL') {
  const riskPercent = calculateRiskPercent(confidence);
  const { targetPrice, stopPrice } = calculatePricesForAction(price, riskPercent, 2.0, action);
  
  return { targetPrice, stopPrice, riskPercent };
}

/**
 * Calcula preços com volatilidade do mercado (Ratio dinâmico)
 */
export function calculateTargetAndStopPricesRealMarket(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  volatility: number
) {
  const baseRisk = calculateRiskPercent(confidence);
  const adjustedRisk = baseRisk * (1 + volatility / 2);
  const rewardRatio = confidence >= 85 ? 2.5 : 2.0;
  
  const { targetPrice, stopPrice } = calculatePricesForAction(price, adjustedRisk, rewardRatio, action);
  
  return { targetPrice, stopPrice, riskPercent: adjustedRisk };
}

/**
 * Calcula preços com níveis de suporte/resistência
 */
export function calculateTargetAndStopPricesWithLevels(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  volatility: number,
  klines: any[]
) {
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
    originalStop: baseResult.stopPrice
  };
}

// ============================================================================
// SUPPORT/RESISTANCE ANALYSIS
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
