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