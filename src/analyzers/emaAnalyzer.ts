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

    const emaFast = this.calculateEMA(prices, this.fastPeriod);
    const emaSlow = this.calculateEMA(prices, this.slowPeriod);
    const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

    let action = "HOLD";
    let confidence = 50;
    let reason = "Mercado estável";

    if (currentPrice > emaFast && emaFast > emaSlow && priceChange > 2) {
      action = "BUY";
      confidence = 75;
      reason = `Tendência de alta confirmada (EMA${this.fastPeriod} > EMA${this.slowPeriod})`;
    } else if (currentPrice < emaFast && emaFast < emaSlow && priceChange < -2) {
      action = "SELL";
      confidence = 70;
      reason = `Tendência de baixa confirmada (EMA${this.fastPeriod} < EMA${this.slowPeriod})`;
    } else if (priceChange > 5) {
      action = "SELL";
      confidence = 80;
      reason = "Possível correção após alta";
    } else if (priceChange < -5) {
      action = "BUY";
      confidence = 75;
      reason = "Possível recuperação após queda";
    }

    console.log(reason);
    return {
      action,
      confidence,
      reason,
      suggested_amount: confidence > 70 ? 3 : 1
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }
}

export default EmaAnalyzer;