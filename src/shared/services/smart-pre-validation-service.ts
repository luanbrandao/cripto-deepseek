/**
 * 🛡️ SMART PRÉ-VALIDAÇÃO SERVICE
 * Sistema modular de validação inteligente com API fluente
 */

import { TradingConfigManager } from '../../core';

// === INTERFACES ===
export interface ValidationLayer {
  name: string;
  weight: number;
  validator: (data: any) => { isValid: boolean; score: number; reason: string };
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  maxScore: number;
  totalScore: number;
  reasons: string[];
  warnings: string[];
  confidence?: number;
  riskLevel?: string;
  activeLayers: string[];
  layerScores: { [key: string]: number };
}

// === CALCULADORAS TÉCNICAS ===
class TechnicalCalculators {
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const returnRate = (prices[i] - prices[i - 1]) / prices[i - 1];
      if (!isNaN(returnRate) && isFinite(returnRate)) {
        returns.push(returnRate);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * 100;
  }
}

// === VALIDADORES ESPECIALIZADOS ===

/**
 * 📈 VALIDADOR EMA
 */
class EMAValidator {
  static validate(data: any, fastPeriod: number, slowPeriod: number) {
    const { marketData } = data;
    
    if (!marketData?.price24h || marketData.price24h.length < slowPeriod) {
      return { isValid: false, score: 0, reason: 'Dados insuficientes para EMA' };
    }

    const prices = marketData.price24h;
    const emaFast = TechnicalCalculators.calculateEMA(prices, fastPeriod);
    const emaSlow = TechnicalCalculators.calculateEMA(prices, slowPeriod);
    const currentPrice = marketData.currentPrice || prices[prices.length - 1];

    let score = 0;
    const details = [];
    const config = TradingConfigManager.getConfig();

    // Alinhamento bullish (40 pontos)
    if (emaFast > emaSlow) {
      score += 40;
      details.push('EMA rápida > lenta');
    }

    // Preço acima das EMAs (40 pontos)
    if (currentPrice > emaFast && currentPrice > emaSlow) {
      score += 40;
      details.push('Preço > EMAs');
    }

    // Separação adequada (20 pontos)
    const separation = Math.abs(emaFast - emaSlow) / emaSlow;
    const minSeparation = config.EMA_ADVANCED?.MIN_SEPARATION || 0.005;
    if (separation > minSeparation) {
      score += 20;
      details.push('Separação adequada');
    }

    return {
      isValid: score >= 60,
      score,
      reason: details.join(', ') || 'Condições EMA desfavoráveis'
    };
  }
}

/**
 * 🎯 VALIDADOR RSI
 */
class RSIValidator {
  static validate(data: any, period: number) {
    const { marketData } = data;
    
    if (!marketData?.price24h || marketData.price24h.length < period + 1) {
      return { isValid: false, score: 0, reason: 'Dados insuficientes para RSI' };
    }

    const rsi = TechnicalCalculators.calculateRSI(marketData.price24h, period);
    const config = TradingConfigManager.getConfig();
    
    let score = 0;
    let reason = '';

    const rsiOversold = config.RSI?.OVERSOLD_THRESHOLD || 25;
    const rsiOverbought = config.RSI?.OVERBOUGHT_THRESHOLD || 75;

    if (rsi >= rsiOversold && rsi <= rsiOverbought) {
      score = 100;
      reason = `RSI em zona neutra (${rsi.toFixed(1)})`;
    } else if (rsi < rsiOversold) {
      score = 80;
      reason = `RSI oversold (${rsi.toFixed(1)}) - oportunidade`;
    } else {
      score = 20;
      reason = `RSI overbought (${rsi.toFixed(1)}) - risco alto`;
    }

    return { isValid: score >= 60, score, reason };
  }
}

/**
 * 📊 VALIDADOR DE VOLUME
 */
