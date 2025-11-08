/**
 * Elite Analyzer - Sistema de Análise de 4 Camadas
 * Combina EMA + Suporte/Resistência + Padrões de Candle para scoring elite
 */

export class EliteAnalyzer {
  
  /**
   * Camada 1: Análise EMA Avançada (25 pontos máximo)
   */
  analyzeEMAAlignment(klines: any[]): number {
    if (!klines || klines.length < 200) return 0;

    const closes = klines.map(k => parseFloat(k[4]));
    const currentPrice = closes[closes.length - 1];
    
    // Calcular EMAs
    const ema8 = this.calculateEMA(closes, 8);
    const ema21 = this.calculateEMA(closes, 21);
    const ema55 = this.calculateEMA(closes, 55);
    const ema200 = this.calculateEMA(closes, 200);

    let score = 0;

    // Verificar alinhamento bullish (10 pontos)
    if (ema8 > ema21 && ema21 > ema55 && ema55 > ema200) {
      score += 10;
    }

    // Verificar separação entre EMAs (5 pontos)
    const separation1 = Math.abs(ema8 - ema21) / ema21;
    const separation2 = Math.abs(ema21 - ema55) / ema55;
    const separation3 = Math.abs(ema55 - ema200) / ema200;
    
    if (separation1 > 0.005 && separation2 > 0.005 && separation3 > 0.005) {
      score += 5; // Separação adequada (>0.5%)
    }

    // Verificar inclinação das EMAs (5 pontos)
    const ema8Slope = this.calculateSlope(closes.slice(-10), 8);
    const ema21Slope = this.calculateSlope(closes.slice(-21), 21);
    
    if (ema8Slope > 0 && ema21Slope > 0) {
      score += 5; // EMAs inclinadas para cima
    }

    // Verificar momentum (5 pontos)
    if (currentPrice > ema8 && ema8 > ema21) {
      score += 5; // Preço acima das EMAs rápidas
    }

    return Math.min(score, 25);
  }

  /**
   * Camada 2: Análise Suporte/Resistência (25 pontos máximo)
   */
  analyzeSupportResistance(klines: any[], currentPrice: number): number {
    if (!klines || klines.length < 50) return 0;

    const highs = klines.map(k => parseFloat(k[2]));
    const lows = klines.map(k => parseFloat(k[3]));
    const volumes = klines.map(k => parseFloat(k[5]));

    let score = 0;

    // Identificar níveis de suporte/resistência
    const supportLevels = this.findSupportLevels(lows, currentPrice);
    const resistanceLevels = this.findResistanceLevels(highs, currentPrice);

    // Verificar proximidade a suporte forte (10 pontos)
    const nearestSupport = this.findNearestLevel(supportLevels, currentPrice, 'support');
    if (nearestSupport) {
      const distance = Math.abs(currentPrice - nearestSupport.level) / currentPrice;
      if (distance >= 0.002 && distance <= 0.008) { // 0.2% - 0.8%
        score += 10;
      }
    }

    // Verificar força do nível (5 pontos)
    if (nearestSupport && nearestSupport.touches >= 3) {
      score += 5; // Nível testado 3+ vezes
    }

    // Verificar volume de confirmação (5 pontos)
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    if (recentVolume > avgVolume * 1.5) {
      score += 5; // Volume 50% acima da média
    }

    // Verificar níveis psicológicos (5 pontos)
    const psychLevels = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const nearPsychLevel = psychLevels.some(level => {
      const distance = Math.abs(currentPrice - level) / currentPrice;
      return distance < 0.01; // Dentro de 1% de um nível psicológico
    });
    
    if (nearPsychLevel) {
      score += 5;
    }

    return Math.min(score, 25);
  }

