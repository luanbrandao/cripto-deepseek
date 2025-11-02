import { BaseTradingBot } from './base-trading-bot';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { calculateRiskReward } from './utils/trade-validators';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { analyzeWithDeepSeek } from './utils/deepseek-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import EmaAnalyzer from '../analyzers/emaAnalyzer';
import * as path from 'path';

export class SmartTradingBotSimulator extends BaseTradingBot {
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MULTI-SYMBOL SMART TRADING BOT SIMULATOR');
    console.log('✅ MODO SIMULAÇÃO - Nenhuma ordem real será executada');
    logBotHeader('SIMULADOR MULTI-SYMBOL SMART BOT', 'Análise Dupla (EMA + DeepSeek AI) + Múltiplas Moedas - SIMULAÇÃO');
  }

  private simulateTradeExecution(decision: any) {
    console.log('\n🚨 SIMULANDO EXECUÇÃO DE ORDEM');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} - $${this.getTradeAmount()}`);
    console.log(`📊 Confiança final: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    const simulatedOrder = {
      orderId: 'SIM_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED',
      executedQty: (this.getTradeAmount() / decision.price).toFixed(6)
    };

    console.log('✅ Ordem simulada com sucesso!');
    console.log(`🆔 ID simulado: ${simulatedOrder.orderId}`);
    console.log(`💱 Qtd simulada: ${simulatedOrder.executedQty}`);
    console.log(`💰 Preço: $${decision.price}`);

    return simulatedOrder;
  }

  private async simulateAndSave(decision: any) {
    const simulatedOrder = this.simulateTradeExecution(decision);
    await this.saveTradeHistory(decision, simulatedOrder);

    console.log('\n🎯 SMART TRADE SIMULADO COM SUCESSO!');
    console.log('📊 Análise completa salva no histórico');
    console.log('✅ Nenhuma ordem real foi executada');

    return simulatedOrder;
  }

  async executeTrade() {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.SMART_SIMULATOR}`);
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    try {
      const symbols = this.getSymbols();
      
      // Filtrar símbolos com EMA de alta primeiro
      const validSymbols = [];
      for (const symbol of symbols) {
        const klines = await this.binancePublic.getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
        const prices = klines.map((k: any) => parseFloat(k[4]));
        const currentPrice = prices[prices.length - 1];
        const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });
        
        if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
          validSymbols.push(symbol);
        }
      }
      
      if (validSymbols.length === 0) {
        console.log('\n⏸️ Nenhuma moeda com EMA de alta encontrada');
        return null;
      }
      
      const bestAnalysis = await analyzeMultipleSymbols(
        validSymbols,
        this.binancePublic,
        this.deepseek!,
        async (analysis: string, symbol: string, price: number) => {
          return await analyzeWithDeepSeek(this.deepseek!, symbol, { price: { price: price.toString() }, stats: {} });
        },
        undefined,
        true,
        TRADING_CONFIG.FILES.SMART_SIMULATOR
      );
      
      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de simulação encontrada');
        return null;
      }

      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(bestAnalysis.symbol);
      if (!validateTrendAnalysis(trendAnalysis, true)) {
        return null;
      }

      if (!validateDeepSeekDecision(bestAnalysis.decision)) {
        return null;
      }

      const boostedDecision = boostConfidence(bestAnalysis.decision);
      
      console.log('🔍 Validação final de Risk/Reward 2:1 para simulação...');
      const { riskPercent, rewardPercent } = calculateRiskReward(boostedDecision.confidence);
      console.log(`📊 R/R calculado: ${(rewardPercent*100).toFixed(1)}%/${(riskPercent*100).toFixed(1)}% (${(rewardPercent/riskPercent).toFixed(1)}:1)`);
      
      return await this.simulateAndSave(boostedDecision);

    } catch (error) {
      return handleBotError('Smart Trading Bot Simulator', error);
    }
  }

  private async saveTradeHistory(decision: any, simulatedOrder: any) {
    const trade = createTradeRecord(decision, simulatedOrder, TRADING_CONFIG.FILES.SMART_SIMULATOR);
    saveTradeHistory(trade, TRADING_CONFIG.FILES.SMART_SIMULATOR);
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const smartBotSimulator = new SmartTradingBotSimulator();
    await smartBotSimulator.executeTrade();
  }

  logBotStartup(
    'Smart Bot Simulator',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise dupla: EMA + DeepSeek AI',
    TRADING_CONFIG.SIMULATION.STARTUP_DELAY
  ).then(() => main());
}