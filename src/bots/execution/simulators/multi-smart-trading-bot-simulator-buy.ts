import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedStrength } from '../../utils/validation/unified-advanced-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';
import { TradingConfigManager } from '../../../core';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { PreValidationService } from '../../../shared/services/pre-validation-service';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';

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

      const strengthValid = validateAdvancedStrength(analysis, threshold, 'BUY');
      const strongUptrend = this.advancedEmaAnalyzer.isStrongUptrend(analysis);
      const moderateUptrend = this.advancedEmaAnalyzer.isModerateUptrend(analysis);
      const trendValid = strongUptrend || moderateUptrend;
      
      // Mais permissivo: aceitar se tem força OU tendência (não ambos)
      if (strengthValid || trendValid || analysis.overallStrength > threshold * 0.8) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${analysis.overallStrength.toFixed(1)} (${condition.type})`);
      } else {
        console.log(`❌ ${symbol}: ${analysis.overallStrength.toFixed(1)} < ${threshold}`);
        if (!trendValid) console.log(`   ❌ Não está em tendência de alta`);
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
    // Critérios EXECUTÁVEIS para Multi-Smart Bot BUY
    switch (marketType) {
      case 'BULL_MARKET': return 20; // Permissivo em bull market
      case 'BEAR_MARKET': return 30; // Moderado em bear market  
      case 'SIDEWAYS': return 25;    // Executável para mercado atual
      default: return 25;            // Padrão executável
    }
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO MULTI-SMART BUY SIMULATOR...');

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

    // 1. SMART PRÉ-VALIDAÇÃO PARA COMPRAS (REALISTA)
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
      console.log('🔄 Tentando validação mais permissiva para BUY...');
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
        
        // Para BUY, ser mais permissivo se a IA tem alta confiança
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

    // 2. VALIDAÇÕES ESPECÍFICAS MULTI-SMART BUY
    console.log('🔍 Validações específicas Multi-Smart BUY...');

    // Validar tendência EMA para alta (mais permissivo para BUY)
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    // Para BUY, aceitar tendência de alta OU lateral com variação positiva
    const isBuyFriendly = trendAnalysis.isUptrend || 
                         trendAnalysis.reason?.includes('lateral') || 
                         trendAnalysis.reason?.includes('consolidação') ||
                         trendAnalysis.reason?.includes('sideways') ||
                         parseFloat(stats.priceChangePercent) >= -0.5; // Aceitar se variação >= -0.5%
    
    if (!isBuyFriendly) {
      console.log('❌ Tendência muito bearish para compra');
      console.log(`💭 Razão: ${trendAnalysis.reason}`);
      console.log(`📊 Variação 24h: ${stats.priceChangePercent}%`);
      return false;
    }
    console.log('✅ Condições de mercado favoráveis para BUY');
    console.log(`📊 Variação 24h: ${stats.priceChangePercent}% (adequada para BUY)`);

    // Validar decisão DeepSeek para BUY
    if (decision.action !== 'BUY') {
      console.log('❌ DeepSeek não recomenda BUY');
      return false;
    }
    console.log('✅ DeepSeek confirma oportunidade de BUY');
    
    // Validar confiança mínima
    if (decision.confidence < config.MIN_CONFIDENCE) {
      console.log(`❌ Confiança ${decision.confidence}% < ${config.MIN_CONFIDENCE}% mínimo`);
      return false;
    }
    console.log(`✅ Confiança ${decision.confidence}% ≥ ${config.MIN_CONFIDENCE}% mínimo`);

    // 3. BOOST INTELIGENTE DE CONFIANÇA (mais conservador)
    const boostedDecision = boostConfidence(decision, { baseBoost: 3, maxBoost: 8, trendType: 'BUY' });
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
      console.log('❌ Risk/Reward insuficiente para simulação');
      return false;
    }

    console.log('🧪 SIMULAÇÃO MULTI-SMART BUY APROVADA - Excelente oportunidade!');

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
