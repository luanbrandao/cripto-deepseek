import { TRADING_CONFIG } from '../config/trading-config';

export interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
}

/**
 * Valida se o Risk/Reward ratio é pelo menos 2:1
 */
export function validateRiskReward(riskPercent: number, rewardPercent: number): boolean {
  const riskRewardRatio = rewardPercent / riskPercent;
  
  console.log(`📊 Risk/Reward: ${(rewardPercent * 100).toFixed(1)}%/${(riskPercent * 100).toFixed(1)}% (${riskRewardRatio.toFixed(1)}:1)`);
  
  if (riskRewardRatio < TRADING_CONFIG.MIN_RISK_REWARD_RATIO) {
    console.log(`❌ TRADE REJEITADO - R/R ${riskRewardRatio.toFixed(1)}:1 < ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1 (MÍNIMO OBRIGATÓRIO)`);
    return false;
  }
  
  console.log(`✅ Risk/Reward APROVADO: ${riskRewardRatio.toFixed(1)}:1 (≥ 2:1)`);
  return true;
}

/**
 * Valida se a confiança está acima do mínimo
 */
export function validateConfidence(decision: TradeDecision): boolean {
  if (decision.confidence < TRADING_CONFIG.MIN_CONFIDENCE) {
    console.log(`❌ Confiança insuficiente: ${decision.confidence}% < ${TRADING_CONFIG.MIN_CONFIDENCE}%`);
    return false;
  }
  
  console.log(`✅ Confiança aprovada: ${decision.confidence}% (≥ ${TRADING_CONFIG.MIN_CONFIDENCE}%)`);
  return true;
}

/**
 * Valida se a ação é BUY ou SELL (não HOLD)
 */
export function validateAction(decision: TradeDecision): boolean {
  if (decision.action === 'HOLD') {
    console.log('⏸️ Ação HOLD - aguardando melhor oportunidade');
    return false;
  }
  
  console.log(`✅ Ação válida: ${decision.action}`);
  return true;
}

/**
 * Validação completa de trade (confiança + ação + risk/reward)
 */
export function validateTrade(decision: TradeDecision, riskPercent: number, rewardPercent: number): boolean {
  console.log('\n🔍 VALIDAÇÃO COMPLETA DE TRADE:');
  
  // 1. Validar ação
  if (!validateAction(decision)) {
    return false;
  }
  
  // 2. Validar confiança
  if (!validateConfidence(decision)) {
    return false;
  }
  
  // 3. Validar risk/reward 2:1
  if (!validateRiskReward(riskPercent, rewardPercent)) {
    return false;
  }
  
  console.log('🎯 TODAS AS VALIDAÇÕES APROVADAS - Trade autorizado!\n');
  return true;
}

/**
 * Calcula risk/reward garantindo sempre 2:1
 */
export function calculateRiskReward(confidence: number): { riskPercent: number; rewardPercent: number } {
  const { BASE_PERCENT, MAX_PERCENT } = TRADING_CONFIG.RISK;
  
  // Quanto maior a confiança, menor o risco
  const riskPercent = Math.max(BASE_PERCENT, Math.min(MAX_PERCENT, 
    MAX_PERCENT - ((confidence - 70) / 15) * (MAX_PERCENT - BASE_PERCENT)
  ));
  
  // GARANTIR SEMPRE 2:1
  const rewardPercent = riskPercent * 2;
  
  return {
    riskPercent: riskPercent / 100,
    rewardPercent: rewardPercent / 100
  };
}

/**
 * Calcula risk/reward dinâmico - apenas valida se ganho é 2x maior que risco
 * Não modifica valores, apenas verifica se atendem ao critério 2:1
 */
export function calculateRiskRewardDynamic(entryPrice: number, targetPrice: number, stopPrice: number, action: 'BUY' | 'SELL'): { riskPercent: number; rewardPercent: number; isValid: boolean } {
  let potentialGain: number;
  let potentialLoss: number;
  
  if (action === 'BUY') {
    potentialGain = targetPrice - entryPrice;
    potentialLoss = entryPrice - stopPrice;
  } else { // SELL
    potentialGain = entryPrice - targetPrice;
    potentialLoss = stopPrice - entryPrice;
  }
  
  const riskPercent = Math.abs(potentialLoss) / entryPrice;
  const rewardPercent = Math.abs(potentialGain) / entryPrice;
  const ratio = rewardPercent / riskPercent;
  
  console.log(`📊 Risk/Reward Dinâmico: ${(rewardPercent * 100).toFixed(2)}%/${(riskPercent * 100).toFixed(2)}% (${ratio.toFixed(2)}:1)`);
  
  const isValid = ratio >= TRADING_CONFIG.MIN_RISK_REWARD_RATIO;
  
  if (!isValid) {
    console.log(`❌ RATIO INSUFICIENTE: ${ratio.toFixed(2)}:1 < ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
  } else {
    console.log(`✅ RATIO APROVADO: ${ratio.toFixed(2)}:1 (≥ ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1)`);
  }
  
  return {
    riskPercent,
    rewardPercent,
    isValid
  };
}