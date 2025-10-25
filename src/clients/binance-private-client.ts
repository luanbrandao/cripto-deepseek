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

  async createMarketOrder(symbol: string, side: 'BUY' | 'SELL', quoteOrderQty: number) {
    const timestamp = this.getTimestamp();
    const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quoteOrderQty=${quoteOrderQty}&timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);

    const response = await axios.post(`${this.baseUrl}/order`, null, {
      params: { symbol, side, type: 'MARKET', quoteOrderQty, timestamp, signature },
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    return response.data;
  }

  async createLimitOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number) {
    const timestamp = this.getTimestamp();
    const queryString = `symbol=${symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}&timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);

    const response = await axios.post(`${this.baseUrl}/order`, null, {
      params: { symbol, side, type: 'LIMIT', timeInForce: 'GTC', quantity, price, timestamp, signature },
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    return response.data;
  }

  async createStopLossOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, stopPrice: number) {
    const timestamp = this.getTimestamp();
    const queryString = `symbol=${symbol}&side=${side}&type=STOP_LOSS_LIMIT&timeInForce=GTC&quantity=${quantity}&price=${stopPrice}&stopPrice=${stopPrice}&timestamp=${timestamp}`;
    const signature = this.createSignature(queryString);

    const response = await axios.post(`${this.baseUrl}/order`, null, {
      params: { 
        symbol, 
        side, 
        type: 'STOP_LOSS_LIMIT', 
        timeInForce: 'GTC', 
        quantity, 
        price: stopPrice, 
        stopPrice, 
        timestamp, 
        signature 
      },
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    return response.data;
  }
}