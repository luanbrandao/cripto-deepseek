/**
 * 🛡️ SERVIÇO CENTRALIZADO DE PRÉ-VALIDAÇÕES
 * Centraliza todas as validações de bots e simuladores
 */

import { TradingConfigManager } from '../config/trading-config-manager';

// === INTERFACES ===
export interface ValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
  confidence?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MarketData {
  price24h: number[];
  currentPrice: number;
  volumes?: number[];
  stats?: any;
  klines?: any[];
}

export interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
}

// === MÓDULOS DE VALIDAÇÃO ===

/**
 * 📊 MÓDULO DE VALIDAÇÃO DE VOLUME
 */
class VolumeValidator {
  static validate(volumes: number[], config: any): { score: number; reasons: string[]; warnings: string[] } {
    const result: { score: number; reasons: string[]; warnings: string[] } = { score: 0, reasons: [], warnings: [] };
    
    if (volumes.length === 0) return result;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const volumeRatio = recentVolume / avgVolume;
    const minMultiplier = config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER;
    
    if (volumeRatio >= minMultiplier * 1.3) {
      result.score = 5;
      result.reasons.push(`✅ Volume forte: ${volumeRatio.toFixed(1)}x média`);
    } else if (volumeRatio >= minMultiplier) {
      result.score = 3;
      result.reasons.push(`✅ Volume adequado: ${volumeRatio.toFixed(1)}x média`);
    } else {
      result.warnings.push(`❌ Volume insuficiente: ${volumeRatio.toFixed(1)}x < ${minMultiplier}x`);
    }
    
    return result;
  }
}

/**
 * 📈 MÓDULO DE VALIDAÇÃO DE TENDÊNCIA
 */
class TrendValidator {
  static validate(prices: number[], config: any): { score: number; reasons: string[]; warnings: string[] } {
    const result: { score: number; reasons: string[]; warnings: string[] } = { score: 0, reasons: [], warnings: [] };
    
    const ema21 = TechnicalCalculator.calculateEMA(prices, 21);
    const ema50 = TechnicalCalculator.calculateEMA(prices, 50);
    const trendStrength = Math.abs(ema21 - ema50) / ema50;
    const minStrength = config.EMA_ADVANCED.MIN_TREND_STRENGTH;
    
    if (trendStrength >= minStrength * 2.5) {
      result.score = 5;
      result.reasons.push(`✅ Tendência forte: ${(trendStrength * 100).toFixed(2)}%`);
    } else if (trendStrength >= minStrength) {
      result.score = 3;
      result.reasons.push(`✅ Tendência adequada: ${(trendStrength * 100).toFixed(2)}%`);
    } else {
      result.warnings.push(`❌ Tendência fraca: ${(trendStrength * 100).toFixed(2)}%`);
    }
    
    return result;
  }
}

/**
 * 🎯 MÓDULO DE VALIDAÇÃO DE RSI
 */
class RSIValidator {
  static validate(prices: number[], config: any): { score: number; reasons: string[]; warnings: string[] } {
    const result: { score: number; reasons: string[]; warnings: string[] } = { score: 0, reasons: [], warnings: [] };
    
    const rsi = TechnicalCalculator.calculateRSI(prices);
    const { RSI_MIN, RSI_MAX, RSI_OPTIMAL_MIN, RSI_OPTIMAL_MAX } = config.ALGORITHM;
    
    if (rsi >= RSI_MIN && rsi <= RSI_MAX) {
      if (rsi >= RSI_OPTIMAL_MIN && rsi <= RSI_OPTIMAL_MAX) {
        result.score = 5;
        result.reasons.push(`✅ RSI em zona ótima: ${rsi.toFixed(1)}`);
      } else {
        result.score = 3;
        result.reasons.push(`✅ RSI em zona boa: ${rsi.toFixed(1)}`);
      }
    } else {
      result.warnings.push(`❌ RSI extremo: ${rsi.toFixed(1)} (${RSI_MIN}-${RSI_MAX})`);
    }
    
    return result;
  }
}

/**
 * 💰 MÓDULO DE VALIDAÇÃO DE PREÇO
 */
