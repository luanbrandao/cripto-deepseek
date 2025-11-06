// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { DeepSeekService } from '../../core/clients/deepseek-client';
import { UnifiedDeepSeekAnalyzer } from '../../shared/analyzers/unified-deepseek-analyzer';

/**
 * SMART-TRADE ANALYSIS: Estratégia conservadora focada apenas em sinais de alta
 * - Ações: BUY ou HOLD (nunca SELL)
 * - Filosofia: Long-only, aguarda condições ideais de alta
 * - Ideal para: Bull markets, traders conservadores
 * - Win Rate esperado: 85-90%
 * 
 * @deprecated Use UnifiedDeepSeekAnalyzer.analyzeSmartTrade() instead
 */
export async function analyzeWithSmartTradeBuy(deepseek: DeepSeekService, symbol: string, marketData: any) {
  return await UnifiedDeepSeekAnalyzer.analyzeSmartTrade(deepseek, symbol, marketData);
}