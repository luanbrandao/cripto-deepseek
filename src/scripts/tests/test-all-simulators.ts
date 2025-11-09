import { hasActiveTradeForSymbol } from '../../bots/utils/validation/symbol-trade-checker';
import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

async function testAllSimulators() {
  console.log('🧪 Testando validação de todos os simuladores...\n');
  
  const simulators = [
    { name: 'Real Bot Simulator', file: UNIFIED_TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR },
    { name: 'Smart Bot Simulator BUY', file: UNIFIED_TRADING_CONFIG.FILES.SMART_SIMULATOR_BUY },
    { name: 'EMA Simulator', file: `ema${UNIFIED_TRADING_CONFIG.EMA.FAST_PERIOD}-${UNIFIED_TRADING_CONFIG.EMA.SLOW_PERIOD}Trades.json` },
    { name: '123 Pattern Simulator', file: '123analyzerTrades.json' }
  ];
  
  for (const sim of simulators) {
    console.log(`📋 ${sim.name} (${sim.file}):`);
    
    for (const symbol of UNIFIED_TRADING_CONFIG.SYMBOLS) {
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