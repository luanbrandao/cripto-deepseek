import { TradeDecision } from '../../bots/utils/risk/trade-validators';
import { getMarketData } from '../../bots/utils/data/market-data-fetcher';
import { hasActiveTradeForSymbol } from '../../bots/utils/validation/symbol-trade-checker';
import { BinancePrivateClient } from '../../core/clients/binance-private-client';

export interface SymbolAnalysis {
  symbol: string;
  decision: TradeDecision;
  score: number;
  marketData?: any;
}

export interface MultiSymbolOptions {
  binancePublic: any;
  binancePrivate?: BinancePrivateClient;
  isSimulation?: boolean;
  simulationFile?: string;
  logLevel?: 'MINIMAL' | 'DETAILED';
}

export class UnifiedMultiSymbolAnalyzer {
  static async analyzeMultipleSymbols(
    symbols: string[], 
    parseAnalysisFunction: (symbol: string, marketData: any) => Promise<TradeDecision>,
    options: MultiSymbolOptions
  ): Promise<SymbolAnalysis | null> {
    const { binancePublic, binancePrivate, isSimulation = false, simulationFile, logLevel = 'DETAILED' } = options;
    
    if (logLevel === 'DETAILED') {
      console.log(`\n🔍 Analisando ${symbols.length} moedas para encontrar a melhor oportunidade...`);
    }
    
    const analyses: SymbolAnalysis[] = [];
    
    for (const symbol of symbols) {
      try {
        // Verificar trades ativos
        const hasActiveTrade = await this.checkActiveTrade(symbol, binancePrivate, isSimulation, simulationFile);
        
        if (hasActiveTrade) {
          if (logLevel === 'DETAILED') {
            console.log(`⏭️ Pulando ${symbol} - trade já ativo`);
          }
          continue;
        }
        
        if (logLevel === 'DETAILED') {
          console.log(`\n📊 Analisando ${symbol}...`);
        }
        
        const marketData = await getMarketData(binancePublic, symbol);
        const { price, stats, klines } = marketData;
        const decision = await parseAnalysisFunction(symbol, { price, stats, klines });
        
        const score = (decision.action === 'BUY' || decision.action === 'SELL') ? decision.confidence : 0;
        analyses.push({ symbol, decision, score, marketData });
        
        if (logLevel === 'DETAILED') {
          console.log(`   ${symbol}: ${decision.action} (${decision.confidence}% confiança, score: ${score})`);
        }
        
      } catch (error) {
        if (logLevel === 'DETAILED') {
          console.log(`   ❌ Erro ao analisar ${symbol}:`, error);
        }
      }
    }
    
    return this.processResults(analyses, logLevel);
  }

  private static async checkActiveTrade(
    symbol: string, 
    binancePrivate?: BinancePrivateClient, 
    isSimulation: boolean = false, 
    simulationFile?: string
  ): Promise<boolean> {
    if (isSimulation) {
      return await hasActiveTradeForSymbol(undefined, symbol, true, simulationFile);
    }
    
    if (binancePrivate) {
      return await hasActiveTradeForSymbol(binancePrivate, symbol, false);
    }
    
    return false;
  }

  private static processResults(analyses: SymbolAnalysis[], logLevel: 'MINIMAL' | 'DETAILED'): SymbolAnalysis | null {
    if (logLevel === 'DETAILED') {
      this.logDetailedResults(analyses);
    }
    
    const validAnalyses = analyses.filter(a => a.decision.action !== 'HOLD');
    const bestAnalysis = validAnalyses.sort((a, b) => b.score - a.score)[0];
    
    if (bestAnalysis) {
      this.logFinalDecision(bestAnalysis, validAnalyses, logLevel);
      return bestAnalysis;
    }
    
    if (logLevel === 'DETAILED') {
      console.log('\n⏸️ RESULTADO: Nenhuma oportunidade encontrada');
      console.log('📊 Todas as moedas estão em HOLD - aguardando melhores condições');
    }
    
    return null;
  }

  private static logDetailedResults(analyses: SymbolAnalysis[]): void {
    console.log('\n📋 RESUMO DAS ANÁLISES:');
    console.log('═'.repeat(60));
    analyses.forEach(analysis => {
      const emoji = analysis.decision.action === 'BUY' ? '🟢' : analysis.decision.action === 'SELL' ? '🔴' : '⚪';
      console.log(`${emoji} ${analysis.symbol.padEnd(10)} | ${analysis.decision.action.padEnd(4)} | ${analysis.decision.confidence}% | ${analysis.decision.reason}`);
    });
    console.log('═'.repeat(60));
  }

  private static logFinalDecision(bestAnalysis: SymbolAnalysis, validAnalyses: SymbolAnalysis[], logLevel: 'MINIMAL' | 'DETAILED'): void {
    console.log('\n🏆 DECISÃO FINAL:');
    console.log(`🎯 VENCEDORA: ${bestAnalysis.symbol} (${bestAnalysis.decision.action})`);
    console.log(`📊 Confiança: ${bestAnalysis.score}%`);
    
    if (logLevel === 'DETAILED') {
      console.log(`💡 Motivo da escolha: Maior confiança entre ${validAnalyses.length} oportunidades válidas`);
      
      if (validAnalyses.length > 1) {
        const secondBest = validAnalyses[1];
        console.log(`📈 Segunda opção: ${secondBest.symbol} (${secondBest.score}% confiança)`);
        console.log(`⚡ Vantagem: +${(bestAnalysis.score - secondBest.score).toFixed(1)}% de confiança`);
      }
    }
  }
}