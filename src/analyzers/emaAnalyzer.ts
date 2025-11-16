import { calculateEMA } from '../bots/utils/analysis/ema-calculator';
import { UNIFIED_TRADING_CONFIG, BOT_SPECIFIC_CONFIG } from '../shared/config/unified-trading-config';
import { TradingConfigManager } from '../shared/config/trading-config-manager';
import { PreValidationService } from '../shared/services/pre-validation-service';


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
    console.log(`EmaAnalyzer (EMA${this.fastPeriod}/EMA${this.slowPeriod})`);
    const prices = marketData.price24h;
    const currentPrice = marketData.currentPrice;
    const config = TradingConfigManager.getConfig();
    const minConfidence = config.MIN_CONFIDENCE; // 75% no modo ultra-conservador

    if (prices.length < this.slowPeriod) {
      return {
        action: "HOLD",
        confidence: this.getDefaultConfidence(),
        reason: "Dados insuficientes para análise EMA",
        suggested_amount: this.getDefaultAmount()
      };
    }

    const emaFast = calculateEMA(prices, this.fastPeriod);
    const emaSlow = calculateEMA(prices, this.slowPeriod);
    const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

    let action = "HOLD";
    let confidence = this.getDefaultConfidence();
    let reason = "Mercado estável";

    // Calcular confiança baseada na força do sinal EMA
    const emaSeparation = Math.abs(emaFast - emaSlow) / emaSlow;
    const priceAboveEma = (currentPrice - emaFast) / emaFast;

    // VALIDAÇÃO ULTRA-CONSERVADORA: Separação mínima EMA
    const minSeparation = config.EMA_ADVANCED.MIN_SEPARATION; // 0.8% no ultra-conservador
    if (emaSeparation < minSeparation) {
      return {
        action: "HOLD",
        confidence: this.getLowConfidence(),
        reason: `Separação EMA insuficiente: ${(emaSeparation * 100).toFixed(2)}% < ${(minSeparation * 100).toFixed(1)}% mínimo`,
        suggested_amount: this.getDefaultAmount()
      };
    }

    // Sinal de compra: Preço > EMA Rápida > EMA Lenta
    if (currentPrice > emaFast && emaFast > emaSlow) {
      const strengthScore = Math.min(100, (emaSeparation * 1000) + (priceAboveEma * 500));
      const baseConfidence = this.getBaseConfidence() + (strengthScore * this.getStrengthMultiplier());

      // VALIDAÇÃO: Mudança de preço mínima baseada na configuração
      const minPriceChange = config.EMA_ADVANCED.MIN_TREND_STRENGTH * 100;
      if (priceChange > minPriceChange) {
        action = "BUY";
        confidence = Math.min(config.HIGH_CONFIDENCE, Math.max(config.MIN_CONFIDENCE, baseConfidence));
        reason = `Tendência de alta confirmada (EMA${this.fastPeriod} > EMA${this.slowPeriod}, separação: ${(emaSeparation * 100).toFixed(2)}%)`;
      }
    }
    // Sinal de venda: Preço < EMA Rápida < EMA Lenta  
    else if (currentPrice < emaFast && emaFast < emaSlow) {
      const strengthScore = Math.min(100, (emaSeparation * 1000) + (Math.abs(priceAboveEma) * 500));
      const baseConfidence = this.getBaseConfidence() + (strengthScore * this.getStrengthMultiplier());

      // VALIDAÇÃO: Mudança de preço mínima baseada na configuração
      const minPriceChange = config.EMA_ADVANCED.MIN_TREND_STRENGTH * 100;
      if (priceChange < -minPriceChange) {
        action = "SELL";
        confidence = Math.min(config.HIGH_CONFIDENCE, Math.max(config.MIN_CONFIDENCE, baseConfidence));
        reason = `Tendência de baixa confirmada (EMA${this.fastPeriod} < EMA${this.slowPeriod}, separação: ${(emaSeparation * 100).toFixed(2)}%)`;
      }
    }

    // VALIDAÇÃO FINAL: Confiança mínima baseada na configuração
    if (action !== "HOLD" && confidence < minConfidence) {
      action = "HOLD";
      confidence = this.getDefaultConfidence();
      reason = `Sinal EMA rejeitado - confiança ${confidence.toFixed(0)}% < ${minConfidence}% mínimo`;
    }

    console.log(reason);

    // Log adicional para debug
    if (action !== "HOLD") {
      console.log(`✅ EMA Signal APROVADO: ${action} com ${confidence.toFixed(0)}% confiança (≥${minConfidence}% mínimo)`);
    } else {
      console.log(`⏸️ EMA Hold: ${reason}`);
    }

    return {
      action,
      confidence,
      reason,
      suggested_amount: confidence >= config.HIGH_CONFIDENCE ? config.ALGORITHM.HIGH_AMOUNT_MULTIPLIER : confidence >= config.MIN_CONFIDENCE ? config.ALGORITHM.MEDIUM_AMOUNT_MULTIPLIER : config.ALGORITHM.DEFAULT_AMOUNT
    };
  }

  // Método público para validação EMA avançada usando serviço centralizado
  public validateEmaStrengthPublic(prices: number[], currentPrice: number): { isValid: boolean; reason: string; score: number } {
    const validation = PreValidationService.validateEmaSignal(
      { price24h: prices, currentPrice },
      { action: 'BUY', confidence: TradingConfigManager.getConfig().MIN_CONFIDENCE }
    );
    
    return {
      isValid: validation.isValid,
      reason: validation.reasons.join(', ') || validation.warnings.join(', '),
      score: validation.score
    };
  }



  private validateEmaStrength(prices: number[]): { isValid: boolean; reason: string; score: number } {
    if (prices.length < TradingConfigManager.getConfig().EMA.SLOW_PERIOD) {
      return { isValid: false, reason: 'Dados insuficientes', score: 0 };
    }

    // Calcular EMAs
    const ema12 = calculateEMA(prices, TradingConfigManager.getConfig().EMA.FAST_PERIOD);
    const ema26 = calculateEMA(prices, TradingConfigManager.getConfig().EMA.SLOW_PERIOD);
    const currentPrice = prices[prices.length - 1];

    // Verificar separação mínima usando configuração
    const minSeparation = TradingConfigManager.getConfig().EMA_ADVANCED.MIN_SEPARATION;
    const separation = (ema12 - ema26) / ema26;

    if (separation < minSeparation) {
      return {
        isValid: false,
        reason: `Separação EMA ${(separation * 100).toFixed(2)}% < ${(minSeparation * 100).toFixed(1)}%`,
        score: separation * 1000
      };
    }

    // Verificar se preço está acima das EMAs
    if (currentPrice < ema12 || ema12 < ema26) {
      return {
        isValid: false,
        reason: 'Preço não está acima das EMAs ou EMAs não alinhadas',
        score: 0
      };
    }

    const score = Math.min(100, separation * 1000);
    return {
      isValid: true,
      reason: `Separação EMA ${(separation * 100).toFixed(2)}% OK`,
      score
    };
  }

  // Algorithm constants from configuration
  private getDefaultConfidence(): number {
    return TradingConfigManager.getConfig().ALGORITHM.DEFAULT_CONFIDENCE;
  }

  private getDefaultAmount(): number {
    return TradingConfigManager.getConfig().ALGORITHM.DEFAULT_AMOUNT;
  }

  private getLowConfidence(): number {
    return TradingConfigManager.getConfig().ALGORITHM.LOW_CONFIDENCE;
  }

  private getBaseConfidence(): number {
    return TradingConfigManager.getConfig().ALGORITHM.BASE_CONFIDENCE;
  }

  private getStrengthMultiplier(): number {
    return TradingConfigManager.getConfig().ALGORITHM.STRENGTH_MULTIPLIER;
  }
}

export default EmaAnalyzer;