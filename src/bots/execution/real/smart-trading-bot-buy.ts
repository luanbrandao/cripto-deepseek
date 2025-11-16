import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig } from '../../core/types';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { EmaAnalyzer, TradingConfigManager } from '../../../core';
import { ValidationLogger } from '../../utils/validation/validation-logger';
import { SmartBotValidator } from '../../utils/validation/smart-bot-validator';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';

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
    const { SymbolFilter } = await import('../../utils/analysis/symbol-filter');
    return SymbolFilter.filterByEma(symbols, this.emaAnalyzer, this.getBinancePublic());
  }

  private async validateSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    ValidationLogger.logValidationHeader('ULTRA-CONSERVADORA');

    return await SmartBotValidator.validateSmartDecision(
      decision,
      symbol,
      marketData,
      this.getBinancePublic(),
      this.trendAnalyzer,
      'UltraConservative'
    );
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