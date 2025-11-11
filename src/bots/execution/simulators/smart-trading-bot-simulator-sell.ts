import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic, validateConfidence } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';

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
    console.log('🚀 NÃO EXECUTA TRADE REAIS\n');
    console.log('🚀 MULTI-SYMBOL SMART TRADING BOT SIMULATOR SELL');
    console.log('✅ MODO SIMULAÇÃO - Nenhuma ordem real será executada');
    console.log('🔴 FOCO EM VENDAS - Estratégia Short-Only (SELL/HOLD apenas)');
    logBotHeader('SIMULADOR MULTI-SYMBOL SMART BOT SELL', 'Análise Dupla (EMA + DeepSeek AI) + Múltiplas Moedas - APENAS VENDAS', true);
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

      // Filtro para tendência de baixa (oposto do BUY)
      if (emaAnalysis.action === 'SELL' && emaAnalysis.reason.includes('Tendência de baixa confirmada')) {
        validSymbols.push(symbol);
      }
    }

    return validSymbols;
  }



  private async validateSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;

    // 1. Validar tendência EMA para baixa
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'DOWN', isSimulation: true })) return false;

    // 2. Validar decisão DeepSeek para SELL
    if (!validateDeepSeekDecision(decision, 'SELL')) return false;

    // 3. Aplicar boost inteligente para vendas
    const boostedDecision = boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'SELL' });

    // 4. Validação de confiança mínima
    console.log('🔍 Validação de confiança mínima...');
    if (!validateConfidence(boostedDecision)) {
      console.log('❌ Simulação cancelada - Confiança insuficiente');
      return false;
    }

    // 5. Validação de Risk/Reward
    console.log('🔍 Validação final de Risk/Reward 2:1 para simulação...');

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
      console.log('❌ Simulação cancelada - Risk/Reward insuficiente');
      return false;
    }

    // Atualizar decisão com boost
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
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🔴 Análise dupla: EMA + DeepSeek AI - APENAS VENDAS',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
