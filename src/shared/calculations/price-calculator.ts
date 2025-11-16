/**
 * 💰 PRICE CALCULATOR
 * Centralized price calculation functions
 */

export interface PriceTargets {
  targetPrice: number;
  stopPrice: number;
  riskPercent: number;
}

export interface EnhancedPriceTargets extends PriceTargets {
  method: string;
  riskRewardRatio: number;
  levels?: any;
  volatility?: number;
  originalTarget?: number;
  originalStop?: number;
}

export class PriceCalculator {
  // Algorithm constants
  private static readonly VOLATILITY_ADJUSTMENT_FACTOR = 0.5;
  private static readonly MIN_RISK_PERCENT = 0.005; // 0.5%
  private static readonly MAX_RISK_PERCENT = 0.015; // 1.5%
  private static readonly VOLATILITY_DIVISOR = 100;
  private static readonly RISK_REWARD_RATIO = 2.0;
  private static readonly PRICE_BUFFER = 0.001;
  private static readonly LEVEL_TARGET_TOLERANCE = 0.002;
  private static readonly PROTECTION_BUFFER = 0.002;

  /**
   * Calculate basic target and stop prices for an action
   */
  static calculatePricesForAction(
    price: number,
    riskPercent: number,
    rewardPercent: number,
    action: 'BUY' | 'SELL'
  ): { targetPrice: number; stopPrice: number } {
    if (action === 'BUY') {
      return {
        targetPrice: price * (1 + rewardPercent),
        stopPrice: price * (1 - riskPercent)
      };
    }

    return {
      targetPrice: price * (1 - rewardPercent),
      stopPrice: price * (1 + riskPercent)
    };
  }

  /**
   * Calculate target and stop prices with volatility adjustment
   */
  static calculateWithVolatility(
    price: number,
    riskPercent: number,
    rewardPercent: number,
    action: 'BUY' | 'SELL',
    volatility: number
  ): EnhancedPriceTargets {
    const adjustedRisk = riskPercent * (1 + volatility / (1 / this.VOLATILITY_ADJUSTMENT_FACTOR));
    const adjustedReward = rewardPercent * (1 + volatility / (1 / this.VOLATILITY_ADJUSTMENT_FACTOR));

    const { targetPrice, stopPrice } = this.calculatePricesForAction(price, adjustedRisk, adjustedReward, action);

    return {
      targetPrice,
      stopPrice,
      riskPercent: adjustedRisk * 100,
      method: 'Volatility Adjusted',
      riskRewardRatio: adjustedReward / adjustedRisk,
      volatility
    };
  }

  /**
   * Calculate prices with support/resistance levels
   */
  static calculateWithLevels(
    price: number,
    riskPercent: number,
    rewardPercent: number,
    action: 'BUY' | 'SELL',
    levels: { support: number; resistance: number },
    volatility?: number
  ): EnhancedPriceTargets {
    const baseRisk = Math.max(this.MIN_RISK_PERCENT, Math.min(this.MAX_RISK_PERCENT, (volatility || 1) / this.VOLATILITY_DIVISOR));
    const adjustedReward = baseRisk * this.RISK_REWARD_RATIO;

    const { targetPrice, stopPrice } = this.calculatePricesForAction(price, baseRisk, adjustedReward, action);

    // Adjust to nearest levels
    const adjustedTarget = PriceCalculator.adjustTargetToNearestLevel(
      targetPrice,
      action === 'BUY' ? levels.resistance : levels.support,
      price,
      action
    );

    const adjustedStop = PriceCalculator.adjustStopToProtectionLevel(
      stopPrice,
      action === 'BUY' ? levels.support : levels.resistance,
      price,
      action
    );

    return {
      targetPrice: adjustedTarget,
      stopPrice: adjustedStop,
      riskPercent: baseRisk * 100,
      method: 'Support/Resistance Levels',
      riskRewardRatio: this.RISK_REWARD_RATIO,
      levels,
      volatility,
      originalTarget: targetPrice,
      originalStop: stopPrice
    };
  }

