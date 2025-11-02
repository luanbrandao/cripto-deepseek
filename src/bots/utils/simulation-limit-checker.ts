import { Trade } from '../../storage/trade-storage';
import { TRADING_CONFIG } from '../config/trading-config';
import * as fs from 'fs';

export function checkActiveSimulationTradesLimit(tradesFile: string): boolean {
  try {
    if (!fs.existsSync(tradesFile)) {
      return true;
    }

    const data = fs.readFileSync(tradesFile, 'utf8').trim();
    if (!data) return true;

    const trades: Trade[] = JSON.parse(data);
    const activeTrades = trades.filter(trade => trade.status === 'pending').length;
    const maxTrades = TRADING_CONFIG.getMaxActiveTrades(true);

    if (activeTrades >= maxTrades) {
      console.log(`⏸️ Máximo de ${maxTrades} simulações ativas atingido (${activeTrades} ativas)`);
      console.log('⏳ Aguardando finalização de simulações para executar novas');
      return false;
    }
    return true;
  } catch (error) {
    return true;
  }
}