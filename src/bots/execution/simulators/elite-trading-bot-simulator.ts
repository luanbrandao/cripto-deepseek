import { BaseTradingBot } from '../../core/base-trading-bot';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { TradingConfigManager } from '../../../core';
import { TechnicalCalculator } from '../../../shared/calculations';
import { getMarketData } from '../../utils/data/market-data-fetcher';
// Elite components removed - using existing risk management
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import * as fs from 'fs';
import * as path from 'path';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';

// Configurações Elite - Sistema de 5 Camadas
const ELITE_CONFIG = {
  SYMBOLS: TradingConfigManager.getConfig().SYMBOLS,
  MIN_CONFIDENCE: TradingConfigManager.getConfig().HIGH_CONFIDENCE,
  MIN_SCORE: 85,           // Score mínimo total (pré-validação + IA)
  PERFECT_SCORE: 95,
  PRE_VALIDATION_MIN: 60,  // Score mínimo para chamar IA
  MIN_RR: TradingConfigManager.getConfig().MIN_RISK_REWARD_RATIO * 2, // 4.0
  TARGET_RR: TradingConfigManager.getConfig().MIN_RISK_REWARD_RATIO * 3, // 6.0
  PERFECT_RR: TradingConfigManager.getConfig().MIN_RISK_REWARD_RATIO * 4, // 8.0
  MAX_TRADES_DAY: TradingConfigManager.getConfig().LIMITS.MAX_ACTIVE_TRADES,
  COOLDOWN_HOURS: 6,
  TIMEFRAME: TradingConfigManager.getConfig().CHART.TIMEFRAME,
  PERIODS: TradingConfigManager.getConfig().CHART.PERIODS,

  // Pesos das camadas de pré-validação
  WEIGHTS: {
    EMA_CONFLUENCE: 20,      // Alinhamento EMA (8>21>55>200)
    SUPPORT_RESISTANCE: 20,  // Proximidade a suporte forte
    CANDLE_PATTERNS: 20,     // Padrões de reversão
    VOLUME_MOMENTUM: 15,     // Volume e momentum
    AI_ANALYSIS: 25          // Análise DeepSeek (só se passou pré-validação)
  }
};

export class EliteTradingBotSimulator extends BaseTradingBot {
  private tradesFile: string;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
    this.tradesFile = path.resolve(`${TradingConfigManager.getConfig().PATHS.TRADES_DIR}/${TradingConfigManager.getConfig().FILES.ELITE_SIMULATOR}`);
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();

