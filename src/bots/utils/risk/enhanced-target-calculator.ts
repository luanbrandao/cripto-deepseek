export class EnhancedTargetCalculator {
  // Algorithm constants for calculations
  private static readonly BUY_STOP_MULTIPLIER = 4; // Algorithm constant
  private static readonly BUY_STOP_FALLBACK = 0.02; // Algorithm constant - 2% fallback
  private static readonly BUY_TARGET_MULTIPLIER = 4; // Algorithm constant
  private static readonly BUY_TARGET_FALLBACK = 0.03; // Algorithm constant - 3% fallback
  private static readonly BUY_STOP_FALLBACK_MULTIPLIER = 6; // Algorithm constant
  private static readonly BUY_STOP_FALLBACK_PERCENT = 0.015; // Algorithm constant - 1.5% fallback
  private static readonly SELL_STOP_MULTIPLIER = 8; // Algorithm constant
  private static readonly SELL_STOP_FALLBACK = 0.02; // Algorithm constant - 2% fallback
  private static readonly SELL_TARGET_MULTIPLIER = 4; // Algorithm constant
  private static readonly SELL_TARGET_FALLBACK = 0.03; // Algorithm constant - 3% fallback
  private static readonly SELL_STOP_FALLBACK_MULTIPLIER = 6; // Algorithm constant
  private static readonly SELL_STOP_FALLBACK_PERCENT = 0.015; // Algorithm constant - 1.5% fallback

  constructor(private config: any) {}

  calculate(decision: any, currentPrice: number) {
    const { action, technicalLevels } = decision;
    
    if (action === 'BUY') {
      return this.calculateBuyTargets(technicalLevels, currentPrice);
    } else if (action === 'SELL') {
      return this.calculateSellTargets(technicalLevels, currentPrice);
    }
    
    return null;
  }

  private calculateBuyTargets(levels: any, currentPrice: number) {
    const nearestResistance = levels.resistance?.find((r: number) => r > currentPrice);
    const nearestSupport = levels.support?.find((s: number) => s < currentPrice);
    
    let target: number, stop: number, method: string;
    
    if (nearestResistance && nearestSupport) {
      target = nearestResistance;
      stop = nearestSupport;
      method = 'Níveis Técnicos AI (Resistência/Suporte)';
    } else if (levels.targets?.[0]) {
      target = levels.targets[0];
      const stopLossPercent = 1 - (this.config.RISK?.BASE_PERCENT / 100 * EnhancedTargetCalculator.BUY_STOP_MULTIPLIER || EnhancedTargetCalculator.BUY_STOP_FALLBACK);
      stop = levels.stopLoss?.[0] || currentPrice * stopLossPercent;
      method = 'Targets AI Diretos';
    } else {
      const targetPercent = 1 + (this.config.RISK?.MAX_PERCENT / 100 * EnhancedTargetCalculator.BUY_TARGET_MULTIPLIER || EnhancedTargetCalculator.BUY_TARGET_FALLBACK);
      const stopPercent = 1 - (this.config.RISK?.BASE_PERCENT / 100 * EnhancedTargetCalculator.BUY_STOP_FALLBACK_MULTIPLIER || EnhancedTargetCalculator.BUY_STOP_FALLBACK_PERCENT);
      target = currentPrice * targetPercent;
      stop = currentPrice * stopPercent;
      method = 'Cálculo Percentual (Fallback)';
    }
    
    return this.validateAndAdjust(target, stop, currentPrice, method);
  }

  private calculateSellTargets(levels: any, currentPrice: number) {
    const nearestSupport = levels.support?.find((s: number) => s < currentPrice);
    const nearestResistance = levels.resistance?.find((r: number) => r > currentPrice);
    
    let target: number, stop: number, method: string;
    
    if (nearestSupport && nearestResistance) {
      target = nearestSupport;
      stop = nearestResistance;
      method = 'Níveis Técnicos AI (Suporte/Resistência)';
    } else if (levels.targets?.[0]) {
      target = levels.targets[0];
      const stopLossPercent = 1 + (this.config.RISK?.BASE_PERCENT / 100 * EnhancedTargetCalculator.SELL_STOP_MULTIPLIER || EnhancedTargetCalculator.SELL_STOP_FALLBACK);
      stop = levels.stopLoss?.[0] || currentPrice * stopLossPercent;
      method = 'Targets AI Diretos';
    } else {
      const targetPercent = 1 - (this.config.RISK?.MAX_PERCENT / 100 * EnhancedTargetCalculator.SELL_TARGET_MULTIPLIER || EnhancedTargetCalculator.SELL_TARGET_FALLBACK);
      const stopPercent = 1 + (this.config.RISK?.BASE_PERCENT / 100 * EnhancedTargetCalculator.SELL_STOP_FALLBACK_MULTIPLIER || EnhancedTargetCalculator.SELL_STOP_FALLBACK_PERCENT);
      target = currentPrice * targetPercent;
      stop = currentPrice * stopPercent;
      method = 'Cálculo Percentual (Fallback)';
    }
    
    return this.validateAndAdjust(target, stop, currentPrice, method);
  }

  private validateAndAdjust(target: number, stop: number, currentPrice: number, method: string) {
    const risk = Math.abs(currentPrice - stop);
    const reward = Math.abs(target - currentPrice);
    let riskRewardRatio = reward / risk;
    
    if (riskRewardRatio < this.config.MIN_RISK_REWARD_RATIO) {
      const adjustedReward = risk * this.config.MIN_RISK_REWARD_RATIO;
      target = currentPrice > stop ? currentPrice + adjustedReward : currentPrice - adjustedReward;
      method += ' (Ajustado para R/R mínimo)';
      riskRewardRatio = this.config.MIN_RISK_REWARD_RATIO;
    }
    
    return { target, stop, riskRewardRatio, method };
  }
}