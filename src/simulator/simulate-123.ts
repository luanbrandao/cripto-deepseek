import { TradeSimulator } from '../simulator/trade-simulator';
import { TRADING_CONFIG } from '../bots/config/trading-config';
import Analyzer123 from '../analyzers/123Analyzer';

async function runSimulation123() {
  console.log('🚀 MULTI-SYMBOL 123 PATTERN SIMULATOR');
  console.log('📊 Estratégia: Padrão 123 de Reversão + Múltiplas Moedas\n');
  
  const tradesFile = `./src/trades/123analyzerTrades.json`;
  const simulator = new TradeSimulator(Analyzer123, 1000, TRADING_CONFIG.SYMBOLS, tradesFile);
  await simulator.simulate(TRADING_CONFIG.SYMBOLS);
}

runSimulation123();