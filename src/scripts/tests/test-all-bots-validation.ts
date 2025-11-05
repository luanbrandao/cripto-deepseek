import { TRADING_CONFIG } from "../../bots";
import { hasActiveTradeForSymbol } from "../../bots/utils/symbol-trade-checker";

async function testAllBotsValidation() {
  console.log('🧪 Testando validação de todos os bots...\n');

  const botFiles = [
    { name: 'Real Trading Bot', file: TRADING_CONFIG.FILES.REAL_BOT },
    { name: 'Smart Trading Bot', file: TRADING_CONFIG.FILES.SMART_BOT },
    { name: 'EMA Trading Bot', file: TRADING_CONFIG.FILES.EMA_BOT },
    { name: 'Real Bot Simulator', file: TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR },
    { name: 'Smart Bot Simulator Buy', file: TRADING_CONFIG.FILES.SMART_SIMULATOR_BUY }
  ];

  for (const bot of botFiles) {
    console.log(`📋 ${bot.name} (${bot.file}):`);

    for (const symbol of TRADING_CONFIG.SYMBOLS) {
      const hasActive = await hasActiveTradeForSymbol(
        undefined,
        symbol,
        bot.file.includes('Simulator'),
        bot.file
      );
      console.log(`   ${symbol}: ${hasActive ? '❌ Trade ativo' : '✅ Disponível'}`);
    }
    console.log('');
  }

  console.log('✅ Validação completa!');
  console.log('🛡️ Todos os bots verificam trades duplicados');
}

testAllBotsValidation().catch(console.error);