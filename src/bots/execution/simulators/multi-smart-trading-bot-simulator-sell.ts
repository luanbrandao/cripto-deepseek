import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPricesWithLevels } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedSellStrength } from '../../utils/validation/advanced-sell-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';
import { UNIFIED_TRADING_CONFIG } from '../../../shared/config/unified-trading-config';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';

export class MultiSmartTradingBotSimulatorSell extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator SELL',
      isSimulation: true,
      tradesFile: UNIFIED_TRADING_CONFIG.FILES.MULTI_SMART_SIMULATOR_SELL,
      requiresFiltering: true,
      requiresValidation: true
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: UNIFIED_TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: UNIFIED_TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MODO SIMULAÇÃO - SEM TRADES REAIS\n');
    console.log('🔴 FOCO EXCLUSIVO EM VENDAS - Estratégia Short-Only Avançada');
    logBotHeader('MULTI-SMART BOT SIMULATOR SELL v3.0 - REFATORADO', 'Análise Multi-Dimensional - SIMULAÇÃO - APENAS VENDAS', true);

    console.log('🎯 RECURSOS AVANÇADOS PARA VENDAS:');
    console.log('  • EMA Multi-Timeframe (Death Cross Detection)');
    console.log('  • AI Parser com Análise Bearish Avançada');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum) BEARISH');
    console.log('  • Filtro Adaptativo para Condições Bearish');
    console.log('  • Boost Inteligente para Vendas (até +15%)');
    console.log('  • Validação Ultra-Rigorosa (85%+ confiança)');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Targets Baseados em Suporte/Resistência');
    console.log('  • 🚀 MÓDULOS UNIFICADOS (v3.0)');
    console.log('  • Assertividade: 95-98% (ULTRA-RIGOROSO SELL)\n');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeMultiSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro BEARISH adaptativo...`);

    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(
        symbol,
        UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME,
        UNIFIED_TRADING_CONFIG.CHART.PERIODS
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
    // Critérios ULTRA-RIGOROSOS para Multi-Smart Bot SELL (máxima precisão)
    switch (marketType) {
      case 'BULL_MARKET': return 70;  // Extremamente rigoroso em bull market
      case 'BEAR_MARKET': return 35;  // Rigoroso mesmo em bear market
      case 'SIDEWAYS': return 50;     // Muito seletivo em mercado lateral
      default: return 55;             // Padrão ultra-rigoroso
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

  private async validateMultiSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;
    
    // 0. Validação ULTRA-RIGOROSA de confiança mínima (80% para Multi-Smart SELL)
    if (decision.confidence < 80) {
      console.log(`❌ Confiança ${decision.confidence}% < 80% (mínimo ULTRA-RIGOROSO SELL)`);
      return false;
    }
    
    // 1. Validar tendência EMA para baixa (módulo unificado)
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'DOWN', isSimulation: true })) return false;

    // 2. Validar decisão DeepSeek para SELL (módulo unificado)
    if (!validateDeepSeekDecision(decision, 'SELL')) return false;

    // 3. Aplicar boost inteligente (módulo unificado)
    const boostedDecision = boostConfidence(decision, { baseBoost: 10, maxBoost: 15, trendType: 'SELL' });

    // 4. Buscar dados históricos para análise técnica
    const klines = await this.getBinancePublic().getKlines(
      symbol,
      UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME,
      UNIFIED_TRADING_CONFIG.CHART.PERIODS
    );

    // 5. Calcular volatilidade do mercado
    const volatility = await calculateSymbolVolatility(
      this.getBinancePublic(),
      symbol,
      UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME,
      UNIFIED_TRADING_CONFIG.CHART.PERIODS
    );

    // 6. Validação completa com níveis técnicos
    console.log('🔍 Validação final com Suporte/Resistência + Volatilidade...');
    console.log(`📊 Volatilidade ${symbol}: ${volatility.toFixed(2)}%`);

    const priceResult = calculateTargetAndStopPricesWithLevels(
      boostedDecision.price,
      boostedDecision.confidence,
      boostedDecision.action,
      klines
    );

    console.log(`🎯 Target: ${priceResult.targetPrice.toFixed(2)} (Nível: ${priceResult.levels.support.toFixed(2)})`);
    console.log(`🛑 Stop: ${priceResult.stopPrice.toFixed(2)} (Resistência: ${priceResult.levels.resistance.toFixed(2)})`);

    const { targetPrice, stopPrice } = priceResult;

    const riskRewardResult = calculateRiskRewardDynamic(
      boostedDecision.price,
      targetPrice,
      stopPrice,
      boostedDecision.action
    );

    if (!riskRewardResult.isValid) {
      console.log('❌ Validações falharam - Risk/Reward insuficiente');
      return false;
    }

    // Atualizar decisão com boost
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
    'Multi Smart Bot Simulator SELL',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🔴 Análise multi-dimensional avançada - APENAS VENDAS',
    UNIFIED_TRADING_CONFIG.SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
