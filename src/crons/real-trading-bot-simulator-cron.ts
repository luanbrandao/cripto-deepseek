import cron from 'node-cron';
// Import direto da classe sem executar o main
import { RealTradingBotSimulator } from '../bots/real-trading-bot-simulator';
import { TradeMonitor } from '../monitor/trade-monitor';
import path from 'path';
import * as dotenv from 'dotenv';
import { TRADING_CONFIG } from '../bots/config/trading-config';
import { validateBinanceKeys } from '../bots/utils/env-validator';

dotenv.config();

console.log('🤖 Real Trading Bot Simulator Cron iniciado - Execução a cada 5 minutos');

// Validar chaves da Binance
const keys = validateBinanceKeys();
if (!keys) {
  console.error('❌ Chaves da Binance não configuradas. Encerrando...');
  process.exit(1);
}

const { apiKey, apiSecret } = keys;
const tradesFilePath = path.join(__dirname, '../bots/trades', TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR);

cron.schedule('*/5 * * * *', async () => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n⏰ [${timestamp}] Executando Real Trading Bot Simulator + Monitor...`);

  try {
    // Criar instâncias apenas quando necessário
    const monitor = new TradeMonitor();

    // Criar bot sem executar a função main automática
    const bot = new RealTradingBotSimulator(apiKey, apiSecret);

    // Executar o monitor de trades
    console.log('🔍 Verificando status dos trades...');
    await monitor.checkTrades(tradesFilePath);

    console.log('\n\n\n')

    // Executar o bot de trading
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando Real Trading Bot Simulator Cron...');
  process.exit(0);
});

console.log('✅ Cron job configurado. Pressione Ctrl+C para parar.');