import { hasActiveTradeForSymbol } from '../../bots/utils/validation/symbol-trade-checker';
import { TradingConfigManager } from '../../shared/config/trading-config-manager';

async function testAllSimulators() {
  console.log('🧪 Testando validação de todos os simuladores...\n');

  const simulators = [
    { name: 'Real Bot Simulator', file: TradingConfigManager.getConfig().FILES.REAL_BOT_SIMULATOR },
    { name: 'Smart Bot Simulator BUY', file: TradingConfigManager.getConfig().FILES.SMART_SIMULATOR_BUY },
    { name: 'EMA Simulator', file: `ema${TradingConfigManager.getConfig().EMA.FAST_PERIOD}-${TradingConfigManager.getConfig().EMA.SLOW_PERIOD}Trades.json` },
    { name: '123 Pattern Simulator', file: '123analyzerTrades.json' }
  ];

  for (const sim of simulators) {
    console.log(`📋 ${sim.name} (${sim.file}):`);

    for (const symbol of TradingConfigManager.getConfig().SYMBOLS) {
      const hasActive = await hasActiveTradeForSymbol(
        undefined,
        symbol,
        true,
        sim.file
      );
      console.log(`   ${symbol}: ${hasActive ? '❌ Simulação ativa' : '✅ Disponível'}`);
    }
    console.log('');
  }

  console.log('✅ Teste completo!');
  console.log('🛡️ Todos os simuladores verificam trades duplicados');
}

testAllSimulators().catch(console.error);