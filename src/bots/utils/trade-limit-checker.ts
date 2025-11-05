import { BinancePrivateClient } from '../../clients/binance-private-client';

import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

export async function checkActiveTradesLimit(binancePrivate: BinancePrivateClient): Promise<boolean> {
  const activeTradesCount = await binancePrivate.getActiveTradesCount();
  const maxTrades = UNIFIED_TRADING_CONFIG.getMaxActiveTrades(false);
  
  if (activeTradesCount >= maxTrades) {
    console.log(`⏸️ Máximo de ${maxTrades} trades ativos atingido (${activeTradesCount} ativos)`);
    console.log('⏳ Aguardando finalização de trades para executar novos');
    return false;
  }
  return true;
}
