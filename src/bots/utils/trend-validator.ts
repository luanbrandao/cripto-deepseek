export function validateTrendAnalysis(trendAnalysis: any, isSimulation = false): boolean {
  if (!trendAnalysis.isUptrend) {
    console.log('❌ MERCADO NÃO ESTÁ EM TENDÊNCIA DE ALTA');
    console.log(`⏸️ ${isSimulation ? 'Simulação' : 'Trading'} cancelado - aguardando condições favoráveis`);
    console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
    return false;
  }

  console.log('✅ TENDÊNCIA DE ALTA CONFIRMADA PELO EMA');
  console.log('🎯 Prosseguindo com análise DeepSeek AI...\n');
  return true;
}

export function validateDeepSeekDecision(decision: any): boolean {
  if (decision.action !== 'BUY') {
    console.log('⏸️ DeepSeek não recomenda compra - aguardando');
    return false;
  }
  return true;
}

export function boostConfidence(decision: any) {
  const boostedConfidence = Math.min(95, decision.confidence + 10);
  decision.confidence = boostedConfidence;
  decision.reason = `${decision.reason} + Tendência de alta confirmada pelo EMA`;
  
  console.log('🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM COMPRA!');
  return decision;
}