class PriceValidator {
  static validate(currentPrice: number, prices: number[], action: string, config: any): { score: number; reasons: string[]; warnings: string[] } {
    const result: { score: number; reasons: string[]; warnings: string[] } = { score: 0, reasons: [], warnings: [] };
    
    const ema21 = TechnicalCalculator.calculateEMA(prices, 21);
    const distance = Math.abs(currentPrice - ema21) / ema21;
    
    if (action === 'BUY' && currentPrice > ema21) {
      result.score = 3;
      result.reasons.push('✅ Preço acima EMA21 para compra');
    } else if (action === 'SELL' && currentPrice < ema21) {
      result.score = 3;
      result.reasons.push('✅ Preço abaixo EMA21 para venda');
    } else if (distance <= config.EMA_ADVANCED.MIN_SEPARATION) {
      result.score = 2;
      result.reasons.push('✅ Preço próximo EMA21 (crossover)');
    } else {
      result.warnings.push('❌ Posição inadequada para EMA');
    }
    
    return result;
  }
}

/**
 * 📊 MÓDULO DE VALIDAÇÃO DE VOLATILIDADE
 */
class VolatilityValidator {
  static validate(stats: any, config: any): { score: number; reasons: string[]; warnings: string[] } {
    const result: { score: number; reasons: string[]; warnings: string[] } = { score: 0, reasons: [], warnings: [] };
    
    if (!stats?.priceChangePercent) return result;
    
    const volatility = Math.abs(parseFloat(stats.priceChangePercent));
    const { MIN_VOLATILITY, MAX_VOLATILITY } = config.MARKET_FILTERS;
    
    if (volatility >= MIN_VOLATILITY && volatility <= MAX_VOLATILITY) {
      result.score = 2;
      result.reasons.push(`✅ Volatilidade adequada: ${volatility.toFixed(1)}%`);
    } else {
      result.warnings.push(`❌ Volatilidade inadequada: ${volatility.toFixed(1)}%`);
    }
    
    return result;
  }
}

/**
 * 🧮 CALCULADORA TÉCNICA
 */
// Import centralized calculations
import { TechnicalCalculator } from '../calculations';

// Use centralized TechnicalCalculator instead of local implementation

// === SERVIÇO PRINCIPAL ===
export class PreValidationService {
  
  /**
   * 🔍 VALIDAÇÃO EMA AVANÇADA
   */
  static validateEmaSignal(marketData: MarketData, basicAnalysis: any): ValidationResult {
    const validation: ValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };
    
    const config = TradingConfigManager.getConfig();
    const { price24h, volumes = [], currentPrice, stats } = marketData;
    
    // Validações modulares
    const volumeResult = VolumeValidator.validate(volumes, config);
    const trendResult = TrendValidator.validate(price24h, config);
    const rsiResult = RSIValidator.validate(price24h, config);
    const priceResult = PriceValidator.validate(currentPrice, price24h, basicAnalysis.action, config);
    const volatilityResult = VolatilityValidator.validate(stats, config);
    
    // Consolidar resultados
    validation.score = volumeResult.score + trendResult.score + rsiResult.score + priceResult.score + volatilityResult.score;
    validation.reasons = [...volumeResult.reasons, ...trendResult.reasons, ...rsiResult.reasons, ...priceResult.reasons, ...volatilityResult.reasons];
    validation.warnings = [...volumeResult.warnings, ...trendResult.warnings, ...rsiResult.warnings, ...priceResult.warnings, ...volatilityResult.warnings];
    
    const minScore = Math.floor(config.EMA_ADVANCED.MIN_EMA_SCORE * 1.2);
    validation.isValid = validation.score >= minScore;
    
