import { BinancePublicClient } from '../../core/clients/binance-public-client';
import EmaAnalyzer from '../../core/analyzers/technical/ema-analyzer';
import { TradingConfigManager } from '../../core/config/trading-config-manager';

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

interface TrendAnalysis {
  isUptrend: boolean;
  confidence: number;
  reason: string;
}

export class MarketTrendAnalyzer {
  private binancePublic: BinancePublicClient;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    this.binancePublic = new BinancePublicClient();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: TradingConfigManager.getConfig().EMA.FAST_PERIOD,
      slowPeriod: TradingConfigManager.getConfig().EMA.SLOW_PERIOD
    });
  }

  async checkMarketTrendWithEma(symbol: string): Promise<TrendAnalysis> {
    console.log('📊 Verificando tendência do mercado com EMA...');

    const klines = await this.binancePublic.getKlines(
      symbol,
      TradingConfigManager.getConfig().CHART.TIMEFRAME,
      TradingConfigManager.getConfig().EMA.SLOW_PERIOD
    );
    const prices = klines.map((k: any) => parseFloat(k[4])); // Close prices
    const currentPrice = prices[prices.length - 1];

    const marketData: MarketData = {
      price24h: prices,
      currentPrice
    };

    const emaAnalysis = this.emaAnalyzer.analyze(marketData);
    const isUptrend = emaAnalysis.action === 'BUY' && emaAnalysis.confidence >= TradingConfigManager.getConfig().MIN_CONFIDENCE;

    console.log(`📈 Tendência EMA: ${emaAnalysis.action} (${emaAnalysis.confidence}%)`);
    console.log(`💭 Razão EMA: ${emaAnalysis.reason}`);

    return {
      isUptrend,
      confidence: emaAnalysis.confidence,
      reason: emaAnalysis.reason
    };
  }
}