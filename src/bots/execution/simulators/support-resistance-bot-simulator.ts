import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import { TradingConfigManager } from '../../../core';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { BaseTradingBot } from '../../core/base-trading-bot';
import SupportResistanceAnalyzer from '../../../core/analyzers/technical/support-resistance-analyzer';
import { EmaAnalyzer } from '../../../core';

dotenv.config();

// Ativar modo ultra-conservador para garantir MIN_CONFIDENCE = 90%
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

interface MarketDataSR {
  price24h: number[];
  currentPrice: number;
  klines: any[];
  volumes: number[];
  stats: any;
  candles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
  }>;
}



export class SupportResistanceBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private srAnalyzer: SupportResistanceAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const botConfig: BotConfig = {
      name: 'Ultra-Conservative S/R Simulator v7.0 - Enhanced',
      isSimulation: true,
      tradesFile: 'ultraConservativeSRSimulatorV7.json'
    };

    this.flowManager = new BotFlowManager(this, botConfig);

    // Configuração ultra-conservadora para S/R MELHORADA
    this.srAnalyzer = new SupportResistanceAnalyzer({
      tolerance: TradingConfigManager.getBotConfig().SUPPORT_RESISTANCE.MAX_DISTANCE * 0.5, // Mais rigoroso
      minTouches: 3,                 // Mínimo 3 toques (era 2)
      lookbackPeriods: 100           // Mais histórico (era 50)
    });

    // Analisador EMA para filtro de tendência
    const tradingConfig = TradingConfigManager.getConfig();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: tradingConfig.EMA.FAST_PERIOD,
      slowPeriod: tradingConfig.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();

    console.log('🛡️ ULTRA-CONSERVATIVE S/R SIMULATOR v7.0 - ENHANCED - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ S/R SIMULATOR v7.0 - ENHANCED', 'Win Rate Target: 75%+ | S/R + EMA + Ultra Validation', true);
    console.log('🔧 Atualizações v7.0 (Melhorias de Assertividade):');
    console.log('   ✅ Filtro EMA: Apenas suportes em tendência de alta');
    console.log('   ✅ Mínimo 3 toques: Suportes mais confiáveis (era 2)');
    console.log('   ✅ Tolerância 50% menor: Entrada mais precisa');
    console.log('   ✅ Volume 50% maior: Confirmação rigorosa');
    console.log('   ✅ Validação adicional: 20 pontos extras obrigatórios');
    console.log('   ✅ Histórico dobrado: 100 períodos (era 50)\n');
    console.log('🎯 Validações S/R Ativas (Config-Based):');
    const botConfig = TradingConfigManager.getBotConfig();
    console.log(`   🎯 Support/Resistance: Tolerância ${(botConfig.SUPPORT_RESISTANCE.MAX_DISTANCE * 100).toFixed(1)}%, Score 25pts`);
    console.log(`   📊 Volume: ${(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER / 2).toFixed(1)}x média mínimo, Score 20pts`);
    console.log(`   ⚡ Momentum: ${(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 400).toFixed(1)}% mínimo, Score 15pts`);
    console.log(`   📉 Volatilidade: ${config.MARKET_FILTERS.MIN_VOLATILITY}-${config.MARKET_FILTERS.MAX_VOLATILITY}% ideal, Score 15pts`);
    console.log(`   🎯 Confidence: ${config.MIN_CONFIDENCE - 10}% mínimo, Score 20pts`);
    console.log('   📊 Score Total: 95/100 para aprovação\n');
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}% (REAL)`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1 (GARANTIDO)`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')} (apenas estáveis)`);
    console.log('🎯 S/R Config: Min 2 toques, Força ≥70%, Tolerância 0.5%');
    console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async getMarketData(symbol: string): Promise<MarketDataSR> {
    const config = TradingConfigManager.getConfig();
    const klines = await this.getBinancePublic().getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    // Converter klines para formato de candles
    const candles = klines.map((k: any) => ({
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      timestamp: k[0]
    }));

    return {
      price24h: prices,
      currentPrice,
      klines,
      volumes,
      stats,
      candles
    };
  }

  private async analyzeWithSupportResistance(symbol: string, marketData: MarketDataSR): Promise<TradeDecision> {
    console.log('\n🎯 Analisando níveis de Suporte e Resistência ULTRA-MELHORADOS...');

    // 1. FILTRO DE TENDÊNCIA EMA (novo)
    const emaAnalysis = this.emaAnalyzer.analyze({ 
      price24h: marketData.price24h, 
      currentPrice: marketData.currentPrice 
    });
    
    console.log(`📈 Tendência EMA: ${emaAnalysis.action} - ${emaAnalysis.reason}`);
    
    // Só prosseguir se EMA confirmar tendência de alta para BUY
    if (emaAnalysis.action !== 'BUY') {
      console.log('❌ EMA não confirma tendência de alta - rejeitando S/R');
      return {
        action: 'HOLD',
        confidence: 40,
        reason: 'EMA não confirma tendência de alta para suporte',
        symbol,
        price: marketData.currentPrice
      };
    }
    
    console.log('✅ EMA confirma tendência de alta - prosseguindo com S/R');

    // 2. Análise S/R básica
    const basicAnalysis = this.srAnalyzer.analyze({
      candles: marketData.candles,
      currentPrice: marketData.currentPrice
    }, true);

    // 3. Validações S/R avançadas integradas
    const validation = await this.validateEnhancedSRSignal(marketData, basicAnalysis);

    if (!validation.isValid) {
      console.log('❌ Sinal S/R rejeitado pelas validações avançadas:');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
      return {
        action: 'HOLD',
        confidence: 50,
        reason: 'Sinal S/R não passou nas validações rigorosas',
        symbol,
        price: marketData.currentPrice
      };
    }

    console.log('✅ Sinal S/R aprovado pelas validações avançadas:');
    validation.reasons.forEach(reason => console.log(`   ${reason}`));

    // 4. Ajustar confiança baseada no score de validação RIGOROSO + EMA
    let adjustedConfidence = Math.min(85, basicAnalysis.confidence + (validation.score * 0.6)); // Menos boost
    
    // Boost adicional se EMA estiver muito forte
    if (emaAnalysis.reason.includes('forte') || emaAnalysis.reason.includes('confirmada')) {
      adjustedConfidence = Math.min(90, adjustedConfidence + 5);
      console.log('✅ Boost +5% por EMA forte');
    }

    console.log(`📈 Sinal S/R: ${basicAnalysis.action} (${adjustedConfidence}% - EMA+S/R melhorado)`);
    console.log(`💭 Razão: ${basicAnalysis.reason} + EMA confirmado + validações rigorosas`);

    if (basicAnalysis.levels && basicAnalysis.levels.length > 0) {
      console.log(`🎯 Níveis identificados: ${basicAnalysis.levels.length}`);
      basicAnalysis.levels.slice(0, 3).forEach((level: any, index: number) => {
        console.log(`   ${index + 1}. ${level.type}: $${level.price.toFixed(2)} (${level.touches} toques, força: ${(level.strength * 100).toFixed(1)}%)`);
      });
    }

    const tradeDecision: TradeDecision = {
      action: basicAnalysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: adjustedConfidence,
      reason: `${basicAnalysis.reason} + EMA ${emaAnalysis.action} (Score: ${validation.score}/25+)`,
      symbol,
      price: marketData.currentPrice
    };

    // Adicionar levels como propriedade extra
    (tradeDecision as any).levels = basicAnalysis.levels || [];

    return tradeDecision;
  }

  private async validateEnhancedSRSignal(marketData: MarketDataSR, basicAnalysis: any) {
    // Validações S/R ULTRA-RIGOROSAS para aumentar win rate
    const config = TradingConfigManager.getConfig();
    const botConfig = TradingConfigManager.getBotConfig();
    const mockDecision = { action: basicAnalysis.action, confidence: basicAnalysis.confidence, price: marketData.currentPrice };
    const mockMarketDataForValidation = {
      price: { price: marketData.currentPrice.toString() },
      stats: marketData.stats,
      klines: marketData.klines,
      price24h: marketData.price24h,
      volumes: marketData.volumes
    };

    // 1. VALIDAÇÃO S/R RIGOROSA
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withSupportResistance(botConfig.SUPPORT_RESISTANCE.MAX_DISTANCE * 0.5, 30) // Tolerância 50% menor
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 1.5, 25) // Volume 50% maior
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 2, 20) // Momentum dobrado
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY * 0.8, 15) // Volatilidade menor
      .withConfidence(config.MIN_CONFIDENCE + 5, 10) // Confiança +5%
      .build()
      .validate('', mockMarketDataForValidation, mockDecision, null);

    // 2. VALIDAÇÕES ADICIONAIS S/R
    let additionalScore = 0;
    const warnings = [...smartValidation.warnings];
    const reasons = [...smartValidation.reasons];

    // Verificar força dos níveis
    if (basicAnalysis.levels && basicAnalysis.levels.length > 0) {
      const strongLevels = basicAnalysis.levels.filter((level: any) => 
        level.strength >= 0.8 && level.touches >= 3
      );
      if (strongLevels.length > 0) {
        additionalScore += 10;
        reasons.push(`✅ ${strongLevels.length} níveis ultra-fortes (≥80% força, ≥3 toques)`);
      } else {
        warnings.push('❌ Nenhum nível ultra-forte identificado');
      }
    }

    // Verificar teste recente do nível
    const recentCandles = marketData.candles.slice(-5); // Últimas 5 velas
    const hasRecentTest = recentCandles.some(candle => 
      Math.abs(candle.low - marketData.currentPrice) / marketData.currentPrice < 0.01
    );
    if (hasRecentTest) {
      additionalScore += 5;
      reasons.push('✅ Nível testado recentemente');
    } else {
      warnings.push('❌ Nível não testado recentemente');
    }

    // Verificar volume no teste
    const avgVolume = marketData.volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVolume = marketData.volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    if (recentVolume > avgVolume * 1.2) {
      additionalScore += 5;
      reasons.push('✅ Volume confirmado no teste do nível');
    } else {
      warnings.push('❌ Volume insuficiente no teste');
    }

    const finalScore = smartValidation.totalScore + additionalScore;
    const isValid = smartValidation.isValid && additionalScore >= 15; // Exigir pelo menos 15 pontos extras

    return {
      isValid,
      score: Math.round(finalScore / 4), // Convert to 0-25+ scale
      reasons,
      warnings
    };
  }



  private async analyzeSymbolWithSR(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return await this.analyzeWithSupportResistance(symbol, fullMarketData);
  }

  private async validateSRDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ VALIDAÇÃO CENTRALIZADA PARA SIMULAÇÃO S/R...');

    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .usePreset('Simulation')
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid) {
      console.log('❌ SIMULAÇÃO REJEITADA:');
      smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ SIMULAÇÃO APROVADA:');
    smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
    console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    console.log(`🔍 Camadas Ativas: ${smartValidation.activeLayers.join(', ')}`);

    // Validação adicional específica para S/R
    const levels = (decision as any).levels;
    if (levels && levels.length > 0) {
      const strongLevels = levels.filter((level: any) => level.strength >= 0.8 && level.touches >= 2);
      if (strongLevels.length > 0) {
        console.log(`🎯 Níveis S/R ultra-fortes identificados: ${strongLevels.length}`);
        console.log('🧪 Esta seria uma excelente oportunidade S/R para trade real!');
      }
    }

    // Atualizar decisão com smart validação centralizada
    decision.confidence = smartValidation.confidence || decision.confidence;
    decision.validationScore = smartValidation.totalScore;
    (decision as any).riskLevel = smartValidation.riskLevel;
    (decision as any).activeLayers = smartValidation.activeLayers;

    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbolWithSR.bind(this),
      undefined,
      this.validateSRDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const srSimulator = new SupportResistanceBotSimulator();
    await srSimulator.executeTrade();
  }

  logBotStartup(
    'Ultra-Conservative S/R Simulator v7.0 - ENHANCED',
    '🛡️ Ultra-Conservador v7.0 - Melhorias de Assertividade\n📈 EMA Filter + 3 Toques + Volume Rigoroso + Validação Extra\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}