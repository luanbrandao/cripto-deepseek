import { validateTradingConditions } from './bot-initializer';
import { checkActiveSimulationTradesLimit } from '../validation/simulation-limit-checker';
import { UnifiedMultiSymbolAnalyzer } from '../../../shared/utils/unified-multi-symbol-analyzer';
import { executeAndSaveTradeWithValidation, handleBotError } from './bot-executor';
import { createTradeRecord, saveTradeHistory } from './trade-history-saver';
import { UNIFIED_TRADING_CONFIG } from '../../../shared/config/unified-trading-config';
import * as path from 'path';
import { BaseTradingBot } from '../../core/base-trading-bot';

export interface BotConfig {
  name: string;
  isSimulation: boolean;
  tradesFile: string;
  requiresValidation?: boolean;
  requiresFiltering?: boolean;
}

export interface TradeExecutionResult {
  orderId: string;
  symbol: string;
  side: string;
  price: number;
  status: string;
  executedQty: string;
}

export class BotFlowManager {
  constructor(private bot: BaseTradingBot, private config: BotConfig) { }

  async executeStandardFlow(
    analyzeFunction: (symbol: string, marketData: any) => Promise<any>,
    filterFunction?: (symbols: string[]) => Promise<string[]>,
    validateFunction?: (decision: any, symbol?: string) => Promise<boolean>
  ): Promise<TradeExecutionResult | null> {

    try {
      // 1. Validações iniciais
      if (!await this.performInitialValidations()) {
        return null;
      }

      // 2. Filtrar símbolos (se necessário)
      const symbols = await this.getValidSymbols(filterFunction);
      if (symbols.length === 0) {
        console.log('\n⏸️ Nenhuma moeda válida encontrada');
        return null;
      }

      // 3. Analisar múltiplos símbolos
      const bestAnalysis = await this.analyzeSymbols(symbols, analyzeFunction);
      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade encontrada');
        return null;
      }

      // 4. Validar decisão (se necessário)
      if (validateFunction && !await validateFunction(bestAnalysis.decision, bestAnalysis.symbol)) {
        return null;
      }

      // 5. Executar trade
      return await this.executeTrade(bestAnalysis.decision);

    } catch (error) {
      return handleBotError(this.config.name, error);
    }
  }

  private async performInitialValidations(): Promise<boolean> {
    if (this.config.isSimulation) {
      const tradesFile = `${UNIFIED_TRADING_CONFIG.PATHS.TRADES_DIR}/${this.config.tradesFile}`;
      return checkActiveSimulationTradesLimit(tradesFile);
    } else {
      return await validateTradingConditions(this.bot.getBinancePrivate());
    }
  }

  private async getValidSymbols(filterFunction?: (symbols: string[]) => Promise<string[]>): Promise<string[]> {
    const symbols = this.bot.getSymbols();

    if (filterFunction) {
      return await filterFunction(symbols);
    }

    return symbols;
  }

  private async analyzeSymbols(
    symbols: string[],
    analyzeFunction: (symbol: string, marketData: any) => Promise<any>
  ) {
    return await UnifiedMultiSymbolAnalyzer.analyzeMultipleSymbols(
      symbols,
      analyzeFunction,
      {
        binancePublic: this.bot.getBinancePublic(),
        binancePrivate: this.config.isSimulation ? undefined : this.bot.getBinancePrivate(),
        isSimulation: this.config.isSimulation,
        simulationFile: this.config.tradesFile,
        logLevel: 'DETAILED'
      }
    );
  }

  private async executeTrade(decision: any): Promise<TradeExecutionResult | null> {
    if (this.config.isSimulation) {
      return await this.simulateTrade(decision);
    } else {
      return await executeAndSaveTradeWithValidation(
        decision,
        this.bot.getBinancePrivate(),
        this.config.tradesFile,
        'REAL'
      );
    }
  }

  private async simulateTrade(decision: any): Promise<TradeExecutionResult> {
    console.log('\n🚨 SIMULANDO EXECUÇÃO DE ORDEM');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} - $${this.bot.getTradeAmount()}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    const simulatedOrder: TradeExecutionResult = {
      orderId: 'SIM_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED',
      executedQty: (this.bot.getTradeAmount() / decision.price).toFixed(6)
    };

    console.log('✅ Ordem simulada com sucesso!');
    console.log(`🆔 ID simulado: ${simulatedOrder.orderId}`);
    console.log(`💱 Qtd simulada: ${simulatedOrder.executedQty}`);
    console.log(`💰 Preço: $${decision.price}`);

    // Salvar histórico
    const trade = createTradeRecord(decision, simulatedOrder, this.config.tradesFile);
    saveTradeHistory(trade, this.config.tradesFile);

    console.log('\n🎯 TRADE SIMULADO COM SUCESSO!');
    console.log('📊 Análise completa salva no histórico');
    console.log('✅ Nenhuma ordem real foi executada');

    return simulatedOrder;
  }
}
