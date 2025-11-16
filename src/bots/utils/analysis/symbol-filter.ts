import TradingConfigManager from '../../../shared/config/trading-config-manager';

export class SymbolFilter {
  static async filterByEma(symbols: string[], emaAnalyzer: any, binancePublic: any): Promise<string[]> {
    const validSymbols = [];
    const config = TradingConfigManager.getConfig();

    for (const symbol of symbols) {
      const klines = await binancePublic.getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      const emaAnalysis = emaAnalyzer.analyze({ price24h: prices, currentPrice });

      if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
        validSymbols.push(symbol);
      }
    }

    return validSymbols;
  }

  static async filterByStrength(symbols: string[], advancedEmaAnalyzer: any, binancePublic: any): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);
    
    const validSymbols = [];
    const config = TradingConfigManager.getConfig();

    for (const symbol of symbols) {
      const klines = await binancePublic.getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const volumes = klines.map((k: any) => parseFloat(k[5]));

      const analysis = advancedEmaAnalyzer.analyzeAdvanced(prices, volumes);
      const condition = advancedEmaAnalyzer.getMarketCondition(analysis);
      const threshold = this.getThresholdByMarketCondition(condition.type);

      if (this.isSymbolValid(analysis, threshold, advancedEmaAnalyzer)) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${analysis.overallStrength.toFixed(1)} (${condition.type})`);
      } else {
        console.log(`❌ ${symbol}: ${analysis.overallStrength.toFixed(1)} < ${threshold}`);
      }
    }

    return validSymbols;
  }

  private static getThresholdByMarketCondition(marketType: string): number {
    switch (marketType) {
      case 'BULL_MARKET': return 65;
      case 'BEAR_MARKET': return 85;
      default: return 75;
    }
  }

  private static isSymbolValid(analysis: any, threshold: number, advancedEmaAnalyzer: any): boolean {
    return analysis.overallStrength > threshold &&
      (advancedEmaAnalyzer.isStrongUptrend(analysis) || advancedEmaAnalyzer.isModerateUptrend(analysis));
  }
}