import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { TRADING_CONFIG } from './config/trading-config';

export abstract class BaseTradingBot {
  protected binancePublic: BinancePublicClient;
  protected binancePrivate!: BinancePrivateClient;
  protected deepseek?: DeepSeekService;

  constructor(apiKey?: string, apiSecret?: string, useDeepSeek: boolean = false) {
    this.binancePublic = new BinancePublicClient();

    if (apiKey && apiSecret) {
      this.binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
    }

    if (useDeepSeek) {
      this.deepseek = new DeepSeekService();
    }
  }

  protected abstract logBotInfo(): void;

  public abstract executeTrade(...args: any[]): Promise<any>;

  public getSymbols(): string[] {
    return TRADING_CONFIG.SYMBOLS;
  }

  public getTradeAmount(): number {
    return TRADING_CONFIG.TRADE_AMOUNT_USD;
  }

  public getBinancePublic(): BinancePublicClient {
    return this.binancePublic;
  }

  public getBinancePrivate(): BinancePrivateClient {
    return this.binancePrivate;
  }
}