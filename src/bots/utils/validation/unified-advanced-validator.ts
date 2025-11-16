import { TradingConfigManager } from '../../../core/config/trading-config-manager';
import { validateRiskReward, calculateRiskReward } from '../risk/trade-validators';

export interface AdvancedValidationOptions {
  direction: 'UP' | 'DOWN';
  isSimulation?: boolean;
}

export interface AdvancedBoostOptions {
  direction: 'BUY' | 'SELL';
}

export function validateAdvancedTrend(
  trendAnalysis: any, 
  options: AdvancedValidationOptions
): boolean {
  const { direction, isSimulation = false } = options;
  const isValidTrend = direction === 'UP' ? trendAnalysis.isUptrend : !trendAnalysis.isUptrend;

  if (!isValidTrend) {
    const trendType = direction === 'UP' ? 'ALTA' : 'BAIXA';
    const oppositeType = direction === 'UP' ? 'BAIXA' : 'ALTA';
    console.log(`❌ MERCADO ${direction === 'UP' ? 'NÃO ESTÁ EM TENDÊNCIA DE' : 'EM TENDÊNCIA DE'} ${direction === 'UP' ? trendType : oppositeType}`);
    console.log(`⏸️ ${isSimulation ? 'Simulação' : 'Trading'} cancelado - aguardando ${direction === 'UP' ? 'condições bullish' : 'reversão bearish'}`);
    console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
    return false;
  }

  const trendConfirmed = direction === 'UP' ? 'ALTA' : 'BAIXA';
  console.log(`✅ TENDÊNCIA DE ${trendConfirmed} CONFIRMADA - ANÁLISE AVANÇADA`);
  console.log(`🎯 Prosseguindo com análise multi-dimensional para ${direction === 'UP' ? 'COMPRA' : 'VENDA'}...\n`);
  return true;
}

export function validateAdvancedDecision(decision: any, expectedAction: 'BUY' | 'SELL'): boolean {
  if (decision.action !== expectedAction) {
    const actionText = expectedAction === 'BUY' ? 'compra' : 'venda';
    console.log(`⏸️ Análise multi-dimensional não recomenda ${actionText} - aguardando`);
    return false;
  }

  if (decision.confidence < TradingConfigManager.getConfig().MIN_CONFIDENCE) {
    const actionText = expectedAction === 'BUY' ? 'compra' : 'venda';
    console.log(`❌ Confiança ${decision.confidence}% insuficiente para ${actionText} avançada (mín: ${TradingConfigManager.getConfig().MIN_CONFIDENCE}%)`);
    return false;
  }

  const actionText = expectedAction === 'BUY' ? 'COMPRA' : 'VENDA';
  const signalType = expectedAction === 'BUY' ? 'Bullish' : 'Bearish';
  const signalKey = expectedAction === 'BUY' ? 'bullishSignals' : 'bearishSignals';
  
  console.log(`✅ Decisão de ${actionText} AVANÇADA aprovada`);
  console.log(`📊 Smart Score: ${decision.smartScore || 'N/A'}`);
  console.log(`🔍 Sinais ${signalType}: ${decision[signalKey]?.length || 0}`);
  return true;
}

export function validateAdvancedRiskReward(decision: any): boolean {
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  return validateRiskReward(riskPercent, rewardPercent);
}