class VolumeValidator {
  static validate(data: any, multiplier: number) {
    const { marketData } = data;
    
    if (!marketData?.volumes || marketData.volumes.length < 20) {
      return { isValid: false, score: 0, reason: 'Dados de volume insuficientes' };
    }

    const volumes = marketData.volumes;
    const recentVolume = volumes.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
    const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
    const volumeRatio = recentVolume / avgVolume;

    let score = 0;
    let reason = '';

    if (volumeRatio >= multiplier * 1.5) {
      score = 100;
      reason = `Volume muito alto (${volumeRatio.toFixed(1)}x)`;
    } else if (volumeRatio >= multiplier) {
      score = 80;
      reason = `Volume adequado (${volumeRatio.toFixed(1)}x)`;
    } else {
      score = 40;
      reason = `Volume baixo (${volumeRatio.toFixed(1)}x)`;
    }

    return { isValid: score >= 60, score, reason };
  }
}

/**
 * 🎯 VALIDADOR SUPORTE/RESISTÊNCIA
 */
class SupportResistanceValidator {
  static validate(data: any, tolerance: number) {
    const { marketData, levels } = data;
    
    if (!levels || levels.length === 0) {
      return { isValid: false, score: 50, reason: 'Nenhum nível S/R detectado' };
    }

    const currentPrice = marketData?.currentPrice || marketData?.price?.price;
    if (!currentPrice) {
      return { isValid: false, score: 0, reason: 'Preço atual não disponível' };
    }

    let score = 0;
    let bestLevel = null;
    let minDistance = Infinity;

    for (const level of levels) {
      const distance = Math.abs(currentPrice - level.price) / currentPrice;
      if (distance < minDistance) {
        minDistance = distance;
        bestLevel = level;
      }
    }

    if (bestLevel) {
      const distancePercent = (minDistance * 100).toFixed(2);
      
      if (minDistance <= tolerance / 2) {
        score = 100;
      } else if (minDistance <= tolerance) {
        score = 80;
      } else if (minDistance <= tolerance * 2) {
        score = 60;
      } else {
        score = 30;
      }

      const reason = `Nível ${bestLevel.type} a ${distancePercent}% (${bestLevel.touches} toques)`;
      return { isValid: score >= 60, score, reason };
    }

    return { isValid: false, score: 0, reason: 'Nenhum nível S/R próximo' };
  }
}

/**
 * 🚀 VALIDADOR DE MOMENTUM
 */
class MomentumValidator {
  static validate(data: any, minMomentum: number) {
    const { marketData } = data;
    
    if (!marketData?.stats?.priceChangePercent) {
      return { isValid: false, score: 50, reason: 'Dados de momentum indisponíveis' };
    }

    const priceChange = Math.abs(parseFloat(marketData.stats.priceChangePercent)) / 100;
    let score = 0;
    let reason = '';

    if (priceChange >= minMomentum * 2) {
      score = 100;
      reason = `Momentum forte (${(priceChange * 100).toFixed(2)}%)`;
    } else if (priceChange >= minMomentum) {
      score = 80;
      reason = `Momentum adequado (${(priceChange * 100).toFixed(2)}%)`;
    } else {
      score = 40;
      reason = `Momentum baixo (${(priceChange * 100).toFixed(2)}%)`;
    }

    return { isValid: score >= 60, score, reason };
  }
}

/**
 * 📊 VALIDADOR DE VOLATILIDADE
 */
class VolatilityValidator {
  static validate(data: any, minVol: number, maxVol: number) {
    const { marketData } = data;
    
    if (!marketData?.price24h || marketData.price24h.length < 20) {
      return { isValid: false, score: 50, reason: 'Dados insuficientes para volatilidade' };
    }

    const volatility = TechnicalCalculators.calculateVolatility(marketData.price24h);
    let score = 0;
    let reason = '';

    if (volatility >= minVol && volatility <= maxVol) {
      score = 100;
      reason = `Volatilidade ideal (${volatility.toFixed(1)}%)`;
    } else if (volatility < minVol) {
      score = 60;
      reason = `Volatilidade baixa (${volatility.toFixed(1)}%)`;
    } else {
      score = 40;
      reason = `Volatilidade alta (${volatility.toFixed(1)}%)`;
    }

    return { isValid: score >= 60, score, reason };
  }
}

