import { TradeSimulator } from './simulator/trade-simulator';

async function runSimulation() {
  const simulator = new TradeSimulator(1000, 'BTCUSDT');
  await simulator.simulate();
}

runSimulation();