    console.log('🏆 ELITE TRADING BOT SIMULATOR v6.0 - TYPESCRIPT CORRIGIDO - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🏆 ELITE SIMULATOR v6.0 - TS FIXED', 'Win Rate Target: 95%+ | 7-Layer Smart Validation | TypeScript Corrigido', true);
    console.log('🔧 Atualizações v6.0 (TypeScript + Elite Validation):');
    console.log('   ✅ Correções TypeScript: TradeDecision.validationScore + activeLayers');
    console.log('   ✅ Smart Pre-Validation: 7 camadas ultra-rigorosas');
    console.log('   ✅ Elite Scoring: Sistema de pontuação 0-125 (pre-val + IA)');
    console.log('   ✅ AI Integration: DeepSeek só após pré-validação 60+/100');
    console.log('   ✅ Risk Classification: Classificação automática de risco');
    console.log('   ✅ Fallback Protection: Valores undefined protegidos\n');
    console.log('🎯 Elite Validation Layers (7 Camadas Config-Based):');
    const eliteConfig = TradingConfigManager.getConfig();
    console.log(`   📈 EMA: Alinhamento 8>${eliteConfig.EMA.FAST_PERIOD}>55>200 + Inclinação (20pts)`);
    console.log('   📊 RSI: Zona neutra 14-período (15pts)');
    console.log(`   📊 Volume: ${(eliteConfig.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.6).toFixed(1)}x média mínimo (15pts)`);
    console.log(`   🎯 Support/Resistance: Proximidade ${(eliteConfig.EMA_ADVANCED.MIN_SEPARATION * 6000).toFixed(1)}% (20pts)`);
    console.log(`   ⚡ Momentum: ${(eliteConfig.EMA_ADVANCED.MIN_TREND_STRENGTH * 150).toFixed(1)}% mínimo (15pts)`);
    console.log(`   📉 Volatilidade: ${eliteConfig.MARKET_FILTERS.MAX_VOLATILITY}% máximo (10pts)`);
    console.log(`   🎯 Confidence: ${ELITE_CONFIG.MIN_CONFIDENCE}% mínimo (25pts)`);
    console.log('   🤖 AI Analysis: DeepSeek BUY + EMA forte (25pts)\n');
    console.log('🎯 Critérios Elite Ultra-Rigorosos:');
    console.log(`   📊 Pré-Validação Mínima: ${ELITE_CONFIG.PRE_VALIDATION_MIN}/100`);
    console.log(`   🎯 Score Total Mínimo: ${ELITE_CONFIG.MIN_SCORE}/125`);
    console.log(`   🤖 Confiança IA Mínima: ${ELITE_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`   ⚖️ Risk/Reward Mínimo: ${ELITE_CONFIG.MIN_RR}:1`);
    console.log(`   ⏰ Cooldown Elite: ${ELITE_CONFIG.COOLDOWN_HOURS}h entre trades`);
    console.log(`   🪙 Símbolos Elite: ${ELITE_CONFIG.SYMBOLS.join(', ')}`);
    console.log('🧪 MODO SIMULAÇÃO ELITE - Zero risco financeiro\n');
  }

  async executeTrade() {
    return await this.executeEliteAnalysis();
  }

  async executeEliteAnalysis() {
    this.logBotInfo();

    console.log('\n🏆 INICIANDO ANÁLISE ELITE - 5 CAMADAS DE VALIDAÇÃO');
    console.log('='.repeat(70));
    console.log(`🎯 Símbolos Elite: ${ELITE_CONFIG.SYMBOLS.join(', ')}`);
    console.log(`🛡️ Pré-validação Mínima: ${ELITE_CONFIG.PRE_VALIDATION_MIN}/75 pontos`);
    console.log(`🧠 Confiança IA Mínima: ${ELITE_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`📊 Score Total Mínimo: ${ELITE_CONFIG.MIN_SCORE}/100`);
    console.log(`⚖️ Risk/Reward Mínimo: ${ELITE_CONFIG.MIN_RR}:1`);
    console.log(`🔍 Camadas: EMA(${ELITE_CONFIG.WEIGHTS.EMA_CONFLUENCE}) + S/R(${ELITE_CONFIG.WEIGHTS.SUPPORT_RESISTANCE}) + Candle(${ELITE_CONFIG.WEIGHTS.CANDLE_PATTERNS}) + Vol(${ELITE_CONFIG.WEIGHTS.VOLUME_MOMENTUM}) + IA(${ELITE_CONFIG.WEIGHTS.AI_ANALYSIS})`);
    console.log('='.repeat(70));

    try {
      // Verificar cooldown
      if (!this.checkCooldown()) {
        return;
      }

      // Analisar múltiplos símbolos
      const bestSetup = await this.analyzeMultipleSymbols();

      if (!bestSetup) {
        console.log('\n⏸️ NENHUM SETUP ELITE ENCONTRADO');
        console.log('🔍 Aguardando confluência perfeita das 5 camadas...');
        return;
      }

      // Validar setup final antes da execução
      if (this.validateFinalSetup(bestSetup)) {
        await this.executeEliteSetup(bestSetup);
      } else {
        console.log('\n❌ SETUP REJEITADO na validação final');
      }

    } catch (error) {
      console.error('❌ Erro na análise elite:', error);
    }
  }

