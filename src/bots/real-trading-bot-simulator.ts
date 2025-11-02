import { BaseTradingBot } from './base-trading-bot';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { TradeDecision, validateTrade, calculateRiskReward } from './utils/trade-validators';
import { validateBinanceKeys } from './utils/env-validator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { analyzeWithRealTradeDeepSeek } from './utils/real-trade-deepseek-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

interface SymbolAnalysis {
  symbol: string;
  decision: TradeDecision;
  score: number;
}

export class RealTradingBotSimulator extends BaseTradingBot {
  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
  }

  protected logBotInfo() {
    logBotHeader('REAL TRADING BOT SIMULATOR', 'Simulação do Real Trading Bot Multi-Moeda');
    console.log('🚀 NÃO EXECUTA TRADE REAIS\n');
  }

  private async analyzeWithRealTradeLogic(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    // Usar a lógica do Real-Trade: BUY, SELL ou HOLD
    return await analyzeWithRealTradeDeepSeek(this.deepseek!, symbol, { 
      price: { price: price.toString() }, 
      stats: {} 
    });
  }

  private async executeTradeDecision(decision: TradeDecision) {
    console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    if (decision.action === 'HOLD') {
      console.log('⏸️ Nenhuma ação executada - aguardando melhor oportunidade');
      return null;
    }

    try {
      const accountInfo = await this.binancePrivate.getAccountInfo();
      console.log('✅ Conta verificada - executando trade simulado');

      console.log('🚨 MODO SIMULAÇÃO - Ordem não executada na exchange');
      console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} @ $${decision.price}`);

      return {
        orderId: 'SIMULATED_' + Date.now(),
        symbol: decision.symbol,
        side: decision.action,
        price: decision.price,
        status: 'SIMULATED'
      };

    } catch (error) {
      console.error('❌ Erro ao executar trade:', error);
      return null;
    }
  }



  async executeTrade() {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    console.log('🚀 Iniciando Multi-Symbol Trading Bot com DeepSeek AI');

    try {
      const symbols = this.getSymbols();
      const bestAnalysis = await analyzeMultipleSymbols(
        symbols,
        this.binancePublic,
        this.deepseek!,
        this.analyzeWithRealTradeLogic.bind(this),
        undefined,
        true,
        TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR
      );

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de trade encontrada');
        return null;
      }

      const decision = bestAnalysis.decision;

      const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);

      if (!validateTrade(decision, riskPercent, rewardPercent)) {
        console.log('❌ Simulação cancelada - Validações falharam');
        return null;
      }

      const orderResult = await this.executeTradeDecision(decision);

      const trade: Trade = {
        timestamp: new Date().toISOString(),
        symbol: decision.symbol,
        action: decision.action,
        price: decision.price,
        entryPrice: decision.price,
        targetPrice: decision.action === 'BUY' ? decision.price * 1.02 : decision.price * 0.98,
        stopPrice: decision.action === 'BUY' ? decision.price * 0.99 : decision.price * 1.01,
        amount: orderResult ? this.getTradeAmount() : 0,
        balance: TRADING_CONFIG.SIMULATION.INITIAL_BALANCE,
        crypto: 0,
        reason: `${decision.reason} (Melhor entre ${this.getSymbols().length} moedas analisadas)`,
        confidence: decision.confidence,
        status: orderResult ? 'pending' : 'completed',
        riskReturn: {
          potentialGain: decision.price * 0.02,
          potentialLoss: decision.price * 0.01,
          riskRewardRatio: 2.0
        }
      };

      if (orderResult) {
        trade.result = 'win';
        trade.exitPrice = decision.price;
        trade.actualReturn = 0;
      }

      const saveFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);
      TradeStorage.saveTrades([trade], saveFile);
      console.log(`\n💾 Trade salvo no histórico: ${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);

      console.log('\n✅ Execução completa do Trading Bot');
      return orderResult;

    } catch (error) {
      return handleBotError('Real Trading Bot Simulator', error);
    }
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