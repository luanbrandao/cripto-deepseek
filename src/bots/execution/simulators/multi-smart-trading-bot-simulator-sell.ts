import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPricesRealMarket } from '../../utils/risk/price-calculator';
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
    if (!symbol) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO MULTI-SMART SELL SIMULATOR...');

    // 1. SMART PRÉ-VALIDAÇÃO PARA VENDAS
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 20)
      .withRSI(14, 15)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.43, 15)
      .withSupportResistance(config.EMA_ADVANCED.MIN_SEPARATION * 160, 20)
      .withMomentum(-config.EMA_ADVANCED.MIN_TREND_STRENGTH, 15)
      .withVolatility(config.MARKET_FILTERS.MAX_VOLATILITY * 1.2, 10)
      .withConfidence(config.MIN_CONFIDENCE, 15)
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid) {
      console.log('❌ SMART PRÉ-VALIDAÇÃO FALHOU:');
      smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
    smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
    console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    console.log(`🔴 Camadas SELL: ${smartValidation.activeLayers.join(', ')}`);

    // 2. VALIDAÇÕES ESPECÍFICAS MULTI-SMART SELL
    console.log('🔍 Validações específicas Multi-Smart SELL...');

    // Validar tendência EMA para baixa (mais permissivo para SELL)
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    // Para SELL, aceitar qualquer tendência que não seja fortemente bullish
    const isSellFriendly = !trendAnalysis.isUptrend || trendAnalysis.reason?.includes('lateral') || trendAnalysis.reason?.includes('consolidação');
    if (!isSellFriendly) {
      console.log('❌ Tendência muito bullish para venda');
      console.log(`💭 Razão: ${trendAnalysis.reason}`);
      return false;
    }
    console.log('✅ Condições de mercado favoráveis para SELL');

    // Validar decisão DeepSeek para SELL
    if (decision.action !== 'SELL') {
      console.log('❌ DeepSeek não recomenda SELL');
      return false;
    }
    console.log('✅ DeepSeek confirma oportunidade de SELL');

    // 3. BOOST INTELIGENTE DE CONFIANÇA
    const boostedDecision = boostConfidence(decision, { baseBoost: 10, maxBoost: 15, trendType: 'SELL' });
    console.log(`🚀 Confiança após boost: ${boostedDecision.confidence}%`);

    // 4. CÁLCULO DE VOLATILIDADE E TARGETS
    const volatility = await calculateSymbolVolatility(
      this.getBinancePublic(),
      symbol,
      TradingConfigManager.getConfig().CHART.TIMEFRAME,
      TradingConfigManager.getConfig().CHART.PERIODS
    );

    console.log(`📊 Volatilidade ${symbol}: ${volatility.toFixed(2)}%`);

    const priceResult = calculateTargetAndStopPricesRealMarket(
      boostedDecision.price,
      boostedDecision.confidence,
      boostedDecision.action,
      volatility
    );

    console.log(`🎯 Target: ${priceResult.targetPrice.toFixed(2)} (Real Market Method)`);
    console.log(`🛑 Stop: ${priceResult.stopPrice.toFixed(2)} (Real Market Method)`);

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
    decision.confidence = smartValidation.confidence || boostedDecision.confidence;
    decision.validationScore = smartValidation.totalScore;
    (decision as any).riskLevel = smartValidation.riskLevel;
    (decision as any).smartValidationPassed = true;
    (decision as any).activeLayers = smartValidation.activeLayers;
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
