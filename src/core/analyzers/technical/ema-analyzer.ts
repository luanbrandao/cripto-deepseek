/**
 * 📈 EMA ANALYZER
 * Moved and optimized from src/analyzers/emaAnalyzer.ts
 */

import { TechnicalCalculator } from '../../../shared/calculations';
import { TradingConfigManager } from '../../config/trading-config-manager';
import { PreValidationService } from '../../../shared/services/pre-validation-service';

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

interface EmaConfig {
  fastPeriod: number;
  slowPeriod: number;
  minConfidence?: number;
  ultraConservative?: boolean;
}

class EmaAnalyzer {
  private fastPeriod: number;
  private slowPeriod: number;

  constructor(config?: EmaConfig) {
    const tradingConfig = TradingConfigManager.getConfig();
    this.fastPeriod = config?.fastPeriod || tradingConfig.EMA.FAST_PERIOD;
    this.slowPeriod = config?.slowPeriod || tradingConfig.EMA.SLOW_PERIOD;
  }

  analyze(marketData: MarketData) {
    const prices = marketData.price24h;
    const currentPrice = marketData.currentPrice;
    const config = TradingConfigManager.getConfig();
    const minConfidence = config.MIN_CONFIDENCE;

    if (prices.length < this.slowPeriod) {
      return {
        action: "HOLD",
        confidence: 50,
        reason: "Dados insuficientes para análise EMA",
        suggested_amount: 1
      };
    }

    const emaFast = TechnicalCalculator.calculateEMA(prices, this.fastPeriod);
    const emaSlow = TechnicalCalculator.calculateEMA(prices, this.slowPeriod);
    const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

    let action = "HOLD";
    let confidence = 50;
    let reason = "Mercado estável";

    const emaSeparation = Math.abs(emaFast - emaSlow) / emaSlow;
    const priceAboveEma = (currentPrice - emaFast) / emaFast;

    const minSeparation = config.EMA_ADVANCED.MIN_SEPARATION;
    if (emaSeparation < minSeparation) {
      const lowConfidence = config.VALIDATION_SCORES?.VOLUME_LOW || 40;
      return {
        action: "HOLD",
        confidence: lowConfidence,
        reason: `Separação EMA insuficiente: ${(emaSeparation * 100).toFixed(2)}% < ${(minSeparation * 100).toFixed(1)}% mínimo`,
        suggested_amount: 1
      };
    }

    if (currentPrice > emaFast && emaFast > emaSlow) {
      const strengthScore = Math.min(100, (emaSeparation * 1000) + (priceAboveEma * 500));
      const baseConfidenceStart = (config.VALIDATION_SCORES?.MIN_APPROVAL_SCORE || 60) + 5;
      const strengthMultiplier = (config.VALIDATION_SCORES?.EMA_SEPARATION || 20) / 80;
      const baseConfidence = baseConfidenceStart + (strengthScore * strengthMultiplier);

      const minPriceChange = config.EMA_ADVANCED.MIN_TREND_STRENGTH * 100;
      if (priceChange > minPriceChange) {
        action = "BUY";
        confidence = Math.min(config.HIGH_CONFIDENCE, Math.max(config.MIN_CONFIDENCE, baseConfidence));
        reason = `Tendência de alta confirmada (EMA${this.fastPeriod} > EMA${this.slowPeriod}, separação: ${(emaSeparation * 100).toFixed(2)}%)`;
      }
    }
    else if (currentPrice < emaFast && emaFast < emaSlow) {
      const strengthScore = Math.min(100, (emaSeparation * 1000) + (Math.abs(priceAboveEma) * 500));
      const baseConfidenceStart = (config.VALIDATION_SCORES?.MIN_APPROVAL_SCORE || 60) + 5;
      const strengthMultiplier = (config.VALIDATION_SCORES?.EMA_SEPARATION || 20) / 80;
      const baseConfidence = baseConfidenceStart + (strengthScore * strengthMultiplier);

      const minPriceChange = config.EMA_ADVANCED.MIN_TREND_STRENGTH * 100;
      if (priceChange < -minPriceChange) {
        action = "SELL";
        confidence = Math.min(config.HIGH_CONFIDENCE, Math.max(config.MIN_CONFIDENCE, baseConfidence));
        reason = `Tendência de baixa confirmada (EMA${this.fastPeriod} < EMA${this.slowPeriod}, separação: ${(emaSeparation * 100).toFixed(2)}%)`;
      }
    }

    if (action !== "HOLD" && confidence < minConfidence) {
      action = "HOLD";
      const rejectedConfidence = config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50;
      confidence = rejectedConfidence;
      reason = `Sinal EMA rejeitado - confiança ${confidence.toFixed(0)}% < ${minConfidence}% mínimo`;
    }

    return {
      action,
      confidence,
      reason,
      suggested_amount: confidence >= config.HIGH_CONFIDENCE ? 3 : confidence >= config.MIN_CONFIDENCE ? 2 : 1
    };
  }

  public validateEmaStrengthPublic(prices: number[], currentPrice: number): { isValid: boolean; reason: string; score: number } {
    const validation = PreValidationService.validateEmaSignal(
      { price24h: prices, currentPrice },
      { action: 'BUY', confidence: 75 }
    );
    
    return {
      isValid: validation.isValid,
      reason: validation.reasons.join(', ') || validation.warnings.join(', '),
      score: validation.score
    };
  }
}

export default EmaAnalyzer;