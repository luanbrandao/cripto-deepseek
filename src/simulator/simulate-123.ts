import { TradeSimulator } from '../simulator/trade-simulator';
import Analyzer123 from '../analyzers/123Analyzer';

async function runSimulation123() {
  const tradesFile = `./src/trades/123analyzerTrades.json`;
  const simulator = new TradeSimulator(Analyzer123, 1000, 'BTCUSDT', tradesFile);
  await simulator.simulate();
}

runSimulation123();