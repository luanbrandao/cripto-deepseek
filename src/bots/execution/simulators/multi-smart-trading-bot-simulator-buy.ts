import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPricesRealMarket } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedBuyStrength } from '../../utils/validation/advanced-buy-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { PreValidationService } from '../../../shared/services/pre-validation-service';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';

export class MultiSmartTradingBotSimulatorBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator BUY',
      isSimulation: true,
      tradesFile: TradingConfigManager.getConfig().FILES.MULTI_SMART_SIMULATOR_BUY,
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
    logBotHeader('MULTI-SMART BOT SIMULATOR BUY v5.0 - PRÉ-VALIDAÇÃO INTELIGENTE', 'Análise Multi-Dimensional + Pré-Validação Inteligente - SIMULAÇÃO', true);

    console.log('🎯 RECURSOS AVANÇADOS:');
    console.log('  • EMA Multi-Timeframe (12/26/50/100/200)');
    console.log('  • AI Parser com Análise de Sentimento');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum)');
    console.log('  • Filtro Adaptativo por Condição de Mercado');
    console.log('  • Boost Inteligente de Confiança');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Targets Baseados em Suporte/Resistência');
    console.log('  • 🚀 MÓDULOS UNIFICADOS (v5.0)');
    console.log('  • 🧠 Pré-Validação Inteligente (API Fluente)');
    console.log('  • 🔧 Camadas Customizáveis: EMA+RSI+Volume+S/R+Momentum+Confiança');
    console.log('  • 🔍 Validações Específicas Multi-Smart');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeMultiSmartTradeBuy(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);

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

      const threshold = this.getThresholdBuyMarketCondition(condition.type);

      const strengthValid = validateAdvancedBuyStrength(analysis, threshold);
      const strongUptrend = this.advancedEmaAnalyzer.isStrongUptrend(analysis);
      const moderateUptrend = this.advancedEmaAnalyzer.isModerateUptrend(analysis);
      const trendValid = strongUptrend || moderateUptrend;

      if (strengthValid && trendValid) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${analysis.overallStrength.toFixed(1)} (${condition.type})`);
      } else {
        console.log(`❌ ${symbol}: ${analysis.overallStrength.toFixed(1)} < ${threshold}`);
      }
    }

    return validSymbols;
  }

  // private getThresholdBuyMarketCondition(marketType: string): number {
  //   switch (marketType) {
  //     case 'BULL_MARKET': return 25; // Mais oportunidades em bull market
  //     case 'BEAR_MARKET': return 35; // Seletivo em bear market
  //     case 'SIDEWAYS': return 30;    // Moderado em mercado lateral
  //     default: return 31.4;          // Padrão mais realista para mercado atual
  //   }
  // }

  private getThresholdBuyMarketCondition(marketType: string): number {
    // Critérios REALISTAS para Multi-Smart Bot BUY (equilibrio precisão/execução)
    switch (marketType) {
      case 'BULL_MARKET': return 30; // Seletivo mas executável em bull market
      case 'BEAR_MARKET': return 45; // Rigoroso em bear market  
      case 'SIDEWAYS': return 35;    // Moderado em mercado lateral
      default: return 40;            // Padrão realista para boa precisão
    }
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO INTELIGENTE MULTI-SMART SIMULATOR...');

    // 1. SMART PRÉ-VALIDAÇÃO INTELIGENTE COM CAMADAS CUSTOMIZADAS
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 25)
      .withRSI(14, 20)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER / 2, 20)
      .withSupportResistance(config.EMA_ADVANCED.MIN_SEPARATION * 2, 15)
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH / 2, 10)
      .withConfidence(config.MIN_CONFIDENCE, 10)
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid) {
      console.log('❌ SMART PRÉ-VALIDAÇÃO INTELIGENTE FALHOU:');
      smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ SMART PRÉ-VALIDAÇÃO INTELIGENTE APROVADA:');
    smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
    console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    console.log(`🔍 Camadas Ativas: ${smartValidation.activeLayers.join(', ')}`);
    console.log(`🎯 Confiança Calculada: ${smartValidation.confidence}%`);

    // 2. VALIDAÇÕES ESPECÍFICAS MULTI-SMART
    console.log('🔍 Validações específicas Multi-Smart...');
    
    // Validar tendência EMA para alta
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation: true })) {
      console.log('❌ Tendência EMA não favorável para compra');
      return false;
    }

    // Validar decisão DeepSeek para BUY
    if (!validateDeepSeekDecision(decision, 'BUY')) {
      console.log('❌ DeepSeek não recomenda BUY');
      return false;
    }

    // 3. BOOST INTELIGENTE DE CONFIANÇA
    const boostedDecision = boostConfidence(decision, { baseBoost: 8, maxBoost: 15, trendType: 'BUY' });
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
      console.log('❌ Risk/Reward insuficiente para simulação');
      return false;
    }

    console.log('🧪 SIMULAÇÃO MULTI-SMART APROVADA - Excelente oportunidade!');

    // Atualizar decisão com smart pré-validação inteligente e boost
    decision.confidence = smartValidation.confidence || boostedDecision.confidence;
    decision.validationScore = smartValidation.totalScore;
    (decision as any).riskLevel = smartValidation.riskLevel;
    (decision as any).activeLayers = smartValidation.activeLayers;
    (decision as any).smartPreValidationPassed = true;
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
    const multiSmartBotSimulator = new MultiSmartTradingBotSimulatorBuy();
    await multiSmartBotSimulator.executeTrade();
  };

  logBotStartup(
    'Multi Smart Bot Simulator BUY v4.1',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise multi-dimensional + Pré-validação otimizada',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