  /**
   * Enhanced target calculation with multiple methods
   */
  static calculateEnhancedTargets(
    price: number,
    confidence: number,
    action: 'BUY' | 'SELL',
    technicalLevels?: any,
    config?: any
  ): EnhancedPriceTargets {
    if (technicalLevels?.resistance && technicalLevels?.support) {
      return this.calculateWithTechnicalLevels(price, action, technicalLevels);
    }

    if (technicalLevels?.targets?.[0]) {
      return this.calculateWithAITargets(price, action, technicalLevels, config);
    }

    return this.calculateWithPercentages(price, action, config);
  }

  private static calculateWithTechnicalLevels(
    price: number,
    action: 'BUY' | 'SELL',
    levels: any
  ): EnhancedPriceTargets {
    const nearestResistance = levels.resistance?.find((r: number) => r > price);
    const nearestSupport = levels.support?.find((s: number) => s < price);

    let target: number, stop: number;

    if (action === 'BUY') {
      target = nearestResistance || price * 1.03;
      stop = nearestSupport || price * 0.98;
    } else {
      target = nearestSupport || price * 0.97;
      stop = nearestResistance || price * 1.02;
    }

    const risk = Math.abs(price - stop);
    const reward = Math.abs(target - price);
    const riskRewardRatio = reward / risk;

    return {
      targetPrice: target,
      stopPrice: stop,
      riskPercent: (risk / price) * 100,
      method: 'Technical Levels (Resistance/Support)',
      riskRewardRatio,
      levels
    };
  }

  private static calculateWithAITargets(
    price: number,
    action: 'BUY' | 'SELL',
    levels: any,
    config?: any
  ): EnhancedPriceTargets {
    const target = levels.targets[0];
    const baseRiskPercent = config?.RISK?.BASE_PERCENT / 100 || 0.02;
    
    let stop: number;
    if (action === 'BUY') {
      stop = levels.stopLoss?.[0] || price * (1 - baseRiskPercent);
    } else {
      stop = levels.stopLoss?.[0] || price * (1 + baseRiskPercent);
    }

    const risk = Math.abs(price - stop);
    const reward = Math.abs(target - price);
    const riskRewardRatio = reward / risk;

    return {
      targetPrice: target,
      stopPrice: stop,
      riskPercent: (risk / price) * 100,
      method: 'AI Direct Targets',
      riskRewardRatio
    };
  }

  private static calculateWithPercentages(
    price: number,
    action: 'BUY' | 'SELL',
    config?: any
  ): EnhancedPriceTargets {
    const targetPercent = config?.RISK?.MAX_PERCENT / 100 || 0.03;
    const stopPercent = config?.RISK?.BASE_PERCENT / 100 || 0.015;

    let target: number, stop: number;

    if (action === 'BUY') {
      target = price * (1 + targetPercent);
      stop = price * (1 - stopPercent);
    } else {
      target = price * (1 - targetPercent);
      stop = price * (1 + stopPercent);
    }

    const risk = Math.abs(price - stop);
    const reward = Math.abs(target - price);
    const riskRewardRatio = reward / risk;

    return {
      targetPrice: target,
      stopPrice: stop,
      riskPercent: (risk / price) * 100,
      method: 'Percentage Calculation (Fallback)',
      riskRewardRatio
    };
  }

  static adjustTargetToNearestLevel(
    calculatedTarget: number,
    nearestLevel: number,
    currentPrice: number,
    action: 'BUY' | 'SELL'
  ): number {
    const distanceToLevel = Math.abs(nearestLevel - currentPrice) / currentPrice;
    const distanceToTarget = Math.abs(calculatedTarget - currentPrice) / currentPrice;

    if (Math.abs(distanceToLevel - distanceToTarget) < this.LEVEL_TARGET_TOLERANCE) {
      const buffer = currentPrice * this.PRICE_BUFFER;
      return action === 'BUY' ? nearestLevel - buffer : nearestLevel + buffer;
    }

    return calculatedTarget;
  }

  static adjustStopToProtectionLevel(
    calculatedStop: number,
    protectionLevel: number,
    currentPrice: number,
    action: 'BUY' | 'SELL'
  ): number {
    const buffer = currentPrice * this.PROTECTION_BUFFER;

    if (action === 'BUY') {
      const protectedStop = protectionLevel - buffer;
      return Math.min(calculatedStop, protectedStop);
    }

    const protectedStop = protectionLevel + buffer;
    return Math.max(calculatedStop, protectedStop);
  }
}