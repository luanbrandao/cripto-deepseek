import { validateRiskReward, calculateRiskReward } from './trade-validators';

export function validateAdvancedBearishTrend(trendAnalysis: any, isSimulation = false): boolean {
  if (trendAnalysis.isUptrend) {
    console.log('❌ MERCADO EM TENDÊNCIA DE ALTA');
    console.log(`⏸️ ${isSimulation ? 'Simulação' : 'Trading'} cancelado - aguardando reversão bearish`);
    console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
    return false;
  }

  console.log('✅ TENDÊNCIA DE BAIXA CONFIRMADA - ANÁLISE AVANÇADA');
  console.log('🎯 Prosseguindo com análise multi-dimensional para VENDA...\n');
  return true;
}

export function validateAdvancedSellDecision(decision: any): boolean {
  if (decision.action !== 'SELL') {
    console.log('⏸️ Análise multi-dimensional não recomenda venda - aguardando');
    return false;
  }
  
  // Validação de confiança mínima para vendas avançadas
  if (decision.confidence < 85) {
    console.log(`❌ Confiança ${decision.confidence}% insuficiente para venda avançada (mín: 85%)`);
    return false;
  }
  
  console.log('✅ Decisão de VENDA AVANÇADA aprovada');
  console.log(`📊 Smart Score: ${decision.smartScore || 'N/A'}`);
  console.log(`🔍 Sinais Bearish: ${decision.bearishSignals?.length || 0}`);
  return true;
}

export function validateAdvancedSellRiskReward(decision: any): boolean {
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  return validateRiskReward(riskPercent, rewardPercent);
}

export function boostAdvancedSellConfidence(decision: any) {
  // VALIDAÇÃO OBRIGATÓRIA: Risk/Reward 2:1
  if (!validateAdvancedSellRiskReward(decision)) {
    throw new Error('Risk/Reward ratio insuficiente - venda avançada cancelada');
  }
  
  // Boost inteligente para vendas avançadas
  let boost = 0;
  
  // Base boost para confirmação EMA bearish
  boost += 5;
  
  // Boost baseado no Smart Score
  if (decision.smartScore >= 90) {
    boost += 5; // Score muito alto
  } else if (decision.smartScore >= 80) {
    boost += 3; // Score alto
  } else if (decision.smartScore >= 70) {
    boost += 2; // Score médio
  }
  
  // Boost baseado no número de sinais bearish
  const bearishCount = decision.bearishSignals?.length || 0;
  if (bearishCount >= 5) {
    boost += 4; // Muitos sinais
  } else if (bearishCount >= 3) {
    boost += 2; // Sinais suficientes
  }
  
  // Boost baseado no nível de risco
  if (decision.riskLevel === 'LOW') {
    boost += 3; // Baixo risco = mais boost
  } else if (decision.riskLevel === 'MEDIUM') {
    boost += 1; // Risco médio = boost moderado
  }
  
  // Boost para padrões específicos
  const reason = decision.reason?.toLowerCase() || '';
  if (reason.includes('death cross') || reason.includes('rompimento')) {
    boost += 2;
  }
  if (reason.includes('volume') && reason.includes('distribuição')) {
    boost += 2;
  }
  if (reason.includes('divergência')) {
    boost += 1;
  }
  
  const boostedConfidence = Math.min(98, decision.confidence + boost);
  decision.confidence = boostedConfidence;
  decision.reason = `${decision.reason} + Análise multi-dimensional confirmada (+${boost}% boost)`;
  
  console.log('🎯 CONFIRMAÇÃO MULTI-DIMENSIONAL: VENDA AVANÇADA APROVADA!');
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost avançado: +${boost}%`);
  console.log(`📊 Confiança final: ${boostedConfidence}%`);
  
  return decision;
}

export function getAdvancedSellThreshold(marketType: string): number {
  // Thresholds mais rigorosos para vendas avançadas
  switch (marketType) {
    case 'BULL_MARKET': return 90; // Muito seletivo em bull market
    case 'BEAR_MARKET': return 70; // Mais oportunidades em bear market
    case 'SIDEWAYS': return 80;    // Seletivo em mercado lateral
    default: return 85;            // Padrão conservador
  }
}

export function validateAdvancedSellStrength(analysis: any, threshold: number): boolean {
  const strength = analysis.overallStrength || 0;
  
  // Para vendas, usar apenas overallStrength (smartScore vem do DeepSeek, não do EMA)
  if (strength < threshold) {
    console.log(`❌ Score combinado ${strength.toFixed(1)} < ${threshold} (threshold)`);
    return false;
  }
  
  console.log(`✅ Validação avançada aprovada: Score ${strength.toFixed(1)}`);
  return true;
}