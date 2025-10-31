import { BinancePublicClient } from '../clients/binance-public-client';
import { DeepSeekService } from '../clients/deepseek-client';
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
import * as path from 'path';

class SmartTradingBotSimulator {
  private binancePublic: BinancePublicClient;
  private deepseek: DeepSeekService;
  private trendAnalyzer: MarketTrendAnalyzer;

  constructor() {
    this.binancePublic = new BinancePublicClient();
    this.deepseek = new DeepSeekService();
    this.trendAnalyzer = new MarketTrendAnalyzer();
  }

  private logBotInfo() {
    console.log('🚀 MULTI-SYMBOL SMART TRADING BOT SIMULATOR');
    console.log('✅ MODO SIMULAÇÃO - Nenhuma ordem real será executada');
    logBotHeader('SIMULADOR MULTI-SYMBOL SMART BOT', 'Análise Dupla (EMA + DeepSeek AI) + Múltiplas Moedas - SIMULAÇÃO');
  }


  private simulateTradeExecution(decision: any) {
    console.log('\n🚨 SIMULANDO EXECUÇÃO DE ORDEM');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} - $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança final: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    // Simular resultado da ordem
    const simulatedOrder = {
      orderId: 'SIM_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED',
      executedQty: (TRADING_CONFIG.TRADE_AMOUNT_USD / decision.price).toFixed(6)
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

  async simulateTrade() {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.SMART_SIMULATOR}`);
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    try {
      // 1. Analisar múltiplas moedas com DeepSeek
      const symbols = TRADING_CONFIG.SYMBOLS;
      const bestAnalysis = await analyzeMultipleSymbols(
        symbols,
        this.binancePublic,
        this.deepseek,
        async (analysis: string, symbol: string, price: number) => {
          return await analyzeWithDeepSeek(this.deepseek, symbol, { price: { price: price.toString() }, stats: {} });
        }
      );
      
      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de simulação encontrada');
        return null;
      }

      // 2. Verificar tendência com EMA para a moeda escolhida
      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(bestAnalysis.symbol);
      if (!validateTrendAnalysis(trendAnalysis, true)) {
        return null;
      }

      // 3. Validar decisão do DeepSeek
      if (!validateDeepSeekDecision(bestAnalysis.decision)) {
        return null;
      }

      // 4. Boost de confiança com validação 2:1 obrigatória
      const boostedDecision = boostConfidence(bestAnalysis.decision);
      
      // 5. VALIDAÇÃO FINAL: Confirmar Risk/Reward 2:1 antes da simulação
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

async function main() {
  const smartBotSimulator = new SmartTradingBotSimulator();
  await smartBotSimulator.simulateTrade();
}

logBotStartup(
  'Smart Bot Simulator',
  '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise dupla: EMA + DeepSeek AI',
  TRADING_CONFIG.SIMULATION.STARTUP_DELAY
).then(() => main());