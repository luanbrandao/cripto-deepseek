import axios from 'axios';
import * as crypto from 'crypto';

export class BinancePrivateClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.binance.com/api/v3';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private createSignature(queryString: string): string {
    return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
  }

  private getTimestamp(): number {
    return Date.now();
  }

  async getAccountInfo() {
    const timestamp = this.getTimestamp();
    const queryString = `timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);

    const response = await axios.get(`${this.baseUrl}/account`, {
      params: { timestamp, signature },
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    return response.data;
  }

  async getOpenOrders(symbol?: string) {
    const timestamp = this.getTimestamp();
    let queryString = `timestamp=${timestamp}`;
    if (symbol) queryString += `&symbol=${symbol}`;
    
    const signature = this.createSignature(queryString);
    const params: any = { timestamp, signature };
    if (symbol) params.symbol = symbol;

    const response = await axios.get(`${this.baseUrl}/openOrders`, {
      params,
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    return response.data;
  }

  async getOrderHistory(symbol: string, limit = 10) {
    const timestamp = this.getTimestamp();
    const queryString = `symbol=${symbol}&timestamp=${timestamp}&limit=${limit}`;
    const signature = this.createSignature(queryString);

    const response = await axios.get(`${this.baseUrl}/allOrders`, {
      params: { symbol, timestamp, limit, signature },
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    return response.data;
  }
}