import { RiskRewardCalculation } from '../types/trading';
import { TRADING_CONFIG } from '../config/trading-config';
import { validateRiskReward as centralValidateRiskReward } from '../utils/trade-validators';

export class RiskManager {
  static calculateDynamicRiskReward(avgPrice: number, confidence: number): RiskRewardCalculation {
    const { BASE_PERCENT, MAX_PERCENT } = TRADING_CONFIG.RISK;

    // Quanto maior a confiança, menor o risco
    const riskPercent = Math.max(BASE_PERCENT, Math.min(MAX_PERCENT,
      MAX_PERCENT - ((confidence - 70) / 15) * (MAX_PERCENT - BASE_PERCENT)
    ));

    // GARANTIR SEMPRE 2:1 - Reward é EXATAMENTE 2x o risco
    const rewardPercent = riskPercent * 2; // Sempre 2x o risco

    return {
      riskPercent: riskPercent / 100,
      rewardPercent: rewardPercent / 100
    };
  }

  static validateRiskReward(riskPercent: number, rewardPercent: number): boolean {
    // Usar validação centralizada
    return centralValidateRiskReward(riskPercent, rewardPercent);
  }
}