import { BinancePrivateClient } from '../../clients/binance-private-client';

export async function checkActiveTradesLimit(binancePrivate: BinancePrivateClient): Promise<boolean> {
  const activeTradesCount = await binancePrivate.getActiveTradesCount();
  if (activeTradesCount >= 2) {
    console.log(`⏸️ Máximo de 2 trades ativos atingido (${activeTradesCount} ativos)`);
    console.log('⏳ Aguardando finalização de trades para executar novos');
    return false;
  }
  return true;
}