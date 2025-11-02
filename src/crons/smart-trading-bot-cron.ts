import cron from 'node-cron';
import { SmartTradingBot } from '../bots/smart-trading-bot';
import { TradeMonitor } from '../monitor/trade-monitor';
import path from 'path';
import * as dotenv from 'dotenv';
import { TRADING_CONFIG } from '../bots/config/trading-config';
import { validateBinanceKeys } from '../bots/utils/env-validator';

dotenv.config();

console.log('🤖 Smart Trading Bot Cron iniciado - Execução a cada 5 minutos');

const keys = validateBinanceKeys();
if (!keys) {
  console.error('❌ Chaves da Binance não configuradas. Encerrando...');
  process.exit(1);
}

const { apiKey, apiSecret } = keys;
const tradesFilePath = path.join(__dirname, '../bots/trades', TRADING_CONFIG.FILES.SMART_BOT);

cron.schedule('*/5 * * * *', async () => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n⏰ [${timestamp}] Executando Smart Trading Bot + Monitor...`);

  try {
    const monitor = new TradeMonitor();
    const bot = new SmartTradingBot(apiKey, apiSecret);

    console.log('🔍 Verificando status dos trades...');
    await monitor.checkTrades(tradesFilePath);

    console.log('\n\n\n')

    console.log('🤖 Iniciando trading real...');
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