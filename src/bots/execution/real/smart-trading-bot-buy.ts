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
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
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
    const config = TradingConfigManager.getConfig();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: config.EMA.FAST_PERIOD,
      slowPeriod: config.EMA.SLOW_PERIOD
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
    
    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA INICIADA...');
    
    // 🚨 ANÁLISE ULTRA-RIGOROSA EM 5 CAMADAS
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);
    
    if (!ultraAnalysis.isValid) {
      console.log('❌ REJEITADO pela análise ultra-conservadora:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }
    
    console.log('✅ APROVADO pela análise ultra-conservadora:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);
    
    // Atualizar decisão com análise ultra-conservadora
    decision.confidence = ultraAnalysis.confidence;
    decision.ultraConservativeScore = ultraAnalysis.score;
    decision.riskLevel = ultraAnalysis.riskLevel;
    
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