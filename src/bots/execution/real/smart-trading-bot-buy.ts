import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig } from '../../core/types';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic, validateConfidence } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import TradingConfigManager from '../../../shared/config/trading-config-manager';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from '../../../shared/validators/trend-validator';

dotenv.config();

export class SmartTradingBotBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative Smart Bot BUY',
      isSimulation: false,
      tradesFile: 'ultraConservativeSmartBotBuy.json'
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
    
    logBotHeader('🛡️ ULTRA-CONSERVATIVE SMART BOT BUY v4.0', 'Win Rate Target: 80%+ | Risk/Reward: 3:1 | Confiança Min: 90%');
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByEma(symbols: string[]): Promise<string[]> {
    const validSymbols = [];

    for (const symbol of symbols) {
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
    
    console.log('🛡️ PRÉ-VALIDAÇÃO ULTRA-CONSERVADORA...');
    
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
    
    // 2. VALIDAÇÕES ESPECÍFICAS SMART BOT
    console.log('🔍 Validações específicas Smart Bot...');
    
    // Validar tendência EMA para alta
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation: false })) {
      console.log('❌ Tendência EMA não favorável para compra');
      return false;
    }

    // Validar decisão DeepSeek para BUY
    if (!validateDeepSeekDecision(decision, 'BUY')) {
      console.log('❌ DeepSeek não recomenda BUY');
      return false;
    }

    // 3. BOOST INTELIGENTE DE CONFIANÇA
    const boostedDecision = boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'BUY' });
    console.log(`🚀 Confiança após boost: ${boostedDecision.confidence}%`);

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
    try {
      return await this.flowManager.executeStandardFlow(
        this.analyzeWithSmartTradeLogic.bind(this),
        this.filterSymbolsByEma.bind(this),
        this.validateSmartDecision.bind(this)
      );
    } catch (error) {
      console.error('❌ Erro no Smart Trading Bot BUY:', error);
      console.log('🔄 Bot continuará funcionando no próximo ciclo...');
      return null;
    }
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const smartBot = new SmartTradingBotBuy(apiKey, apiSecret);
    await smartBot.executeTrade();
  }

  logBotStartup(
    'Smart Bot BUY',
    '🧠 Análise dupla: EMA + DeepSeek AI - APENAS COMPRAS (Long-Only)'
  ).then(() => main());
}