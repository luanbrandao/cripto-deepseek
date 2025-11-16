/**
 * 🏭 TECHNICAL ANALYZER FACTORY
 * Consolidates all technical analysis patterns into a unified factory
 */

import Analyzer123 from '../technical/pattern-123';
import EmaAnalyzer from '../technical/ema-analyzer';
import { MomentumAnalyzer } from '../technical/momentum-analyzer';
import { VolumeAnalyzer } from '../technical/volume-analyzer';
import SupportResistanceAnalyzer from '../technical/support-resistance-analyzer';

export type AnalyzerType = '123' | 'ema' | 'momentum' | 'volume' | 'support-resistance';

export interface TechnicalAnalysisResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  suggested_amount?: number;
  analyzer: AnalyzerType;
  metadata?: any;
}

export interface MarketDataInput {
  candles?: any[];
  price24h?: number[];
  currentPrice: number;
  volumes?: number[];
}

export class TechnicalAnalyzerFactory {
  private static analyzers = new Map<AnalyzerType, any>();

  static {
    // Initialize analyzers once
    this.analyzers.set('ema', new EmaAnalyzer());
    this.analyzers.set('momentum', new MomentumAnalyzer());
    this.analyzers.set('volume', new VolumeAnalyzer());
    this.analyzers.set('support-resistance', new SupportResistanceAnalyzer());
  }

  /**
   * 🎯 ANALYZE WITH SPECIFIC PATTERN
   */
  static analyze(type: AnalyzerType, marketData: MarketDataInput, config?: any): TechnicalAnalysisResult {
    try {
      let result: any;

      switch (type) {
        case '123':
          result = Analyzer123.analyze({
            candles: marketData.candles || [],
            currentPrice: marketData.currentPrice
          });
          break;

        case 'ema':
          const emaAnalyzer = config ? new EmaAnalyzer(config) : this.analyzers.get('ema');
          result = emaAnalyzer.analyze({
            price24h: marketData.price24h || [],
            currentPrice: marketData.currentPrice
          });
          break;

        case 'momentum':
          const momentumAnalyzer = this.analyzers.get('momentum') as MomentumAnalyzer;
          const momentumResult = momentumAnalyzer.getMomentumScore(marketData.price24h || []);
          result = {
            action: momentumResult.recommendation === 'STRONG_BUY' || momentumResult.recommendation === 'BUY' ? 'BUY' :
                   momentumResult.recommendation === 'STRONG_SELL' || momentumResult.recommendation === 'SELL' ? 'SELL' : 'HOLD',
            confidence: momentumResult.totalScore,
            reason: `Momentum analysis: ${momentumResult.recommendation}`,
            suggested_amount: momentumResult.totalScore > 80 ? 3 : momentumResult.totalScore > 60 ? 2 : 1
          };
          break;

        case 'volume':
          const volumeAnalyzer = this.analyzers.get('volume') as VolumeAnalyzer;
          const volumeResult = volumeAnalyzer.getVolumeScore(marketData.candles || []);
          result = {
            action: volumeResult.recommendation === 'STRONG' ? 'BUY' : 'HOLD',
            confidence: volumeResult.totalScore,
            reason: `Volume analysis: ${volumeResult.recommendation}`,
            suggested_amount: volumeResult.totalScore > 70 ? 2 : 1
          };
          break;

        case 'support-resistance':
          const srAnalyzer = config ? new SupportResistanceAnalyzer(config) : this.analyzers.get('support-resistance');
          result = srAnalyzer.analyze({
            candles: marketData.candles || [],
            currentPrice: marketData.currentPrice
          }, config?.isSimulation ?? true);
          break;

        default:
          throw new Error(`Unknown analyzer type: ${type}`);
      }

      return {
        ...result,
        analyzer: type
      };

    } catch (error) {
      console.error(`❌ Error in ${type} analyzer:`, error);
      return {
        action: 'HOLD',
        confidence: 0,
        reason: `${type} analyzer error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        analyzer: type
      };
    }
  }

  /**
   * 🔄 MULTI-PATTERN ANALYSIS
   */
  static analyzeMultiple(
    patterns: AnalyzerType[], 
    marketData: MarketDataInput, 
    configs?: Record<AnalyzerType, any>
  ): {
    results: TechnicalAnalysisResult[];
    consensus: TechnicalAnalysisResult;
    agreement: number;
  } {
    const results = patterns.map(pattern => 
      this.analyze(pattern, marketData, configs?.[pattern])
    );

    // Calculate consensus
    const buyVotes = results.filter(r => r.action === 'BUY').length;
    const sellVotes = results.filter(r => r.action === 'SELL').length;
    const holdVotes = results.filter(r => r.action === 'HOLD').length;

    const totalVotes = results.length;
    const agreement = Math.max(buyVotes, sellVotes, holdVotes) / totalVotes;

    let consensusAction: 'BUY' | 'SELL' | 'HOLD';
    if (buyVotes > sellVotes && buyVotes > holdVotes) consensusAction = 'BUY';
    else if (sellVotes > buyVotes && sellVotes > holdVotes) consensusAction = 'SELL';
    else consensusAction = 'HOLD';

    const avgConfidence = results
      .filter(r => r.action === consensusAction)
      .reduce((sum, r) => sum + r.confidence, 0) / 
      results.filter(r => r.action === consensusAction).length || 50;

    const consensus: TechnicalAnalysisResult = {
      action: consensusAction,
      confidence: Math.round(avgConfidence * agreement),
      reason: `Multi-pattern consensus: ${consensusAction} (${Math.round(agreement * 100)}% agreement)`,
      analyzer: 'consensus' as AnalyzerType,
      metadata: {
        votes: { buy: buyVotes, sell: sellVotes, hold: holdVotes },
        patterns: patterns,
        agreement: Math.round(agreement * 100)
      }
    };

    return { results, consensus, agreement };
  }

  /**
   * 🎯 GET AVAILABLE ANALYZERS
   */
  static getAvailableAnalyzers(): AnalyzerType[] {
    return ['123', 'ema', 'momentum', 'volume', 'support-resistance'];
  }

  /**
   * 🔧 VALIDATE MARKET DATA
   */
  static validateMarketData(type: AnalyzerType, marketData: MarketDataInput): boolean {
    switch (type) {
      case '123':
      case 'support-resistance':
        return !!(marketData.candles && marketData.candles.length >= 10);
      
      case 'ema':
      case 'momentum':
        return !!(marketData.price24h && marketData.price24h.length >= 26);
      
      case 'volume':
        return !!(marketData.candles && marketData.candles.length >= 20);
      
      default:
        return false;
    }
  }
}