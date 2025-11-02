import cron from 'node-cron';
import { SmartTradingBotSimulator } from '../bots/smart-trading-bot-simulator';
import { TradeMonitor } from '../monitor/trade-monitor';
import path from 'path';
import * as dotenv from 'dotenv';
import { TRADING_CONFIG } from '../bots/config/trading-config';

dotenv.config();

console.log('🤖 Smart Trading Bot Simulator Cron iniciado - Execução a cada 5 minutos');

const tradesFilePath = path.join(__dirname, '../bots/trades', TRADING_CONFIG.FILES.SMART_SIMULATOR);

cron.schedule('*/5 * * * *', async () => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n⏰ [${timestamp}] Executando Smart Trading Bot Simulator + Monitor...`);

  try {
    const monitor = new TradeMonitor();
    const bot = new SmartTradingBotSimulator();

    console.log('🔍 Verificando status dos trades...');
    await monitor.checkTrades(tradesFilePath);

    console.log('\n\n\n')

    console.log('🤖 Iniciando simulação de trading...');
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
  console.log('\n🛑 Encerrando Smart Trading Bot Simulator Cron...');
  process.exit(0);
});

console.log('✅ Cron job configurado. Pressione Ctrl+C para parar.');