import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import { SupportResistanceAnalyzer, TradingConfigManager } from '../../../core';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { BaseTradingBot } from '../../core/base-trading-bot';

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

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative S/R Simulator v6.0 - TS Fixed',
      isSimulation: true,
      tradesFile: 'ultraConservativeSRSimulatorV6.json'
    };

    this.flowManager = new BotFlowManager(this, config);

    // Configuração ultra-conservadora para S/R
    this.srAnalyzer = new SupportResistanceAnalyzer({
      tolerance: TradingConfigManager.getBotConfig().SUPPORT_RESISTANCE.MAX_DISTANCE, // Baseado na config
      minTouches: 2,                 // Mínimo 2 toques
      lookbackPeriods: 50            // ↑ Mais histórico (era 25)
    });
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();

    console.log('🛡️ ULTRA-CONSERVATIVE S/R SIMULATOR v6.0 - TYPESCRIPT CORRIGIDO - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ S/R SIMULATOR v6.0 - TS FIXED', 'Win Rate Target: 85%+ | S/R + Smart Validation | TypeScript Corrigido', true);
    console.log('🔧 Atualizações v6.0 (TypeScript + Validações):');
    console.log('   ✅ Correções TypeScript: Async/await em validateEnhancedSRSignal');
    console.log('   ✅ Smart Pre-Validation: 5 camadas customizadas para S/R');
    console.log('   ✅ Score Conversion: 0-100 → 0-25 scale para S/R');
    console.log('   ✅ Level Analysis: Detecção de níveis ultra-fortes');
    console.log('   ✅ Risk Classification: Classificação automática de risco');
    console.log('   ✅ Validation Score: Integração com TradeDecision interface\n');
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
    console.log('\n🎯 Analisando níveis de Suporte e Resistência MELHORADOS...');

    // 1. Análise S/R básica
    const basicAnalysis = this.srAnalyzer.analyze({
      candles: marketData.candles,
      currentPrice: marketData.currentPrice
    }, true);

    // 2. Validações S/R avançadas integradas
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

    // 3. Ajustar confiança baseada no score de validação
    const adjustedConfidence = Math.min(95, basicAnalysis.confidence + validation.score);

    console.log(`📈 Sinal S/R: ${basicAnalysis.action} (${adjustedConfidence}% - melhorado)`);
    console.log(`💭 Razão: ${basicAnalysis.reason} + validações rigorosas`);

    if (basicAnalysis.levels && basicAnalysis.levels.length > 0) {
      console.log(`🎯 Níveis identificados: ${basicAnalysis.levels.length}`);
      basicAnalysis.levels.slice(0, 3).forEach((level: any, index: number) => {
        console.log(`   ${index + 1}. ${level.type}: $${level.price.toFixed(2)} (${level.touches} toques, força: ${(level.strength * 100).toFixed(1)}%)`);
      });
    }

    const tradeDecision: TradeDecision = {
      action: basicAnalysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: adjustedConfidence,
      reason: `${basicAnalysis.reason} (Score validação: ${validation.score}/25)`,
      symbol,
      price: marketData.currentPrice
    };

    // Adicionar levels como propriedade extra
    (tradeDecision as any).levels = basicAnalysis.levels || [];

    return tradeDecision;
  }

  private async validateEnhancedSRSignal(marketData: MarketDataSR, basicAnalysis: any) {
    // Usar smart pré-validação S/R específica com valores das configs
    const config = TradingConfigManager.getConfig();
    const botConfig = TradingConfigManager.getBotConfig();
    const mockDecision = { action: basicAnalysis.action, confidence: basicAnalysis.confidence, price: marketData.currentPrice };
    const mockMarketDataForValidation = {
      price: { price: marketData.currentPrice.toString() },
      stats: marketData.stats,
      klines: marketData.klines
    };

    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withSupportResistance(botConfig.SUPPORT_RESISTANCE.MAX_DISTANCE, 25)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER / 2, 20) // 1.0x ou 1.5x
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 4, 15) // 0.04 ou 0.08
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY, 15)
      .withConfidence(config.MIN_CONFIDENCE, 20) // 65% ou 82%
      .build()
      .validate('', mockMarketDataForValidation, mockDecision, null);

    return {
      isValid: smartValidation.isValid,
      score: Math.round(smartValidation.totalScore / 4), // Convert to 0-25 scale
      reasons: smartValidation.reasons,
      warnings: smartValidation.warnings
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
    'Ultra-Conservative S/R Simulator v6.0 - TYPESCRIPT FIXED',
    '🛡️ Ultra-Conservador v6.0 - TypeScript Corrigido + Smart S/R Validation\n🔧 Correções: Async/Await + Score Conversion + Level Analysis\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}