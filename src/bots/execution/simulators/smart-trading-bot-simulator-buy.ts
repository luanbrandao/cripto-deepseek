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
      name: 'Ultra-Conservative Smart Simulator BUY',
      isSimulation: true,
      tradesFile: 'ultraConservativeSmartSimulatorBuy.json',
      requiresFiltering: true,
      requiresValidation: true,
      riskCalculationMethod: 'Ultra-Conservative Method'
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
    const config = TradingConfigManager.getConfig();

    console.log('🛡️ ULTRA-CONSERVATIVE SIMULATOR - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ ULTRA-CONSERVATIVE SMART SIMULATOR BUY v4.0', 'Win Rate Target: 80%+ | Máxima Segurança | Apenas Simulação', true);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
    console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
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

      if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
        validSymbols.push(symbol);
      }
    }

    return validSymbols;
  }

  private async validateSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO ULTRA-CONSERVADORA SIMULATOR...');

    // 1. SMART PRÉ-VALIDAÇÃO ULTRA-CONSERVADORA
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .usePreset('Simulation')
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
    console.log(`🔍 Camadas Ativas: ${smartValidation.activeLayers.join(', ')}`);

    // 2. ANÁLISE ULTRA-CONSERVADORA ADICIONAL
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);

    if (!ultraAnalysis.isValid) {
      console.log('❌ ANÁLISE ULTRA-CONSERVADORA FALHOU:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ ANÁLISE ULTRA-CONSERVADORA APROVADA:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log('🧪 Esta seria uma excelente oportunidade para trade real!');

    // Atualizar decisão com smart pré-validação e análise ultra-conservadora
    decision.confidence = smartValidation.confidence || ultraAnalysis.confidence;
    decision.validationScore = smartValidation.totalScore;
    decision.ultraConservativeScore = ultraAnalysis.score;
    decision.riskLevel = smartValidation.riskLevel || ultraAnalysis.riskLevel;
    decision.smartValidationPassed = true;
    decision.activeLayers = smartValidation.activeLayers;

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
    'Ultra-Conservative Smart Simulator Buy',
    '🛡️ Ultra-Conservador v4.0 - Win Rate Target: 80%+\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}
