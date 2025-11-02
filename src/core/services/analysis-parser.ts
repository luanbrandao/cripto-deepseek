import { TradeDecision } from '../types/trading';

export class AnalysisParser {
  static async parseDeepSeekAnalysis(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    const analysisLower = analysis.toLowerCase();

    if (analysisLower.includes('strong buy') || analysisLower.includes('breakout above')) {
      return { action: 'BUY', confidence: 85, reason: 'DeepSeek AI: Sinal forte de compra', symbol, price };
    }

    if (analysisLower.includes('buy') || analysisLower.includes('bullish')) {
      return { action: 'BUY', confidence: 75, reason: 'DeepSeek AI: Tendência de alta identificada', symbol, price };
    }

    if (analysisLower.includes('strong sell') || analysisLower.includes('break below')) {
      return { action: 'SELL', confidence: 80, reason: 'DeepSeek AI: Sinal forte de venda', symbol, price };
    }

    if (analysisLower.includes('sell') || analysisLower.includes('bearish')) {
      return { action: 'SELL', confidence: 70, reason: 'DeepSeek AI: Tendência de baixa identificada', symbol, price };
    }

    return { action: 'HOLD', confidence: 50, reason: 'DeepSeek AI: Mercado indefinido', symbol, price };
  }
}