import { validateRiskReward, calculateRiskReward } from '../../bots/utils/risk/trade-validators';
import { TradingConfigManager } from '../../core/config/trading-config-manager';

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

  const config = TradingConfigManager.getConfig();
  const highConfidenceBoost = config.VALIDATION_SCORES?.RSI_OVERSOLD / 27 || 3;
  const mediumConfidenceBoost = config.VALIDATION_SCORES?.VOLUME_LOW / 7 || 6;
  const lowConfidenceBoost = config.VALIDATION_SCORES?.VOLUME_ADEQUATE / 10 || 8;
  
  if (decision.confidence >= config.HIGH_CONFIDENCE) {
    boost += highConfidenceBoost;
  } else if (decision.confidence >= config.MEDIUM_CONFIDENCE) {
    boost += mediumConfidenceBoost;
  } else {
    boost += lowConfidenceBoost;
  }

  if (decision.reason?.includes('Smart Score:')) {
    const scoreMatch = decision.reason.match(/Smart Score: ([0-9.]+)/);
    if (scoreMatch) {
      const smartScore = parseFloat(scoreMatch[1]);
      const smartScoreHighBoost = config.VALIDATION_SCORES?.VOLUME_LOW / 10 || 4;
      const smartScoreMediumBoost = config.VALIDATION_SCORES?.RSI_OVERBOUGHT / 10 || 2;
      
      if (smartScore > config.HIGH_CONFIDENCE) boost += smartScoreHighBoost;
      else if (smartScore > config.MEDIUM_CONFIDENCE) boost += smartScoreMediumBoost;
    }
  }

  if (options.trendType === 'SELL' && decision.reason) {
    const bearishPatterns = ['resistência', 'divergência', 'rompimento', 'distribuição'];
    const bearishPatternBoost = config.VALIDATION_SCORES?.RSI_OVERSOLD / 27 || 3;
    
    if (bearishPatterns.some(pattern => decision.reason.includes(pattern))) {
      boost += bearishPatternBoost;
    }
  }
  const boostedConfidence = Math.min(config.HIGH_CONFIDENCE, decision.confidence + Math.min(boost, options.maxBoost));
  decision.confidence = boostedConfidence;

  const trendText = options.trendType === 'BUY' ? 'COMPRA' : 'VENDA';
  decision.reason = `${decision.reason} + EMA confirmado (+${boost}% boost)`;

  console.log(`🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM ${trendText}!`);
  console.log(`✅ Risk/Reward 2:1 confirmado! Boost inteligente: +${boost}%`);

  return decision;
}