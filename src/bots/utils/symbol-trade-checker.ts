import { BinancePrivateClient } from '../../clients/binance-private-client';
import * as fs from 'fs';
import * as path from 'path';

export async function hasActiveTradeForSymbol(
  binancePrivate: BinancePrivateClient | undefined, 
  symbol: string,
  isSimulation: boolean = false,
  simulationFile?: string
): Promise<boolean> {
  if (isSimulation && simulationFile) {
    return hasActiveSimulationTradeForSymbol(symbol, simulationFile);
  }
  
  if (!binancePrivate) return false;
  
  try {
    const openOrders = await binancePrivate.getOpenOrders(symbol);
    if (openOrders.length > 0) {
      console.log(`⚠️ Trade ativo encontrado para ${symbol} - Pulando para evitar duplicação`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Erro ao verificar trades ativos para ${symbol}:`, error);
    return false;
  }
}

function hasActiveSimulationTradeForSymbol(symbol: string, simulationFile: string): boolean {
  try {
    const tradesPath = path.join(__dirname, '../trades', simulationFile);
    
    if (!fs.existsSync(tradesPath)) {
      return false;
    }
    
    const tradesData = fs.readFileSync(tradesPath, 'utf8');
    const trades = JSON.parse(tradesData);
    
    // Verifica se há trades pendentes para o símbolo
    const activeSimulationTrade = trades.some((trade: any) => 
      trade.symbol === symbol && 
      trade.status === 'pending'
    );
    
    if (activeSimulationTrade) {
      console.log(`⚠️ Trade ativo encontrado para ${symbol} - Pulando para evitar duplicação`);
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}