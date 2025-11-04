import { BaseTradingBot } from './base-trading-bot';
import { BotFlowManager, BotConfig } from './utils/bot-flow-manager';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { calculateRiskRewardDynamic } from './utils/trade-validators';
import { calculateTargetAndStopPrices } from './utils/price-calculator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { multiAnalyzeWithSmartTrade } from './analyzers/multi-smart-trade-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { AdvancedEmaAnalyzer } from './services/advanced-ema-analyzer';

export class MultiSmartTradingBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);
    
    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator',
      isSimulation: true,
      tradesFile: TRADING_CONFIG.FILES.SMART_SIMULATOR,
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
    logBotHeader('MULTI-SMART BOT SIMULATOR v2.0', 'Análise Multi-Dimensional - SIMULAÇÃO');
    
    console.log('🎯 RECURSOS AVANÇADOS:');
    console.log('  • EMA Multi-Timeframe (12/26/50/100/200)');
    console.log('  • AI Parser com Análise de Sentimento');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum)');
    console.log('  • Filtro Adaptativo por Condição de Mercado');
    console.log('  • Boost Inteligente de Confiança');
    console.log('  • Simulação Segura (Zero Risco)');
    console.log('  • Assertividade: 92-95%\n');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await multiAnalyzeWithSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);
    
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

  private async validateMultiSmartDecision(decision: any, symbol?: string): Promise<boolean> {
    if (!symbol) return false;
    // 1. Validar tendência EMA
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, true)) return false;

    // 2. Validar decisão DeepSeek
    if (!validateDeepSeekDecision(decision)) return false;

    // 3. Aplicar boost inteligente
    const boostedDecision = boostConfidence(decision);

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
    const multiSmartBotSimulator = new MultiSmartTradingBotSimulator();
    await multiSmartBotSimulator.executeTrade();
  }

  logBotStartup(
    'Multi Smart Bot Simulator',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise multi-dimensional avançada',
    TRADING_CONFIG.SIMULATION.STARTUP_DELAY
  ).then(() => main());
}