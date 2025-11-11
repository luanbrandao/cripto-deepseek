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
}

class EmaAnalyzer {
  private fastPeriod: number;
  private slowPeriod: number;

  constructor(config: EmaConfig = { fastPeriod: 9, slowPeriod: 21 }) {
    this.fastPeriod = config.fastPeriod;
    this.slowPeriod = config.slowPeriod;
  }

  analyze(marketData: MarketData) {
    console.log(`EmaAnalyzer (EMA${this.fastPeriod}/EMA${this.slowPeriod})`);
    const prices = marketData.price24h;
    const currentPrice = marketData.currentPrice;

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

    // Usar configurações dinâmicas baseadas no contexto
    const minConfidence = TradingConfigManager.getConfig().MIN_CONFIDENCE || 70;
    const emaConfig = BOT_SPECIFIC_CONFIG?.EMA_BOT;

    // Verificar se a confiança atenderá o mínimo antes de gerar sinal
    if (currentPrice > emaFast && emaFast > emaSlow && priceChange > 2) {
      const potentialConfidence = minConfidence;
      if (potentialConfidence >= minConfidence) {
        action = "BUY";
        confidence = potentialConfidence;
        reason = `Tendência de alta confirmada (EMA${this.fastPeriod} > EMA${this.slowPeriod})`;
      }
    } else if (currentPrice < emaFast && emaFast < emaSlow && priceChange < -2) {
      const potentialConfidence = Math.max(minConfidence - 5, minConfidence); // Redução mínima
      if (potentialConfidence >= minConfidence) {
        action = "SELL";
        confidence = potentialConfidence;
        reason = `Tendência de baixa confirmada (EMA${this.fastPeriod} < EMA${this.slowPeriod})`;
      }
    } else if (priceChange > 5) {
      // Correção técnica - só se atender confiança mínima
      const potentialConfidence = Math.max(minConfidence - 2, minConfidence);
      if (potentialConfidence >= minConfidence) {
        action = "SELL";
        confidence = potentialConfidence;
        reason = "Possível correção após alta";
      }
    } else if (priceChange < -5) {
      // Recuperação - só se atender confiança mínima  
      const potentialConfidence = minConfidence; // Sem redução para recuperação
      if (potentialConfidence >= minConfidence) {
        action = "BUY";
        confidence = potentialConfidence;
        reason = "Possível recuperação após queda";
      }
    }
    
    // Se nenhum sinal atingiu a confiança mínima, manter HOLD
    if (action !== "HOLD" && confidence < minConfidence) {
      action = "HOLD";
      confidence = 50;
      reason = `Sinal EMA rejeitado - confiança ${confidence}% < ${minConfidence}% mínimo`;
    }

    console.log(reason);
    
    // Log adicional para debug
    if (action !== "HOLD") {
      console.log(`✅ EMA Signal: ${action} com ${confidence}% confiança (mínimo: ${minConfidence}%)`);
    } else {
      console.log(`⏸️ EMA Hold: ${reason}`);
    }
    
    return {
      action,
      confidence,
      reason,
      suggested_amount: confidence >= minConfidence ? 3 : 1
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

    // Verificar separação mínima usando BOT_SPECIFIC_CONFIG
    const minSeparation = TradingConfigManager.getConfig().EMA_ADVANCED?.MIN_SEPARATION || 0.005;
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