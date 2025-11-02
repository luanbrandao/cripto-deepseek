import { TradeMonitor } from './monitor/trade-monitor';
import * as fs from 'fs';

async function checkTradesContinuously() {
  const monitor = new TradeMonitor();
  const filePath = './src/bots/trades/realTradingBotSimulator.json';

  console.log('🔄 Iniciando monitoramento contínuo de trades...');

  while (true) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const trades = JSON.parse(data);
        const pendingTrades = trades.filter((trade: any) => trade.status === 'pending');

        if (pendingTrades.length === 0) {
          console.log('✅ Nenhum trade pendente. Encerrando monitoramento.');
          break;
        }

        await monitor.checkTrades(filePath);
      }

      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
    } catch (error) {
      console.error('❌ Erro no monitoramento:', error);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

checkTradesContinuously();