  private async analyzeMultipleSymbols() {
    const setups = [];

    console.log('\n🔍 ESCANEAMENTO ELITE - ANÁLISE MULTI-SÍMBOLO');
    console.log('-'.repeat(50));

    for (const symbol of ELITE_CONFIG.SYMBOLS) {
      try {
        console.log(`\n📊 Analisando ${symbol}...`);

        // Buscar dados de mercado
        const marketData = await getMarketData(
          this.getBinancePublic(),
          symbol
        );

        // Validar dados de mercado
        if (!this.validateMarketData(marketData, symbol)) {
          continue;
        }

        // Análise Elite (5 camadas)
        const eliteScore = await this.performEliteAnalysis(symbol, marketData);

        if (eliteScore && eliteScore.totalScore >= ELITE_CONFIG.MIN_SCORE && eliteScore.aiDecision.action === 'BUY') {
          setups.push({
            symbol,
            score: eliteScore,
            marketData
          });

          console.log(`✅ ${symbol}: SETUP ELITE BUY DETECTADO (Score: ${eliteScore.totalScore}/100)`);
        } else if (eliteScore && eliteScore.totalScore >= ELITE_CONFIG.MIN_SCORE) {
          console.log(`⚠️ ${symbol}: Score alto mas não é BUY (${eliteScore.aiDecision.action})`);
        } else {
          console.log(`❌ ${symbol}: Setup não atende critérios elite (Score: ${eliteScore?.totalScore || 0})`);
        }

      } catch (error) {
        console.log(`❌ Erro ao analisar ${symbol}:`, error);
      }
    }

    if (setups.length === 0) {
      return null;
    }

    // Selecionar melhor setup
    const bestSetup = setups.sort((a, b) => b.score.totalScore - a.score.totalScore)[0];

    console.log('\n🏆 RESULTADO DO ESCANEAMENTO ELITE:');
    console.log('='.repeat(60));
    setups.forEach(setup => {
      const emoji = setup.score.totalScore >= ELITE_CONFIG.PERFECT_SCORE ? '🌟' : '⭐';
      const { emaScore, srScore, candleScore, volumeScore, aiScore } = setup.score;
      console.log(`${emoji} ${setup.symbol}: ${setup.score.totalScore}/100 (EMA:${emaScore} S/R:${srScore} Candle:${candleScore} Vol:${volumeScore} IA:${aiScore}) - ${setup.score.aiDecision.action}`);
    });
    console.log('='.repeat(60));

    console.log(`\n🎯 SETUP SELECIONADO: ${bestSetup.symbol}`);
    console.log(`📊 Score Final: ${bestSetup.score.totalScore}/100`);
    console.log(`🎖️ Classificação: ${this.getSetupClassification(bestSetup.score.totalScore)}`);

    return bestSetup;
  }

