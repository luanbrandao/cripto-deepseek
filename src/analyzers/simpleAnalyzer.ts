interface MarketData {
  price24h: number[];
  currentPrice: number;
}

class SimpleAnalyzer {
  static analyze(marketData: MarketData) {
    console.log('SimpleAnalyzer')
    const prices = marketData.price24h;
    const currentPrice = marketData.currentPrice;

    const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const priceChange = ((currentPrice - prices[0]) / prices[0]) * 100;

    let action = "HOLD";
    let confidence = 50;
    let reason = "Mercado estável";

    if (currentPrice > sma5 && sma5 > sma10 && priceChange > 2) {
      action = "BUY";
      confidence = 75;
      reason = "Tendência de alta confirmada";
    } else if (currentPrice < sma5 && sma5 < sma10 && priceChange < -2) {
      action = "SELL";
      confidence = 70;
      reason = "Tendência de baixa confirmada";
    } else if (priceChange > 5) {
      action = "SELL";
      confidence = 80;
      reason = "Possível correção após alta";
    } else if (priceChange < -5) {
      action = "BUY";
      confidence = 75;
      reason = "Possível recuperação após queda";
    }
    console.log(reason)
    return {
      action,
      confidence,
      reason,
      suggested_amount: confidence > 70 ? 3 : 1
    };
  }
}

export default SimpleAnalyzer;