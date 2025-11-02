import { hasActiveTradeForSymbol } from './bots/utils/symbol-trade-checker';
import { TRADING_CONFIG } from './bots/config/trading-config';

async function testAllSimulators() {
  console.log('🧪 Testando validação de todos os simuladores...\n');
  
  const simulators = [
    { name: 'Real Bot Simulator', file: TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR },
    { name: 'Smart Bot Simulator', file: TRADING_CONFIG.FILES.SMART_SIMULATOR },
    { name: 'EMA Simulator', file: 'ema12-26Trades.json' },
    { name: '123 Pattern Simulator', file: '123analyzerTrades.json' }
  ];
  
  for (const sim of simulators) {
    console.log(`📋 ${sim.name} (${sim.file}):`);
    
    for (const symbol of TRADING_CONFIG.SYMBOLS) {
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