// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { DeepSeekService } from '../../clients/deepseek-client';
import { UnifiedDeepSeekAnalyzer } from '../../shared/analyzers/unified-deepseek-analyzer';

/**
 * SMART-TRADE SELL ANALYSIS: Estratégia conservadora focada apenas em sinais de baixa
 * - Ações: SELL ou HOLD (nunca BUY)
 * - Filosofia: Short-only, aguarda condições ideais de baixa
 * - Ideal para: Bear markets, traders conservadores
 * - Win Rate esperado: 85-90%
 * 
 * @deprecated Use UnifiedDeepSeekAnalyzer.analyzeSmartTradeSell() instead
 */
export async function analyzeWithSmartSell(deepseek: DeepSeekService, symbol: string, marketData: any) {
  return await UnifiedDeepSeekAnalyzer.analyzeSmartTradeSell(deepseek, symbol, marketData);
}