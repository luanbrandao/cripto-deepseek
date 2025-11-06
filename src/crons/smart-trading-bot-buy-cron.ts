import cron from 'node-cron';
import { SmartTradingBotBuy } from '../bots/smart-trading-bot-buy';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from '../bots/utils/validation/env-validator';

dotenv.config();

console.log('🤖 Smart Trading Bot Cron iniciado - Execução a cada 5 minutos');

const keys = validateBinanceKeys();
if (!keys) {
  console.error('❌ Chaves da Binance não configuradas. Encerrando...');
  process.exit(1);
}

const { apiKey, apiSecret } = keys;

cron.schedule('*/5 * * * *', async () => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n⏰ [${timestamp}] Executando Smart Trading Bot...`);

  try {
    const bot = new SmartTradingBotBuy(apiKey, apiSecret);
    const tradeResult = await bot.executeTrade();

    if (tradeResult) {
      console.log('📊 Trade real executado com sucesso');
    } else {
      console.log('⚠️ Nenhum trade executado neste ciclo');
    }

    console.log(`✅ [${timestamp}] Ciclo completo finalizado\n`);
  } catch (error) {
    console.error(`❌ [${timestamp}] Erro no ciclo:`, error);
    console.log('⏳ Aguardando próximo ciclo...\n');
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando Smart Trading Bot Cron...');
  process.exit(0);
});

console.log('✅ Cron job configurado. Pressione Ctrl+C para parar.');