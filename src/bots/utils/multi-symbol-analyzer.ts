import { TradeDecision } from './trade-validators';
import { getMarketData } from './market-data-fetcher';
import { TRADING_CONFIG } from '../config/trading-config';

export interface SymbolAnalysis {
  symbol: string;
  decision: TradeDecision;
  score: number;
}

export async function analyzeMultipleSymbols(
  symbols: string[], 
  binancePublic: any, 
  deepseek: any,
  parseAnalysisFunction: (analysis: string, symbol: string, price: number) => Promise<TradeDecision>
): Promise<SymbolAnalysis | null> {
  console.log(`\n🔍 Analisando ${symbols.length} moedas para encontrar a melhor oportunidade...`);
  
  const analyses: SymbolAnalysis[] = [];
  
  for (const symbol of symbols) {
    try {
      console.log(`\n📊 Analisando ${symbol}...`);
      const { price, stats, klines } = await getMarketData(binancePublic, symbol);
      
      const analysis = await deepseek.analyzeMarket(
        { price, stats, klines },
        `Analyze ${symbol} market data (${TRADING_CONFIG.CHART.TIMEFRAME} timeframe, ${TRADING_CONFIG.CHART.PERIODS} periods) and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning.`
      );
      
      const decision = await parseAnalysisFunction(analysis, symbol, parseFloat(price.price));
      
      let score = 0;
      if (decision.action === 'BUY' || decision.action === 'SELL') {
        score = decision.confidence;
      }
      
      analyses.push({ symbol, decision, score });
      console.log(`   ${symbol}: ${decision.action} (${decision.confidence}% confiança, score: ${score})`);
      
    } catch (error) {
      console.log(`   ❌ Erro ao analisar ${symbol}:`, error);
    }
  }
  
  // Log resumo
  console.log('\n📋 RESUMO DAS ANÁLISES:');
  console.log('═'.repeat(60));
  analyses.forEach(analysis => {
    const emoji = analysis.decision.action === 'BUY' ? '🟢' : analysis.decision.action === 'SELL' ? '🔴' : '⚪';
    console.log(`${emoji} ${analysis.symbol.padEnd(10)} | ${analysis.decision.action.padEnd(4)} | ${analysis.decision.confidence}% | ${analysis.decision.reason}`);
  });
  console.log('═'.repeat(60));
  
  // Encontrar melhor oportunidade
  const validAnalyses = analyses.filter(a => a.decision.action !== 'HOLD');
  const bestAnalysis = validAnalyses.sort((a, b) => b.score - a.score)[0];
  
  if (bestAnalysis) {
    console.log('\n🏆 DECISÃO FINAL:');
    console.log(`🎯 VENCEDORA: ${bestAnalysis.symbol} (${bestAnalysis.decision.action})`);
    console.log(`📊 Confiança: ${bestAnalysis.score}%`);
    console.log(`💡 Motivo da escolha: Maior confiança entre ${validAnalyses.length} oportunidades válidas`);
    
    if (validAnalyses.length > 1) {
      const secondBest = validAnalyses[1];
      console.log(`📈 Segunda opção: ${secondBest.symbol} (${secondBest.score}% confiança)`);
      console.log(`⚡ Vantagem: +${(bestAnalysis.score - secondBest.score).toFixed(1)}% de confiança`);
    }
    
    return bestAnalysis;
  }
  
  console.log('\n⏸️ RESULTADO: Nenhuma oportunidade encontrada');
  console.log('📊 Todas as moedas estão em HOLD - aguardando melhores condições');
  return null;
}