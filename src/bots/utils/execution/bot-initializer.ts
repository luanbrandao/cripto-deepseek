import { BinancePublicClient } from '../../../clients/binance-public-client';
import { BinancePrivateClient } from '../../../clients/binance-private-client';
import { DeepSeekService } from '../../../clients/deepseek-client';
import { validateBinanceKeys } from '../validation/env-validator';
import { checkActiveTradesLimit } from '../validation/trade-limit-checker';

export interface BotClients {
  binancePublic: BinancePublicClient;
  binancePrivate: BinancePrivateClient;
  deepseek: DeepSeekService;
}

export async function initializeBotClients(): Promise<BotClients | null> {
  const keys = validateBinanceKeys();
  if (!keys) return null;

  const { apiKey, apiSecret } = keys;

  return {
    binancePublic: new BinancePublicClient(),
    binancePrivate: new BinancePrivateClient(apiKey, apiSecret),
    deepseek: new DeepSeekService()
  };
}

export async function validateTradingConditions(binancePrivate: BinancePrivateClient): Promise<boolean> {
  return await checkActiveTradesLimit(binancePrivate);
}
