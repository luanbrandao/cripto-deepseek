import axios from 'axios';

export class BinancePublicClient {
  private baseUrl = 'https://api.binance.com/api/v3';

  async getPrice(symbol: string) {
    const response = await axios.get(`${this.baseUrl}/ticker/price`, {
      params: { symbol }
    });
    return response.data;
  }

  async getAllPrices() {
    const response = await axios.get(`${this.baseUrl}/ticker/price`);
    return response.data;
  }

  async get24hrStats(symbol?: string) {
    const params = symbol ? { symbol } : {};
    const response = await axios.get(`${this.baseUrl}/ticker/24hr`, { params });
    return response.data;
  }

  async getOrderBook(symbol: string, limit = 100) {
    const response = await axios.get(`${this.baseUrl}/depth`, {
      params: { symbol, limit }
    });
    return response.data;
  }

  async getKlines(symbol: string, interval: string, limit = 500) {
    const response = await axios.get(`${this.baseUrl}/klines`, {
      params: { symbol, interval, limit }
    });
    return response.data;
  }

  async getExchangeInfo() {
    const response = await axios.get(`${this.baseUrl}/exchangeInfo`);
    return response.data;
  }

  async getCandlesHistory(symbol: string) {
    const response = await axios.get(`${this.baseUrl}/klines`, {
      params: { symbol, interval: '1h', limit: 24 }
    });
    return response.data;
  }
}