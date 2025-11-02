import { hasActiveTradeForSymbol } from './utils/symbol-trade-checker';
import { TRADING_CONFIG } from './config/trading-config';

async function testRealBotValidation() {
  console.log('🧪 Testando validação do Real Trading Bot...\n');
  
  console.log('📋 Verificando trades pendentes no realTradingBot.json:');
  const symbols = TRADING_CONFIG.SYMBOLS;
  
  for (const symbol of symbols) {
    const hasActive = await hasActiveTradeForSymbol(
      undefined, 
      symbol, 
      false, 
      TRADING_CONFIG.FILES.REAL_BOT
    );
    console.log(`   ${symbol}: ${hasActive ? '❌ Trade pendente encontrado' : '✅ Sem trades pendentes'}`);
  }
  
  console.log('\n✅ Teste concluído!');
  console.log('📝 Real Trading Bot agora verifica trades pendentes antes de executar');
}

testRealBotValidation().catch(console.error);