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