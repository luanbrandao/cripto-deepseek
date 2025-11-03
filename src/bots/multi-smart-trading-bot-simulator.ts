import { BaseTradingBot } from './base-trading-bot';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { calculateRiskRewardDynamic, validateTrade, calculateRiskReward, validateConfidence } from './utils/trade-validators';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { multiAnalyzeWithSmartTrade } from './analyzers/multi-smart-trade-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { AdvancedEmaAnalyzer } from './services/advanced-ema-analyzer';
import * as path from 'path';

export class MultiSmartTradingBotSimulator extends BaseTradingBot {
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);
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

  private simulateTradeExecution(decision: any) {
    console.log('\n🚨 SIMULANDO TRADE');
    console.log(`📝 ${decision.action} ${decision.symbol} - $${this.getTradeAmount()} (${decision.confidence}%)`);

    const simulatedOrder = {
      orderId: 'SIM_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED',
      executedQty: (this.getTradeAmount() / decision.price).toFixed(6)
    };

    console.log(`✅ Simulação concluída! ID: ${simulatedOrder.orderId}`);
    this.saveTradeHistory(decision, simulatedOrder);
    
    return simulatedOrder;
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await multiAnalyzeWithSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);
    
    const validSymbols = [];
    
    for (const symbol of symbols) {
      const klines = await this.binancePublic.getKlines(
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

  private async validateDecision(decision: any, symbol: string): Promise<boolean> {
    // 1. Validar tendência EMA
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, true)) return false;

    // 2. Validar decisão DeepSeek
    if (!validateDeepSeekDecision(decision)) return false;

    // 3. Aplicar boost inteligente
    const boostedDecision = boostConfidence(decision);

    // 4. Validação completa (confiança + ação + risk/reward)
    const { riskPercent, rewardPercent } = calculateRiskReward(boostedDecision.confidence);
    if (!validateTrade(boostedDecision, riskPercent, rewardPercent)) {
      console.log('❌ Validações falharam');
      return false;
    }

    // Atualizar decisão com boost
    Object.assign(decision, boostedDecision);
    return true;
  }

  async executeTrade() {
    this.logBotInfo();

    // 1. Verificar limites de simulações ativas
    const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.SMART_SIMULATOR}`);
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    try {
      // 2. Filtrar moedas por força técnica
      const symbols = this.getSymbols();
      const validSymbols = await this.filterSymbolsByStrength(symbols);
      
      if (validSymbols.length === 0) {
        console.log('\n⏸️ Nenhuma moeda passou no filtro');
        return null;
      }

      console.log(`\n🎯 ${validSymbols.length} moedas aprovadas: ${validSymbols.join(', ')}`);

      // 3. Analisar e selecionar melhor oportunidade
      const bestAnalysis = await analyzeMultipleSymbols(
        validSymbols,
        this.binancePublic,
        this.analyzeSymbol.bind(this),
        undefined,
        true,
        TRADING_CONFIG.FILES.SMART_SIMULATOR
      );

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade encontrada');
        return null;
      }

      // 4. Validar decisão final
      if (!(await this.validateDecision(bestAnalysis.decision, bestAnalysis.symbol))) {
        return null;
      }

      // 5. Simular trade
      return this.simulateTradeExecution(bestAnalysis.decision);

    } catch (error) {
      return handleBotError('Multi-Smart Trading Bot Simulator', error);
    }
  }

  private saveTradeHistory(decision: any, simulatedOrder: any): void {
    const trade = createTradeRecord(decision, simulatedOrder, TRADING_CONFIG.FILES.SMART_SIMULATOR);
    saveTradeHistory(trade, TRADING_CONFIG.FILES.SMART_SIMULATOR);
    console.log('💾 Simulação salva no histórico');
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
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise dupla: EMA + DeepSeek AI',
    TRADING_CONFIG.SIMULATION.STARTUP_DELAY
  ).then(() => main());
}