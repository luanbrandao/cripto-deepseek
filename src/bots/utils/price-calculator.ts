/**
 * Calcula target e stop prices baseados na confiança da decisão
 */
export function calculateTargetAndStopPrices(price: number, confidence: number, action: 'BUY' | 'SELL') {
  // Calcular percentual de risco baseado na confiança
  const riskPercent = confidence >= 80 ? 0.5 :
    confidence >= 75 ? 1.0 : 1.5;

  // Calcular preços para BUY
  if (action === 'BUY') {
    const targetPrice = price * (1 + (riskPercent * 2) / 100);  // Reward = 2x Risk
    const stopPrice = price * (1 - riskPercent / 100);
    return { targetPrice, stopPrice, riskPercent };
  }

  // Calcular preços para SELL
  const targetPrice = price * (1 - (riskPercent * 2) / 100);  // Reward = 2x Risk
  const stopPrice = price * (1 + riskPercent / 100);
  return { targetPrice, stopPrice, riskPercent };
}

// Adicionar volatilidade real do mercado
export function calculateTargetAndStopPricesRealMarket(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  volatility: number // em %, ex: 1.2 significa 1.2% de variação média
) {
  const baseRisk = confidence >= 80 ? 0.5 : confidence >= 75 ? 1.0 : 1.5;
  const adjustedRisk = baseRisk * (1 + volatility / 2); // stop maior em mercados mais voláteis

  const rewardRatio = confidence >= 85 ? 2.5 : 2.0;

  if (action === 'BUY') {
    return {
      targetPrice: price * (1 + (adjustedRisk * rewardRatio) / 100),
      stopPrice: price * (1 - adjustedRisk / 100),
      riskPercent: adjustedRisk
    };
  }

  return {
    targetPrice: price * (1 - (adjustedRisk * rewardRatio) / 100),
    stopPrice: price * (1 + adjustedRisk / 100),
    riskPercent: adjustedRisk
  };

}

// Targets dinâmicos baseados em suporte/resistência
export function calculateTargetAndStopPricesWithLevels(
  price: number,
  confidence: number,
  action: 'BUY' | 'SELL',
  volatility: number,
  klines: any[] // dados históricos para calcular níveis
) {
  // 1. Calcular níveis técnicos
  const levels = findSupportResistanceLevels(klines, price);
  
  // 2. Cálculo base com volatilidade
  const baseResult = calculateTargetAndStopPricesRealMarket(price, confidence, action, volatility);
  
  // 3. Ajustar target para próximo nível técnico
  const optimizedTarget = adjustTargetToNearestLevel(
    baseResult.targetPrice, 
    action === 'BUY' ? levels.resistance : levels.support,
    price,
    action
  );
  
  // 4. Ajustar stop para nível de proteção
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
    levels: levels,
    originalTarget: baseResult.targetPrice,
    originalStop: baseResult.stopPrice
  };
}

// Encontrar níveis de suporte e resistência
function findSupportResistanceLevels(klines: any[], currentPrice: number) {
  const highs = klines.map(k => parseFloat(k[2])); // high prices
  const lows = klines.map(k => parseFloat(k[3]));  // low prices
  
  // Encontrar resistências (máximas locais)
  const resistances = findLocalMaxima(highs).filter(r => r > currentPrice);
  const nearestResistance = resistances.length > 0 ? Math.min(...resistances) : currentPrice * 1.05;
  
  // Encontrar suportes (mínimas locais)
  const supports = findLocalMinima(lows).filter(s => s < currentPrice);
  const nearestSupport = supports.length > 0 ? Math.max(...supports) : currentPrice * 0.95;
  
  return {
    resistance: nearestResistance,
    support: nearestSupport,
    allResistances: resistances.slice(0, 3), // top 3
    allSupports: supports.slice(-3) // últimos 3
  };
}

// Encontrar máximas locais
function findLocalMaxima(prices: number[]): number[] {
  const maxima = [];
  for (let i = 2; i < prices.length - 2; i++) {
    if (prices[i] > prices[i-1] && prices[i] > prices[i-2] && 
        prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
      maxima.push(prices[i]);
    }
  }
  return maxima.sort((a, b) => b - a); // maior para menor
}

// Encontrar mínimas locais
function findLocalMinima(prices: number[]): number[] {
  const minima = [];
  for (let i = 2; i < prices.length - 2; i++) {
    if (prices[i] < prices[i-1] && prices[i] < prices[i-2] && 
        prices[i] < prices[i+1] && prices[i] < prices[i+2]) {
      minima.push(prices[i]);
    }
  }
  return minima.sort((a, b) => a - b); // menor para maior
}

// Ajustar target para nível técnico próximo
function adjustTargetToNearestLevel(
  calculatedTarget: number,
  nearestLevel: number,
  currentPrice: number,
  action: 'BUY' | 'SELL'
): number {
  const distanceToLevel = Math.abs(nearestLevel - currentPrice) / currentPrice;
  const distanceToTarget = Math.abs(calculatedTarget - currentPrice) / currentPrice;
  
  // Se o nível técnico está próximo do target calculado (±20%), usar o nível
  if (Math.abs(distanceToLevel - distanceToTarget) < 0.002) { // 0.2%
    // Ajustar ligeiramente antes do nível para melhor execução
    const buffer = currentPrice * 0.001; // 0.1% buffer
    return action === 'BUY' ? nearestLevel - buffer : nearestLevel + buffer;
  }
  
  // Se o nível está muito longe, usar target calculado
  return calculatedTarget;
}

// Ajustar stop para nível de proteção
function adjustStopToProtectionLevel(
  calculatedStop: number,
  protectionLevel: number,
  currentPrice: number,
  action: 'BUY' | 'SELL'
): number {
  // Para BUY: stop não pode estar acima do suporte
  // Para SELL: stop não pode estar abaixo da resistência
  
  if (action === 'BUY') {
    // Stop deve estar abaixo do suporte para proteção
    const buffer = currentPrice * 0.002; // 0.2% buffer
    const protectedStop = protectionLevel - buffer;
    return Math.min(calculatedStop, protectedStop);
  } else {
    // Stop deve estar acima da resistência para proteção
    const buffer = currentPrice * 0.002; // 0.2% buffer
    const protectedStop = protectionLevel + buffer;
    return Math.max(calculatedStop, protectedStop);
  }
}