  private async performEliteAnalysis(symbol: string, marketData: any) {
    console.log(`   🔍 Iniciando análise das 5 camadas de validação...`);

    // SMART PRÉ-VALIDAÇÃO ELITE: Sistema de 7 camadas inteligentes
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(8, config.EMA.FAST_PERIOD, 20)
      .withRSI(14, 15)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.6, 15)
      .withSupportResistance(config.EMA_ADVANCED.MIN_SEPARATION * 60, 20)
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 1.5, 15)
      .withVolatility(config.MARKET_FILTERS.MAX_VOLATILITY, 10)
      .withConfidence(ELITE_CONFIG.MIN_CONFIDENCE, 25)
      .build()
      .validate(symbol, marketData, { action: 'BUY', confidence: 0 }, this.getBinancePublic());

    console.log(`   🛡️ Smart Pré-validação: ${smartValidation.totalScore}/100`);

    if (!smartValidation.isValid || smartValidation.totalScore < ELITE_CONFIG.PRE_VALIDATION_MIN) {
      console.log(`   ❌ Mercado não atende critérios mínimos (${smartValidation.totalScore}/${ELITE_CONFIG.PRE_VALIDATION_MIN}) - Pulando IA`);
      if (smartValidation.warnings && smartValidation.warnings.length > 0) {
        smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
      }
      return {
        emaScore: smartValidation.layerScores.ema || 0,
        srScore: smartValidation.layerScores.supportResistance || 0,
        candleScore: 0,
        volumeScore: smartValidation.layerScores.volume || 0,
        aiScore: 0,
        totalScore: smartValidation.totalScore,
        aiDecision: {
          action: 'HOLD',
          confidence: 0,
          reason: `Smart pré-validação insuficiente: ${smartValidation.totalScore}/${ELITE_CONFIG.PRE_VALIDATION_MIN}`,
          price: parseFloat(marketData.price.price),
          validationScore: smartValidation.totalScore
        }
      };
    }

    console.log(`   ✅ Smart pré-validação aprovada - Consultando IA...`);
    console.log(`   🔍 Camadas ativas: ${smartValidation.activeLayers.join(', ')}`);

    // Camada Final: AI Analysis - Só se passou na smart pré-validação
    const aiDecision = await UnifiedDeepSeekAnalyzer.analyzeRealTrade(
      this.deepseek!,
      symbol,
      marketData
    );

    // Validar se é BUY em tendência de alta com critérios rigorosos
    let aiScore = 0;
    const minEmaForBuy = 12; // Mínimo 60% do score EMA (12/20)
    const emaScore = smartValidation.layerScores.ema || 0;

    if (aiDecision.confidence >= ELITE_CONFIG.MIN_CONFIDENCE) {
      if (aiDecision.action === 'BUY') {
        if (emaScore >= minEmaForBuy) {
          aiScore = 25;
          console.log(`   ✅ IA aprovou BUY com EMA forte (${emaScore}/20)`);
        } else {
          console.log(`   ❌ IA recomenda BUY mas EMA insuficiente (${emaScore}/${minEmaForBuy})`);
        }
      } else {
        console.log(`   ❌ IA não recomenda BUY (${aiDecision.action})`);
      }
    } else {
      console.log(`   ❌ Confiança IA insuficiente (${aiDecision.confidence}%/${ELITE_CONFIG.MIN_CONFIDENCE}%)`);
    }

    console.log(`   🧠 AI Score: ${aiScore}/25 (${aiDecision.confidence}% confiança, ${aiDecision.action})`);

    const totalScore = smartValidation.totalScore + aiScore;

    if (totalScore >= ELITE_CONFIG.MIN_SCORE) {
      console.log(`   ✅ Score Total: ${totalScore}/125 - SETUP ELITE APROVADO!`);
    } else {
      console.log(`   ❌ Score Total: ${totalScore}/125 - Abaixo do mínimo (${ELITE_CONFIG.MIN_SCORE})`);
    }

    // Update aiDecision with validation score
    aiDecision.validationScore = smartValidation.totalScore;
    aiDecision.activeLayers = smartValidation.activeLayers;
    aiDecision.riskLevel = smartValidation.riskLevel;

    // Handle warnings properly
    if (smartValidation.warnings && smartValidation.warnings.length > 0) {
      console.log('⚠️ Smart validation warnings:');
      smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    return {
      emaScore: smartValidation.layerScores.ema || 0,
      srScore: smartValidation.layerScores.supportResistance || 0,
      candleScore: 0,
      volumeScore: smartValidation.layerScores.volume || 0,
      aiScore,
      totalScore,
      aiDecision,
      smartValidation
    };
  }

  private performPreValidation(marketData: any) {
    console.log(`   🔍 Executando pré-validação técnica...`);

    // Camada 1: EMA Confluence (20 pontos)
    const emaScore = this.validateEMAConfluence(marketData.klines);
    console.log(`   📈 EMA Confluence: ${emaScore}/20`);

    // Camada 2: Support/Resistance (20 pontos)
    const srScore = this.validateSupportResistance(marketData.klines, parseFloat(marketData.price.price));
    console.log(`   🎯 S/R Proximity: ${srScore}/20`);

    // Camada 3: Candlestick Patterns (20 pontos)
    const candleScore = this.validateCandlePatterns(marketData.klines);
    console.log(`   🕯️ Candle Patterns: ${candleScore}/20`);

    // Camada 4: Volume & Momentum (15 pontos)
    const volumeScore = this.validateVolumeAndMomentum(marketData.klines, marketData.stats);
    console.log(`   📊 Volume/Momentum: ${volumeScore}/15`);

    const totalScore = emaScore + srScore + candleScore + volumeScore;

    return {
      emaScore,
      srScore,
      candleScore,
      volumeScore,
      score: totalScore
    };
  }

  private validateEMAConfluence(klines: any[]): number {
    if (!klines || klines.length < 50) {
      console.log(`     ⚠️ Dados insuficientes para EMA (${klines?.length || 0}/50)`);
      return 0;
    }

    const closes = klines.map(k => parseFloat(k[4]));
    const currentPrice = closes[closes.length - 1];

    // Calcular EMAs (ajustado para dados disponíveis)
    const ema8 = TechnicalCalculator.calculateEMA(closes, 8);
    const ema21 = TechnicalCalculator.calculateEMA(closes, 21);
    const ema55 = closes.length >= 55 ? TechnicalCalculator.calculateEMA(closes, 55) : TechnicalCalculator.calculateEMA(closes, Math.min(closes.length - 1, 26));
    const ema200 = closes.length >= 50 ? TechnicalCalculator.calculateEMA(closes, Math.min(closes.length - 1, 50)) : TechnicalCalculator.calculateEMA(closes, Math.min(closes.length - 1, 26));

    let score = 0;
    const details = [];

    // 1. Alinhamento bullish (8 pontos) - adaptado para dados disponíveis
    const bullishAlignment = ema8 > ema21 && ema21 > ema55 && ema55 > ema200;
    if (bullishAlignment) {
      score += 8;
      details.push('✅ Alinhamento bullish');
    } else {
      details.push('❌ Sem alinhamento bullish');
    }

    // 2. Preço acima das EMAs (4 pontos)
    const priceAboveEMAs = currentPrice > ema8 && currentPrice > ema21;
    if (priceAboveEMAs) {
      score += 4;
      details.push('✅ Preço > EMAs');
    } else {
      details.push('❌ Preço abaixo EMAs');
    }

    // 3. Separação adequada (4 pontos)
    const sep1 = Math.abs(ema8 - ema21) / ema21;
    const sep2 = Math.abs(ema21 - ema55) / ema55;
    const minSeparation = TradingConfigManager.getConfig().EMA_ADVANCED.MIN_SEPARATION;
    if (sep1 > minSeparation && sep2 > minSeparation) {
      score += 4;
      details.push('✅ Separação adequada');
    } else {
      details.push(`❌ Separação insuficiente (${(sep1 * 100).toFixed(2)}%/${(sep2 * 100).toFixed(2)}%)`);
    }

    // 4. Inclinação positiva (4 pontos)
    const slope8 = this.calculateSlope(closes.slice(-10), 8);
    const slope21 = this.calculateSlope(closes.slice(-21), 21);
    if (slope8 > 0 && slope21 > 0) {
      score += 4;
      details.push('✅ Inclinação positiva');
    } else {
      details.push('❌ Inclinação negativa');
    }

    console.log(`     📈 EMA Details: ${details.join(', ')}`);
    return Math.min(score, 20);
  }

  private validateSupportResistance(klines: any[], currentPrice: number): number {
    if (!klines || klines.length < 50) {
      console.log(`     ⚠️ Dados insuficientes para S/R (${klines?.length || 0}/50)`);
      return 0;
    }

    const lows = klines.map(k => parseFloat(k[3]));

    let score = 0;
    const details = [];

    // Encontrar suportes próximos
    const supportLevels = this.findSupportLevels(lows, currentPrice);
    const nearestSupport = this.findNearestLevel(supportLevels, currentPrice, 'below');

    if (nearestSupport) {
      const distance = Math.abs(currentPrice - nearestSupport.level) / currentPrice;
      const distancePercent = (distance * 100).toFixed(2);

      // 1. Proximidade ideal ao suporte (10 pontos)
      const minDistance = TradingConfigManager.getConfig().EMA_ADVANCED.MIN_SEPARATION * 0.4;
      const maxDistance = TradingConfigManager.getConfig().EMA_ADVANCED.MIN_SEPARATION * 1.6;
      if (distance >= minDistance && distance <= maxDistance) {
        score += 10;
        details.push(`✅ Proximidade ideal (${distancePercent}%)`);
      } else if (distance <= TradingConfigManager.getConfig().EMA_ADVANCED.MIN_SEPARATION * 3) {
        score += 5;
        details.push(`⚠️ Proximidade aceitável (${distancePercent}%)`);
      } else {
        details.push(`❌ Muito distante (${distancePercent}%)`);
      }

      // 2. Força do nível (5 pontos)
      if (nearestSupport.touches >= 3) {
        score += 5;
        details.push(`✅ Nível forte (${nearestSupport.touches} toques)`);
      } else {
        details.push(`❌ Nível fraco (${nearestSupport.touches} toques)`);
      }

      // 3. Nível recente (5 pontos)
      if (nearestSupport.recent) {
        score += 5;
        details.push('✅ Nível recente');
      } else {
        details.push('❌ Nível antigo');
      }
    } else {
      details.push('❌ Nenhum suporte encontrado');
    }

    console.log(`     🎯 S/R Details: ${details.join(', ')}`);
    return Math.min(score, 20);
  }

  private validateCandlePatterns(klines: any[]): number {
    if (!klines || klines.length < 5) {
      console.log(`     ⚠️ Dados insuficientes para Candles (${klines?.length || 0}/5)`);
      return 0;
    }

    const recentCandles = klines.slice(-3);
    let score = 0;
    const details = [];
    let patternFound = false;

    for (const candle of recentCandles) {
      const open = parseFloat(candle[1]);
      const high = parseFloat(candle[2]);
      const low = parseFloat(candle[3]);
      const close = parseFloat(candle[4]);

      const body = Math.abs(close - open);
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      const totalRange = high - low;

      // Padrão Hammer (8 pontos)
      if (this.isHammer(body, upperShadow, lowerShadow, totalRange)) {
        score += 8;
        details.push('✅ Hammer detectado');
        patternFound = true;
        break;
      }

      // Padrão Doji (6 pontos)
      if (this.isDoji(body, totalRange)) {
        score += 6;
        details.push('✅ Doji detectado');
        patternFound = true;
        break;
      }

      // Candle bullish forte (6 pontos)
      if (close > open && body > totalRange * 0.6) {
        score += 6;
        details.push('✅ Candle bullish forte');
        patternFound = true;
        break;
      }
    }

    if (!patternFound) {
      details.push('❌ Nenhum padrão relevante');
    }

    console.log(`     🕯️ Candle Details: ${details.join(', ')}`);
    return Math.min(score, 20);
  }

  private validateVolumeAndMomentum(klines: any[], stats: any): number {
    if (!klines || klines.length < 20) {
      console.log(`     ⚠️ Dados insuficientes para Volume (${klines?.length || 0}/20)`);
      return 0;
    }

    const volumes = klines.slice(-20).map(k => parseFloat(k[5]));
    const closes = klines.slice(-20).map(k => parseFloat(k[4]));
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    let score = 0;
    const details = [];

    // 1. Volume acima da média (5 pontos)
    const volumeRatio = recentVolume / avgVolume;
    if (volumeRatio > 1.5) {
      score += 5;
      details.push(`✅ Volume alto (${volumeRatio.toFixed(1)}x)`);
    } else {
      details.push(`❌ Volume baixo (${volumeRatio.toFixed(1)}x)`);
    }

    // 2. Momentum positivo (5 pontos)
    const priceChange = parseFloat(stats.priceChangePercent);
    if (priceChange > 0) {
      score += 5;
      details.push(`✅ Momentum positivo (${priceChange.toFixed(2)}%)`);
    } else {
      details.push(`❌ Momentum negativo (${priceChange.toFixed(2)}%)`);
    }

    // 3. Volatilidade controlada (5 pontos)
    const volatility = this.calculateVolatility(closes);
    if (volatility < 3.0) {
      score += 5;
      details.push(`✅ Volatilidade controlada (${volatility.toFixed(1)}%)`);
    } else {
      details.push(`❌ Alta volatilidade (${volatility.toFixed(1)}%)`);
    }

    console.log(`     📊 Vol/Mom Details: ${details.join(', ')}`);
    return Math.min(score, 15);
  }

  // Métodos auxiliares - usando calculadoras centralizadas

  private calculateSlope(prices: number[], period: number): number {
    if (prices.length < 2) return 0;

    const ema1 = TechnicalCalculator.calculateEMA(prices.slice(0, -1), period);
    const ema2 = TechnicalCalculator.calculateEMA(prices, period);

    return (ema2 - ema1) / ema1;
  }

  private findSupportLevels(lows: number[], currentPrice: number) {
    const levels = [];
    const tolerance = currentPrice * (TradingConfigManager.getConfig().EMA_ADVANCED.MIN_SEPARATION * 2);

    for (let i = 1; i < lows.length - 1; i++) {
      if (lows[i] <= lows[i - 1] && lows[i] <= lows[i + 1]) {
        const level = lows[i];
        let touches = 1;

        for (let j = 0; j < lows.length; j++) {
          if (Math.abs(lows[j] - level) < tolerance) {
            touches++;
          }
        }

        if (touches >= 2) {
          levels.push({
            level,
            touches,
            recent: i > lows.length - 50 // Últimas 50 velas
          });
        }
      }
    }

    return levels.sort((a, b) => b.touches - a.touches);
  }

  private findNearestLevel(levels: any[], currentPrice: number, direction: string) {
    if (levels.length === 0) return null;

    const filteredLevels = direction === 'below'
      ? levels.filter(l => l.level < currentPrice)
      : levels.filter(l => l.level > currentPrice);

    if (filteredLevels.length === 0) return null;

    return filteredLevels.reduce((nearest, level) => {
      const distance = Math.abs(currentPrice - level.level);
      const nearestDistance = nearest ? Math.abs(currentPrice - nearest.level) : Infinity;
      return distance < nearestDistance ? level : nearest;
    }, null);
  }

  private isHammer(body: number, upperShadow: number, lowerShadow: number, totalRange: number): boolean {
    return (
      body < totalRange * 0.3 &&
      lowerShadow > body * 2 &&
      upperShadow < totalRange * 0.1
    );
  }

  private isDoji(body: number, totalRange: number): boolean {
    return body < totalRange * 0.05;
  }

  private calculateVolatility(closes: number[]): number {
    if (closes.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      const returnRate = (closes[i] - closes[i - 1]) / closes[i - 1];
      if (!isNaN(returnRate) && isFinite(returnRate)) {
        returns.push(returnRate);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * 100;
  }

  private async executeEliteSetup(setup: any) {
    const { symbol, score, marketData } = setup;
    const { aiDecision } = score;

    console.log('\n🚀 EXECUTANDO SETUP ELITE');
    console.log('='.repeat(50));
    console.log(`🎯 Símbolo: ${symbol}`);
    console.log(`📊 Ação: ${aiDecision.action}`);
    console.log(`💰 Preço: $${aiDecision.price}`);
    console.log(`🎖️ Score: ${score.totalScore}/100`);
    console.log(`🧠 Confiança IA: ${aiDecision.confidence}%`);

    // Calcular posição baseada no score
    const positionSize = this.calculatePositionSize(score.totalScore);
    const riskReward = this.calculateRiskReward(score.totalScore);

    console.log(`\n💎 CONFIGURAÇÃO ELITE:`);
    console.log(`📏 Tamanho da Posição: ${positionSize}% do capital`);
    console.log(`⚖️ Risk/Reward Target: ${riskReward}:1`);

    // Calcular preços de entrada e saída usando risk manager padrão
    const riskPercent = 1.0 / riskReward; // 1/4 = 0.25% para RR 4:1
    const rewardPercent = riskPercent * riskReward;

    const prices = {
      target1: aiDecision.price * (1 + rewardPercent * 0.4),
      target2: aiDecision.price * (1 + rewardPercent * 0.75),
      target3: aiDecision.price * (1 + rewardPercent),
      stopLoss: aiDecision.price * (1 - riskPercent)
    };

    console.log(`\n🎯 NÍVEIS DE PREÇO:`);
    console.log(`📈 Target 1 (40%): $${prices.target1.toFixed(4)}`);
    console.log(`📈 Target 2 (35%): $${prices.target2.toFixed(4)}`);
    console.log(`📈 Target 3 (25%): $${prices.target3.toFixed(4)}`);
    console.log(`🛑 Stop Loss: $${prices.stopLoss.toFixed(4)}`);

    // Salvar trade simulado
    const trade = {
      id: `ELITE_${Date.now()}`,
      timestamp: new Date().toISOString(),
      symbol,
      action: aiDecision.action,
      price: aiDecision.price,
      entryPrice: aiDecision.price,
      targetPrice: prices.target2, // Target principal
      stopPrice: prices.stopLoss,
      amount: TradingConfigManager.getConfig().TRADE_AMOUNT_USD * (positionSize / 100),
      confidence: aiDecision.confidence,
      reason: `Elite Setup (Score: ${score.totalScore}/100) - ${aiDecision.reason}`,
      status: 'pending',
      strategy: 'elite-5-layers',
      eliteScore: {
        total: score.totalScore,
        ema: score.emaScore,
        sr: score.srScore,
        candle: score.candleScore,
        volume: score.volumeScore,
        ai: score.aiScore
      },
      riskReward: riskReward,
      targets: {
        target1: prices.target1,
        target2: prices.target2,
        target3: prices.target3
      }
    };

    // Salvar no arquivo
    this.saveEliteTrade(trade);

    console.log(`\n✅ SIMULAÇÃO ELITE CONCLUÍDA!`);
    console.log(`💾 Trade salvo: ${symbol} ${aiDecision.action}`);
    console.log(`🏆 Classificação: ${this.getSetupClassification(score.totalScore)}`);
  }

  private calculatePositionSize(score: number): number {
    if (score >= ELITE_CONFIG.PERFECT_SCORE) return 1.5; // Setup perfeito
    if (score >= TradingConfigManager.getConfig().HIGH_CONFIDENCE) return 1.0; // Setup excelente
    return 0.5; // Setup bom
  }

  private calculateRiskReward(score: number): number {
    if (score >= ELITE_CONFIG.PERFECT_SCORE) return ELITE_CONFIG.PERFECT_RR; // 8:1
    if (score >= TradingConfigManager.getConfig().HIGH_CONFIDENCE) return ELITE_CONFIG.TARGET_RR; // 6:1
    return ELITE_CONFIG.MIN_RR; // 4:1
  }

  private getSetupClassification(score: number): string {
    if (score >= ELITE_CONFIG.PERFECT_SCORE) return '🌟 SETUP PERFEITO';
    if (score >= TradingConfigManager.getConfig().HIGH_CONFIDENCE) return '⭐ SETUP EXCELENTE';
    return '✨ SETUP BOM';
  }

  private validateMarketData(marketData: any, symbol: string): boolean {
    if (!marketData) {
      console.log(`❌ ${symbol}: Dados de mercado não encontrados`);
      return false;
    }

    if (!marketData.price || !marketData.price.price) {
      console.log(`❌ ${symbol}: Preço não disponível`);
      return false;
    }

    if (!marketData.stats || !marketData.stats.priceChangePercent) {
      console.log(`❌ ${symbol}: Estatísticas 24h não disponíveis`);
      return false;
    }

    if (!marketData.klines || !Array.isArray(marketData.klines) || marketData.klines.length < 50) {
      console.log(`❌ ${symbol}: Dados de klines insuficientes (${marketData.klines?.length || 0}/50)`);
      return false;
    }

    const price = parseFloat(marketData.price.price);
    if (isNaN(price) || price <= 0) {
      console.log(`❌ ${symbol}: Preço inválido: ${marketData.price.price}`);
      return false;
    }

    return true;
  }

  private validateFinalSetup(setup: any): boolean {
    const { score } = setup;
    const { aiDecision, emaScore, totalScore } = score;

    console.log('\n🔍 VALIDAÇÃO FINAL DO SETUP:');

    // 1. Verificar se é BUY
    if (aiDecision.action !== 'BUY') {
      console.log(`❌ Ação inválida: ${aiDecision.action} (esperado: BUY)`);
      return false;
    }

    // 2. Verificar score total
    if (totalScore < ELITE_CONFIG.MIN_SCORE) {
      console.log(`❌ Score insuficiente: ${totalScore}/${ELITE_CONFIG.MIN_SCORE}`);
      return false;
    }

    // 3. Verificar EMA para BUY (tendência de alta)
    if (emaScore < 12) {
      console.log(`❌ EMA insuficiente para BUY: ${emaScore}/20 (mínimo 12)`);
      return false;
    }

    // 4. Verificar confiança IA
    if (aiDecision.confidence < ELITE_CONFIG.MIN_CONFIDENCE) {
      console.log(`❌ Confiança IA insuficiente: ${aiDecision.confidence}%/${ELITE_CONFIG.MIN_CONFIDENCE}%`);
      return false;
    }

    console.log('✅ Todas as validações finais aprovadas!');
    return true;
  }

  private checkCooldown(): boolean {
    // Verificar se existe trade recente (simulação de cooldown)
    const now = Date.now();
    const cooldownMs = ELITE_CONFIG.COOLDOWN_HOURS * 60 * 60 * 1000;

    if (fs.existsSync(this.tradesFile)) {
      const trades = JSON.parse(fs.readFileSync(this.tradesFile, 'utf8'));
      const lastTrade = trades[trades.length - 1];

      if (lastTrade) {
        const lastTradeTime = new Date(lastTrade.timestamp).getTime();
        const timeDiff = now - lastTradeTime;

        if (timeDiff < cooldownMs) {
          const remainingHours = Math.ceil((cooldownMs - timeDiff) / (60 * 60 * 1000));
          console.log(`\n⏰ COOLDOWN ATIVO: Aguarde ${remainingHours}h para próximo trade elite`);
          return false;
        }
      }
    }

    return true;
  }

  private saveEliteTrade(trade: any) {
    try {
      let trades = [];

      if (fs.existsSync(this.tradesFile)) {
        trades = JSON.parse(fs.readFileSync(this.tradesFile, 'utf8'));
      }

      trades.push(trade);

      // Manter apenas últimos 50 trades
      if (trades.length > 50) {
        trades = trades.slice(-50);
      }

      fs.writeFileSync(this.tradesFile, JSON.stringify(trades, null, 2));

    } catch (error) {
      console.error('❌ Erro ao salvar trade elite:', error);
    }
  }
}

// Execução direta
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const eliteBot = new EliteTradingBotSimulator(apiKey, apiSecret);
    await eliteBot.executeEliteAnalysis();
  };

  logBotStartup(
    'Elite Trading Bot Simulator v6.0 - TYPESCRIPT FIXED',
    '🏆 Elite v6.0 - TypeScript Corrigido + 7-Layer Smart Validation\n🔧 Correções: TradeDecision Interface + AI Integration + Fallback Protection\n🧪 Modo elite - Apenas simulação ultra-rigorosa, sem trades reais',
    3000,
    true
  ).then(() => main());
}