import { TradingConfigManager } from '../../core';
import Analyzer123 from '../../core/analyzers/technical/pattern-123';
import { TradeSimulator } from "./trade-simulator";

async function runSimulation123() {
  console.log('🚀 MULTI-SYMBOL 123 PATTERN SIMULATOR');
  console.log('📊 Estratégia: Padrão 123 de Reversão + Múltiplas Moedas\n');

  const tradesFile = `${TradingConfigManager.getConfig().PATHS.TRADES_DIR}/123analyzerTrades.json`;
  const simulator = new TradeSimulator(Analyzer123, TradingConfigManager.getConfig().SIMULATION.INITIAL_BALANCE, TradingConfigManager.getConfig().SYMBOLS, tradesFile);
  await simulator.simulate(TradingConfigManager.getConfig().SYMBOLS);
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  runSimulation123();
}