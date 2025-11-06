import axios from 'axios';
import { config } from '../config/config';

export class DeepSeekService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.deepseek.baseUrl;
    this.apiKey = config.deepseek.apiKey;
  }

  async analyzeMarket(marketData: any, prompt: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a crypto market analyst. Analyze the provided market data and give insights.',
            },
            {
              role: 'user',
              content: `${prompt}\n\nMarket Data: ${JSON.stringify(marketData)}`,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }
}