/**
 * 📊 VOLUME ANALYZER
 * Uses centralized TechnicalCalculator for calculations
 */

import { TechnicalCalculator } from '../../../shared/calculations';
import { BOT_SPECIFIC_CONFIG } from '../../../shared/config/unified-trading-config';

interface VolumeAnalysis {
  isValid: boolean;
  reason: string;
  score: number;
  volumeMultiplier: number;
  avgVolume: number;
  currentVolume: number;
}

export class VolumeAnalyzer {
  
  public validateVolumeStrength(klines: any[]): VolumeAnalysis {
    if (klines.length < 10) {
      return { 
        isValid: false, 
        reason: 'Dados de volume insuficientes', 
        score: 0,
        volumeMultiplier: 0,
        avgVolume: 0,
        currentVolume: 0
      };
    }

    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const volumeResult = TechnicalCalculator.calculateVolumeAnalysis(volumes);
    
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const volumeMultiplier = volumeResult.ratio;
    
    const botConfig = BOT_SPECIFIC_CONFIG.SMART_BOT_BUY;
    const requiredVolume = botConfig.VOLUME_MULTIPLIER;
    
    const isValid = volumeMultiplier >= requiredVolume;
    
    return { 
      isValid,
      reason: isValid ? 
        `Volume ${volumeMultiplier.toFixed(1)}x OK` : 
        `Volume ${volumeMultiplier.toFixed(1)}x < ${requiredVolume}x (BOT_SPECIFIC)`,
      score: volumeResult.strength,
      volumeMultiplier,
      avgVolume,
      currentVolume
    };
  }

  public getVolumeScore(klines: any[]): {
    totalScore: number;
    breakdown: {
      strength: number;
      pattern: number;
      consistency: number;
    };
    recommendation: 'STRONG' | 'MODERATE' | 'WEAK';
  } {
    const strengthAnalysis = this.validateVolumeStrength(klines);
    const patternAnalysis = this.analyzeVolumePattern(klines);
    
    const volumes = klines.slice(-10).map((k: any) => parseFloat(k[5]));
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avgVolume * 100));
    
    const breakdown = {
      strength: strengthAnalysis.score,
      pattern: patternAnalysis.strength,
      consistency: consistency
    };
    
    const totalScore = (breakdown.strength * 0.5) + (breakdown.pattern * 0.3) + (breakdown.consistency * 0.2);
    
    let recommendation: 'STRONG' | 'MODERATE' | 'WEAK';
    if (totalScore >= this.getStrongThreshold()) recommendation = 'STRONG';
    else if (totalScore >= this.getModerateThreshold()) recommendation = 'MODERATE';
    else recommendation = 'WEAK';
    
    return { totalScore, breakdown, recommendation };
  }

  private analyzeVolumePattern(klines: any[]) {
    if (klines.length < 20) {
      return {
        trend: 'stable' as const,
        strength: 0,
        anomaly: false,
        reason: 'Dados insuficientes para análise de padrão'
      };
    }

    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const volumeResult = TechnicalCalculator.calculateVolumeAnalysis(volumes, 20);
    
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const anomaly = currentVolume > avgVolume * this.getAnomalyMultiplier();
    
    let reason: string;
    if (volumeResult.trend === 'increasing') {
      reason = `Volume crescente`;
    } else if (volumeResult.trend === 'decreasing') {
      reason = `Volume decrescente`;
    } else {
      reason = 'Volume estável';
    }
    
    if (anomaly) {
      reason += ` | ANOMALIA: ${(currentVolume / avgVolume).toFixed(1)}x acima da média`;
    }
    
    return { 
      trend: volumeResult.trend, 
      strength: volumeResult.strength, 
      anomaly, 
      reason 
    };
  }

  // Algorithm constants as methods
  private getStrongThreshold(): number {
    return 70; // Algorithm constant
  }

  private getModerateThreshold(): number {
    return 50; // Algorithm constant
  }

  private getAnomalyMultiplier(): number {
    return 3; // Algorithm constant
  }

  private getChangeThreshold(): number {
    return 0.2; // Algorithm constant
  }

  private getStableStrength(): number {
    return 50; // Algorithm constant
  }
}