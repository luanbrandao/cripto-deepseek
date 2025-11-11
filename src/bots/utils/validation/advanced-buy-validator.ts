import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { validateRiskReward, calculateRiskReward } from '../risk/trade-validators';

export function validateAdvancedBullishTrend(trendAnalysis: any, isSimulation = false): boolean {
  if (!trendAnalysis.isUptrend) {
    console.log('❌ MERCADO NÃO ESTÁ EM TENDÊNCIA DE ALTA');
    console.log(`⏸️ ${isSimulation ? 'Simulação' : 'Trading'} cancelado - aguardando condições bullish`);
    console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
    return false;
  }

  console.log('✅ TENDÊNCIA DE ALTA CONFIRMADA - ANÁLISE AVANÇADA');
  console.log('🎯 Prosseguindo com análise multi-dimensional para COMPRA...\n');
  return true;
}

export function validateAdvancedBuyDecision(decision: any): boolean {
  if (decision.action !== 'BUY') {
    console.log('⏸️ Análise multi-dimensional não recomenda compra - aguardando');
    return false;
  }

  // Validação de confiança mínima para compras avançadas
  if (decision.confidence < TradingConfigManager.getConfig().MIN_CONFIDENCE) {
    console.log(`❌ Confiança ${decision.confidence}% insuficiente para compra avançada (mín: ${TradingConfigManager.getConfig().MIN_CONFIDENCE}%)`);
    return false;
  }

  console.log('✅ Decisão de COMPRA AVANÇADA aprovada');
  console.log(`📊 Smart Score: ${decision.smartScore || 'N/A'}`);
  console.log(`🔍 Sinais Bullish: ${decision.bullishSignals?.length || 0}`);
  return true;
}

export function validateAdvancedBuyRiskReward(decision: any): boolean {
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  return validateRiskReward(riskPercent, rewardPercent);
}

export function boostAdvancedBuyConfidence(decision: any) {
  // VALIDAÇÃO OBRIGATÓRIA: Risk/Reward 2:1
  if (!validateAdvancedBuyRiskReward(decision)) {
    throw new Error('Risk/Reward ratio insuficiente - compra avançada cancelada');
  }

  // Boost inteligente para compras avançadas
  let boost = 0;

  // Base boost para confirmação EMA bullish
  boost += 5;

  // Boost baseado no Smart Score
  if (decision.smartScore >= TradingConfigManager.getConfig().HIGH_CONFIDENCE) {
    boost += 5; // Score muito alto
  } else if (decision.smartScore >= TradingConfigManager.getConfig().MEDIUM_CONFIDENCE) {
    boost += 3; // Score alto
  } else if (decision.smartScore >= TradingConfigManager.getConfig().MIN_CONFIDENCE) {
    boost += 2; // Score médio
  }

  // Boost baseado no número de sinais bullish
  const bullishCount = decision.bullishSignals?.length || 0;
  if (bullishCount >= 5) {
    boost += 4; // Muitos sinais
  } else if (bullishCount >= 3) {
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
  if (reason.includes('golden cross') || reason.includes('rompimento')) {
    boost += 2;
  }
  if (reason.includes('volume') && reason.includes('acumulação')) {
    boost += 2;
  }
  if (reason.includes('divergência bullish')) {
    boost += 1;
  }

  const boostedConfidence = Math.min(TradingConfigManager.getConfig().HIGH_CONFIDENCE + 8, decision.confidence + boost);
  decision.confidence = boostedConfidence;
  decision.reason = `${decision.reason} + Análise multi-dimensional confirmada (+${boost}% boost)`;

  console.log('🎯 CONFIRMAÇÃO MULTI-DIMENSIONAL: COMPRA AVANÇADA APROVADA!');
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost avançado: +${boost}%`);
  console.log(`📊 Confiança final: ${boostedConfidence}%`);

  return decision;
}

export function getAdvancedBuyThreshold(marketType: string): number {
  // Thresholds otimizados para compras avançadas
  switch (marketType) {
    case 'BULL_MARKET': return 65; // Mais oportunidades em bull market
    case 'BEAR_MARKET': return TradingConfigManager.getConfig().MEDIUM_CONFIDENCE; // Muito seletivo em bear market
    case 'SIDEWAYS': return 75;    // Moderado em mercado lateral
    default: return 70;            // Padrão equilibrado
  }
}

export function validateAdvancedBuyStrength(analysis: any, threshold: number): boolean {
  const strength = analysis.overallStrength || 0;

  // Usar apenas overallStrength (smartScore não existe no AdvancedEmaAnalysis)
  if (strength < threshold) {
    console.log(`❌ ${strength.toFixed(1)} < ${threshold} (threshold)`);
    return false;
  }

  // Validação adicional: verificar se é tendência de alta
  const isUptrend = analysis.shortTerm?.trend === 'UP' || analysis.mediumTerm?.trend === 'UP';
  if (!isUptrend) {
    console.log(`❌ Não está em tendência de alta`);
    return false;
  }

  console.log(`✅ Validação aprovada: Força ${strength.toFixed(1)}, Tendência: UP`);
  return true;
}
