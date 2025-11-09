
import { TRADING_CONFIG } from '../../bots/config/trading-config';
import EmaAnalyzer from '../../analyzers/emaAnalyzer';
import { TradeSimulator } from './trade-simulator';
import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

async function runEmaSimulation() {
  console.log('🚀 MULTI-SYMBOL EMA CROSSOVER SIMULATOR');
  console.log(`📊 Estratégia: EMA ${TRADING_CONFIG.EMA.FAST_PERIOD}/${TRADING_CONFIG.EMA.SLOW_PERIOD} + Múltiplas Moedas\n`);

  // Configurar EMA com períodos do config
  const emaConfig = {
    fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
    slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
  };
  const analyzer = new EmaAnalyzer(emaConfig);

  const tradesFile = `${UNIFIED_TRADING_CONFIG.PATHS.TRADES_DIR}/ema${emaConfig.fastPeriod}-${emaConfig.slowPeriod}Trades.json`;
  const simulator = new TradeSimulator(analyzer, UNIFIED_TRADING_CONFIG.SIMULATION.INITIAL_BALANCE, UNIFIED_TRADING_CONFIG.SYMBOLS, tradesFile);
  await simulator.simulate(UNIFIED_TRADING_CONFIG.SYMBOLS);
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  runEmaSimulation();
}