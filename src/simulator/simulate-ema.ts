import { TradeSimulator } from '../simulator/trade-simulator';
import EmaAnalyzer from '../analyzers/emaAnalyzer';

async function runEmaSimulation() {
  // Configurar EMA com períodos personalizados
  const emaConfig = { fastPeriod: 5, slowPeriod: 10 }; // EMA 12/26
  const analyzer = new EmaAnalyzer(emaConfig);

  const tradesFile = `./src/trades/ema${emaConfig.fastPeriod}-${emaConfig.slowPeriod}Trades.json`;
  const simulator = new TradeSimulator(analyzer, 1000, 'BNBUSDT', tradesFile);
  await simulator.simulate();
}

runEmaSimulation();