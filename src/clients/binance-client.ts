import Binance from 'binance-api-node';
import { config } from '../config';

export class BinanceService {
  private client: ReturnType<typeof Binance>;

  constructor() {
    this.client = Binance({
      apiKey: config.binance.apiKey,
      apiSecret: config.binance.apiSecret,
    });
  }

  async getPrice(symbol: string) {
    return await this.client.prices({ symbol });
  }

  async getAccountInfo() {
    return await this.client.accountInfo();
  }

  async get24hrStats(symbol: string) {
    return await this.client.dailyStats({ symbol });
  }
}