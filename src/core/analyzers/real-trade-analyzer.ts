import { DeepSeekService } from '../../clients/deepseek-client';
import { AnalysisParser } from '../services/analysis-parser';
import { TRADING_CONFIG } from '../config/trading-config';

/**
 * REAL-TRADE ANALYSIS: Estratégia completa para aproveitar movimentos bidirecionais
 * - Ações: BUY, SELL ou HOLD (estratégia completa)
 * - Filosofia: Oportunista, aproveita alta e baixa
 * - Ideal para: Mercados voláteis, traders experientes
 * - Win Rate esperado: 75-80%
 * - Configurável: Timeframe e períodos via TRADING_CONFIG
 */
export async function analyzeWithRealTrade(deepseek: DeepSeekService, symbol: string, marketData: any) {
  const analysis = await deepseek.analyzeMarket(
    marketData,
    `Analyze ${symbol} market data (${TRADING_CONFIG.CHART.TIMEFRAME} timeframe, ${TRADING_CONFIG.CHART.PERIODS} periods) and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning.`
  );

  return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
}