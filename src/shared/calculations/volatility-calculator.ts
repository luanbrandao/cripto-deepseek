/**
 * 📊 VOLATILITY CALCULATOR
 * Centralized volatility and risk calculations
 */

export class VolatilityCalculator {
  /**
   * Calculate standard volatility (standard deviation of returns)
   */
  static calculateVolatility(prices: number[]): {
    volatility: number;
    annualizedVolatility: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    if (prices.length < 2) {
      return { volatility: 0, annualizedVolatility: 0, riskLevel: 'low' };
    }

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const returnRate = (prices[i] - prices[i - 1]) / prices[i - 1];
      if (!isNaN(returnRate) && isFinite(returnRate)) {
        returns.push(returnRate);
      }
    }

    if (returns.length === 0) {
      return { volatility: 0, annualizedVolatility: 0, riskLevel: 'low' };
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    // Annualized volatility (assuming daily data)
    const annualizedVolatility = volatility * Math.sqrt(365);

    let riskLevel: 'low' | 'medium' | 'high';
    if (volatility < 1) riskLevel = 'low';
    else if (volatility < 3) riskLevel = 'medium';
    else riskLevel = 'high';

    return { volatility, annualizedVolatility, riskLevel };
  }

  /**
   * Calculate Average True Range (ATR)
   */
  static calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
    if (highs.length !== lows.length || lows.length !== closes.length || highs.length < period + 1) {
      return [];
    }

    const trueRanges: number[] = [];

    // Calculate True Range for each period
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      const trueRange = Math.max(tr1, tr2, tr3);
      trueRanges.push(trueRange);
    }

    // Calculate ATR using simple moving average
    const atr: number[] = [];
    for (let i = period - 1; i < trueRanges.length; i++) {
      const atrValue = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      atr.push(atrValue);
    }

    return atr;
  }

  /**
   * Calculate Bollinger Bands volatility
   */
  static calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
    upperBand: number[];
    lowerBand: number[];
    middleBand: number[];
    bandwidth: number[];
    percentB: number[];
  } {
    if (prices.length < period) {
      return { upperBand: [], lowerBand: [], middleBand: [], bandwidth: [], percentB: [] };
    }

    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    const middleBand: number[] = [];
    const bandwidth: number[] = [];
    const percentB: number[] = [];

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / period;
      
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      const upper = sma + (multiplier * stdDev);
      const lower = sma - (multiplier * stdDev);
      const bw = (upper - lower) / sma * 100;
      const pb = (prices[i] - lower) / (upper - lower) * 100;

      upperBand.push(upper);
      lowerBand.push(lower);
      middleBand.push(sma);
      bandwidth.push(bw);
      percentB.push(pb);
    }

    return { upperBand, lowerBand, middleBand, bandwidth, percentB };
  }

  /**
   * Calculate volatility from klines data
   */
  static calculateFromKlines(klines: any[]): {
    volatility: number;
    riskLevel: 'low' | 'medium' | 'high';
    avgVolatility: number;
  } {
    if (klines.length < 2) {
      return { volatility: 1.0, riskLevel: 'low', avgVolatility: 1.0 };
    }

    const prices = klines.map(k => parseFloat(k[4] || k.close || k));
    const returns = [];

    for (let i = 1; i < prices.length; i++) {
      const returnPct = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
      returns.push(Math.abs(returnPct));
    }

    const avgVolatility = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.min(avgVolatility, 5.0); // Cap at 5%

    let riskLevel: 'low' | 'medium' | 'high';
    if (volatility < 1) riskLevel = 'low';
    else if (volatility < 3) riskLevel = 'medium';
    else riskLevel = 'high';

    return { volatility, riskLevel, avgVolatility };
  }

  /**
   * Calculate Garman-Klass volatility (uses OHLC data)
   */
  static calculateGarmanKlass(ohlcData: Array<{open: number, high: number, low: number, close: number}>): number {
    if (ohlcData.length < 2) return 0;

    let sum = 0;
    for (const candle of ohlcData) {
      const { open, high, low, close } = candle;
      
      // Garman-Klass formula
      const term1 = 0.5 * Math.pow(Math.log(high / low), 2);
      const term2 = (2 * Math.log(2) - 1) * Math.pow(Math.log(close / open), 2);
      
      sum += term1 - term2;
    }

    const variance = sum / ohlcData.length;
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  /**
   * Calculate volatility cone (historical volatility ranges)
   */
  static calculateVolatilityCone(prices: number[], periods: number[] = [5, 10, 20, 50]): {
    [key: string]: {
      min: number;
      max: number;
      current: number;
      percentile: number;
    };
  } {
    const result: any = {};

    for (const period of periods) {
      if (prices.length < period * 2) continue;

      const volatilities: number[] = [];
      
      // Calculate rolling volatilities
      for (let i = period; i <= prices.length; i++) {
        const slice = prices.slice(i - period, i);
        const vol = this.calculateVolatility(slice).volatility;
        volatilities.push(vol);
      }

      if (volatilities.length === 0) continue;

      const sortedVols = [...volatilities].sort((a, b) => a - b);
      const current = volatilities[volatilities.length - 1];
      const min = sortedVols[0];
      const max = sortedVols[sortedVols.length - 1];
      
      // Calculate percentile
      const rank = sortedVols.findIndex(vol => vol >= current);
      const percentile = (rank / sortedVols.length) * 100;

      result[`period${period}`] = { min, max, current, percentile };
    }

    return result;
  }
}