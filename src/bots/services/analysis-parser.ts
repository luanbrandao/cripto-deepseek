// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { TradeDecision } from '../types/trading';
import { UnifiedAnalysisParser } from '../../shared/parsers/unified-analysis-parser';

/**
 * @deprecated Use UnifiedAnalysisParser.parseBasic() instead
 */
export class AnalysisParser {
  static async parseDeepSeekAnalysis(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    return await UnifiedAnalysisParser.parseBasic(analysis, symbol, price);
  }
}