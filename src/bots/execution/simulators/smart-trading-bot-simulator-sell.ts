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

export class SmartTradingBotSimulatorSell extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Smart Trading Bot Simulator SELL',
      isSimulation: true,
      tradesFile: TradingConfigManager.getConfig().FILES.SMART_SIMULATOR_SELL,
      requiresFiltering: true,
      requiresValidation: true,
      riskCalculationMethod: 'Basic Method'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TradingConfigManager.getConfig().EMA.FAST_PERIOD,
      slowPeriod: TradingConfigManager.getConfig().EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MODO SIMULAÇÃO - SEM TRADES REAIS\n');
    console.log('🔴 FOCO EM VENDAS - Estratégia Short-Only RIGOROSA');
    logBotHeader('SMART BOT SIMULATOR SELL v2.1 - TENDÊNCIAS CLARAS', 'Análise Dupla (EMA + DeepSeek AI) + Validação de Tendência - APENAS VENDAS', true);

    console.log('🎯 RECURSOS PARA VENDAS:');
    console.log('  • EMA Rigoroso (apenas SELL aceito)');
    console.log('  • Trend Validation (exige tendência de baixa)');
    console.log('  • Smart Pre-Validation com 70% confiança mínima');
    console.log('  • Modo Ultra-Permissivo (70% confiança backup)');
    console.log('  • Volume 40% mais flexível');
    console.log('  • Volatilidade 2x mais tolerante');
    console.log('  • Boost Inteligente para Vendas (até +15%)');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Assertividade: 70-85% (SELL RIGOROSO)\n');
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeSmartTradeSell(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByEma(symbols: string[]): Promise<string[]> {
    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(symbol, TradingConfigManager.getConfig().CHART.TIMEFRAME, TradingConfigManager.getConfig().CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });

      // Filtro RIGOROSO para SELL: apenas tendências claras de venda
      if (emaAnalysis.action === 'SELL') {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${emaAnalysis.action} - ${emaAnalysis.reason}`);
      } else {
        console.log(`❌ ${symbol}: ${emaAnalysis.action} - Não há tendência clara de venda`);
      }
    }

    return validSymbols;
  }



  private async validateSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO SMART SELL SIMULATOR...');

    // 1. SMART PRÉ-VALIDAÇÃO PARA VENDAS (PERMISSIVA)
    const config = TradingConfigManager.getConfig();
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.6, 25)  // Volume mais flexível
      .withMomentum(0.005, 20)  // Momentum muito baixo
      .withConfidence(config.MIN_CONFIDENCE, 25)  // Confiança 10% menor (60%)
      .withVolatility(config.MARKET_FILTERS.MIN_VOLATILITY * 0.5, config.MARKET_FILTERS.MAX_VOLATILITY * 2, 30)  // Volatilidade muito flexível
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid) {
      console.log('⚠️ VALIDAÇÃO PADRÃO FALHOU - Tentando modo ULTRA-PERMISSIVO...');

      // Validação ultra-permissiva para Smart Bot SELL
      const ultraPermissive = await SmartPreValidationService
        .createBuilder()
        .withConfidence(config.MIN_CONFIDENCE, 10)
        .build()
        .validate(symbol, marketData, decision, this.getBinancePublic());

      if (!ultraPermissive.isValid) {
        console.log('❌ VALIDAÇÃO ULTRA-PERMISSIVA FALHOU:');
        ultraPermissive.warnings.forEach(warning => console.log(`   ${warning}`));
        return false;
      }

      console.log('✅ VALIDAÇÃO ULTRA-PERMISSIVA APROVADA (Smart Bot SELL):');
      ultraPermissive.reasons.forEach(reason => console.log(`   ${reason}`));

      // Usar dados da validação permissiva
      decision.validationScore = ultraPermissive.totalScore;
      decision.riskLevel = 'HIGH';  // Sempre alto risco no modo permissivo
      decision.smartValidationPassed = true;
      decision.activeLayers = ultraPermissive.activeLayers;
    } else {
      console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
      smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
      console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
      console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
      console.log(`🔴 Camadas SELL: ${smartValidation.activeLayers.join(', ')}`);

      decision.validationScore = smartValidation.totalScore;
      decision.riskLevel = smartValidation.riskLevel;
      decision.smartValidationPassed = true;
      decision.activeLayers = smartValidation.activeLayers;
    }

    // 2. VALIDAÇÕES ESPECÍFICAS SMART SELL
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    // Para SELL: exigir tendência de baixa clara
    if (trendAnalysis.isUptrend) {
      console.log('❌ MERCADO EM TENDÊNCIA DE ALTA - Não adequado para SELL');
      console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
      return false;
    }
    console.log('✅ TENDÊNCIA DE BAIXA CONFIRMADA - Adequado para SELL');

    if (!validateDeepSeekDecision(decision, 'SELL')) return false;

    // 3. BOOST INTELIGENTE PARA VENDAS
    const boostedDecision = boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'SELL' });

    // 4. VALIDAÇÃO FINAL DE RISK/REWARD
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
      console.log('❌ Risk/Reward insuficiente para simulação SELL');
      return false;
    }

    // Atualizar decisão com boost (validação já aplicada acima)
    decision.confidence = boostedDecision.confidence;
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
    const smartBotSimulatorSell = new SmartTradingBotSimulatorSell();
    await smartBotSimulatorSell.executeTrade();
  }

  logBotStartup(
    'Smart Bot Simulator SELL',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🔴 Análise dupla RIGOROSA: EMA + DeepSeek AI - APENAS VENDAS',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
