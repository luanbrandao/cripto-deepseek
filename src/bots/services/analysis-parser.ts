import { TradeDecision } from '../types/trading';

export class AnalysisParser {
  static async parseDeepSeekAnalysis(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    const analysisLower = analysis.toLowerCase();

    // Primeiro, procurar por recomendações explícitas (mais específicas)
    if (analysisLower.includes('recommendation: **hold**') || 
        analysisLower.includes('recommendation: hold') ||
        analysisLower.includes('trading recommendation: **hold**') ||
        analysisLower.includes('trading recommendation: hold')) {
      return { action: 'HOLD', confidence: 60, reason: 'DeepSeek AI: Recomendação de aguardar', symbol, price };
    }

    if (analysisLower.includes('recommendation: **sell**') || 
        analysisLower.includes('recommendation: sell') ||
        analysisLower.includes('trading recommendation: **sell**') ||
        analysisLower.includes('trading recommendation: sell')) {
      return { action: 'SELL', confidence: 75, reason: 'DeepSeek AI: Recomendação de venda', symbol, price };
    }

    if (analysisLower.includes('recommendation: **buy**') || 
        analysisLower.includes('recommendation: buy') ||
        analysisLower.includes('trading recommendation: **buy**') ||
        analysisLower.includes('trading recommendation: buy')) {
      return { action: 'BUY', confidence: 75, reason: 'DeepSeek AI: Recomendação de compra', symbol, price };
    }

    // Depois, procurar por sinais fortes (mais específicos)
    if (analysisLower.includes('strong sell') || analysisLower.includes('break below') || analysisLower.includes('breakdown')) {
      return { action: 'SELL', confidence: 80, reason: 'DeepSeek AI: Sinal forte de venda', symbol, price };
    }

    if (analysisLower.includes('strong buy') || analysisLower.includes('breakout above') || analysisLower.includes('strong bullish')) {
      return { action: 'BUY', confidence: 85, reason: 'DeepSeek AI: Sinal forte de compra', symbol, price };
    }

    // Por último, procurar por tendências gerais (menos específicas)
    if (analysisLower.includes('bearish trend') || analysisLower.includes('downward trend') || 
        (analysisLower.includes('sell') && !analysisLower.includes('oversell'))) {
      return { action: 'SELL', confidence: 70, reason: 'DeepSeek AI: Tendência de baixa identificada', symbol, price };
    }

    if (analysisLower.includes('bullish trend') || analysisLower.includes('upward trend') || 
        (analysisLower.includes('buy') && !analysisLower.includes('overbuy'))) {
      return { action: 'BUY', confidence: 75, reason: 'DeepSeek AI: Tendência de alta identificada', symbol, price };
    }

    return { action: 'HOLD', confidence: 50, reason: 'DeepSeek AI: Mercado indefinido', symbol, price };
  }
}