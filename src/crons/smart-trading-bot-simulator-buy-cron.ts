import cron from 'node-cron';
import * as dotenv from 'dotenv';
import { SmartTradingBotSimulatorBuy } from '../bots';

dotenv.config();

console.log('🤖 Smart Trading Bot Simulator BUY Cron iniciado - Execução a cada 5 minutos');



cron.schedule('*/5 * * * *', async () => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n⏰ [${timestamp}] Executando Smart Trading Bot Simulator BUY...`);

  try {
    const bot = new SmartTradingBotSimulatorBuy();
    const tradeResult = await bot.executeTrade();

    if (tradeResult) {
      console.log('📊 Trade simulado executado com sucesso');
    } else {
      console.log('⚠️ Nenhum trade simulado executado neste ciclo');
    }

    console.log(`✅ [${timestamp}] Ciclo completo finalizado\n`);
  } catch (error) {
    console.error(`❌ [${timestamp}] Erro no ciclo:`, error);
    console.log('⏳ Aguardando próximo ciclo...\n');
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando Smart Trading Bot Simulator BUY Cron...');
  process.exit(0);
});

console.log('✅ Cron job configurado. Pressione Ctrl+C para parar.');