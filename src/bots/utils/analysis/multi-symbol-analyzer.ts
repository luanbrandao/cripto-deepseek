// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { TradeDecision } from '../risk/trade-validators';
import { getMarketData } from '../data/market-data-fetcher';
import { hasActiveTradeForSymbol } from '../validation/symbol-trade-checker';
import { BinancePrivateClient } from '../../../clients/binance-private-client';
import { UnifiedMultiSymbolAnalyzer, SymbolAnalysis } from '../../../shared/utils/unified-multi-symbol-analyzer';

/**
 * @deprecated Use UnifiedMultiSymbolAnalyzer.analyzeMultipleSymbols() instead
 */
export async function analyzeMultipleSymbols(
  symbols: string[], 
  binancePublic: any, 
  parseAnalysisFunction: (symbol: string, marketData: any) => Promise<TradeDecision>,
  binancePrivate?: BinancePrivateClient,
  isSimulation: boolean = false,
  simulationFile?: string
): Promise<SymbolAnalysis | null> {
  return await UnifiedMultiSymbolAnalyzer.analyzeMultipleSymbols(
    symbols,
    parseAnalysisFunction,
    {
      binancePublic,
      binancePrivate,
      isSimulation,
      simulationFile,
      logLevel: 'DETAILED'
    }
  );
}

export { SymbolAnalysis };