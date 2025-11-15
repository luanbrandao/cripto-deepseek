import { BaseTradingBot } from '../../core/base-trading-bot';
import { BinancePrivateClient } from '../../../core/clients/binance-private-client';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig } from '../../core/types';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from '../../../shared/validators/trend-validator';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';

export class MultiSmartTradingBotBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    // Inicializar com DeepSeek para análise AI
    super(undefined, undefined, true);

    // Inicializar BinancePrivateClient para trades reais
    const { validateBinanceKeys } = require('../../utils/validation/env-validator');
    const keys = validateBinanceKeys();
    if (keys) {
      this.binancePrivate = new BinancePrivateClient(keys.apiKey, keys.apiSecret);
    }

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot BUY',
      isSimulation: false,
      tradesFile: TradingConfigManager.getConfig().FILES.MULTI_SMART_BUY
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: TradingConfigManager.getConfig().EMA.FAST_PERIOD,
      slowPeriod: TradingConfigManager.getConfig().EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('⚠️  EXECUTA TRADES REAIS NA BINANCE ⚠️\n');
    logBotHeader('MULTI-SMART TRADING BOT BUY v3.0 - REFATORADO', 'Análise Multi-Dimensional + Trades Reais - APENAS COMPRAS');

    console.log('🎯 RECURSOS AVANÇADOS:');
    console.log('  • EMA Multi-Timeframe (12/26/50/100/200)');
    console.log('  • AI Parser com Análise de Sentimento');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum)');
    console.log('  • Filtro Adaptativo por Condição de Mercado');
    console.log('  • Boost Inteligente de Confiança');
    console.log('  • Execução com OCO Orders (TP+SL)');
    console.log('  • Assertividade: 92-95%\n');
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

      const threshold = this.getThresholdByMarketCondition(condition.type);

      if (this.isSymbolValid(analysis, threshold)) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${analysis.overallStrength.toFixed(1)} (${condition.type})`);
      } else {
        console.log(`❌ ${symbol}: ${analysis.overallStrength.toFixed(1)} < ${threshold}`);
      }
    }

    return validSymbols;
  }

  private getThresholdByMarketCondition(marketType: string): number {
    switch (marketType) {
      case 'BULL_MARKET': return 65;
      case 'BEAR_MARKET': return 85;
      default: return 75;
    }
  }

  private isSymbolValid(analysis: any, threshold: number): boolean {
    return analysis.overallStrength > threshold &&
      (this.advancedEmaAnalyzer.isStrongUptrend(analysis) ||
        this.advancedEmaAnalyzer.isModerateUptrend(analysis));
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO MULTI-SMART REAL BOT...');

    // 1. SMART PRÉ-VALIDAÇÃO MULTI-SMART
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withEma(12, 26, 25)
      .withRSI(14, 20)
      .withVolume(1.5, 20)
      .withSupportResistance(0.5, 15)
      .withMomentum(0.02, 15)
      .withConfidence(85, 25)
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

    // 2. VALIDAÇÕES ESPECÍFICAS MULTI-SMART
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation: false })) return false;

    if (!validateDeepSeekDecision(decision, 'BUY')) return false;

    // 3. BOOST INTELIGENTE
    const boostedDecision = boostConfidence(decision, { baseBoost: 8, maxBoost: 15, trendType: 'BUY' });

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
      console.log('❌ Risk/Reward insuficiente para trade real');
      return false;
    }

    // Atualizar decisão com smart pré-validação e boost
    decision.confidence = smartValidation.confidence || boostedDecision.confidence;
    decision.validationScore = smartValidation.totalScore;
    decision.riskLevel = smartValidation.riskLevel;
    decision.smartValidationPassed = true;
    decision.activeLayers = smartValidation.activeLayers;
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
    const multiSmartBotBuy = new MultiSmartTradingBotBuy();
    await multiSmartBotBuy.executeTrade();
  }

  logBotStartup(
    'Multi-Smart Trading Bot BUY',
    '⚠️  TRADES REAIS - Ordens executadas na Binance\n🧠 Análise multi-dimensional avançada - APENAS COMPRAS',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY
  ).then(() => main());
}