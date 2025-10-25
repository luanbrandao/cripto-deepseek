import { Trade } from '../../storage/trade-storage';
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
    
    if (activeTrades >= 2) {
      console.log(`⏸️ Máximo de 2 trades ativos atingido (${activeTrades} ativos)`);
      console.log('⏳ Aguardando finalização de trades para executar novos');
      return false;
    }
    return true;
  } catch (error) {
    return true;
  }
}