export function boostAdvancedConfidence(decision: any, options: AdvancedBoostOptions) {
  if (!validateAdvancedRiskReward(decision)) {
    const actionText = options.direction === 'BUY' ? 'compra' : 'venda';
    throw new Error(`Risk/Reward ratio insuficiente - ${actionText} avançada cancelada`);
  }

  const config = TradingConfigManager.getConfig();
  const baseBoost = config.VALIDATION_SCORES?.EMA_SEPARATION / 4 || 5;
  const highScoreBoost = config.VALIDATION_SCORES?.EMA_ALIGNMENT / 8 || 5;
  const mediumScoreBoost = config.VALIDATION_SCORES?.RSI_OVERSOLD / 27 || 3;
  const minScoreBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 10 || 2;
  const highSignalBoost = config.VALIDATION_SCORES?.VOLUME_LOW / 10 || 4;
  const mediumSignalBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 10 || 2;
  const lowRiskBoost = config.VALIDATION_SCORES?.RSI_OVERSOLD / 27 || 3;
  const mediumRiskBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 20 || 1;
  const patternBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 10 || 2;
  const volumePatternBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 10 || 2;
  const divergenceBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 20 || 1;

  let boost = baseBoost;

  // Boost baseado no Smart Score
  if (decision.smartScore >= config.HIGH_CONFIDENCE) {
    boost += highScoreBoost;
  } else if (decision.smartScore >= config.MEDIUM_CONFIDENCE) {
    boost += mediumScoreBoost;
  } else if (decision.smartScore >= config.MIN_CONFIDENCE) {
    boost += minScoreBoost;
  }

  // Boost baseado no número de sinais
  const signalKey = options.direction === 'BUY' ? 'bullishSignals' : 'bearishSignals';
  const signalCount = decision[signalKey]?.length || 0;
  if (signalCount >= 5) {
    boost += highSignalBoost;
  } else if (signalCount >= 3) {
    boost += mediumSignalBoost;
  }

  // Boost baseado no nível de risco
  if (decision.riskLevel === 'LOW') {
    boost += lowRiskBoost;
  } else if (decision.riskLevel === 'MEDIUM') {
    boost += mediumRiskBoost;
  }

  // Boost para padrões específicos
  const reason = decision.reason?.toLowerCase() || '';
  if (options.direction === 'BUY') {
    if (reason.includes('golden cross') || reason.includes('rompimento')) boost += patternBoost;
    if (reason.includes('volume') && reason.includes('acumulação')) boost += volumePatternBoost;
    if (reason.includes('divergência bullish')) boost += divergenceBoost;
  } else {
    if (reason.includes('death cross') || reason.includes('rompimento')) boost += patternBoost;
    if (reason.includes('volume') && reason.includes('distribuição')) boost += volumePatternBoost;
    if (reason.includes('divergência')) boost += divergenceBoost;
  }

  const maxBoostLimit = config.VALIDATION_SCORES?.RSI_OVERSOLD / 10 || 8;
  const boostedConfidence = Math.min(config.HIGH_CONFIDENCE + maxBoostLimit, decision.confidence + boost);
  decision.confidence = boostedConfidence;
  decision.reason = `${decision.reason} + Análise multi-dimensional confirmada (+${boost}% boost)`;

  const actionText = options.direction === 'BUY' ? 'COMPRA' : 'VENDA';
  console.log(`🎯 CONFIRMAÇÃO MULTI-DIMENSIONAL: ${actionText} AVANÇADA APROVADA!`);
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost avançado: +${boost}%`);
  console.log(`📊 Confiança final: ${boostedConfidence}%`);

  return decision;
}

export function getAdvancedThreshold(marketType: string, direction: 'BUY' | 'SELL'): number {
  if (direction === 'BUY') {
    const config = TradingConfigManager.getConfig();
    const bullMarketThreshold = (config.VALIDATION_SCORES?.MIN_APPROVAL_SCORE || 60) + 5;
    const sidewaysThreshold = (config.VALIDATION_SCORES?.VOLUME_ADEQUATE || 80) - 5;
    const defaultThreshold = (config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50) + 20;
    
    switch (marketType) {
      case 'BULL_MARKET': return bullMarketThreshold;
      case 'BEAR_MARKET': return config.MEDIUM_CONFIDENCE;
      case 'SIDEWAYS': return sidewaysThreshold;
      default: return defaultThreshold;
    }
  } else {
    const config = TradingConfigManager.getConfig();
    const bearMarketThreshold = (config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50) + 20;
    
    switch (marketType) {
      case 'BULL_MARKET': return config.HIGH_CONFIDENCE;
      case 'BEAR_MARKET': return bearMarketThreshold;
      case 'SIDEWAYS': return config.MIN_CONFIDENCE;
      default: return config.MEDIUM_CONFIDENCE;
    }
  }
}

export function validateAdvancedStrength(analysis: any, threshold: number, direction: 'BUY' | 'SELL'): boolean {
  const strength = analysis.overallStrength || 0;

  if (strength < threshold) {
    const prefix = direction === 'SELL' ? 'Score combinado ' : '';
    console.log(`❌ ${prefix}${strength.toFixed(1)} < ${threshold} (threshold)`);
    return false;
  }

  if (direction === 'BUY') {
    const isUptrend = analysis.shortTerm?.trend === 'UP' || analysis.mediumTerm?.trend === 'UP';
    if (!isUptrend) {
      console.log(`❌ Não está em tendência de alta`);
      return false;
    }
    console.log(`✅ Validação aprovada: Força ${strength.toFixed(1)}, Tendência: UP`);
  } else {
    console.log(`✅ Validação avançada aprovada: Score ${strength.toFixed(1)}`);
  }

  return true;
}