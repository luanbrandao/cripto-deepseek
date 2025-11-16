import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { validateTrade, calculateRiskReward } from '../../utils/risk/trade-validators';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { EmaAnalyzer, TradingConfigManager } from '../../../core';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { BaseTradingBot } from '../../core/base-trading-bot';
import UltraConservativeAnalyzer from '../../../core/analyzers/factories/ultra-conservative-analyzer';

dotenv.config();

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

export class EmaTradingBot extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, false);

    const config: BotConfig = {
      name: 'Ultra-Conservative EMA Trading Bot',
      isSimulation: false,
      tradesFile: 'ultraConservativeEmaBot.json'
    };

    this.flowManager = new BotFlowManager(this, config);
    const tradingConfig = TradingConfigManager.getConfig();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: tradingConfig.EMA.FAST_PERIOD,
      slowPeriod: tradingConfig.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();

    logBotHeader('🛡️ ULTRA-CONSERVATIVE EMA BOT v4.0', `Win Rate Target: 75%+ | EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} | Risk/Reward: 3:1`);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const config = TradingConfigManager.getConfig();
    const klines = await this.getBinancePublic().getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    return {
      price24h: prices,
      currentPrice
    };
  }

  private analyzeWithEma(symbol: string, marketData: MarketData): TradeDecision {
    const config = TradingConfigManager.getConfig();
    console.log(`\n📊 Analisando mercado com EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD}...`);

    const analysis = this.emaAnalyzer.analyze(marketData);

    console.log(`📈 Sinal EMA: ${analysis.action} (${analysis.confidence}%)`);
    console.log(`💭 Razão: ${analysis.reason}`);

    return {
      action: analysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: analysis.confidence,
      reason: analysis.reason,
      symbol,
      price: marketData.currentPrice
    };
  }

  private async analyzeSymbolWithEma(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return this.analyzeWithEma(symbol, fullMarketData);
  }

  private async validateEmaDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ PRÉ-VALIDAÇÃO ULTRA-CONSERVADORA EMA...');

    // 1. SMART PRÉ-VALIDAÇÃO ULTRA-CONSERVADORA
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .usePreset('UltraConservative')
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

    // Atualizar decisão com smart pré-validação e análise ultra-conservadora
    decision.confidence = smartValidation.confidence || ultraAnalysis.confidence;
    decision.validationScore = smartValidation.totalScore;
    (decision as any).ultraConservativeScore = ultraAnalysis.score;
    (decision as any).riskLevel = smartValidation.riskLevel || ultraAnalysis.riskLevel;
    (decision as any).smartValidationPassed = true;
    (decision as any).activeLayers = smartValidation.activeLayers;

    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbolWithEma.bind(this),
      undefined,
      this.validateEmaDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const emaBot = new EmaTradingBot(apiKey, apiSecret);
    await emaBot.executeTrade();
  }

  logBotStartup(
    'EMA Bot',
    '📊 Estratégia: Médias Móveis Exponenciais (EMA 12/26)'
  ).then(() => main());
}