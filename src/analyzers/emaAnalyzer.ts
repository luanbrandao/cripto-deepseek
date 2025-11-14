import { calculateEMA } from '../bots/utils/analysis/ema-calculator';
import { UNIFIED_TRADING_CONFIG, BOT_SPECIFIC_CONFIG } from '../shared/config/unified-trading-config';
import { TradingConfigManager } from '../shared/config/trading-config-manager';


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
        confidence: 50,
        reason: "Dados insuficientes para análise EMA",
        suggested_amount: 1
      };
    }

    const emaFast = calculateEMA(prices, this.fastPeriod);
    const emaSlow = calculateEMA(prices, this.slowPeriod);
    const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

    let action = "HOLD";
    let confidence = 50;
    let reason = "Mercado estável";

    // Calcular confiança baseada na força do sinal EMA
    const emaSeparation = Math.abs(emaFast - emaSlow) / emaSlow;
    const priceAboveEma = (currentPrice - emaFast) / emaFast;

    // VALIDAÇÃO ULTRA-CONSERVADORA: Separação mínima EMA
    const minSeparation = config.EMA_ADVANCED.MIN_SEPARATION; // 0.8% no ultra-conservador
    if (emaSeparation < minSeparation) {
      return {
        action: "HOLD",
        confidence: 40,
        reason: `Separação EMA insuficiente: ${(emaSeparation * 100).toFixed(2)}% < ${(minSeparation * 100).toFixed(1)}% mínimo`,
        suggested_amount: 1
      };
    }

    // Sinal de compra: Preço > EMA Rápida > EMA Lenta
    if (currentPrice > emaFast && emaFast > emaSlow) {
      const strengthScore = Math.min(100, (emaSeparation * 1000) + (priceAboveEma * 500));
      const baseConfidence = 65 + (strengthScore * 0.25); // Base mais alta para ultra-conservador

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
      const baseConfidence = 65 + (strengthScore * 0.25);

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
      confidence = 50;
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
      suggested_amount: confidence >= config.HIGH_CONFIDENCE ? 3 : confidence >= config.MIN_CONFIDENCE ? 2 : 1
    };
  }

  // Método público para validação EMA avançada
  public validateEmaStrengthPublic(prices: number[]): { isValid: boolean; reason: string; score: number } {
    return this.validateEmaStrength(prices);
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private validateEmaStrength(prices: number[]): { isValid: boolean; reason: string; score: number } {
    if (prices.length < 26) {
      return { isValid: false, reason: 'Dados insuficientes', score: 0 };
    }

    // Calcular EMAs
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
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

}

export default EmaAnalyzer;