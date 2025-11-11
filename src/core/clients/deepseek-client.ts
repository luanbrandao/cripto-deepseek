import axios from 'axios';
import { config } from '../config/config';
import { DeepSeekHistoryLogger } from '../../shared/utils/deepseek-history-logger';

export class DeepSeekService {
  // Método para obter estatísticas do histórico
  static getHistoryStats() {
    return DeepSeekHistoryLogger.getStats();
  }

  // Método para obter histórico por bot
  static getHistory(botType?: 'realBot' | 'smartBot' | 'multiSmartBot' | 'smartEntryBot') {
    return DeepSeekHistoryLogger.getHistory(botType);
  }
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.deepseek.baseUrl;
    this.apiKey = config.deepseek.apiKey;
  }

  async analyzeMarket(marketData: any, prompt: string, botType?: 'realBot' | 'smartBot' | 'multiSmartBot' | 'smartEntryBot', symbol?: string) {
    const startTime = Date.now();
    
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

      const analysisResponse = response.data.choices[0].message.content;
      const executionTime = Date.now() - startTime;

      // Log análise no histórico se botType e symbol fornecidos
      if (botType && symbol) {
        try {
          // Tentar extrair dados da resposta
          const confidenceMatch = analysisResponse.match(/confidence["']?\s*:\s*([0-9]+)/i) || 
                                 analysisResponse.match(/confidence\s+level["']?\s*:\s*([0-9]+)/i) ||
                                 analysisResponse.match(/([0-9]+)%\s+confidence/i);
          const actionMatch = analysisResponse.match(/action["']?\s*:\s*["']?(BUY|SELL|HOLD)["']?/i) ||
                             analysisResponse.match(/recommendation["']?\s*:\s*["']?(BUY|SELL|HOLD)["']?/i);
          
          DeepSeekHistoryLogger.logAnalysis({
            symbol,
            botType,
            prompt,
            response: analysisResponse,
            confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : undefined,
            action: actionMatch ? actionMatch[1] : undefined,
            marketData: {
              price: marketData.price || marketData.currentPrice || 0,
              change24h: marketData.priceChangePercent || marketData.change24h || 0,
              volume24h: marketData.volume || marketData.volume24h || 0
            },
            executionTime
          });
        } catch (logError) {
          console.warn('⚠️ Erro ao salvar análise DeepSeek:', logError);
        }
      }

      return analysisResponse;
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }
}