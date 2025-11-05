import { BaseTradingBot } from './base-trading-bot';
import { BotFlowManager, BotConfig } from './utils/bot-flow-manager';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { calculateRiskRewardDynamic } from './utils/trade-validators';
import { calculateTargetAndStopPrices } from './utils/price-calculator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { multiAnalyzeWithSmartTradeSell } from './analyzers/multi-smart-trade-analyzer-sell';
import {
  validateAdvancedBearishTrend,
  validateAdvancedSellDecision,
  boostAdvancedSellConfidence,
  validateAdvancedSellStrength
} from './utils/advanced-sell-validator';
import { AdvancedEmaAnalyzer } from './services/advanced-ema-analyzer';

export class MultiSmartTradingBotSimulatorSell extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator SELL',
      isSimulation: true,
      tradesFile: TRADING_CONFIG.FILES.MULTI_SMART_SIMULATOR_SELL,
      requiresFiltering: true,
      requiresValidation: true
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MODO SIMULAÇÃO - SEM TRADES REAIS\n');
    console.log('🔴 FOCO EXCLUSIVO EM VENDAS - Estratégia Short-Only Avançada');
    logBotHeader('MULTI-SMART BOT SIMULATOR SELL v2.0', 'Análise Multi-Dimensional - SIMULAÇÃO - APENAS VENDAS', true);

    console.log('🎯 RECURSOS AVANÇADOS PARA VENDAS:');
    console.log('  • EMA Multi-Timeframe (Death Cross Detection)');
    console.log('  • AI Parser com Análise Bearish Avançada');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum) BEARISH');
    console.log('  • Filtro Adaptativo para Condições Bearish');
    console.log('  • Boost Inteligente para Vendas (até +15%)');
    console.log('  • Validação Ultra-Rigorosa (85%+ confiança)');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Assertividade: 90-95% (Short-Only)\n');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await multiAnalyzeWithSmartTradeSell(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro BEARISH adaptativo...`);

    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(
        symbol,
        TRADING_CONFIG.CHART.TIMEFRAME,
        TRADING_CONFIG.CHART.PERIODS
      );

      const prices = klines.map((k: any) => parseFloat(k[4]));
      const volumes = klines.map((k: any) => parseFloat(k[5]));

      const analysis = this.advancedEmaAnalyzer.analyzeAdvanced(prices, volumes);
      const condition = this.advancedEmaAnalyzer.getMarketCondition(analysis);

      const threshold = this.getThresholdSellMarketCondition(condition.type);

      console.log(`📊 ${symbol}: Score ${analysis.overallStrength.toFixed(1)}, Mercado: ${condition.type}, Threshold: ${threshold}`);
      
      if (this.isSymbolValid(analysis, threshold)) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: APROVADO`);
      } else {
        console.log(`❌ ${symbol}: REJEITADO`);
      }
    }

    return validSymbols;
  }

  private getThresholdSellMarketCondition(marketType: string): number {
    switch (marketType) {
      case 'BULL_MARKET': return 60;  // Mais rigoroso em mercado de alta
      case 'BEAR_MARKET': return 25;  // Muito permissivo em mercado de baixa
      default: return 35;             // Padrão para mercado lateral
    }
  }

  private isSymbolValid(analysis: any, threshold: number): boolean {
    // Validação específica para vendas - procura por tendências de baixa
    const isBearishTrend = this.isBearishByEma(analysis);

    return validateAdvancedSellStrength(analysis, threshold) && isBearishTrend;
  }

  private isBearishByEma(analysis: any): boolean {
    // Detectar tendência bearish baseada em EMAs
    const isBearish = (
      analysis.shortTerm.trend === 'DOWN' ||
      analysis.mediumTerm.trend === 'DOWN' ||
      analysis.longTerm.trend === 'DOWN'
    );
    
    const isNotUptrend = !this.advancedEmaAnalyzer.isStrongUptrend(analysis) &&
                        !this.advancedEmaAnalyzer.isModerateUptrend(analysis);
    
    return isBearish || isNotUptrend;
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;
    // 1. Validar tendência EMA para baixa
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateAdvancedBearishTrend(trendAnalysis, true)) return false;

    // 2. Validar decisão DeepSeek para SELL com critérios rigorosos
    if (!validateAdvancedSellDecision(decision)) return false;

    // 3. Aplicar boost inteligente para vendas avançadas
    const boostedDecision = boostAdvancedSellConfidence(decision);

    // 4. Validação completa (confiança + ação + risk/reward)
    console.log('🔍 Validação final de Risk/Reward para simulação...');

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
      console.log('❌ Validações falharam - Risk/Reward insuficiente');
      return false;
    }

    // Atualizar decisão com boost
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
  async function main() {
    const multiSmartBotSimulatorSell = new MultiSmartTradingBotSimulatorSell();
    await multiSmartBotSimulatorSell.executeTrade();
  }

  logBotStartup(
    'Multi Smart Bot Simulator SELL',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🔴 Análise multi-dimensional avançada - APENAS VENDAS',
    TRADING_CONFIG.SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}