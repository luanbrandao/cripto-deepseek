import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPricesWithLevels } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedBuyStrength } from '../../utils/validation/advanced-buy-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';

import { UNIFIED_TRADING_CONFIG } from '../../../shared/config/unified-trading-config';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';

export class MultiSmartTradingBotSimulatorBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator BUY',
      isSimulation: true,
      tradesFile: UNIFIED_TRADING_CONFIG.FILES.MULTI_SMART_SIMULATOR_BUY,
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
    logBotHeader('MULTI-SMART BOT SIMULATOR BUY v3.0 - REFATORADO', 'Análise Multi-Dimensional - SIMULAÇÃO - APENAS COMPRAS', true);

    console.log('🎯 RECURSOS AVANÇADOS:');
    console.log('  • EMA Multi-Timeframe (12/26/50/100/200)');
    console.log('  • AI Parser com Análise de Sentimento');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum)');
    console.log('  • Filtro Adaptativo por Condição de Mercado');
    console.log('  • Boost Inteligente de Confiança');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Targets Baseados em Suporte/Resistência');
    console.log('  • 🚀 MÓDULOS UNIFICADOS (v3.0)');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeMultiSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);

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
    // Critérios ULTRA-RIGOROSOS para Multi-Smart Bot BUY (máxima precisão)
    switch (marketType) {
      case 'BULL_MARKET': return 45; // Muito seletivo mesmo em bull market
      case 'BEAR_MARKET': return 65; // Extremamente rigoroso em bear market  
      case 'SIDEWAYS': return 55;    // Ultra-rigoroso em mercado lateral
      default: return 60;            // Padrão ultra-rigoroso para máxima precisão
    }
  }
  private isSymbolValid(analysis: any, threshold: number): boolean {
    // Esta função não é mais usada - lógica movida para filterSymbolsByStrength
    return true;
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;
    
    // 0. Validação ULTRA-RIGOROSA de confiança mínima (80% para Multi-Smart)
    if (decision.confidence < 80) {
      console.log(`❌ Confiança ${decision.confidence}% < 80% (mínimo ULTRA-RIGOROSO)`);
      return false;
    }
    
    // 1. Validar tendência EMA para alta (módulo unificado)
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation: true })) return false;

    // 2. Validar decisão DeepSeek para BUY (módulo unificado)
    if (!validateDeepSeekDecision(decision, 'BUY')) return false;

    // 3. Aplicar boost inteligente (módulo unificado)
    const boostedDecision = boostConfidence(decision, { baseBoost: 8, maxBoost: 15, trendType: 'BUY' });

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

    console.log(`🎯 Target: ${priceResult.targetPrice.toFixed(2)} (Nível: ${priceResult.levels.resistance.toFixed(2)})`);
    console.log(`🛑 Stop: ${priceResult.stopPrice.toFixed(2)} (Suporte: ${priceResult.levels.support.toFixed(2)})`);

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
    const multiSmartBotSimulator = new MultiSmartTradingBotSimulatorBuy();
    await multiSmartBotSimulator.executeTrade();
  };

  logBotStartup(
    'Multi Smart Bot Simulator BUY',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise multi-dimensional avançada',
    UNIFIED_TRADING_CONFIG.SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
