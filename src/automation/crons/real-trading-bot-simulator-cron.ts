import cron from 'node-cron';
// Import direto da classe sem executar o main
import { RealTradingBotSimulator } from '../../bots/real-trading-bot-simulator';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from '../../bots/utils/env-validator';

dotenv.config();

console.log('🤖 Real Trading Bot Simulator Cron iniciado - Execução a cada 5 minutos');

// Validar chaves da Binance
const keys = validateBinanceKeys();
if (!keys) {
  console.error('❌ Chaves da Binance não configuradas. Encerrando...');
  process.exit(1);
}

const { apiKey, apiSecret } = keys;

cron.schedule('*/5 * * * *', async () => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n⏰ [${timestamp}] Executando Real Trading Bot Simulator...`);

  try {
    const bot = new RealTradingBotSimulator(apiKey, apiSecret);
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando Real Trading Bot Simulator Cron...');
  process.exit(0);
});

console.log('✅ Cron job configurado. Pressione Ctrl+C para parar.');