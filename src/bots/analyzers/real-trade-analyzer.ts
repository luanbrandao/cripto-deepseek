// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { DeepSeekService } from '../../core/clients/deepseek-client';
import { UnifiedDeepSeekAnalyzer } from '../../shared/analyzers/unified-deepseek-analyzer';

/**
 * REAL-TRADE ANALYSIS: Estratégia completa com BUY/SELL/HOLD
 * - Ações: BUY, SELL ou HOLD
 * - Filosofia: Análise completa de mercado
 * - Ideal para: Trading ativo, swing trading
 * - Win Rate esperado: 75-80%
 * 
 * @deprecated Use UnifiedDeepSeekAnalyzer.analyzeRealTrade() instead
 */
export async function analyzeWithRealTrade(deepseek: DeepSeekService, symbol: string, marketData: any) {
  return await UnifiedDeepSeekAnalyzer.analyzeRealTrade(deepseek, symbol, marketData);
}