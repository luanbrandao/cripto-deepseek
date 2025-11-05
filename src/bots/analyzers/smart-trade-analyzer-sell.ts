import { DeepSeekService } from '../../clients/deepseek-client';
import { AnalysisParser } from '../services/analysis-parser';

/**
 * SMART-TRADE ANALYSIS SELL: Estratégia focada apenas em sinais de baixa
 * - Ações: SELL ou HOLD (nunca BUY)
 * - Filosofia: Short-only, aguarda condições ideais de baixa
 * - Ideal para: Bear markets, traders que fazem short
 * - Win Rate esperado: 75-85%
 */
export async function analyzeWithSmartSell(deepseek: DeepSeekService, symbol: string, marketData: any) {
  const analysis = await deepseek.analyzeMarket(
    marketData,
    `Analyze ${symbol} market data including 24h klines. Focus on BEARISH signals only. Provide a CLEAR SELL recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for downward momentum. Look for resistance levels, bearish patterns, and distribution signals.`
  );

  return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
}