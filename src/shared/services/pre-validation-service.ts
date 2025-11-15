/**
 * 🛡️ SERVIÇO CENTRALIZADO DE PRÉ-VALIDAÇÕES
 * Centraliza todas as validações de bots e simuladores
 */

import { TradingConfigManager } from '../config/trading-config-manager';

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
    
    const { price24h, volumes = [], currentPrice, stats } = marketData;
    const config = TradingConfigManager.getConfig();
    
    // 1. Validação de Volume (5 pontos)
    if (volumes.length > 0) {
      const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const volumeRatio = recentVolume / avgVolume;
      const minVolumeMultiplier = config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER;
      
      if (volumeRatio >= minVolumeMultiplier * 1.3) {
        validation.score += 5;
        validation.reasons.push(`✅ Volume forte: ${volumeRatio.toFixed(1)}x média`);
      } else if (volumeRatio >= minVolumeMultiplier) {
        validation.score += 3;
        validation.reasons.push(`✅ Volume adequado: ${volumeRatio.toFixed(1)}x média`);
      } else {
        validation.warnings.push(`❌ Volume insuficiente: ${volumeRatio.toFixed(1)}x < ${minVolumeMultiplier}x`);
      }
    }
    
    // 2. Validação de Força da Tendência (5 pontos)
    const ema21 = this.calculateEMA(price24h, 21);
    const ema50 = this.calculateEMA(price24h, 50);
    const trendStrength = Math.abs(ema21 - ema50) / ema50;
    const minTrendStrength = config.EMA_ADVANCED.MIN_TREND_STRENGTH;
    
    if (trendStrength >= minTrendStrength * 2.5) {
      validation.score += 5;
      validation.reasons.push(`✅ Tendência forte: ${(trendStrength * 100).toFixed(2)}%`);
    } else if (trendStrength >= minTrendStrength) {
      validation.score += 3;
      validation.reasons.push(`✅ Tendência adequada: ${(trendStrength * 100).toFixed(2)}%`);
    } else {
      validation.warnings.push(`❌ Tendência fraca: ${(trendStrength * 100).toFixed(2)}% < ${(minTrendStrength * 100).toFixed(1)}%`);
    }
    
    // 3. Validação de RSI (5 pontos)
    const rsi = this.calculateRSI(price24h);
    const rsiMin = 30;
    const rsiMax = 70;
    const rsiOptimalMin = 40;
    const rsiOptimalMax = 60;
    
    if (rsi >= rsiMin && rsi <= rsiMax) {
      if (rsi >= rsiOptimalMin && rsi <= rsiOptimalMax) {
        validation.score += 5;
        validation.reasons.push(`✅ RSI em zona ótima: ${rsi.toFixed(1)}`);
      } else {
        validation.score += 3;
        validation.reasons.push(`✅ RSI em zona boa: ${rsi.toFixed(1)}`);
      }
    } else {
      validation.warnings.push(`❌ RSI em zona extrema: ${rsi.toFixed(1)} (${rsiMin}-${rsiMax} requerido)`);
    }
    
    // 4. Validação de Posição do Preço (3 pontos)
    const ema21Distance = Math.abs(currentPrice - ema21) / ema21;
    if (basicAnalysis.action === 'BUY' && currentPrice > ema21) {
      validation.score += 3;
      validation.reasons.push('✅ Preço acima EMA21 para compra');
    } else if (basicAnalysis.action === 'SELL' && currentPrice < ema21) {
      validation.score += 3;
      validation.reasons.push('✅ Preço abaixo EMA21 para venda');
    } else if (ema21Distance <= config.EMA_ADVANCED.MIN_SEPARATION) {
      validation.score += 2;
      validation.reasons.push('✅ Preço próximo da EMA21 (crossover)');
    } else {
      validation.warnings.push('❌ Posição do preço inadequada para EMA');
    }
    
    // 5. Validação de Volatilidade (2 pontos)
    if (stats?.priceChangePercent) {
      const volatility = Math.abs(parseFloat(stats.priceChangePercent));
      const minVol = config.MARKET_FILTERS.MIN_VOLATILITY;
      const maxVol = config.MARKET_FILTERS.MAX_VOLATILITY;
      
      if (volatility >= minVol && volatility <= maxVol) {
        validation.score += 2;
        validation.reasons.push(`✅ Volatilidade adequada: ${volatility.toFixed(1)}%`);
      } else {
        validation.warnings.push(`❌ Volatilidade inadequada: ${volatility.toFixed(1)}% (${minVol}-${maxVol}% requerido)`);
      }
    }
    
    // Critério de aprovação
    const minScore = Math.floor(config.EMA_ADVANCED.MIN_EMA_SCORE * 1.2);
    validation.isValid = validation.score >= minScore;
    
    return validation;
  }

  /**
   * 🎯 VALIDAÇÃO SUPORTE/RESISTÊNCIA
   */
  static validateSupportResistanceSignal(
    currentPrice: number, 
    levels: any[], 
    candles: any[], 
    decision: TradeDecision
  ): ValidationResult {
    const validation: ValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };
    
    const config = TradingConfigManager.getConfig();
    const srConfig = TradingConfigManager.getBotConfig().SUPPORT_RESISTANCE;
    
    // 1. Validação de Níveis Próximos (5 pontos)
    const tolerance = currentPrice * (srConfig?.MAX_DISTANCE || 0.005);
    const nearbyLevels = levels.filter(level =>
      Math.abs(level.price - currentPrice) <= tolerance * 3 &&
      level.touches >= (srConfig?.MIN_TOUCHES || 2)
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
    
    // 2. Validação de Força dos Níveis (5 pontos)
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
    
    // 3. Validação de Tendência (5 pontos)
    const trend = this.analyzeTrend(candles);
    if ((decision.action === 'BUY' && trend === 'up') || 
        (decision.action === 'SELL' && trend === 'down')) {
      validation.score += 5;
      validation.reasons.push(`✅ Tendência alinhada: ${trend}`);
    } else if (trend === 'sideways') {
      validation.score += 3;
      validation.reasons.push(`✅ Mercado lateral favorável`);
    } else {
      validation.warnings.push(`❌ Tendência contrária: ${trend}`);
    }
    
    // Critério de aprovação
    const minScore = Math.floor((srConfig?.MIN_TOUCHES || 2) * 5);
    validation.isValid = validation.score >= minScore;
    
    return validation;
  }

  /**
   * 🚀 VALIDAÇÃO ULTRA-CONSERVADORA
   */
  static validateUltraConservative(
    symbol: string, 
    marketData: MarketData, 
    decision: TradeDecision
  ): ValidationResult {
    const validation: ValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: [],
      riskLevel: 'HIGH'
    };
    
    const config = TradingConfigManager.getConfig();
    
    // 1. Validação de Confiança (25 pontos)
    if (decision.confidence >= 95) {
      validation.score += 25;
      validation.reasons.push(`✅ Confiança excepcional: ${decision.confidence}%`);
      validation.riskLevel = 'LOW';
    } else if (decision.confidence >= 90) {
      validation.score += 20;
      validation.reasons.push(`✅ Confiança muito alta: ${decision.confidence}%`);
      validation.riskLevel = 'MEDIUM';
    } else if (decision.confidence >= config.MIN_CONFIDENCE) {
      validation.score += 15;
      validation.reasons.push(`✅ Confiança mínima: ${decision.confidence}%`);
    } else {
      validation.warnings.push(`❌ Confiança insuficiente: ${decision.confidence}% < ${config.MIN_CONFIDENCE}%`);
    }
    
    // 2. Validação EMA (25 pontos)
    const emaValidation = this.validateEmaSignal(marketData, decision);
    validation.score += Math.floor(emaValidation.score * 1.25);
    validation.reasons.push(...emaValidation.reasons);
    validation.warnings.push(...emaValidation.warnings);
    
    // 3. Validação de Símbolo (25 pontos)
    if (config.SYMBOLS.includes(symbol)) {
      validation.score += 15;
      validation.reasons.push(`✅ Símbolo aprovado: ${symbol}`);
    } else {
      validation.warnings.push(`❌ Símbolo não aprovado: ${symbol}`);
    }
    
    if (['BTCUSDT', 'ETHUSDT'].includes(symbol)) {
      validation.score += 10;
      validation.reasons.push(`✅ Símbolo premium: ${symbol}`);
    }
    
    // Critério ultra-rigoroso: 80/100 pontos
    validation.isValid = validation.score >= 80;
    validation.confidence = Math.min(100, validation.score);
    
    return validation;
  }

  /**
   * 📊 VALIDAÇÃO DE SIMULAÇÃO
   */
  static validateSimulation(
    marketData: MarketData, 
    decision: TradeDecision
  ): ValidationResult {
    const validation: ValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };
    
    const config = TradingConfigManager.getConfig();
    
    // 1. Validação de Confiança (40 pontos)
    if (decision.confidence >= config.MIN_CONFIDENCE) {
      validation.score += 40;
      validation.reasons.push(`✅ Confiança adequada: ${decision.confidence}%`);
    } else {
      validation.warnings.push(`❌ Confiança baixa: ${decision.confidence}%`);
    }
    
    // 2. Validação EMA Simplificada (40 pontos)
    const emaValidation = this.validateEmaSignal(marketData, decision);
    validation.score += Math.floor(emaValidation.score * 2);
    validation.reasons.push(...emaValidation.reasons.slice(0, 2));
    validation.warnings.push(...emaValidation.warnings.slice(0, 2));
    
    // 3. Validação de Ação (20 pontos)
    if (decision.action !== 'HOLD') {
      validation.score += 20;
      validation.reasons.push(`✅ Ação definida: ${decision.action}`);
    } else {
      validation.warnings.push(`❌ Nenhuma ação recomendada`);
    }
    
    // Critério relaxado: 60/100 pontos
    validation.isValid = validation.score >= 60;
    validation.confidence = Math.min(100, validation.score);
    
    return validation;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private static analyzeTrend(candles: any[]): 'up' | 'down' | 'sideways' {
    if (candles.length < 3) return 'sideways';

    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const change = (last - first) / first;

    const config = TradingConfigManager.getConfig();
    const trendThreshold = config.EMA_ADVANCED.MIN_TREND_STRENGTH;
    
    if (change > trendThreshold) return 'up';
    if (change < -trendThreshold) return 'down';
    return 'sideways';
  }

  /**
   * 🎯 MÉTODO PRINCIPAL - SELETOR DE VALIDAÇÃO
   */
  static validate(
    type: 'EMA' | 'SUPPORT_RESISTANCE' | 'ULTRA_CONSERVATIVE' | 'SIMULATION',
    data: {
      marketData: MarketData;
      decision: TradeDecision;
      symbol?: string;
      levels?: any[];
      candles?: any[];
    }
  ): ValidationResult {
    switch (type) {
      case 'EMA':
        return this.validateEmaSignal(data.marketData, data.decision);
      
      case 'SUPPORT_RESISTANCE':
        return this.validateSupportResistanceSignal(
          data.marketData.currentPrice,
          data.levels || [],
          data.candles || [],
          data.decision
        );
      
      case 'ULTRA_CONSERVATIVE':
        return this.validateUltraConservative(
          data.symbol || '',
          data.marketData,
          data.decision
        );
      
      case 'SIMULATION':
        return this.validateSimulation(data.marketData, data.decision);
      
      default:
        return {
          isValid: false,
          score: 0,
          reasons: [],
          warnings: ['❌ Tipo de validação não reconhecido']
        };
    }
  }
}