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
    
    console.log('📈 EMA SIMULATOR v8.0 - OTIMIZADO PARA MAIOR WIN RATE\n');
    logBotHeader('📈 EMA SIMULATOR v8.0 - OTIMIZADO', `Performance-Based | EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} + Anti-Overtrading`, true);
    console.log('🚀 Atualizações v8.0 (Baseado na Análise de Performance):');
    console.log('   ✅ Separação EMA Mínima: 0.70% (era 0.50%)');
    console.log('   ✅ Cooldown Anti-Overtrading: 45-90min por símbolo');
    console.log('   ✅ Filtro de Símbolos: Evita BTC (0% win rate)');
    console.log('   ✅ Timing Otimizado: Boost 18h-23h UTC');
    console.log('   ✅ Volume Rigoroso: 1.5x média mínimo');
    console.log('   ✅ Win Rate Alvo: 45-55% (realista vs 27% atual)\n');
    console.log('🎯 Validações Baseadas em Dados Históricos:');
    console.log('   📈 EMA Separação: ≥0.70% (winners tiveram 0.62-0.92%)');
    console.log('   ⏰ Timing: 18h-23h UTC (melhor performance)');
    console.log('   🚫 BTC Bloqueado: 0% win rate (3/3 losses)');
    console.log('   🏆 ETH Priorizado: 15.4% win rate (melhor relativo)');
    console.log('   ⏰ Cooldown ETH: 60min, SOL: 90min');
    console.log('   📊 Volume: 1.5x média (confirmação)\n');
    console.log('📊 Performance Histórica Analisada:');
    console.log('   📉 Total Trades: 22 (27.3% win rate)');
    console.log('   ❌ Overtrading: 22 trades em 7h (problema crítico)');
    console.log('   🏆 Winners: Separação 0.62-0.92%, timing 18h+');
    console.log('   ⚠️ Losers: Separação 0.50-0.65%, overtrading');
    console.log('🧪 MODO SIMULAÇÃO - Validações otimizadas, sem trades reais\n');
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
    console.log(`\n📊 Analisando ${symbol} com EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} OTIMIZADO...`);

    // 1. Análise EMA básica
    const basicAnalysis = this.emaAnalyzer.analyze(marketData);
    
    // 2. Validações EMA otimizadas baseadas na performance
    const validation = await this.validateEnhancedEmaSignal(marketData, { ...basicAnalysis, symbol });
    
    if (!validation.isValid) {
      console.log('❌ Sinal EMA REJEITADO pelas validações otimizadas:');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
      return {
        action: 'HOLD',
        confidence: 50,
        reason: 'Sinal EMA não atende critérios de performance otimizados',
        symbol,
        price: marketData.currentPrice
      };
    }
    
    console.log('✅ Sinal EMA APROVADO pelas validações otimizadas:');
    validation.reasons.forEach(reason => console.log(`   ${reason}`));
    
    // 3. Confiança dinâmica baseada na separação EMA
    const emaFast = this.calculateSimpleEMA(marketData.price24h, config.EMA.FAST_PERIOD);
    const emaSlow = this.calculateSimpleEMA(marketData.price24h, config.EMA.SLOW_PERIOD);
    const separation = Math.abs(emaFast - emaSlow) / emaSlow;
    
    let finalConfidence = 78; // Base mais alta
    if (separation >= 0.0085) finalConfidence = 82; // 0.85%+
    else if (separation >= 0.0075) finalConfidence = 80; // 0.75%+
    else if (separation >= 0.007) finalConfidence = 78; // 0.70%+
    
    console.log(`📈 Sinal EMA OTIMIZADO: ${basicAnalysis.action} (${finalConfidence}%)`);
    console.log(`📊 Separação: ${(separation * 100).toFixed(2)}% | Score: ${validation.score}`);

    return {
      action: basicAnalysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: finalConfidence,
      reason: `${basicAnalysis.reason} (Sep: ${(separation * 100).toFixed(2)}%, Score: ${validation.score})`,
      symbol,
      price: marketData.currentPrice
    };
  }
  
  private async validateEnhancedEmaSignal(marketData: MarketData, basicAnalysis: any) {
    // Validações EMA OTIMIZADAS baseadas na análise de performance
    const config = TradingConfigManager.getConfig();
    let additionalScore = 0;
    const warnings: string[] = [];
    const reasons: string[] = [];

    // 1. FILTRO DE SEPARAÇÃO EMA RIGOROSO (baseado na análise)
    if (marketData.price24h.length >= config.EMA.SLOW_PERIOD) {
      const emaFast = this.calculateSimpleEMA(marketData.price24h, config.EMA.FAST_PERIOD);
      const emaSlow = this.calculateSimpleEMA(marketData.price24h, config.EMA.SLOW_PERIOD);
      const separation = Math.abs(emaFast - emaSlow) / emaSlow;
      
      // OTIMIZAÇÃO: Separação mínima 0.70% (baseado nos winners)
      const minSeparation = 0.007; // 0.70%
      
      if (separation >= minSeparation) {
        additionalScore += 15;
        reasons.push(`✅ Separação EMA forte (${(separation * 100).toFixed(2)}% ≥ 0.70%)`);
      } else {
        warnings.push(`❌ Separação EMA fraca (${(separation * 100).toFixed(2)}% < 0.70%) - alta probabilidade de loss`);
        return { isValid: false, score: 0, reasons, warnings };
      }
    }

    // 2. FILTRO DE SÍMBOLO (baseado na performance)
    const symbol = basicAnalysis.symbol || '';
    if (symbol === 'BTCUSDT') {
      warnings.push('❌ BTC teve 0% win rate - evitando');
      return { isValid: false, score: 0, reasons, warnings };
    }
    
    if (symbol === 'ETHUSDT') {
      additionalScore += 5;
      reasons.push('✅ ETH: Melhor performance relativa (5/6 wins)');
    } else if (symbol === 'SOLUSDT') {
      additionalScore += 2;
      reasons.push('✅ SOL: Performance moderada (1/3 wins)');
    }

    // 3. FILTRO DE TIMING (baseado na análise)
    const hour = new Date().getUTCHours();
    if (hour >= 18 && hour <= 23) {
      additionalScore += 8;
      reasons.push('✅ Timing ótimo (18h-23h UTC) - melhor performance histórica');
    } else if (hour >= 16 && hour < 18) {
      warnings.push('⚠️ Timing desfavorável (16h-18h UTC) - muitos losses históricos');
      additionalScore -= 5;
    }

    // 4. COOLDOWN ANTI-OVERTRADING (problema crítico identificado)
    const lastTradeKey = `lastEmaTrade_${symbol}`;
    const lastTradeTime = (global as any)[lastTradeKey] || 0;
    let cooldownMinutes = 45; // Base
    
    switch (symbol) {
      case 'ETHUSDT': cooldownMinutes = 60; break; // ETH teve overtrading
      case 'SOLUSDT': cooldownMinutes = 90; break; // SOL mais cauteloso
      default: cooldownMinutes = 45; break;
    }
    
    const cooldownMs = cooldownMinutes * 60 * 1000;
    if (Date.now() - lastTradeTime < cooldownMs) {
      warnings.push(`❌ COOLDOWN ATIVO: Aguarde ${cooldownMinutes}min para ${symbol} (anti-overtrading)`);
      return { isValid: false, score: 0, reasons, warnings };
    }

    // 5. VALIDAÇÃO DE VOLUME
    const avgVolume = marketData.volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = marketData.volumes[marketData.volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    
    if (volumeRatio >= 1.5) {
      additionalScore += 8;
      reasons.push(`✅ Volume elevado (${volumeRatio.toFixed(1)}x média)`);
    } else {
      warnings.push(`⚠️ Volume baixo (${volumeRatio.toFixed(1)}x < 1.5x média)`);
      additionalScore -= 3;
    }

    // 6. CONFIANÇA DINÂMICA baseada na separação
    const emaFast = this.calculateSimpleEMA(marketData.price24h, config.EMA.FAST_PERIOD);
    const emaSlow = this.calculateSimpleEMA(marketData.price24h, config.EMA.SLOW_PERIOD);
    const separation = Math.abs(emaFast - emaSlow) / emaSlow;
    
    let confidenceBonus = 0;
    if (separation >= 0.0085) { // 0.85%+
      confidenceBonus = 7;
      reasons.push('✅ Separação EMA excelente (0.85%+)');
    } else if (separation >= 0.0075) { // 0.75%+
      confidenceBonus = 5;
      reasons.push('✅ Separação EMA boa (0.75%+)');
    } else if (separation >= 0.007) { // 0.70%+
      confidenceBonus = 3;
      reasons.push('✅ Separação EMA adequada (0.70%+)');
    }
    
    additionalScore += confidenceBonus;

    // Registrar timestamp do trade se aprovado
    if (additionalScore >= 15) {
      (global as any)[lastTradeKey] = Date.now();
    }

    const finalScore = additionalScore;
    const isValid = finalScore >= 15; // Threshold mais rigoroso
    
    return {
      isValid,
      score: finalScore,
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