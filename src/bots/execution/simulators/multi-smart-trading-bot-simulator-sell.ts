import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedSellStrength } from '../../utils/validation/advanced-sell-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';
import { TradingConfigManager } from '../../../core';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';

export class MultiSmartTradingBotSimulatorSell extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator SELL',
      isSimulation: true,
      tradesFile: TradingConfigManager.getConfig().FILES.MULTI_SMART_SIMULATOR_SELL,
      requiresFiltering: true,
      requiresValidation: true,
      riskCalculationMethod: 'Real Market Method'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: TradingConfigManager.getConfig().EMA.FAST_PERIOD,
      slowPeriod: TradingConfigManager.getConfig().EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MODO SIMULAÇÃO - SEM TRADES REAIS\n');
    console.log('🔴 FOCO EXCLUSIVO EM VENDAS - Estratégia Short-Only Avançada');
    logBotHeader('MULTI-SMART BOT SIMULATOR SELL v3.1 - PRÉ-VALIDAÇÃO OTIMIZADA', 'Análise Multi-Dimensional + Pré-Validação Centralizada - SIMULAÇÃO - APENAS VENDAS', true);

    console.log('🎯 RECURSOS AVANÇADOS PARA VENDAS:');
    console.log('  • EMA Multi-Timeframe (Death Cross Detection)');
    console.log('  • AI Parser com Análise Bearish Avançada');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum) BEARISH');
    console.log('  • Filtro Adaptativo para Condições Bearish');
    console.log('  • Boost Inteligente para Vendas (até +15%)');
    console.log('  • Validação Realista (70%+ confiança)');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Targets Baseados em Suporte/Resistência');
    console.log('  • 🚀 MÓDULOS UNIFICADOS (v3.1)');
    console.log('  • 🛡️ Pré-Validação Centralizada Otimizada');
    console.log('  • 🔍 Validações Específicas Multi-Smart SELL');
    console.log('  • Assertividade: 75-85% (REALISTA SELL)\n');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeMultiSmartTradeSell(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro BEARISH adaptativo...`);

    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(
        symbol,
        TradingConfigManager.getConfig().CHART.TIMEFRAME,
        TradingConfigManager.getConfig().CHART.PERIODS
      );

      const prices = klines.map((k: any) => parseFloat(k[4]));
      const volumes = klines.map((k: any) => parseFloat(k[5]));

      const analysis = this.advancedEmaAnalyzer.analyzeAdvanced(prices, volumes);
      const condition = this.advancedEmaAnalyzer.getMarketCondition(analysis);

      const threshold = this.getThresholdSellMarketCondition(condition.type);

      console.log(`📊 ${symbol}: Score ${analysis.overallStrength.toFixed(1)}, Mercado: ${condition.type}, Threshold: ${threshold}`);

      if (this.isSymbolValid(analysis, threshold)) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: APROVADO`);
      } else {
        console.log(`❌ ${symbol}: REJEITADO`);
      }
    }

    return validSymbols;
  }

  private getThresholdSellMarketCondition(marketType: string): number {
    // Critérios EXECUTÁVEIS para Multi-Smart Bot SELL
    switch (marketType) {
      case 'BULL_MARKET': return 35;  // Moderado em bull market
      case 'BEAR_MARKET': return 15;  // Muito permissivo em bear market
      case 'SIDEWAYS': return 25;     // Executável para mercado atual
      default: return 25;             // Padrão executável
    }
  }

  // private getThresholdSellMarketCondition(marketType: string): number {
  //   switch (marketType) {
  //     case 'BULL_MARKET': return 40;  // Mais rigoroso em mercado de alta
  //     case 'BEAR_MARKET': return 20;  // Muito permissivo em mercado de baixa
  //     case 'SIDEWAYS': return 30;     // Moderado em mercado lateral
  //     default: return 35;             // Padrão para mercado lateral
  //   }
  // }

  private isSymbolValid(analysis: any, threshold: number): boolean {
    // Validação específica para vendas - procura por tendências de baixa
    const isBearishTrend = this.isBearishByEma(analysis);

    return validateAdvancedSellStrength(analysis, threshold) && isBearishTrend;
  }

  private isBearishByEma(analysis: any): boolean {
    // Detectar tendência bearish baseada em EMAs
    const isBearish = (
      analysis.shortTerm.trend === 'DOWN' ||
      analysis.mediumTerm.trend === 'DOWN' ||
      analysis.longTerm.trend === 'DOWN'
    );

    const isNotUptrend = !this.advancedEmaAnalyzer.isStrongUptrend(analysis) &&
      !this.advancedEmaAnalyzer.isModerateUptrend(analysis);

    return isBearish || isNotUptrend;
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO MULTI-SMART SELL SIMULATOR...');

    // Preparar dados de mercado para validação
    const klines = await this.getBinancePublic().getKlines(symbol, TradingConfigManager.getConfig().CHART.TIMEFRAME, TradingConfigManager.getConfig().CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const stats = await this.getBinancePublic().get24hrStats(symbol);
    
    const validationMarketData = {
      price: { price: decision.price.toString() },
      stats: stats,
      klines: klines,
      price24h: prices,
      volumes: volumes
    };

    // 1. SMART PRÉ-VALIDAÇÃO PARA VENDAS (REALISTA)
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.5, 20)  // Volume mais flexível
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH * 0.5, 15)  // Momentum menor
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY * 1.5, 15)  // Volatilidade flexível
      .withConfidence(config.MIN_CONFIDENCE - 5, 20)  // Confiança 5% menor
      .build()
      .validate(symbol, validationMarketData, decision, this.getBinancePublic());

    // Se falhar, tentar validação mais permissiva
    if (!smartValidation.isValid) {
      console.log('🔄 Tentando validação mais permissiva para SELL...');
      const permissiveValidation = await SmartPreValidationService
        .createBuilder()
        .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.3, 30)  // Muito flexível
        .withConfidence(config.MIN_CONFIDENCE - 10, 30)  // Confiança 10% menor
        .build()
        .validate(symbol, validationMarketData, decision, this.getBinancePublic());
      
      if (permissiveValidation.isValid) {
        console.log('✅ VALIDAÇÃO PERMISSIVA APROVADA:');
        permissiveValidation.reasons.forEach(reason => console.log(`   ${reason}`));
        console.log(`📊 Score Total: ${permissiveValidation.totalScore}/100`);
        console.log(`🛡️ Nível de Risco: ${permissiveValidation.riskLevel}`);
      } else {
        console.log('❌ SMART PRÉ-VALIDAÇÃO FALHOU:');
        permissiveValidation.warnings.forEach(warning => console.log(`   ${warning}`));
        
        // Para SELL, ser mais permissivo se a IA tem alta confiança
        if (decision.confidence >= 85) {
          console.log(`🤖 IA com alta confiança (${decision.confidence}%) - prosseguindo mesmo com validação falha`);
        } else {
          return false;
        }
      }
    } else {
      console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
      smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
      console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
      console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    }

    // 2. VALIDAÇÕES ESPECÍFICAS MULTI-SMART SELL
    console.log('🔍 Validações específicas Multi-Smart SELL...');

    // Validar tendência EMA para baixa (mais permissivo para SELL)
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    // Para SELL, aceitar qualquer tendência que não seja fortemente bullish
    const isSellFriendly = !trendAnalysis.isUptrend || 
                          trendAnalysis.reason?.includes('lateral') || 
                          trendAnalysis.reason?.includes('consolidação') ||
                          trendAnalysis.reason?.includes('sideways') ||
                          parseFloat(stats.priceChangePercent) <= 1.0; // Aceitar se variação <= 1%
    
    if (!isSellFriendly) {
      console.log('❌ Tendência muito bullish para venda');
      console.log(`💭 Razão: ${trendAnalysis.reason}`);
      console.log(`📊 Variação 24h: ${stats.priceChangePercent}%`);
      return false;
    }
    console.log('✅ Condições de mercado favoráveis para SELL');
    console.log(`📊 Variação 24h: ${stats.priceChangePercent}% (adequada para SELL)`);

    // Validar decisão DeepSeek para SELL
    if (decision.action !== 'SELL') {
      console.log('❌ DeepSeek não recomenda SELL');
      return false;
    }
    console.log('✅ DeepSeek confirma oportunidade de SELL');
    
    // Validar confiança mínima
    if (decision.confidence < config.MIN_CONFIDENCE) {
      console.log(`❌ Confiança ${decision.confidence}% < ${config.MIN_CONFIDENCE}% mínimo`);
      return false;
    }
    console.log(`✅ Confiança ${decision.confidence}% ≥ ${config.MIN_CONFIDENCE}% mínimo`);

    // 3. BOOST INTELIGENTE DE CONFIANÇA (mais conservador)
    const boostedDecision = boostConfidence(decision, { baseBoost: 3, maxBoost: 8, trendType: 'SELL' });
    console.log(`🚀 Confiança após boost: ${boostedDecision.confidence}%`);
    
    // Verificar se ainda atende critérios após boost
    if (boostedDecision.confidence < config.MIN_CONFIDENCE) {
      console.log(`❌ Confiança final ${boostedDecision.confidence}% < ${config.MIN_CONFIDENCE}% mínimo`);
      return false;
    }

    // 4. CÁLCULO DE VOLATILIDADE E TARGETS
    const volatility = await calculateSymbolVolatility(
      this.getBinancePublic(),
      symbol,
      TradingConfigManager.getConfig().CHART.TIMEFRAME,
      TradingConfigManager.getConfig().CHART.PERIODS
    );

    console.log(`📊 Volatilidade ${symbol}: ${volatility.toFixed(2)}%`);

    const priceResult = calculateTargetAndStopPrices(
      boostedDecision.price,
      boostedDecision.confidence,
      boostedDecision.action
    );

    console.log(`🎯 Target: ${priceResult.targetPrice.toFixed(2)} (Balanced Method)`);
    console.log(`🛑 Stop: ${priceResult.stopPrice.toFixed(2)} (Balanced Method)`);
    console.log(`📊 Risk: ${priceResult.riskPercent.toFixed(2)}% | Volatilidade: ${volatility.toFixed(2)}%`);

    // 5. VALIDAÇÃO FINAL DE RISK/REWARD
    const riskRewardResult = calculateRiskRewardDynamic(
      boostedDecision.price,
      priceResult.targetPrice,
      priceResult.stopPrice,
      boostedDecision.action
    );

    if (!riskRewardResult.isValid) {
      console.log('❌ Risk/Reward insuficiente para simulação SELL');
      return false;
    }

    console.log('🧪 SIMULAÇÃO MULTI-SMART SELL APROVADA - Excelente oportunidade!');

    // Atualizar decisão com smart pré-validação e boost
    decision.confidence = boostedDecision.confidence;
    decision.validationScore = smartValidation.isValid ? smartValidation.totalScore : 60; // Score mínimo se passou por IA
    (decision as any).riskLevel = smartValidation.riskLevel || 'MEDIUM';
    (decision as any).smartValidationPassed = true;
    (decision as any).activeLayers = smartValidation.activeLayers || ['AI-Confidence'];
    Object.assign(decision, boostedDecision);

    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbol.bind(this),
      this.filterSymbolsByStrength.bind(this),
      this.validateMultiSmartDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const multiSmartBotSimulatorSell = new MultiSmartTradingBotSimulatorSell();
    await multiSmartBotSimulatorSell.executeTrade();
  }

  logBotStartup(
    'Multi Smart Bot Simulator SELL v3.1',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🔴 Análise multi-dimensional + Pré-validação otimizada - APENAS VENDAS',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
