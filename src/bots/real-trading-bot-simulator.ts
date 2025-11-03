import { BaseTradingBot } from './base-trading-bot';
import { validateBinanceKeys } from './utils/env-validator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { validateTradingConditions } from './utils/bot-initializer';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { analyzeWithRealTrade } from './analyzers/real-trade-analyzer';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export class RealTradingBotSimulator extends BaseTradingBot {
  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
  }

  protected logBotInfo() {
    console.log('🚀 NÃO EXECUTA TRADE REAIS\n');
    logBotHeader('REAL TRADING BOT SIMULATOR', 'Simulação do Real Trading Bot Multi-Moeda');
  }

  private async analyzeWithRealTradeLogic(symbol: string, marketData: any) {
    return await analyzeWithRealTrade(this.deepseek!, symbol, marketData);
  }

  private simulateTradeExecution(decision: any) {
    console.log('\n🚨 SIMULANDO EXECUÇÃO DE ORDEM');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} - $${this.getTradeAmount()}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
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

  async executeTrade() {
    this.logBotInfo();

    try {
      // Validar condições de trading (mesmo fluxo do Real Bot)
      if (!await validateTradingConditions(this.binancePrivate)) {
        return null;
      }

      // Verificar limite de simulações
      const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);
      if (!checkActiveSimulationTradesLimit(tradesFile)) {
        return null;
      }

      const symbols = this.getSymbols();
      const bestAnalysis = await analyzeMultipleSymbols(
        symbols,
        this.binancePublic,
        this.analyzeWithRealTradeLogic.bind(this),
        this.binancePrivate,  // Passar cliente privado para verificação de trades ativos
        true,                 // isSimulation = true
        TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR
      );

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de trade encontrada');
        return null;
      }

      const decision = bestAnalysis.decision;

      // Simular execução (equivalente ao executeAndSaveTradeWithValidation)
      const simulatedOrder = this.simulateTradeExecution(decision);
      await this.saveTradeHistory(decision, simulatedOrder);

      console.log('\n🎯 REAL TRADE SIMULADO COM SUCESSO!');
      console.log('📊 Análise completa salva no histórico');
      console.log('✅ Nenhuma ordem real foi executada');

      return simulatedOrder;

    } catch (error) {
      return handleBotError('Real Trading Bot Simulator', error);
    }
  }

  private async saveTradeHistory(decision: any, simulatedOrder: any) {
    const trade = createTradeRecord(decision, simulatedOrder, TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR);
    saveTradeHistory(trade, TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR);
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const simulator = new RealTradingBotSimulator(apiKey, apiSecret);
    await simulator.executeTrade();
  }

  logBotStartup(
    'Real Trading Bot Simulator',
    '🧪 Simulação do Real Trading Bot com múltiplas moedas + DeepSeek AI'
  ).then(() => main());
}