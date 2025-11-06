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
import { UNIFIED_TRADING_CONFIG } from '../../../shared/config/unified-trading-config';
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
      name: 'Smart Trading Bot BUY',
      isSimulation: false,
      tradesFile: UNIFIED_TRADING_CONFIG.FILES.SMART_BOT_BUY
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: UNIFIED_TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: UNIFIED_TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL SMART TRADING BOT BUY v3.0 - REFATORADO', 'Análise Dupla (EMA + DeepSeek AI) + Múltiplas Moedas - APENAS COMPRAS');
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByEma(symbols: string[]): Promise<string[]> {
    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(symbol, UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME, UNIFIED_TRADING_CONFIG.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });

      if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
        validSymbols.push(symbol);
      }
    }

    return validSymbols;
  }

  private async validateSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;
    // 1. Validar tendência EMA
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation: false })) return false;

    // 2. Validar decisão DeepSeek
    if (!validateDeepSeekDecision(decision, 'BUY')) return false;

    // 3. Aplicar boost inteligente
    const boostedDecision = boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'BUY' });

    // 4. Validação de confiança mínima (OBRIGATÓRIA)
    console.log('🔍 Validação de confiança mínima...');
    if (!validateConfidence(boostedDecision)) {
      console.log('❌ Trade cancelado - Confiança insuficiente');
      return false;
    }

    // 5. Validação de Risk/Reward
    console.log('🔍 Validação final de Risk/Reward antes da execução...');

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
      console.log('❌ Trade cancelado - Risk/Reward insuficiente');
      return false;
    }

    // Atualizar decisão com boost
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