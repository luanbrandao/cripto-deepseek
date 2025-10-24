import { TradeSimulator } from './simulator/trade-simulator';
import SimpleAnalyzer from './analyzers/simpleAnalyzer';

async function runSimulation() {
  const simulator = new TradeSimulator(SimpleAnalyzer, 1000, 'SOLUSDT');
  await simulator.simulate();
}

runSimulation();