/**
 * 💯 VALIDADOR DE CONFIANÇA
 */
class ConfidenceValidator {
  static validate(data: any, minConfidence: number) {
    const { decision } = data;
    
    if (!decision?.confidence) {
      return { isValid: false, score: 0, reason: 'Confiança não disponível' };
    }

    const confidence = decision.confidence;
    let score = 0;
    let reason = '';

    if (confidence >= minConfidence + 20) {
      score = 100;
      reason = `Confiança muito alta (${confidence}%)`;
    } else if (confidence >= minConfidence + 10) {
      score = 80;
      reason = `Confiança alta (${confidence}%)`;
    } else if (confidence >= minConfidence) {
      score = 60;
      reason = `Confiança adequada (${confidence}%)`;
    } else {
      score = 20;
      reason = `Confiança baixa (${confidence}%)`;
    }

    return { isValid: score >= 60, score, reason };
  }
}

// === BUILDER PATTERN ===

/**
 * 🏗️ CONSTRUTOR DE VALIDAÇÕES
 */
export class SmartPreValidationBuilder {
  private layers: ValidationLayer[] = [];
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  withEma(fastPeriod: number = 12, slowPeriod: number = 26, weight: number = 20): SmartPreValidationBuilder {
    this.layers.push({
      name: 'EMA',
      weight,
      validator: (data) => EMAValidator.validate(data, fastPeriod, slowPeriod)
    });
    return this;
  }

  withRSI(period: number = 14, weight: number = 15): SmartPreValidationBuilder {
    this.layers.push({
      name: 'RSI',
      weight,
      validator: (data) => RSIValidator.validate(data, period)
    });
    return this;
  }

  withVolume(multiplier: number = 1.2, weight: number = 15): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Volume',
      weight,
      validator: (data) => VolumeValidator.validate(data, multiplier)
    });
    return this;
  }

  withSupportResistance(tolerance: number = 0.01, weight: number = 20): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Support/Resistance',
      weight,
      validator: (data) => SupportResistanceValidator.validate(data, tolerance)
    });
    return this;
  }

  withMomentum(minMomentum: number = 0.01, weight: number = 10): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Momentum',
      weight,
      validator: (data) => MomentumValidator.validate(data, minMomentum)
    });
    return this;
  }

  withVolatility(minVol: number = 0.5, maxVol: number = 5.0, weight: number = 10): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Volatility',
      weight,
      validator: (data) => VolatilityValidator.validate(data, minVol, maxVol)
    });
    return this;
  }

  withConfidence(minConfidence: number = 70, weight: number = 10): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Confidence',
      weight,
      validator: (data) => ConfidenceValidator.validate(data, minConfidence)
    });
    return this;
  }

  usePreset(preset: string): SmartPreValidationBuilder {
    const presets = {
      'EmaBot': () => this.withEma(12, 26, 25).withRSI(14, 20).withVolume(1.2, 20).withMomentum(0.01, 15).withVolatility(1, 5, 10).withConfidence(70, 10),
      'SmartBot': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.5, 15).withSupportResistance(0.01, 20).withMomentum(0.01, 15).withConfidence(75, 15),
      'RealBot': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.3, 15).withMomentum(0.01, 15).withConfidence(70, 15).withVolatility(1, 4, 20),
      'UltraConservative': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.8, 15).withSupportResistance(0.005, 20).withMomentum(0.02, 10).withVolatility(0.5, 3, 10).withConfidence(85, 10),
      'Simulation': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.2, 15).withMomentum(0.01, 15).withConfidence(70, 15).withVolatility(1, 4, 20)
    };

    const presetFn = presets[preset as keyof typeof presets];
    return presetFn ? presetFn() : this;
  }

  build(): SmartPreValidationValidator {
    return new SmartPreValidationValidator(this.layers);
  }

  validate(): ValidationResult {
    return this.build().validate(this.data.symbol, this.data.marketData, this.data.decision, this.data.binanceClient);
  }
}

