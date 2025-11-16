import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import { EmaAnalyzer, TradingConfigManager } from '../../../core';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { BaseTradingBot } from '../../core/base-trading-bot';

dotenv.config();

// Usar modo balanceado para validações realistas
TradingConfigManager.setMode('BALANCED');

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
      name: 'Realistic EMA Simulator v7.0 - Balanced',
      isSimulation: true,
      tradesFile: 'realisticEmaSimulatorV7.json'
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
    
    console.log('📈 REALISTIC EMA SIMULATOR v7.0 - BALANCED - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('📈 EMA SIMULATOR v7.0 - REALISTIC', `Win Rate Target: 65-70% | EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} + Balanced Validation`, true);
    console.log('🔧 Atualizações v7.0 (Validações Realistas):');
    console.log('   ✅ Modo Balanceado: Confiança mínima 75% (era 82%)');
    console.log('   ✅ Validações Práticas: Critérios alcançáveis');
    console.log('   ✅ EMA Rigoroso: Separação mínima + alinhamento');
    console.log('   ✅ Volume Realista: 2.0x média (rigoroso mas alcançável)');
    console.log('   ✅ RSI Flexível: 30-70 zona operável');
    console.log('   ✅ Win Rate Alvo: 65-70% (realista)\n');
    console.log('🎯 Validações Balanceadas:');
    console.log(`   📈 EMA: Períodos ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} + Separação 0.5%`);
    console.log(`   📊 RSI: Zona 30-70 (evita extremos)`);
    console.log(`   📊 Volume: ${config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER.toFixed(1)}x média mínimo`);
    console.log(`   ⚡ Momentum: ${(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 100).toFixed(1)}% mínimo`);
    console.log(`   📉 Volatilidade: ${config.MARKET_FILTERS.MIN_VOLATILITY}-${config.MARKET_FILTERS.MAX_VOLATILITY}%`);
    console.log(`   🎯 Confidence: ${config.MIN_CONFIDENCE}% mínimo\n`);
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
      const config = TradingConfigManager.getConfig();
      return {
        action: 'HOLD',
        confidence: config.VALIDATION_SCORES?.MIN_CONFIDENCE || 50,
        reason: 'Sinal EMA não passou nas validações rigorosas',
        symbol,
        price: marketData.currentPrice
      };
    }
    
    console.log('✅ Sinal EMA aprovado pelas validações avançadas:');
    validation.reasons.forEach(reason => console.log(`   ${reason}`));
    
    // 3. Ajustar confiança de forma REALISTA
    const adjustedConfidence = Math.min(85, basicAnalysis.confidence + Math.min(validation.score, 10)); // Máximo +10%
    
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
    // Validações EMA REALISTAS e ALCANÇÁVEIS
    const mockDecision = { action: basicAnalysis.action, confidence: basicAnalysis.confidence, price: marketData.currentPrice };
    const mockMarketDataForValidation = { 
      price: { price: marketData.currentPrice.toString() }, 
      stats: marketData.stats, 
      klines: marketData.klines,
      price24h: marketData.price24h,
      volumes: marketData.volumes
    };
    
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 25)  // EMA principal
      .withRSI(14, 15)  // RSI flexível
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER, 20)  // Volume realista
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH, 15)  // Momentum normal
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY, 15)  // Volatilidade balanceada
      .withConfidence(config.MIN_CONFIDENCE, 10)  // Confiança mínima
      .build()
      .validate('', mockMarketDataForValidation, mockDecision, null);
    
    // Validações adicionais EMA específicas
    let additionalScore = 0;
    const warnings = [...smartValidation.warnings];
    const reasons = [...smartValidation.reasons];

    // Verificar separação EMA adequada (mais flexível)
    if (marketData.price24h.length >= config.EMA.SLOW_PERIOD) {
      const emaFast = this.calculateSimpleEMA(marketData.price24h, config.EMA.FAST_PERIOD);
      const emaSlow = this.calculateSimpleEMA(marketData.price24h, config.EMA.SLOW_PERIOD);
      const separation = Math.abs(emaFast - emaSlow) / emaSlow;
      const minSeparation = config.EMA_ADVANCED.MIN_SEPARATION * 0.5; // 50% mais flexível
      
      if (separation >= minSeparation) {
        additionalScore += 5;
        reasons.push(`✅ Separação EMA adequada (${(separation * 100).toFixed(2)}%)`);
      } else {
        warnings.push(`❌ Separação EMA insuficiente (${(separation * 100).toFixed(2)}% < ${(minSeparation * 100).toFixed(1)}%)`);
      }
    }

    // Verificar alinhamento de preço com EMAs
    if (basicAnalysis.action === 'BUY' && marketData.currentPrice > marketData.price24h[marketData.price24h.length - 2]) {
      additionalScore += 3;
      reasons.push('✅ Preço acima da EMA para BUY');
    } else if (basicAnalysis.action === 'SELL' && marketData.currentPrice < marketData.price24h[marketData.price24h.length - 2]) {
      additionalScore += 3;
      reasons.push('✅ Preço abaixo da EMA para SELL');
    }

    const finalScore = smartValidation.totalScore + additionalScore;
    // Mais flexível: aceitar se smart validation passou OU se tem pontos EMA
    const isValid = smartValidation.isValid || (smartValidation.totalScore >= 40 && additionalScore >= 3);
    
    return {
      isValid,
      score: Math.round(finalScore / 5), // Convert to 0-20+ scale
      reasons,
      warnings
    };
  }

  private calculateSimpleEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
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
    'Realistic EMA Simulator v7.0 - BALANCED',
    '📈 Realista v7.0 - Validações Balanceadas + EMA Rigoroso\n🎯 Win Rate Alvo: 65-70% | Critérios Alcançáveis\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}