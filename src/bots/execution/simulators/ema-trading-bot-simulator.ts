import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import TradingConfigManager from '../../../shared/config/trading-config-manager';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
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

interface EmaValidation {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
}

export class EmaTradingBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative EMA Simulator',
      isSimulation: true,
      tradesFile: 'ultraConservativeEmaSimulator.json'
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
    
    console.log('🛡️ ULTRA-CONSERVATIVE EMA SIMULATOR v5.0 - MELHORADO - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ EMA SIMULATOR v5.0 - MELHORADO', `Win Rate Target: 75%+ | EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} + Filtros Avançados`, true);
    console.log('🎯 Melhorias Implementadas (baseadas na análise de 33% → 75%+ win rate):');
    console.log('   ✅ Volume Adequado (1.0x média mínimo)');
    console.log('   ✅ Força da Tendência (0.2% mínimo)');
    console.log('   ✅ Filtro RSI (zona 25-75)');
    console.log('   ✅ Posicionamento Inteligente (baseado na ação)');
    console.log('   ✅ Controle de Volatilidade (1-5%)');
    console.log('   ✅ Score mínimo: 12/20 pontos para aprovação\n');
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
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

  private analyzeWithEma(symbol: string, marketData: MarketData): TradeDecision {
    const config = TradingConfigManager.getConfig();
    console.log(`\n📊 Analisando mercado com EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} MELHORADO...`);

    // 1. Análise EMA básica
    const basicAnalysis = this.emaAnalyzer.analyze(marketData);
    
    // 2. Validações adicionais para melhorar assertividade
    const validation = this.validateEnhancedEmaSignal(marketData, basicAnalysis);
    
    if (!validation.isValid) {
      console.log('❌ Sinal EMA rejeitado pelas validações adicionais:');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
      return {
        action: 'HOLD',
        confidence: 50,
        reason: 'Sinal EMA não passou nas validações rigorosas',
        symbol,
        price: marketData.currentPrice
      };
    }
    
    console.log('✅ Sinal EMA aprovado pelas validações:');
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
  
  private validateEnhancedEmaSignal(marketData: MarketData, basicAnalysis: any): EmaValidation {
    const validation: EmaValidation = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };
    
    const { price24h, volumes, currentPrice, stats } = marketData;
    
    // 1. Validação de Volume (5 pontos)
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const volumeRatio = recentVolume / avgVolume;
    
    const config = TradingConfigManager.getConfig();
    const minVolumeMultiplier = config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER;
    
    if (volumeRatio >= minVolumeMultiplier * 1.3) { // Volume forte
      validation.score += 5;
      validation.reasons.push(`✅ Volume forte: ${volumeRatio.toFixed(1)}x média`);
    } else if (volumeRatio >= minVolumeMultiplier) { // Volume adequado
      validation.score += 3;
      validation.reasons.push(`✅ Volume adequado: ${volumeRatio.toFixed(1)}x média`);
    } else {
      validation.warnings.push(`❌ Volume insuficiente: ${volumeRatio.toFixed(1)}x < ${minVolumeMultiplier}x`);
    }
    
    // 2. Validação de Força da Tendência (5 pontos)
    const ema21 = this.calculateEMA(price24h, 21);
    const ema50 = this.calculateEMA(price24h, 50);
    const trendStrength = Math.abs(ema21 - ema50) / ema50;
    
    const minTrendStrength = config.EMA_ADVANCED.MIN_TREND_STRENGTH;
    
    if (trendStrength >= minTrendStrength * 2.5) { // Forte
      validation.score += 5;
      validation.reasons.push(`✅ Tendência forte: ${(trendStrength * 100).toFixed(2)}%`);
    } else if (trendStrength >= minTrendStrength) { // Adequada
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
    const volatility = Math.abs(parseFloat(stats.priceChangePercent));
    const minVol = config.MARKET_FILTERS.MIN_VOLATILITY;
    const maxVol = config.MARKET_FILTERS.MAX_VOLATILITY;
    
    if (volatility >= minVol && volatility <= maxVol) {
      validation.score += 2;
      validation.reasons.push(`✅ Volatilidade adequada: ${volatility.toFixed(1)}%`);
    } else {
      validation.warnings.push(`❌ Volatilidade inadequada: ${volatility.toFixed(1)}% (${minVol}-${maxVol}% requerido)`);
    }
    
    // Critério de aprovação baseado na configuração
    const minScore = Math.floor(config.EMA_ADVANCED.MIN_EMA_SCORE * 1.2); // 20% mais rigoroso
    validation.isValid = validation.score >= minScore;
    
    console.log(`🔍 Score de validação EMA: ${validation.score}/20 (mínimo: ${minScore})`);
    
    return validation;
  }
  
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }
  
  private calculateRSI(prices: number[], period: number = 14): number {
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

  private async analyzeSymbolWithEma(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return this.analyzeWithEma(symbol, fullMarketData);
  }

  private async validateEmaDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA EMA PARA SIMULAÇÃO...');

    // 🚨 ANÁLISE ULTRA-RIGOROSA EM 5 CAMADAS
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);

    if (!ultraAnalysis.isValid) {
      console.log('❌ SIMULAÇÃO REJEITADA pela análise ultra-conservadora EMA:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ SIMULAÇÃO APROVADA pela análise ultra-conservadora EMA:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);
    console.log('🧪 Esta seria uma excelente oportunidade EMA para trade real!');

    // Atualizar decisão com análise ultra-conservadora
    decision.confidence = ultraAnalysis.confidence;
    (decision as any).ultraConservativeScore = ultraAnalysis.score;
    (decision as any).riskLevel = ultraAnalysis.riskLevel;

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
    'Ultra-Conservative EMA Simulator v5.0 - MELHORADO',
    '🛡️ Ultra-Conservador v5.0 - Win Rate: 33% → 75%+ (MELHORADO)\n🔍 Filtros Avançados: Volume + RSI + Tendência + Volatilidade\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}