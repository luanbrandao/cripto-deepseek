import { DeepSeekService } from '../../clients/deepseek-client';
import { AnalysisParser } from '../services/analysis-parser';
import { TRADING_CONFIG } from '../config/trading-config';

export async function analyzeWithRealTradeDeepSeek(deepseek: DeepSeekService, symbol: string, marketData: any) {
  console.log('\n🧠 Analisando mercado com DeepSeek AI (Real-Trade)...');
  
  const analysis = await deepseek.analyzeMarket(
    marketData,
    `Analyze ${symbol} market data (${TRADING_CONFIG.CHART.TIMEFRAME} timeframe, ${TRADING_CONFIG.CHART.PERIODS} periods) and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning.`
  );

  console.log('\n📋 Análise DeepSeek Real-Trade (primeiros 500 chars):');
  console.log(analysis.substring(0, 500) + '...');

  return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
}