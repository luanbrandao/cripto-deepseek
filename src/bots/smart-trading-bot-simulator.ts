import { BinancePublicClient } from '../clients/binance-public-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { calculateRiskReward } from './utils/trade-validators';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { getMarketData } from './utils/market-data-fetcher';
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
    console.log('🚀 SMART TRADING BOT SIMULATOR - ANÁLISE DUPLA (EMA + DEEPSEEK AI)');
    console.log('✅ MODO SIMULAÇÃO - Nenhuma ordem real será executada');
    console.log(`💵 Valor simulado por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`🎯 Risk/Reward OBRIGATÓRIO: ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1 (SEMPRE 2:1)`);
    console.log('✅ GARANTIA: Todas as simulações terão reward 2x maior que o risco\n');
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

  async simulateTrade(symbol: string = 'BTCUSDT') {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, 'trades/smartTradingBotSimulator.json');
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    try {
      // 1. Verificar tendência com EMA
      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
      if (!validateTrendAnalysis(trendAnalysis, true)) {
        return null;
      }

      // 2. Obter dados de mercado e analisar com DeepSeek
      const marketData = await getMarketData(this.binancePublic, symbol);
      const decision = await analyzeWithDeepSeek(this.deepseek, symbol, marketData);

      // 3. Validar decisão do DeepSeek
      if (!validateDeepSeekDecision(decision)) {
        return null;
      }

      // 4. Boost de confiança com validação 2:1 obrigatória
      const boostedDecision = boostConfidence(decision);
      
      // 5. VALIDAÇÃO FINAL: Confirmar Risk/Reward 2:1 antes da simulação
      console.log('🔍 Validação final de Risk/Reward 2:1 para simulação...');
      const { riskPercent, rewardPercent } = calculateRiskReward(boostedDecision.confidence);
      console.log(`📊 R/R calculado: ${(rewardPercent*100).toFixed(1)}%/${(riskPercent*100).toFixed(1)}% (${(rewardPercent/riskPercent).toFixed(1)}:1)`);
      
      return await this.simulateAndSave(boostedDecision);

    } catch (error) {
      console.error('❌ Erro no Smart Trading Bot Simulator:', error);
      return null;
    }
  }

  private async saveTradeHistory(decision: any, simulatedOrder: any) {
    const trade = createTradeRecord(decision, simulatedOrder, 'smartTradingBotSimulator.json');
    saveTradeHistory(trade, 'smartTradingBotSimulator.json');
  }
}

async function main() {
  const smartBotSimulator = new SmartTradingBotSimulator();
  await smartBotSimulator.simulateTrade('BTCUSDT');
}

console.log('🧪 SMART TRADING BOT SIMULATOR');
console.log('✅ Modo seguro - Apenas simulação, sem trades reais');
console.log('🧠 Análise dupla: EMA + DeepSeek AI');
console.log('⏳ Iniciando em 3 segundos...');

setTimeout(() => {
  main();
}, 3000);