/**
 * 🔍 VALIDADOR PRINCIPAL
 */
export class SmartPreValidationValidator {
  constructor(private layers: ValidationLayer[]) {}

  validate(symbol: string, marketData: any, decision: any, binanceClient?: any): ValidationResult {
    const data = { symbol, marketData, decision, binanceClient };
    
    if (this.layers.length === 0) {
      return {
        isValid: false,
        score: 0,
        maxScore: 0,
        totalScore: 0,
        reasons: [],
        warnings: ['Nenhuma camada de validação configurada'],
        activeLayers: [],
        layerScores: {}
      };
    }

    let totalScore = 0;
    let maxScore = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    const activeLayers: string[] = [];
    const layerScores: { [key: string]: number } = {};

    for (const layer of this.layers) {
      try {
        const result = layer.validator(data);
        const layerScore = (result.score / 100) * layer.weight;
        
        totalScore += layerScore;
        maxScore += layer.weight;
        layerScores[layer.name.toLowerCase().replace(/[^a-z]/g, '')] = layerScore;

        if (result.isValid) {
          reasons.push(`✅ ${layer.name}: ${result.reason} (${layerScore.toFixed(1)}/${layer.weight})`);
          activeLayers.push(layer.name);
        } else {
          warnings.push(`❌ ${layer.name}: ${result.reason} (${layerScore.toFixed(1)}/${layer.weight})`);
        }
      } catch (error) {
        warnings.push(`⚠️ ${layer.name}: Erro na validação - ${error}`);
      }
    }

    const scorePercentage = (totalScore / maxScore) * 100;
    const config = TradingConfigManager.getConfig();
    const minApprovalScore = config.VALIDATION_SCORES?.MIN_APPROVAL_SCORE || 60;
    const isValid = scorePercentage >= minApprovalScore;

    const maxConfidence = config.HIGH_CONFIDENCE || 95;
    const minConfidence = config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50;
    const confidence = Math.min(maxConfidence, Math.max(minConfidence, scorePercentage));
    
    let riskLevel = 'HIGH';
    const lowRiskThreshold = config.VALIDATION_SCORES?.LOW_RISK_THRESHOLD || 80;
    const mediumRiskThreshold = config.VALIDATION_SCORES?.MEDIUM_RISK_THRESHOLD || 65;
    if (scorePercentage >= lowRiskThreshold) riskLevel = 'LOW';
    else if (scorePercentage >= mediumRiskThreshold) riskLevel = 'MEDIUM';

    return {
      isValid,
      score: Math.round(totalScore),
      maxScore,
      totalScore: Math.round(totalScore),
      reasons,
      warnings,
      confidence: Math.round(confidence),
      riskLevel,
      activeLayers,
      layerScores
    };
  }
}

// === SERVIÇO PRINCIPAL ===

/**
 * 🛡️ SMART PRÉ-VALIDAÇÃO SERVICE
 */
export class SmartPreValidationService {
  static createBuilder(): SmartPreValidationServiceBuilder {
    return new SmartPreValidationServiceBuilder();
  }

  static create(data: any): SmartPreValidationBuilder {
    return new SmartPreValidationBuilder(data);
  }

