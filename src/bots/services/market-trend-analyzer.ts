import { BinancePublicClient } from '../../core/clients/binance-public-client';
import EmaAnalyzer from '../../analyzers/emaAnalyzer';
import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

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
    this.emaAnalyzer = new EmaAnalyzer({ fastPeriod: 12, slowPeriod: 26 });
  }

  async checkMarketTrendWithEma(symbol: string): Promise<TrendAnalysis> {
    console.log('📊 Verificando tendência do mercado com EMA...');

    const klines = await this.binancePublic.getKlines(symbol, '1h', 26);
    const prices = klines.map((k: any) => parseFloat(k[4])); // Close prices
    const currentPrice = prices[prices.length - 1];

    const marketData: MarketData = {
      price24h: prices,
      currentPrice
    };

    const emaAnalysis = this.emaAnalyzer.analyze(marketData);
    const isUptrend = emaAnalysis.action === 'BUY' && emaAnalysis.confidence >= UNIFIED_TRADING_CONFIG.MIN_CONFIDENCE;

    console.log(`📈 Tendência EMA: ${emaAnalysis.action} (${emaAnalysis.confidence}%)`);
    console.log(`💭 Razão EMA: ${emaAnalysis.reason}`);

    return {
      isUptrend,
      confidence: emaAnalysis.confidence,
      reason: emaAnalysis.reason
    };
  }
}