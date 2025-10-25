interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MarketData {
  candles: CandleData[];
  currentPrice: number;
}

class Analyzer123 {
  static analyze(marketData: MarketData) {
    console.log('123Analyzer');
    const candles = marketData.candles;
    const currentPrice = marketData.currentPrice;

    if (candles.length < 10) {
      return {
        action: "HOLD",
        confidence: 50,
        reason: "Dados insuficientes para análise",
        suggested_amount: 1
      };
    }

    // Pegar os últimos 3 candles para o padrão 123
    const candle1 = candles[candles.length - 3];
    const candle2 = candles[candles.length - 2];
    const candle3 = candles[candles.length - 1];

    // Verificar tendência (últimos 7 candles)
    const trendCandles = candles.slice(-7, -3);
    const isUptrend = this.isUptrend(trendCandles);
    const isDowntrend = this.isDowntrend(trendCandles);

    // Setup 123 de compra
    const buySetup = this.identifyBuySetup(candle1, candle2, candle3, currentPrice, isUptrend);
    if (buySetup.valid) {
      return {
        action: "BUY",
        confidence: buySetup.confidence,
        reason: buySetup.reason,
        suggested_amount: buySetup.confidence > 70 ? 3 : 2,
        stopLoss: candle2.low
      };
    }

    // Setup 123 de venda
    const sellSetup = this.identifySellSetup(candle1, candle2, candle3, currentPrice, isDowntrend);
    if (sellSetup.valid) {
      return {
        action: "SELL",
        confidence: sellSetup.confidence,
        reason: sellSetup.reason,
        suggested_amount: sellSetup.confidence > 70 ? 3 : 2,
        stopLoss: candle2.high
      };
    }

    return {
      action: "HOLD",
      confidence: 50,
      reason: "Padrão 123 não identificado",
      suggested_amount: 1
    };
  }

  private static identifyBuySetup(candle1: CandleData, candle2: CandleData, candle3: CandleData, currentPrice: number, isUptrend: boolean) {
    // Candle 2 deve ter a mínima mais baixa dos três
    const candle2IsLowest = candle2.low < candle1.low && candle2.low < candle3.low;
    
    // Candle 3 deve ser de alta e não ter mínima menor que candle 2
    const candle3IsBullish = candle3.close > candle3.open;
    const candle3ValidLow = candle3.low >= candle2.low;
    
    // Rompimento da máxima do candle 3
    const breakoutAboveCandle3 = currentPrice > candle3.high;

    if (candle2IsLowest && candle3IsBullish && candle3ValidLow && breakoutAboveCandle3) {
      let confidence = 65;
      let reason = "Setup 123 de compra identificado";
      
      if (isUptrend) {
        confidence = 80;
        reason = "Setup 123 de compra em tendência de alta";
      }
      
      return { valid: true, confidence, reason };
    }

    return { valid: false, confidence: 0, reason: "" };
  }

  private static identifySellSetup(candle1: CandleData, candle2: CandleData, candle3: CandleData, currentPrice: number, isDowntrend: boolean) {
    // Candle 2 deve ter a máxima mais alta dos três
    const candle2IsHighest = candle2.high > candle1.high && candle2.high > candle3.high;
    
    // Candle 3 deve ser de baixa e não ter máxima maior que candle 2
    const candle3IsBearish = candle3.close < candle3.open;
    const candle3ValidHigh = candle3.high <= candle2.high;
    
    // Rompimento da mínima do candle 3
    const breakoutBelowCandle3 = currentPrice < candle3.low;

    if (candle2IsHighest && candle3IsBearish && candle3ValidHigh && breakoutBelowCandle3) {
      let confidence = 65;
      let reason = "Setup 123 de venda identificado";
      
      if (isDowntrend) {
        confidence = 80;
        reason = "Setup 123 de venda em tendência de baixa";
      }
      
      return { valid: true, confidence, reason };
    }

    return { valid: false, confidence: 0, reason: "" };
  }

  private static isUptrend(candles: CandleData[]): boolean {
    const closes = candles.map(c => c.close);
    const sma = closes.reduce((a, b) => a + b) / closes.length;
    return closes[closes.length - 1] > sma && closes[0] < closes[closes.length - 1];
  }

  private static isDowntrend(candles: CandleData[]): boolean {
    const closes = candles.map(c => c.close);
    const sma = closes.reduce((a, b) => a + b) / closes.length;
    return closes[closes.length - 1] < sma && closes[0] > closes[closes.length - 1];
  }
}

export default Analyzer123;