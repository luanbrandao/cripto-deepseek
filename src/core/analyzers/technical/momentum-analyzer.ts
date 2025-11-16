/**
 * 🚀 MOMENTUM ANALYZER
 * Moved and optimized from src/analyzers/momentumAnalyzer.ts
 */

interface MomentumAnalysis {
  isValid: boolean;
  reason: string;
  score: number;
  momentum: number;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export class MomentumAnalyzer {
  
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

    const recent = prices.slice(-5);
    const momentum = (recent[4] - recent[0]) / recent[0];
    
    let direction: 'bullish' | 'bearish' | 'neutral';
    const momentumThreshold = 0.005; // Algorithm constant - minimum momentum threshold
    if (momentum > momentumThreshold) direction = 'bullish';
    else if (momentum < -momentumThreshold) direction = 'bearish';
    else direction = 'neutral';
    
    if (momentum < momentumThreshold) {
      return { 
        isValid: false, 
        reason: `Momentum ${(momentum * 100).toFixed(2)}% < ${(momentumThreshold * 100).toFixed(1)}%`, 
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
      multiPeriod: multiPeriod.consensus === 'bullish' ? this.getBullishScore() : multiPeriod.consensus === 'bearish' ? this.getBearishScore() : this.getNeutralScore(),
      rsi: rsiAnalysis.score,
      acceleration: acceleration.score
    };
    
    const totalScore = (breakdown.basic * 0.3) + (breakdown.multiPeriod * 0.3) + (breakdown.rsi * 0.2) + (breakdown.acceleration * 0.2);
    
    let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    if (totalScore >= this.getStrongBuyThreshold() && basic.direction === 'bullish') recommendation = 'STRONG_BUY';
    else if (totalScore >= this.getBuyThreshold() && basic.direction === 'bullish') recommendation = 'BUY';
    else if (totalScore <= this.getBearishScore() && basic.direction === 'bearish') recommendation = 'STRONG_SELL';
    else if (totalScore <= this.getSellThreshold() && basic.direction === 'bearish') recommendation = 'SELL';
    else recommendation = 'HOLD';
    
    return { totalScore, breakdown, recommendation };
  }

  private analyzeMomentumMultiPeriod(prices: number[]) {
    const short = this.calculateMomentumForPeriod(prices, 3);
    const medium = this.calculateMomentumForPeriod(prices, 5);
    const long = this.calculateMomentumForPeriod(prices, 10);
    
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

  private calculateMomentumWithRSI(prices: number[]) {
    if (prices.length < 14) {
      return { momentum: 0, rsi: 50, strength: 'neutral' as const, score: 0 };
    }

    const momentum = (prices[prices.length - 1] - prices[prices.length - 5]) / prices[prices.length - 5];
    
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
    
    let strength: 'overbought' | 'oversold' | 'neutral' | 'strong_bullish' | 'strong_bearish';
    if (rsi > 70 && momentum > 0.02) strength = 'overbought';
    else if (rsi < 30 && momentum < -0.02) strength = 'oversold';
    else if (momentum > 0.01 && rsi > 50) strength = 'strong_bullish';
    else if (momentum < -0.01 && rsi < 50) strength = 'strong_bearish';
    else strength = 'neutral';
    
    const momentumScore = Math.min(50, Math.abs(momentum) * 1000);
    const rsiScore = rsi > 30 && rsi < 70 ? 50 : Math.max(0, 50 - Math.abs(rsi - 50));
    const score = momentumScore + rsiScore;
    
    return { momentum, rsi, strength, score };
  }

  private calculateMomentumAcceleration(prices: number[]) {
    if (prices.length < 10) {
      return {
        acceleration: 0,
        trend: 'stable' as const,
        score: 0,
        reason: 'Dados insuficientes para aceleração'
      };
    }

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

  // Algorithm constants as methods
  private getBullishScore(): number {
    return 80; // Algorithm constant
  }

  private getBearishScore(): number {
    return 20; // Algorithm constant
  }

  private getNeutralScore(): number {
    return 50; // Algorithm constant
  }

  private getStrongBuyThreshold(): number {
    return 80; // Algorithm constant
  }

  private getBuyThreshold(): number {
    return 60; // Algorithm constant
  }

  private getSellThreshold(): number {
    return 40; // Algorithm constant
  }
}