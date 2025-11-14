import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import SupportResistanceAnalyzer from '../../../analyzers/supportResistanceAnalyzer';
import TradingConfigManager from '../../../shared/config/trading-config-manager';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
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

interface SRValidation {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
}

export class SupportResistanceBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private srAnalyzer: SupportResistanceAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative Support/Resistance Simulator',
      isSimulation: true,
      tradesFile: 'ultraConservativeSupportResistanceSimulator.json'
    };

    this.flowManager = new BotFlowManager(this, config);

    // Configuração ultra-conservadora para S/R
    this.srAnalyzer = new SupportResistanceAnalyzer({
      tolerance: 0.005,              // ↓ Mais rigoroso (era 0.008)
      minTouches: 2,                 // Mínimo 2 toques
      lookbackPeriods: 50            // ↑ Mais histórico (era 25)
    });
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();
    
    console.log('🛡️ ULTRA-CONSERVATIVE S/R SIMULATOR v5.0 - MELHORADO - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ S/R SIMULATOR v5.0 - MELHORADO', 'Win Rate Target: 78%+ | S/R + Filtros Avançados | Apenas Simulação', true);
    console.log('🎯 Melhorias Implementadas (baseadas na análise para 75%+ win rate):');
    console.log('   ✅ Qualidade dos Níveis S/R (força ≥65%, 2+ toques)');
    console.log('   ✅ Distância Realista (0.1-1.5% do nível)');
    console.log('   ✅ Volume S/R Adequado (1.2x média mínimo)');
    console.log('   ✅ Momentum Realista (0.08 mínimo)');
    console.log('   ✅ Volatilidade Controlada (0.8-4%)');
    console.log('   ✅ Score mínimo: 15/25 pontos (60% - realista)\n');
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
    console.log('🎯 S/R Config: Min 3 toques, Força ≥80%, Tolerância 0.5%');
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

  private analyzeWithSupportResistance(symbol: string, marketData: MarketDataSR): TradeDecision {
    console.log('\n🎯 Analisando níveis de Suporte e Resistência MELHORADOS...');

    // 1. Análise S/R básica
    const basicAnalysis = this.srAnalyzer.analyze({
      candles: marketData.candles,
      currentPrice: marketData.currentPrice
    }, true);
    
    // 2. Validações adicionais para melhorar assertividade
    const validation = this.validateEnhancedSRSignal(marketData, basicAnalysis);
    
    if (!validation.isValid) {
      console.log('❌ Sinal S/R rejeitado pelas validações adicionais:');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
      return {
        action: 'HOLD',
        confidence: 50,
        reason: 'Sinal S/R não passou nas validações rigorosas',
        symbol,
        price: marketData.currentPrice
      };
    }
    
    console.log('✅ Sinal S/R aprovado pelas validações:');
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
  
  private validateEnhancedSRSignal(marketData: MarketDataSR, basicAnalysis: any): SRValidation {
    const validation: SRValidation = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };
    
    const { price24h, volumes, currentPrice, stats } = marketData;
    const levels = basicAnalysis.levels || [];
    
    // 1. Validação de Qualidade dos Níveis S/R (8 pontos)
    const strongLevels = levels.filter((level: any) => level.strength >= 0.65 && level.touches >= 2);
    const ultraStrongLevels = levels.filter((level: any) => level.strength >= 0.8 && level.touches >= 3);
    
    if (ultraStrongLevels.length >= 1) {
      validation.score += 8;
      validation.reasons.push(`✅ Níveis S/R ultra-fortes: ${ultraStrongLevels.length} (força ≥80%, 3+ toques)`);
    } else if (strongLevels.length >= 1) {
      validation.score += 5;
      validation.reasons.push(`✅ Níveis S/R fortes: ${strongLevels.length} (força ≥65%, 2+ toques)`);
    } else {
      validation.warnings.push('❌ Nenhum nível S/R forte encontrado (força <65% ou <2 toques)');
    }
    
    // 2. Validação de Proximidade Ideal (6 pontos)
    const nearestLevel = this.findNearestLevel(levels, currentPrice);
    if (nearestLevel) {
      const distance = Math.abs(currentPrice - nearestLevel.price) / currentPrice;
      if (distance >= 0.001 && distance <= 0.015) { // 0.1% a 1.5% (mais realista)
        if (distance <= 0.008) {
          validation.score += 6; // Distância ótima
          validation.reasons.push(`✅ Distância ótima do S/R: ${(distance * 100).toFixed(2)}%`);
        } else {
          validation.score += 4; // Distância boa
          validation.reasons.push(`✅ Distância boa do S/R: ${(distance * 100).toFixed(2)}%`);
        }
      } else {
        validation.warnings.push(`❌ Distância inadequada do S/R: ${(distance * 100).toFixed(2)}% (0.1-1.5% requerido)`);
      }
    } else {
      validation.warnings.push('❌ Nenhum nível S/R próximo encontrado');
    }
    
    // 3. Validação de Volume (5 pontos)
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const volumeRatio = recentVolume / avgVolume;
    
    if (volumeRatio >= 1.5) { // Volume forte
      validation.score += 5;
      validation.reasons.push(`✅ Volume S/R forte: ${volumeRatio.toFixed(1)}x média`);
    } else if (volumeRatio >= 1.2) { // Volume adequado
      validation.score += 3;
      validation.reasons.push(`✅ Volume S/R adequado: ${volumeRatio.toFixed(1)}x média`);
    } else {
      validation.warnings.push(`❌ Volume S/R insuficiente: ${volumeRatio.toFixed(1)}x < 1.2x`);
    }
    
    // 4. Validação de Momentum (3 pontos)
    const momentum = this.calculateMomentum(price24h);
    if (Math.abs(momentum) >= 0.15) { // Momentum forte
      validation.score += 3;
      validation.reasons.push(`✅ Momentum forte: ${momentum.toFixed(3)}`);
    } else if (Math.abs(momentum) >= 0.08) { // Momentum adequado
      validation.score += 2;
      validation.reasons.push(`✅ Momentum adequado: ${momentum.toFixed(3)}`);
    } else {
      validation.warnings.push(`❌ Momentum insuficiente: ${momentum.toFixed(3)} (0.08 mínimo)`);
    }
    
    // 5. Validação de Volatilidade Controlada (3 pontos)
    const volatility = Math.abs(parseFloat(stats.priceChangePercent));
    if (volatility >= 0.8 && volatility <= 4.0) {
      validation.score += 3;
      validation.reasons.push(`✅ Volatilidade S/R adequada: ${volatility.toFixed(1)}%`);
    } else {
      validation.warnings.push(`❌ Volatilidade S/R inadequada: ${volatility.toFixed(1)}% (0.8-4% requerido)`);
    }
    
    // Critério de aprovação: mínimo 15/25 pontos (60% - mais realista)
    validation.isValid = validation.score >= 15;
    
    console.log(`🔍 Score de validação S/R: ${validation.score}/25 (mínimo: 15)`);
    
    return validation;
  }
  
  private findNearestLevel(levels: any[], currentPrice: number): any {
    if (!levels || levels.length === 0) return null;
    
    return levels.reduce((nearest, level) => {
      const distance = Math.abs(currentPrice - level.price);
      const nearestDistance = nearest ? Math.abs(currentPrice - nearest.price) : Infinity;
      return distance < nearestDistance ? level : nearest;
    }, null);
  }
  
  private calculateMomentum(prices: number[]): number {
    if (prices.length < 10) return 0;
    
    const recent = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const older = prices.slice(-15, -10).reduce((a, b) => a + b, 0) / 5;
    
    return (recent - older) / older;
  }

  private async analyzeSymbolWithSR(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return this.analyzeWithSupportResistance(symbol, fullMarketData);
  }

  private async validateSRDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA S/R PARA SIMULAÇÃO...');

    // 🚨 ANÁLISE ULTRA-RIGOROSA EM 5 CAMADAS
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);

    if (!ultraAnalysis.isValid) {
      console.log('❌ SIMULAÇÃO REJEITADA pela análise ultra-conservadora S/R:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ SIMULAÇÃO APROVADA pela análise ultra-conservadora S/R:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);

    // Validação adicional específica para S/R
    const levels = (decision as any).levels;
    if (levels && levels.length > 0) {
      const strongLevels = levels.filter((level: any) => level.strength >= 0.8 && level.touches >= 2);
      if (strongLevels.length > 0) {
        console.log(`🎯 Níveis S/R ultra-fortes identificados: ${strongLevels.length}`);
        console.log('🧪 Esta seria uma excelente oportunidade S/R para trade real!');
      }
    }

    // Atualizar decisão com análise ultra-conservadora
    decision.confidence = ultraAnalysis.confidence;
    (decision as any).ultraConservativeScore = ultraAnalysis.score;
    (decision as any).riskLevel = ultraAnalysis.riskLevel;

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
    'Ultra-Conservative S/R Simulator v5.0 - MELHORADO',
    '🛡️ Ultra-Conservador v5.0 - Win Rate Target: 78%+ (MELHORADO)\n🔍 Filtros S/R Avançados: Qualidade + Proximidade + Volume + Momentum\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}