  // Presets otimizados
  static forEmaBot(data: any): ValidationResult {
    const config = TradingConfigManager.getConfig();
    return this.create(data)
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 25)
      .withRSI(14, 20)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER, 20)
      .withMomentum(0.01, 15)
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY, 10)
      .withConfidence(config.MIN_CONFIDENCE, 10)
      .validate();
  }

  static forSmartBot(data: any): ValidationResult {
    const config = TradingConfigManager.getConfig();
    return this.create(data)
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 20)
      .withRSI(14, 15)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 1.25, 15)
      .withSupportResistance(config.EMA_ADVANCED.MIN_SEPARATION * 2, 20)
      .withMomentum(0.01, 15)
      .withConfidence(config.MIN_CONFIDENCE + 5, 15)
      .validate();
  }

  static forUltraConservative(data: any): ValidationResult {
    return this.create(data)
      .withEma(12, 26, 20)
      .withRSI(14, 15)
      .withVolume(1.8, 15)
      .withSupportResistance(0.005, 20)
      .withMomentum(0.02, 10)
      .withVolatility(0.5, 3, 10)
      .withConfidence(85, 10)
      .validate();
  }

  static forSimulation(data: any): ValidationResult {
    return this.create(data)
      .withEma(12, 26, 20)
      .withRSI(14, 15)
      .withVolume(1.2, 15)
      .withMomentum(0.01, 15)
      .withConfidence(70, 15)
      .withVolatility(1, 4, 20)
      .validate();
  }
}

/**
 * 🏗️ BUILDER ALTERNATIVO (Compatibilidade)
 */
export class SmartPreValidationServiceBuilder {
  private layers: ValidationLayer[] = [];

  withEma(fastPeriod: number = 12, slowPeriod: number = 26, weight: number = 20): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'EMA',
      weight,
      validator: (data) => EMAValidator.validate(data, fastPeriod, slowPeriod)
    });
    return this;
  }

  withRSI(period: number = 14, weight: number = 15): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'RSI',
      weight,
      validator: (data) => RSIValidator.validate(data, period)
    });
    return this;
  }

  withVolume(multiplier: number = 1.2, weight: number = 15): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Volume',
      weight,
      validator: (data) => VolumeValidator.validate(data, multiplier)
    });
    return this;
  }

  withSupportResistance(tolerance: number = 0.01, weight: number = 20): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Support/Resistance',
      weight,
      validator: (data) => SupportResistanceValidator.validate(data, tolerance)
    });
    return this;
  }

  withMomentum(minMomentum: number = 0.01, weight: number = 10): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Momentum',
      weight,
      validator: (data) => MomentumValidator.validate(data, minMomentum)
    });
    return this;
  }

  withVolatility(minVol: number = 0.5, maxVol: number = 5.0, weight: number = 10): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Volatility',
      weight,
      validator: (data) => VolatilityValidator.validate(data, minVol, maxVol)
    });
    return this;
  }

  withConfidence(minConfidence: number = 70, weight: number = 10): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Confidence',
      weight,
      validator: (data) => ConfidenceValidator.validate(data, minConfidence)
    });
    return this;
  }

  usePreset(preset: string): SmartPreValidationServiceBuilder {
    const presets = {
      'EmaBot': () => this.withEma(12, 26, 25).withRSI(14, 20).withVolume(1.2, 20).withMomentum(0.01, 15).withVolatility(1, 5, 10).withConfidence(70, 10),
      'SmartBot': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.5, 15).withSupportResistance(0.01, 20).withMomentum(0.01, 15).withConfidence(75, 15),
      'RealBot': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.3, 15).withMomentum(0.01, 15).withConfidence(70, 15).withVolatility(1, 4, 20),
      'UltraConservative': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.8, 15).withSupportResistance(0.005, 20).withMomentum(0.02, 10).withVolatility(0.5, 3, 10).withConfidence(85, 10),
      'Simulation': () => this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.2, 15).withMomentum(0.01, 15).withConfidence(70, 15).withVolatility(1, 4, 20)
    };

    const presetFn = presets[preset as keyof typeof presets];
    return presetFn ? presetFn() : this;
  }

  build(): SmartPreValidationValidator {
    return new SmartPreValidationValidator(this.layers);
  }
}