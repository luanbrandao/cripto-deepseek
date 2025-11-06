import { BinancePublicClient } from '../../core/clients/binance-public-client';
import { BinancePrivateClient } from '../../core/clients/binance-private-client';
import { DeepSeekService } from '../../core/clients/deepseek-client';
import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

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
    return UNIFIED_TRADING_CONFIG.SYMBOLS;
  }

  public getTradeAmount(): number {
    return UNIFIED_TRADING_CONFIG.TRADE_AMOUNT_USD;
  }

  public getBinancePublic(): BinancePublicClient {
    return this.binancePublic;
  }

  public getBinancePrivate(): BinancePrivateClient {
    return this.binancePrivate;
  }
}
