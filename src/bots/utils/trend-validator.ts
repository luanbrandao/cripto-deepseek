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

import { validateRiskReward, calculateRiskReward } from './trade-validators';

export function validateRiskRewardRatio(decision: any): boolean {
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  return validateRiskReward(riskPercent, rewardPercent);
}

export function boostConfidence(decision: any) {
  // VALIDAÇÃO OBRIGATÓRIA: Risk/Reward 2:1
  if (!validateRiskRewardRatio(decision)) {
    throw new Error('Risk/Reward ratio insuficiente - trade cancelado');
  }
  
  // Intelligent boost based on multiple criteria
  let boost = 0;
  
  // Base EMA confirmation boost
  boost += 5;
  
  // Additional boost based on current confidence level
  if (decision.confidence >= 85) {
    boost += 3; // High confidence gets smaller boost
  } else if (decision.confidence >= 75) {
    boost += 6; // Medium confidence gets medium boost
  } else {
    boost += 8; // Lower confidence gets higher boost
  }
  
  // Smart Score boost (if available in reason)
  if (decision.reason && decision.reason.includes('Smart Score:')) {
    const scoreMatch = decision.reason.match(/Smart Score: ([0-9.]+)/);
    if (scoreMatch) {
      const smartScore = parseFloat(scoreMatch[1]);
      if (smartScore > 90) boost += 4;
      else if (smartScore > 85) boost += 2;
    }
  }
  
  const boostedConfidence = Math.min(95, decision.confidence + boost);
  decision.confidence = boostedConfidence;
  decision.reason = `${decision.reason} + EMA confirmado (+${boost}% boost)`;
  
  console.log('🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM COMPRA!');
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost inteligente: +${boost}%`);
  return decision;
}
