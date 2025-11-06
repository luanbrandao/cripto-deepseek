import { validateRiskReward, calculateRiskReward } from '../../bots/utils/risk/trade-validators';

export interface TrendValidationOptions {
  direction: 'UP' | 'DOWN';
  isSimulation?: boolean;
  boostAmount?: number;
}

export function validateTrendAnalysis(
  trendAnalysis: any, 
  options: TrendValidationOptions
): boolean {
  const { direction, isSimulation = false } = options;
  
  const isValidTrend = direction === 'UP' ? trendAnalysis.isUptrend : !trendAnalysis.isUptrend;
  
  if (!isValidTrend) {
    const trendType = direction === 'UP' ? 'ALTA' : 'BAIXA';
    console.log(`❌ MERCADO NÃO ESTÁ EM TENDÊNCIA DE ${trendType}`);
    console.log(`⏸️ ${isSimulation ? 'Simulação' : 'Trading'} cancelado - aguardando condições favoráveis`);
    console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
    return false;
  }

  const trendConfirmed = direction === 'UP' ? 'ALTA' : 'BAIXA';
  console.log(`✅ TENDÊNCIA DE ${trendConfirmed} CONFIRMADA PELO EMA`);
  console.log('🎯 Prosseguindo com análise DeepSeek AI...\n');
  return true;
}

export function validateDeepSeekDecision(decision: any, expectedAction: 'BUY' | 'SELL'): boolean {
  if (decision.action !== expectedAction) {
    const actionText = expectedAction === 'BUY' ? 'compra' : 'venda';
    console.log(`⏸️ DeepSeek não recomenda ${actionText} - aguardando`);
    return false;
  }
  return true;
}

export function validateRiskRewardRatio(decision: any): boolean {
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  return validateRiskReward(riskPercent, rewardPercent);
}

export function boostConfidence(
  decision: any, 
  options: { baseBoost: number; maxBoost: number; trendType: 'BUY' | 'SELL' }
): any {
  if (!validateRiskRewardRatio(decision)) {
    throw new Error('Risk/Reward ratio insuficiente - trade cancelado');
  }
  
  let boost = options.baseBoost;
  
  if (decision.confidence >= 85) {
    boost += 3;
  } else if (decision.confidence >= 75) {
    boost += 6;
  } else {
    boost += 8;
  }
  
  if (decision.reason?.includes('Smart Score:')) {
    const scoreMatch = decision.reason.match(/Smart Score: ([0-9.]+)/);
    if (scoreMatch) {
      const smartScore = parseFloat(scoreMatch[1]);
      if (smartScore > 90) boost += 4;
      else if (smartScore > 85) boost += 2;
    }
  }
  
  if (options.trendType === 'SELL' && decision.reason) {
    const bearishPatterns = ['resistência', 'divergência', 'rompimento', 'distribuição'];
    if (bearishPatterns.some(pattern => decision.reason.includes(pattern))) {
      boost += 3;
    }
  }
  
  const boostedConfidence = Math.min(95, decision.confidence + Math.min(boost, options.maxBoost));
  decision.confidence = boostedConfidence;
  
  const trendText = options.trendType === 'BUY' ? 'COMPRA' : 'VENDA';
  decision.reason = `${decision.reason} + EMA confirmado (+${boost}% boost)`;
  
  console.log(`🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM ${trendText}!`);
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost inteligente: +${boost}%`);
  
  return decision;
}