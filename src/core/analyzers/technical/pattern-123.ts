/**
 * 🔢 PATTERN 123 ANALYZER
 * Moved from src/analyzers/123Analyzer.ts
 */

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketData {
  candles: CandleData[];
  currentPrice: number;
}

class Analyzer123 {
  static analyze(marketData: MarketData) {
    const { candles, currentPrice } = marketData;
    
    if (candles.length < 3) {
      return {
        action: "HOLD",
        confidence: 50,
        reason: "Dados insuficientes para análise do padrão 123",
        suggested_amount: 1
      };
    }

    // Implementação do padrão 123
    const lastThree = candles.slice(-3);
    const [first, second, third] = lastThree;

    // Padrão 123 de alta: baixa -> alta -> baixa (mas não tão baixa quanto a primeira)
    const isBullish123 = 
      first.low < second.low && 
      second.high > first.high && 
      third.low > first.low && 
      third.high < second.high &&
      currentPrice > second.high;

    // Padrão 123 de baixa: alta -> baixa -> alta (mas não tão alta quanto a primeira)
    const isBearish123 = 
      first.high > second.high && 
      second.low < first.low && 
      third.high < first.high && 
      third.low > second.low &&
      currentPrice < second.low;

    if (isBullish123) {
      const strength = Math.min(95, 70 + (currentPrice - second.high) / second.high * 1000);
      return {
        action: "BUY",
        confidence: Math.round(strength),
        reason: "Padrão 123 de alta identificado - breakout confirmado",
        suggested_amount: strength > 85 ? 3 : strength > 75 ? 2 : 1
      };
    }

    if (isBearish123) {
      const strength = Math.min(95, 70 + (second.low - currentPrice) / second.low * 1000);
      return {
        action: "SELL",
        confidence: Math.round(strength),
        reason: "Padrão 123 de baixa identificado - breakdown confirmado",
        suggested_amount: strength > 85 ? 3 : strength > 75 ? 2 : 1
      };
    }

    return {
      action: "HOLD",
      confidence: 50,
      reason: "Padrão 123 não identificado ou não confirmado",
      suggested_amount: 1
    };
  }
}

export default Analyzer123;