  /**
   * Camada 3: Análise Padrões de Candle (25 pontos máximo)
   */
  analyzeCandlestickPatterns(klines: any[]): number {
    if (!klines || klines.length < 10) return 0;

    const recentCandles = klines.slice(-5); // Últimas 5 velas
    let score = 0;

    // Analisar última vela
    const lastCandle = recentCandles[recentCandles.length - 1];
    const open = parseFloat(lastCandle[1]);
    const high = parseFloat(lastCandle[2]);
    const low = parseFloat(lastCandle[3]);
    const close = parseFloat(lastCandle[4]);
    const volume = parseFloat(lastCandle[5]);

    const body = Math.abs(close - open);
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;
    const totalRange = high - low;

    // Padrão Hammer (10 pontos)
    if (this.isHammer(body, upperShadow, lowerShadow, totalRange)) {
      score += 10;
    }

    // Padrão Doji (8 pontos)
    if (this.isDoji(body, totalRange)) {
      score += 8;
    }

    // Padrão Engulfing (12 pontos)
    if (recentCandles.length >= 2) {
      const prevCandle = recentCandles[recentCandles.length - 2];
      if (this.isEngulfing(prevCandle, lastCandle)) {
        score += 12;
      }
    }

    // Volume de confirmação (5 pontos)
    const avgVolume = klines.slice(-20).map(k => parseFloat(k[5]))
      .reduce((a, b) => a + b, 0) / 20;
    
    if (volume > avgVolume * 2) {
      score += 5; // Volume 2x acima da média
    }

    return Math.min(score, 25);
  }

  // Métodos auxiliares
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateSlope(prices: number[], period: number): number {
    if (prices.length < 2) return 0;
    
    const ema1 = this.calculateEMA(prices.slice(0, -1), period);
    const ema2 = this.calculateEMA(prices, period);
    
    return (ema2 - ema1) / ema1;
  }

  private findSupportLevels(lows: number[], currentPrice: number) {
    const levels = [];
    const tolerance = currentPrice * 0.01; // 1% tolerance

    for (let i = 1; i < lows.length - 1; i++) {
      if (lows[i] <= lows[i-1] && lows[i] <= lows[i+1]) {
        // É um mínimo local
        const level = lows[i];
        let touches = 1;

        // Contar quantas vezes foi testado
        for (let j = 0; j < lows.length; j++) {
          if (Math.abs(lows[j] - level) < tolerance) {
            touches++;
          }
        }

        if (touches >= 2) {
          levels.push({ level, touches, type: 'support' });
        }
      }
    }

    return levels.sort((a, b) => b.touches - a.touches);
  }

  private findResistanceLevels(highs: number[], currentPrice: number) {
    const levels = [];
    const tolerance = currentPrice * 0.01; // 1% tolerance

    for (let i = 1; i < highs.length - 1; i++) {
      if (highs[i] >= highs[i-1] && highs[i] >= highs[i+1]) {
        // É um máximo local
        const level = highs[i];
        let touches = 1;

        // Contar quantas vezes foi testado
        for (let j = 0; j < highs.length; j++) {
          if (Math.abs(highs[j] - level) < tolerance) {
            touches++;
          }
        }

        if (touches >= 2) {
          levels.push({ level, touches, type: 'resistance' });
        }
      }
    }

    return levels.sort((a, b) => b.touches - a.touches);
  }

  private findNearestLevel(levels: any[], currentPrice: number, type: string) {
    if (levels.length === 0) return null;

    return levels.reduce((nearest, level) => {
      const distance = Math.abs(currentPrice - level.level);
      const nearestDistance = nearest ? Math.abs(currentPrice - nearest.level) : Infinity;
      
      return distance < nearestDistance ? level : nearest;
    }, null);
  }

  private isHammer(body: number, upperShadow: number, lowerShadow: number, totalRange: number): boolean {
    return (
      body < totalRange * 0.3 &&           // Corpo pequeno
      lowerShadow > body * 2 &&            // Sombra inferior > 2x corpo
      upperShadow < totalRange * 0.1       // Sombra superior pequena
    );
  }

  private isDoji(body: number, totalRange: number): boolean {
    return body < totalRange * 0.05; // Corpo < 5% do range total
  }

  private isEngulfing(prevCandle: any, currentCandle: any): boolean {
    const prevOpen = parseFloat(prevCandle[1]);
    const prevClose = parseFloat(prevCandle[4]);
    const currOpen = parseFloat(currentCandle[1]);
    const currClose = parseFloat(currentCandle[4]);

    const prevBullish = prevClose > prevOpen;
    const currBullish = currClose > currOpen;

    // Engulfing bullish
    if (!prevBullish && currBullish) {
      return currClose > prevOpen && currOpen < prevClose;
    }

    // Engulfing bearish
    if (prevBullish && !currBullish) {
      return currClose < prevOpen && currOpen > prevClose;
    }

    return false;
  }
}