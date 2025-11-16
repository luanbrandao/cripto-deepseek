import { UnifiedAnalysisParser } from "../../../shared/parsers/unified-analysis-parser";
import { DeepSeekHistoryLogger } from "../../../shared/utils/deepseek-history-logger";
import { DeepSeekService } from "../../clients/deepseek-client";
import TradingConfigManager from "../../config/trading-config-manager";

export class DeepSeekAnalysisFactory {
  static async executeAnalysis(
    deepseek: DeepSeekService,
    symbol: string,
    marketData: any,
    prompt: string,
    botType: 'realBot' | 'smartBot' | 'multiSmartBot',
    parseMode: 'BASIC' | 'ADVANCED' = 'BASIC'
  ) {
    console.log(`\n🧠 Analisando ${symbol} com ${botType.toUpperCase()}...`);

    const analysis = await deepseek.analyzeMarket(marketData, prompt, undefined, undefined);

    const PREVIEW_LENGTH = 500; // Algorithm constant - analysis preview length
    console.log(`\n📋 Análise DeepSeek (primeiros ${PREVIEW_LENGTH} chars):`);
    console.log(analysis.substring(0, PREVIEW_LENGTH) + '...');

    const price = parseFloat(marketData.price.price);
    const decision = parseMode === 'ADVANCED'
      ? await UnifiedAnalysisParser.parseAdvanced(analysis, symbol, price)
      : await UnifiedAnalysisParser.parseBasic(analysis, symbol, price);

    this.logAnalysis(symbol, botType, prompt, analysis, decision, marketData);

    return decision;
  }

  private static logAnalysis(symbol: string, botType: 'realBot' | 'smartBot' | 'multiSmartBot', prompt: string, analysis: string, decision: any, marketData: any) {
    DeepSeekHistoryLogger.logAnalysis({
      symbol,
      botType,
      prompt,
      response: analysis,
      confidence: decision.confidence,
      action: decision.action,
      reason: decision.reason,
      marketData: {
        price: parseFloat(marketData.price.price),
        change24h: 0,
        volume24h: 0
      },
      executionTime: 0
    });
  }

  static buildSmartTradePrompt(symbol: string): string {
    return `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`;
  }

  static buildRealTradePrompt(symbol: string): string {
    const config = TradingConfigManager.getConfig();
    return `Analyze ${symbol} market data (${config.CHART.TIMEFRAME} timeframe, ${config.CHART.PERIODS} periods) and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning.`;
  }

  static buildMultiSmartPrompt(symbol: string): string {
    return `Analyze ${symbol} comprehensively using the following data:
    - Current price and 24h statistics
    - Candlestick patterns from klines data
    - Volume analysis and momentum indicators
    
    Focus on BULLISH signals and provide detailed analysis including:
    1. Technical breakout patterns
    2. Support/resistance levels
    3. Volume confirmation
    4. Momentum strength
    5. Risk factors
    
    Be specific about confidence level and provide clear reasoning for BUY or HOLD recommendation.`;
  }
}