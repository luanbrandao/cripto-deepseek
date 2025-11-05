import { validateRiskReward, calculateRiskReward } from './trade-validators';

export function validateBearishTrendAnalysis(trendAnalysis: any, isSimulation = false): boolean {
  if (trendAnalysis.isUptrend) {
    console.log('❌ MERCADO EM TENDÊNCIA DE ALTA');
    console.log(`⏸️ ${isSimulation ? 'Simulação' : 'Trading'} cancelado - aguardando tendência de baixa`);
    console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
    return false;
  }

  console.log('✅ TENDÊNCIA DE BAIXA CONFIRMADA PELO EMA');
  console.log('🎯 Prosseguindo com análise DeepSeek AI para VENDA...\n');
  return true;
}

export function validateSellDecision(decision: any): boolean {
  if (decision.action !== 'SELL') {
    console.log('⏸️ DeepSeek não recomenda venda - aguardando oportunidade bearish');
    return false;
  }
  console.log('✅ Decisão de VENDA aprovada pelo DeepSeek');
  return true;
}

export function validateSellRiskRewardRatio(decision: any): boolean {
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  return validateRiskReward(riskPercent, rewardPercent);
}

export function boostSellConfidence(decision: any) {
  // VALIDAÇÃO OBRIGATÓRIA: Risk/Reward 2:1
  if (!validateSellRiskRewardRatio(decision)) {
    throw new Error('Risk/Reward ratio insuficiente - venda cancelada');
  }
  
  // Boost inteligente para vendas
  let boost = 0;
  
  // Base EMA confirmation boost para vendas
  boost += 8; // Boost maior para vendas (mais arriscadas)
  
  // Boost adicional baseado na confiança atual
  if (decision.confidence >= 85) {
    boost += 2; // Alta confiança gets smaller boost
  } else if (decision.confidence >= 75) {
    boost += 5; // Média confiança gets medium boost
  } else {
    boost += 7; // Baixa confiança gets higher boost
  }
  
  // Boost para padrões bearish específicos
  if (decision.reason && (
    decision.reason.includes('resistência') ||
    decision.reason.includes('divergência') ||
    decision.reason.includes('rompimento') ||
    decision.reason.includes('distribuição')
  )) {
    boost += 3; // Boost para padrões bearish clássicos
  }
  
  const boostedConfidence = Math.min(95, decision.confidence + boost);
  decision.confidence = boostedConfidence;
  decision.reason = `${decision.reason} + Tendência de baixa confirmada (+${boost}% boost)`;
  
  console.log('🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM VENDA!');
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost para venda: +${boost}%`);
  return decision;
}