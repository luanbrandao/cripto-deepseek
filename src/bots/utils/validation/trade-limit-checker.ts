import { BinancePrivateClient } from '../../../core/clients/binance-private-client';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';

export async function checkActiveTradesLimit(binancePrivate: BinancePrivateClient): Promise<boolean> {
  const activeTradesCount = await binancePrivate.getActiveTradesCount();
  const maxTrades = TradingConfigManager.getMaxActiveTrades(false);
  
  if (activeTradesCount >= maxTrades) {
    console.log(`⏸️ Máximo de ${maxTrades} trades ativos atingido (${activeTradesCount} ativos)`);
    console.log('⏳ Aguardando finalização de trades para executar novos');
    return false;
  }
  return true;
}
