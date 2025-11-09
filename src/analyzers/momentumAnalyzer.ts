interface MomentumAnalysis {
  isValid: boolean;
  reason: string;
  score: number;
  momentum: number;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export class MomentumAnalyzer {
  
  /**
   * 🚀 VALIDAÇÃO DE MOMENTUM
   */
  public validateMomentum(prices: number[]): MomentumAnalysis {
    if (prices.length < 5) {
      return { 
        isValid: false, 
        reason: 'Dados insuficientes para momentum', 
        score: 0,
        momentum: 0,
        direction: 'neutral'
      };
    }

    // Calcular momentum dos últimos 5 períodos
    const recent = prices.slice(-5);
    const momentum = (recent[4] - recent[0]) / recent[0];
    
    let direction: 'bullish' | 'bearish' | 'neutral';
    if (momentum > 0.005) direction = 'bullish';
    else if (momentum < -0.005) direction = 'bearish';
    else direction = 'neutral';
    
    // Exigir momentum positivo mínimo de 0.5%
    if (momentum < 0.005) {
      return { 
        isValid: false, 
        reason: `Momentum ${(momentum * 100).toFixed(2)}% < 0.5%`, 
        score: momentum * 1000,
        momentum,
        direction
      };
    }

    const score = Math.min(100, momentum * 1000);
    return { 
      isValid: true, 
      reason: `Momentum ${(momentum * 100).toFixed(2)}% OK`, 
      score,
      momentum,
      direction
    };
  }

  /**
   * 📈 ANÁLISE DE MOMENTUM MULTI-PERÍODO
   */
  public analyzeMomentumMultiPeriod(prices: number[]): {
    short: MomentumAnalysis;    // 3 períodos
    medium: MomentumAnalysis;   // 5 períodos
    long: MomentumAnalysis;     // 10 períodos
    consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  } {
    const short = this.calculateMomentumForPeriod(prices, 3);
    const medium = this.calculateMomentumForPeriod(prices, 5);
    const long = this.calculateMomentumForPeriod(prices, 10);
    
    // Determinar consenso
    const directions = [short.direction, medium.direction, long.direction];
    const bullishCount = directions.filter(d => d === 'bullish').length;
    const bearishCount = directions.filter(d => d === 'bearish').length;
    
    let consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral';
    if (bullishCount >= 2) consensus = 'bullish';
    else if (bearishCount >= 2) consensus = 'bearish';
    else if (bullishCount > 0 && bearishCount > 0) consensus = 'mixed';
    else consensus = 'neutral';
    
    return { short, medium, long, consensus };
  }

  /**
   * 🎯 MOMENTUM COM RSI SIMULADO
   */
  public calculateMomentumWithRSI(prices: number[]): {
    momentum: number;
    rsi: number;
    strength: 'overbought' | 'oversold' | 'neutral' | 'strong_bullish' | 'strong_bearish';
    score: number;
  } {
    if (prices.length < 14) {
      return {
        momentum: 0,
        rsi: 50,
        strength: 'neutral',
        score: 0
      };
    }

    // Calcular momentum
    const momentum = (prices[prices.length - 1] - prices[prices.length - 5]) / prices[prices.length - 5];
    
    // Simular RSI (versão simplificada)
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < Math.min(prices.length, 14); i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    // Determinar força
    let strength: 'overbought' | 'oversold' | 'neutral' | 'strong_bullish' | 'strong_bearish';
    if (rsi > 70 && momentum > 0.02) strength = 'overbought';
    else if (rsi < 30 && momentum < -0.02) strength = 'oversold';
    else if (momentum > 0.01 && rsi > 50) strength = 'strong_bullish';
    else if (momentum < -0.01 && rsi < 50) strength = 'strong_bearish';
    else strength = 'neutral';
    
    // Calcular score combinado
    const momentumScore = Math.min(50, Math.abs(momentum) * 1000);
    const rsiScore = rsi > 30 && rsi < 70 ? 50 : Math.max(0, 50 - Math.abs(rsi - 50));
    const score = momentumScore + rsiScore;
    
    return { momentum, rsi, strength, score };
  }

  /**
   * 🔄 MOMENTUM ACCELERATION (Taxa de mudança do momentum)
   */
  public calculateMomentumAcceleration(prices: number[]): {
    acceleration: number;
    trend: 'accelerating' | 'decelerating' | 'stable';
    score: number;
    reason: string;
  } {
    if (prices.length < 10) {
      return {
        acceleration: 0,
        trend: 'stable',
        score: 0,
        reason: 'Dados insuficientes para aceleração'
      };
    }

    // Calcular momentum em dois períodos
    const recent5 = prices.slice(-5);
    const previous5 = prices.slice(-10, -5);
    
    const recentMomentum = (recent5[4] - recent5[0]) / recent5[0];
    const previousMomentum = (previous5[4] - previous5[0]) / previous5[0];
    
    const acceleration = recentMomentum - previousMomentum;
    
    let trend: 'accelerating' | 'decelerating' | 'stable';
    let reason: string;
    
    if (acceleration > 0.002) {
      trend = 'accelerating';
      reason = `Momentum acelerando: +${(acceleration * 100).toFixed(2)}%`;
    } else if (acceleration < -0.002) {
      trend = 'decelerating';
      reason = `Momentum desacelerando: ${(acceleration * 100).toFixed(2)}%`;
    } else {
      trend = 'stable';
      reason = 'Momentum estável';
    }
    
    const score = Math.min(100, Math.abs(acceleration) * 5000);
    
    return { acceleration, trend, score, reason };
  }

  /**
   * 🎯 SCORE COMBINADO DE MOMENTUM
   */
  public getMomentumScore(prices: number[]): {
    totalScore: number;
    breakdown: {
      basic: number;
      multiPeriod: number;
      rsi: number;
      acceleration: number;
    };
    recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  } {
    const basic = this.validateMomentum(prices);
    const multiPeriod = this.analyzeMomentumMultiPeriod(prices);
    const rsiAnalysis = this.calculateMomentumWithRSI(prices);
    const acceleration = this.calculateMomentumAcceleration(prices);
    
    const breakdown = {
      basic: basic.score,
      multiPeriod: multiPeriod.consensus === 'bullish' ? 80 : multiPeriod.consensus === 'bearish' ? 20 : 50,
      rsi: rsiAnalysis.score,
      acceleration: acceleration.score
    };
    
    const totalScore = (breakdown.basic * 0.3) + (breakdown.multiPeriod * 0.3) + (breakdown.rsi * 0.2) + (breakdown.acceleration * 0.2);
    
    let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    if (totalScore >= 80 && basic.direction === 'bullish') recommendation = 'STRONG_BUY';
    else if (totalScore >= 60 && basic.direction === 'bullish') recommendation = 'BUY';
    else if (totalScore <= 20 && basic.direction === 'bearish') recommendation = 'STRONG_SELL';
    else if (totalScore <= 40 && basic.direction === 'bearish') recommendation = 'SELL';
    else recommendation = 'HOLD';
    
    return { totalScore, breakdown, recommendation };
  }

  /**
   * 🔧 MÉTODO AUXILIAR - Calcular momentum para período específico
   */
  private calculateMomentumForPeriod(prices: number[], period: number): MomentumAnalysis {
    if (prices.length < period) {
      return {
        isValid: false,
        reason: `Dados insuficientes para período ${period}`,
        score: 0,
        momentum: 0,
        direction: 'neutral'
      };
    }

    const recent = prices.slice(-period);
    const momentum = (recent[period - 1] - recent[0]) / recent[0];
    
    let direction: 'bullish' | 'bearish' | 'neutral';
    if (momentum > 0.002) direction = 'bullish';
    else if (momentum < -0.002) direction = 'bearish';
    else direction = 'neutral';
    
    const score = Math.min(100, Math.abs(momentum) * 1000);
    
    return {
      isValid: Math.abs(momentum) > 0.001,
      reason: `Momentum ${period}p: ${(momentum * 100).toFixed(2)}%`,
      score,
      momentum,
      direction
    };
  }
}

export default MomentumAnalyzer;