    return validation;
  }

  /**
   * 🎯 VALIDAÇÃO SUPORTE/RESISTÊNCIA
   */
  static validateSupportResistanceSignal(currentPrice: number, levels: any[], candles: any[], decision: TradeDecision): ValidationResult {
    const validation: ValidationResult = { isValid: false, score: 0, reasons: [], warnings: [] };
    const srConfig = TradingConfigManager.getBotConfig().SUPPORT_RESISTANCE;
    
    // Validação de níveis próximos
    const tolerance = currentPrice * (srConfig?.MAX_DISTANCE || 0.005);
    const nearbyLevels = levels.filter(level => 
      Math.abs(level.price - currentPrice) <= tolerance * 3 && level.touches >= (srConfig?.MIN_TOUCHES || 2)
    );
    
    if (nearbyLevels.length >= 2) {
      validation.score += 5;
      validation.reasons.push(`✅ Múltiplos níveis próximos: ${nearbyLevels.length}`);
    } else if (nearbyLevels.length === 1) {
      validation.score += 3;
      validation.reasons.push(`✅ Nível próximo identificado`);
    } else {
      validation.warnings.push(`❌ Nenhum nível S/R próximo`);
    }
    
    // Validação de força dos níveis
    const strongLevels = levels.filter(level => level.strength >= 0.7);
    if (strongLevels.length >= 2) {
      validation.score += 5;
      validation.reasons.push(`✅ Múltiplos níveis fortes: ${strongLevels.length}`);
    } else if (strongLevels.length === 1) {
      validation.score += 3;
      validation.reasons.push(`✅ Nível forte identificado`);
    } else {
      validation.warnings.push(`❌ Níveis S/R fracos`);
    }
    
    // Validação de tendência
    const trend = this.analyzeTrend(candles);
    if ((decision.action === 'BUY' && trend === 'up') || (decision.action === 'SELL' && trend === 'down')) {
      validation.score += 5;
      validation.reasons.push(`✅ Tendência alinhada: ${trend}`);
    } else if (trend === 'sideways') {
      validation.score += 3;
      validation.reasons.push(`✅ Mercado lateral favorável`);
    } else {
      validation.warnings.push(`❌ Tendência contrária: ${trend}`);
    }
    
    validation.isValid = validation.score >= Math.floor((srConfig?.MIN_TOUCHES || 2) * 5);
    return validation;
  }

  private static analyzeTrend(candles: any[]): 'up' | 'down' | 'sideways' {
    if (candles.length < 10) return 'sideways';
    
    const closes = candles.slice(-10).map(c => parseFloat(c[4] || c.close || c));
    const first = closes[0];
    const last = closes[closes.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.02) return 'up';
    if (change < -0.02) return 'down';
    return 'sideways';
  }

  /**
   * 🚀 VALIDAÇÃO ULTRA-CONSERVADORA
   */
  static validateUltraConservative(symbol: string, marketData: MarketData, decision: TradeDecision): ValidationResult {
    const validation: ValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: [],
      riskLevel: 'HIGH'
    };
    
    const config = TradingConfigManager.getConfig();
    const { EXCEPTIONAL_CONFIDENCE, VERY_HIGH_CONFIDENCE, EXCEPTIONAL_SCORE, VERY_HIGH_SCORE, MIN_SCORE } = config.ALGORITHM;
    
    // Validação de confiança
    if (decision.confidence >= EXCEPTIONAL_CONFIDENCE) {
      validation.score += EXCEPTIONAL_SCORE;
      validation.reasons.push(`✅ Confiança excepcional: ${decision.confidence}%`);
      validation.riskLevel = 'LOW';
    } else if (decision.confidence >= VERY_HIGH_CONFIDENCE) {
      validation.score += VERY_HIGH_SCORE;
      validation.reasons.push(`✅ Confiança muito alta: ${decision.confidence}%`);
      validation.riskLevel = 'MEDIUM';
    } else if (decision.confidence >= config.MIN_CONFIDENCE) {
      validation.score += MIN_SCORE;
      validation.reasons.push(`✅ Confiança mínima: ${decision.confidence}%`);
    } else {
      validation.warnings.push(`❌ Confiança insuficiente: ${decision.confidence}%`);
    }
    
    // Validação de símbolo
    const stableSymbols = ['BTCUSDT', 'ETHUSDT'];
    if (stableSymbols.includes(symbol)) {
      validation.score += config.ALGORITHM.ACTION_SCORE;
      validation.reasons.push(`✅ Símbolo estável: ${symbol}`);
    } else {
      validation.warnings.push(`⚠️ Símbolo volátil: ${symbol}`);
    }
    
    // Validação EMA adicional
    const emaValidation = this.validateEmaSignal(marketData, decision);
    validation.score += Math.floor(emaValidation.score * 0.5);
    validation.reasons.push(...emaValidation.reasons.slice(0, 2));
    
    validation.isValid = validation.score >= config.ALGORITHM.ULTRA_CONSERVATIVE_THRESHOLD;
    return validation;
  }
}