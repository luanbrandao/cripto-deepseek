import { DeepSeekService } from '../../clients/deepseek-client';
import { AnalysisParser } from '../services/analysis-parser';

export async function analyzeWithDeepSeek(deepseek: DeepSeekService, symbol: string, marketData: any) {
  console.log('\n🧠 Analisando mercado com DeepSeek AI...');
  
  const analysis = await deepseek.analyzeMarket(
    marketData,
    `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`
  );

  console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
  console.log(analysis.substring(0, 500) + '...');

  return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
}