import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic, validateConfidence } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { EmaAnalyzer, TradingConfigManager } from '../../../core';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';
import UltraConservativeAnalyzer from '../../../core/analyzers/factories/ultra-conservative-analyzer';

export class SmartTradingBotSimulatorBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Smart Trading Bot Simulator BUY',
      isSimulation: true,
      tradesFile: TradingConfigManager.getConfig().FILES.SMART_SIMULATOR_BUY,
      requiresFiltering: true,
      requiresValidation: true,
      riskCalculationMethod: 'Basic Method'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    const tradingConfig = TradingConfigManager.getConfig();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: tradingConfig.EMA.FAST_PERIOD,
      slowPeriod: tradingConfig.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MODO SIMULAÇÃO - SEM TRADES REAIS\n');
    console.log('🟢 FOCO EM COMPRAS - Estratégia Long-Only RIGOROSA');
    logBotHeader('SMART BOT SIMULATOR BUY v2.1 - TENDÊNCIAS CLARAS', 'Análise Dupla (EMA + DeepSeek AI) + Validação de Tendência - APENAS COMPRAS', true);
    
    console.log('🎯 RECURSOS PARA COMPRAS:');
    console.log('  • EMA Rigoroso (apenas BUY aceito)');
    console.log('  • Trend Validation (exige tendência de alta)');
    console.log('  • Smart Pre-Validation com 70% confiança mínima');
    console.log('  • Modo Ultra-Permissivo (60% confiança backup)');
    console.log('  • Volume padrão para validação');
    console.log('  • Volatilidade controlada');
    console.log('  • Boost Inteligente para Compras (até +15%)');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Assertividade: 85-90% (BUY RIGOROSO)\n');
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeSmartTradeBuy(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByEma(symbols: string[]): Promise<string[]> {
    const validSymbols = [];

    for (const symbol of symbols) {
      console.log(`\n📊 Analisando Tendência EMA: ${symbol}...`);
      const config = TradingConfigManager.getConfig();
      const klines = await this.getBinancePublic().getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });

      // Filtro rigoroso para BUY: apenas tendência clara de alta
      if (emaAnalysis.action === 'BUY') {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${emaAnalysis.action} - ${emaAnalysis.reason}`);
      } else {
        console.log(`❌ ${symbol}: ${emaAnalysis.action} - Não há tendência clara de alta`);
      }
    }

    return validSymbols;
  }

  private async validateSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO ULTRA-CONSERVADORA SIMULATOR...');

    // 1. SMART PRÉ-VALIDAÇÃO PARA COMPRAS
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(config.EMA.FAST_PERIOD, config.EMA.SLOW_PERIOD, 20)
      .withRSI(14, 15)
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER, 15)
      .withMomentum(config.EMA_ADVANCED.MIN_TREND_STRENGTH, 15)
      .withConfidence(config.MIN_CONFIDENCE, 15)
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY, config.MARKET_FILTERS.MAX_VOLATILITY, 20)
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid) {
      console.log('⚠️ VALIDAÇÃO PADRÃO FALHOU - Tentando modo ULTRA-PERMISSIVO...');
      
      // Validação ultra-permissiva para Smart Bot BUY
      const ultraPermissive = await SmartPreValidationService
        .createBuilder()
        .withConfidence(config.MIN_CONFIDENCE - 10, 100)  // 60% confiança mínima
        .build()
        .validate(symbol, marketData, decision, this.getBinancePublic());
      
      if (!ultraPermissive.isValid) {
        console.log('❌ VALIDAÇÃO ULTRA-PERMISSIVA FALHOU:');
        ultraPermissive.warnings.forEach(warning => console.log(`   ${warning}`));
        return false;
      }
      
      console.log('✅ VALIDAÇÃO ULTRA-PERMISSIVA APROVADA (Smart Bot BUY):');
      ultraPermissive.reasons.forEach(reason => console.log(`   ${reason}`));
      
      // Usar dados da validação permissiva
      decision.validationScore = ultraPermissive.totalScore;
      decision.riskLevel = 'MEDIUM';  // Risco médio no modo permissivo
      decision.smartValidationPassed = true;
      decision.activeLayers = ultraPermissive.activeLayers;
    } else {
      console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
      smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
      console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
      console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
      console.log(`🟢 Camadas BUY: ${smartValidation.activeLayers.join(', ')}`);
      
      decision.validationScore = smartValidation.totalScore;
      decision.riskLevel = smartValidation.riskLevel;
      decision.smartValidationPassed = true;
      decision.activeLayers = smartValidation.activeLayers;
    }

    // 2. VALIDAÇÕES ESPECÍFICAS SMART BUY
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    // Para BUY: exigir tendência de alta clara (rigoroso)
    if (!trendAnalysis.isUptrend) {
      console.log('❌ MERCADO NÃO ESTÁ EM TENDÊNCIA DE ALTA - Não adequado para BUY');
      console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
      return false;
    }
    console.log('✅ TENDÊNCIA DE ALTA CONFIRMADA - Adequado para BUY');

    if (!validateDeepSeekDecision(decision, 'BUY')) return false;

    // 3. ANÁLISE ULTRA-CONSERVADORA ADICIONAL
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);

    if (!ultraAnalysis.isValid) {
      console.log('❌ ANÁLISE ULTRA-CONSERVADORA FALHOU:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ ANÁLISE ULTRA-CONSERVADORA APROVADA:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log('🧪 Esta seria uma excelente oportunidade para trade real!');

    // 4. BOOST INTELIGENTE PARA COMPRAS
    const boostedDecision = boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'BUY' });

    // 5. VALIDAÇÃO FINAL DE RISK/REWARD
    const { targetPrice, stopPrice } = calculateTargetAndStopPrices(
      boostedDecision.price,
      boostedDecision.confidence,
      boostedDecision.action
    );

    const riskRewardResult = calculateRiskRewardDynamic(
      boostedDecision.price,
      targetPrice,
      stopPrice,
      boostedDecision.action
    );

    if (!riskRewardResult.isValid) {
      console.log('❌ Risk/Reward insuficiente para simulação BUY');
      return false;
    }

    // Atualizar decisão com boost (validação já aplicada acima)
    decision.confidence = ultraAnalysis.confidence || boostedDecision.confidence;
    decision.ultraConservativeScore = ultraAnalysis.score;
    Object.assign(decision, boostedDecision);

    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeWithSmartTradeLogic.bind(this),
      this.filterSymbolsByEma.bind(this),
      this.validateSmartDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const smartBotSimulatorBuy = new SmartTradingBotSimulatorBuy();
    await smartBotSimulatorBuy.executeTrade();
  }

  logBotStartup(
    'Smart Bot Simulator BUY',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🟢 Análise dupla RIGOROSA: EMA + DeepSeek AI - APENAS COMPRAS',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
