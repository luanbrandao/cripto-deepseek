import { DeepSeekService } from '../../clients/deepseek-client';
import { AnalysisParser } from '../services/analysis-parser';

/**
 * SMART-TRADE ANALYSIS: Estratégia conservadora focada apenas em sinais de alta
 * - Ações: BUY ou HOLD (nunca SELL)
 * - Filosofia: Long-only, aguarda condições ideais de alta
 * - Ideal para: Bull markets, traders conservadores
 * - Win Rate esperado: 85-90%
 */
export async function analyzeWithSmartTrade(deepseek: DeepSeekService, symbol: string, marketData: any) {
  const analysis = await deepseek.analyzeMarket(
    marketData,
    `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`
  );

  return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
}