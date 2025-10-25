import { RiskRewardCalculation } from '../types/trading';
import { TRADING_CONFIG } from '../config/trading-config';

export class RiskManager {
  static calculateDynamicRiskReward(avgPrice: number, confidence: number): RiskRewardCalculation {
    const { BASE_PERCENT, MAX_PERCENT } = TRADING_CONFIG.RISK;
    
    // Quanto maior a confiança, menor o risco
    const riskPercent = MAX_PERCENT - ((confidence - 70) / 15) * (MAX_PERCENT - BASE_PERCENT);
    const rewardPercent = riskPercent * 2; // Sempre 2x o risco

    return {
      riskPercent: Math.max(BASE_PERCENT, Math.min(MAX_PERCENT, riskPercent)) / 100,
      rewardPercent: (riskPercent * 2) / 100
    };
  }

  static validateRiskReward(riskPercent: number, rewardPercent: number): boolean {
    const riskRewardRatio = rewardPercent / riskPercent;
    return riskRewardRatio >= TRADING_CONFIG.MIN_RISK_REWARD_RATIO;
  }
}