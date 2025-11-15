import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import TradingConfigManager from '../../../shared/config/trading-config-manager';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { BaseTradingBot } from '../../core/base-trading-bot';

dotenv.config();

// Ativar modo ultra-conservador para garantir MIN_CONFIDENCE = 90%
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

interface MarketData {
  price24h: number[];
  currentPrice: number;
  klines: any[];
  volumes: number[];
  stats: any;
}



export class EmaTradingBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative EMA Simulator v6.0 - TS Fixed',
      isSimulation: true,
      tradesFile: 'ultraConservativeEmaSimulatorV6.json'
    };

    this.flowManager = new BotFlowManager(this, config);
    const tradingConfig = TradingConfigManager.getConfig();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: tradingConfig.EMA.FAST_PERIOD,
      slowPeriod: tradingConfig.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();
    
    console.log('🛡️ ULTRA-CONSERVATIVE EMA SIMULATOR v6.0 - TYPESCRIPT CORRIGIDO - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ EMA SIMULATOR v6.0 - TS FIXED', `Win Rate Target: 80%+ | EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} + Smart Validation`, true);
    console.log('🔧 Atualizações v6.0 (TypeScript + Validações):');
    console.log('   ✅ Correções TypeScript: TradeDecision interface atualizada');
    console.log('   ✅ Smart Pre-Validation: 6 camadas de validação async');
    console.log('   ✅ Fallback Protection: Valores undefined protegidos');
    console.log('   ✅ Async/Await: Métodos de validação corrigidos');
    console.log('   ✅ Score Dinâmico: Conversão 0-100 → 0-20 scale');
    console.log('   ✅ Risk Level: Classificação automática de risco\n');
    console.log('🎯 Validações Ativas (Config-Based):');
    console.log(`   📈 EMA: Períodos ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} + Alinhamento (25pts)`);
    console.log('   📊 RSI: Zona neutra 14-período (20pts)');
    console.log(`   📊 Volume: ${(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER / 2).toFixed(1)}x média mínimo (20pts)`);
    console.log(`   ⚡ Momentum: ${(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 500).toFixed(1)}% mínimo (15pts)`);
    console.log(`   📉 Volatilidade: ${config.MARKET_FILTERS.MIN_VOLATILITY}-${config.MARKET_FILTERS.MAX_VOLATILITY}% (10pts)`);
    console.log(`   🎯 Confidence: ${config.MIN_CONFIDENCE}% mínimo (10pts)\n`);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}% (REAL)`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1 (GARANTIDO)`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')} (apenas estáveis)`);
    console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const config = TradingConfigManager.getConfig();
    const klines = await this.getBinancePublic().getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    return {
      price24h: prices,
      currentPrice,
      klines,
      volumes,
      stats
    };
  }

  private async analyzeWithEma(symbol: string, marketData: MarketData): Promise<TradeDecision> {
    const config = TradingConfigManager.getConfig();
    console.log(`\n📊 Analisando mercado com EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} MELHORADO...`);

    // 1. Análise EMA básica
    const basicAnalysis = this.emaAnalyzer.analyze(marketData);
    
    // 2. Validações EMA avançadas integradas
    const validation = await this.validateEnhancedEmaSignal(marketData, basicAnalysis);
    
    if (!validation.isValid) {
      console.log('❌ Sinal EMA rejeitado pelas validações avançadas:');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
      return {
        action: 'HOLD',
        confidence: 50,
        reason: 'Sinal EMA não passou nas validações rigorosas',
        symbol,
        price: marketData.currentPrice
      };
    }
    
    console.log('✅ Sinal EMA aprovado pelas validações avançadas:');
    validation.reasons.forEach(reason => console.log(`   ${reason}`));
    
    // 3. Ajustar confiança baseada no score de validação
    const adjustedConfidence = Math.min(95, basicAnalysis.confidence + validation.score);
    
    console.log(`📈 Sinal EMA: ${basicAnalysis.action} (${adjustedConfidence}% - melhorado)`);
    console.log(`💭 Razão: ${basicAnalysis.reason} + validações rigorosas`);

    return {
      action: basicAnalysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: adjustedConfidence,
      reason: `${basicAnalysis.reason} (Score validação: ${validation.score}/20)`,
      symbol,
      price: marketData.currentPrice
    };
  }
  
  private async validateEnhancedEmaSignal(marketData: MarketData, basicAnalysis: any) {
    // Usar smart pré-validação EMA específica
    const mockDecision = { action: basicAnalysis.action, confidence: basicAnalysis.confidence, price: marketData.currentPrice };
    const mockMarketDataForValidation = { 
      price: { price: marketData.currentPrice.toString() }, 
      stats: marketData.stats, 
      klines: marketData.klines 
    };
    
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 25)
      .withRSI(14, 20)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER / 2, 20)
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 5, 15)
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY, 10)
      .withConfidence(config.MIN_CONFIDENCE, 10)
      .build()
      .validate('', mockMarketDataForValidation, mockDecision, null);
    
    return {
      isValid: smartValidation.isValid,
      score: Math.round(smartValidation.totalScore / 5), // Convert to 0-20 scale
      reasons: smartValidation.reasons,
      warnings: smartValidation.warnings
    };
  }
  


  private async analyzeSymbolWithEma(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return await this.analyzeWithEma(symbol, fullMarketData);
  }

  private async validateEmaDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ VALIDAÇÃO CENTRALIZADA PARA SIMULAÇÃO EMA...');

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
    console.log('🧪 Esta seria uma excelente oportunidade EMA para trade real!');

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
      this.analyzeSymbolWithEma.bind(this),
      undefined,
      this.validateEmaDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const emaSimulator = new EmaTradingBotSimulator();
    await emaSimulator.executeTrade();
  }

  logBotStartup(
    'Ultra-Conservative EMA Simulator v6.0 - TYPESCRIPT FIXED',
    '🛡️ Ultra-Conservador v6.0 - TypeScript Corrigido + Smart Validation\n🔧 Correções: Interface TradeDecision + Async/Await + Fallback Protection\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}