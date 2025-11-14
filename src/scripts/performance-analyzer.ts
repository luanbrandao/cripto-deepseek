import * as fs from 'fs';
import * as path from 'path';

interface TradeAnalysis {
  botName: string;
  totalTrades: number;
  completedTrades: number;
  pendingTrades: number;
  winRate: number;
  totalReturn: number;
  avgReturn: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveLosses: number;
  avgConfidence: number;
  trades: any[];
}

interface OverallMetrics {
  totalTrades: number;
  overallWinRate: number;
  totalReturn: number;
  totalInvested: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
}

export class PerformanceAnalyzer {

  static async analyzeAllTrades(): Promise<void> {
    console.log('📊 ANÁLISE COMPLETA DE PERFORMANCE DOS BOTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const tradesFiles = [
      { file: 'realTradingBotSimulator.json', name: 'Real Trading Bot Simulator' },
      { file: 'smartTradingBotSimulatorBuy.json', name: 'Smart Trading Bot Simulator BUY' },
      { file: 'smartTradingBotSimulatorSell.json', name: 'Smart Trading Bot Simulator SELL' },
      { file: 'ema12-26Trades.json', name: 'EMA 12-26 Trading Bot' },
      { file: '1-ultraConservativeSupportResistanceTrades.json', name: '1-ultraConservativeSupportResistanceTrades' },

      { file: 'supportResistanceTrades.json', name: 'Support Resistance Bot' },
      { file: 'ema21-50Trades.json', name: 'ema21-50Trades' },
      { file: 'multiSmartTradingBotSimulatorSell.json', name: 'multiSmartTradingBotSimulatorSell' },
      { file: 'smartEntryOrders.json', name: 'smartEntryOrders' },
    ];

    const analyses: TradeAnalysis[] = [];

    for (const { file, name } of tradesFiles) {
      const analysis = await this.analyzeBotPerformance(file, name);
      if (analysis) {
        analyses.push(analysis);
        this.displayBotAnalysis(analysis);
      }
    }

    // Análise geral
    const overallMetrics = this.calculateOverallMetrics(analyses);
    this.displayOverallMetrics(overallMetrics);

    // Recomendações
    this.generateRecommendations(analyses, overallMetrics);

    // Salvar relatório
    this.saveAnalysisReport(analyses, overallMetrics);
  }

  private static async analyzeBotPerformance(filename: string, botName: string): Promise<TradeAnalysis | null> {
    const filePath = path.join(__dirname, '../storage/trades', filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filename}\n`);
      return null;
    }

    const trades = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (trades.length === 0) {
      console.log(`📭 Nenhum trade encontrado em: ${botName}\n`);
      return null;
    }

    const completedTrades = trades.filter((t: any) => t.result);
    const pendingTrades = trades.filter((t: any) => !t.result);
    const winningTrades = completedTrades.filter((t: any) => t.result === 'win');
    const losingTrades = completedTrades.filter((t: any) => t.result === 'loss');

    const totalReturn = completedTrades.reduce((sum: number, t: any) => sum + (t.actualReturn || 0), 0);
    const winRate = completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0;
    const avgReturn = completedTrades.length > 0 ? totalReturn / completedTrades.length : 0;

    const returns = completedTrades.map((t: any) => t.actualReturn || 0);
    const bestTrade = returns.length > 0 ? Math.max(...returns) : 0;
    const worstTrade = returns.length > 0 ? Math.min(...returns) : 0;

    const avgConfidence = trades.reduce((sum: number, t: any) => sum + (t.confidence || 0), 0) / trades.length;

    // Calcular perdas consecutivas
    let consecutiveLosses = 0;
    let currentStreak = 0;
    for (const trade of completedTrades.reverse()) {
      if (trade.result === 'loss') {
        currentStreak++;
        consecutiveLosses = Math.max(consecutiveLosses, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      botName,
      totalTrades: trades.length,
      completedTrades: completedTrades.length,
      pendingTrades: pendingTrades.length,
      winRate,
      totalReturn,
      avgReturn,
      bestTrade,
      worstTrade,
      consecutiveLosses,
      avgConfidence,
      trades
    };
  }

  private static displayBotAnalysis(analysis: TradeAnalysis): void {
    console.log(`🤖 ${analysis.botName.toUpperCase()}`);
    console.log('─'.repeat(50));
    console.log(`📊 Total de Trades: ${analysis.totalTrades}`);
    console.log(`✅ Trades Completos: ${analysis.completedTrades}`);
    console.log(`⏳ Trades Pendentes: ${analysis.pendingTrades}`);
    console.log(`🎯 Win Rate: ${analysis.winRate.toFixed(1)}%`);
    console.log(`💰 Retorno Total: $${analysis.totalReturn.toFixed(2)}`);
    console.log(`📈 Retorno Médio: $${analysis.avgReturn.toFixed(2)}`);
    console.log(`🏆 Melhor Trade: $${analysis.bestTrade.toFixed(2)}`);
    console.log(`📉 Pior Trade: $${analysis.worstTrade.toFixed(2)}`);
    console.log(`🔴 Perdas Consecutivas: ${analysis.consecutiveLosses}`);
    console.log(`🧠 Confiança Média: ${analysis.avgConfidence.toFixed(1)}%`);

    // Status do bot
    if (analysis.winRate >= 60) {
      console.log(`✅ Status: EXCELENTE`);
    } else if (analysis.winRate >= 40) {
      console.log(`⚠️ Status: PRECISA MELHORAR`);
    } else {
      console.log(`🚨 Status: CRÍTICO - REQUER AJUSTES IMEDIATOS`);
    }

    console.log('');
  }

  private static calculateOverallMetrics(analyses: TradeAnalysis[]): OverallMetrics {
    const totalTrades = analyses.reduce((sum, a) => sum + a.completedTrades, 0);
    const totalWins = analyses.reduce((sum, a) => sum + (a.completedTrades * a.winRate / 100), 0);
    const totalReturn = analyses.reduce((sum, a) => sum + a.totalReturn, 0);
    const totalInvested = analyses.reduce((sum, a) => sum + (a.totalTrades * 15), 0); // Assumindo $15 por trade

    const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const roi = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Calcular Sharpe Ratio simplificado
    const returns = analyses.flatMap(a => a.trades.filter(t => t.result).map(t => t.actualReturn || 0));
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) : 1;
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Max Drawdown
    let runningTotal = 0;
    let peak = 0;
    let maxDrawdown = 0;

    for (const analysis of analyses) {
      for (const trade of analysis.trades.filter(t => t.result)) {
        runningTotal += trade.actualReturn || 0;
        if (runningTotal > peak) peak = runningTotal;
        const drawdown = peak - runningTotal;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }
    }

    // Profit Factor
    const grossProfit = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
    const grossLoss = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    return {
      totalTrades,
      overallWinRate,
      totalReturn,
      totalInvested,
      roi,
      sharpeRatio,
      maxDrawdown,
      profitFactor
    };
  }

  private static displayOverallMetrics(metrics: OverallMetrics): void {
    console.log('📊 MÉTRICAS GERAIS DO SISTEMA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📈 Total de Trades: ${metrics.totalTrades}`);
    console.log(`🎯 Win Rate Geral: ${metrics.overallWinRate.toFixed(1)}%`);
    console.log(`💰 Retorno Total: $${metrics.totalReturn.toFixed(2)}`);
    console.log(`💸 Total Investido: $${metrics.totalInvested.toFixed(2)}`);
    console.log(`📊 ROI: ${metrics.roi.toFixed(1)}%`);
    console.log(`📈 Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}`);
    console.log(`📉 Max Drawdown: $${metrics.maxDrawdown.toFixed(2)}`);
    console.log(`💹 Profit Factor: ${metrics.profitFactor.toFixed(2)}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  private static generateRecommendations(analyses: TradeAnalysis[], metrics: OverallMetrics): void {
    console.log('💡 RECOMENDAÇÕES BASEADAS NA ANÁLISE');
    console.log('═══════════════════════════════════════════════════════════════');

    // Recomendações gerais
    if (metrics.overallWinRate < 30) {
      console.log('🚨 CRÍTICO: Win rate muito baixo - PARAR OPERAÇÕES IMEDIATAMENTE');
      console.log('   • Revisar completamente as estratégias');
      console.log('   • Aumentar critérios de entrada para 98%+ confiança');
      console.log('   • Reduzir tamanho de posição para $3-5 por trade');
    } else if (metrics.overallWinRate < 50) {
      console.log('⚠️ ATENÇÃO: Win rate abaixo do esperado');
      console.log('   • Implementar filtros mais rigorosos');
      console.log('   • Aumentar confiança mínima para 90%');
      console.log('   • Adicionar cooldown de 60min entre trades');
    }

    if (metrics.totalReturn < -50) {
      console.log('🚨 CRÍTICO: Perdas excessivas');
      console.log('   • Ativar modo conservador imediatamente');
      console.log('   • Reduzir exposição para máximo $5 por trade');
      console.log('   • Implementar stop loss mais próximo (1%)');
    }

    // Recomendações por bot
    for (const analysis of analyses) {
      if (analysis.winRate < 20) {
        console.log(`🔴 ${analysis.botName}: DESATIVAR temporariamente`);
        console.log(`   • Win rate de ${analysis.winRate.toFixed(1)}% é inaceitável`);
        console.log(`   • Revisar completamente a estratégia`);
      } else if (analysis.consecutiveLosses >= 3) {
        console.log(`⚠️ ${analysis.botName}: Implementar cooldown após perdas`);
        console.log(`   • ${analysis.consecutiveLosses} perdas consecutivas detectadas`);
      }
    }

    // Recomendações de melhoria
    console.log('\n🔧 AJUSTES RECOMENDADOS:');
    console.log('   1. Aumentar confiança mínima para 90-90%');
    console.log('   2. Implementar validação de volume (2-3x média)');
    console.log('   3. Adicionar filtro de volatilidade (0.5-4%)');
    console.log('   4. Reduzir tamanho de posição para $5');
    console.log('   5. Implementar R/R mínimo de 3:1');
    console.log('   6. Adicionar cooldown de 60min após perdas');
    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  private static saveAnalysisReport(analyses: TradeAnalysis[], metrics: OverallMetrics): void {
    const report = {
      timestamp: new Date().toISOString(),
      overallMetrics: metrics,
      botAnalyses: analyses,
      recommendations: {
        criticalIssues: metrics.overallWinRate < 30 || metrics.totalReturn < -50,
        suggestedActions: [
          'Aumentar confiança mínima para 95-98%',
          'Reduzir tamanho de posição para $5',
          'Implementar filtros de volume e volatilidade',
          'Adicionar cooldown após perdas',
          'Implementar R/R mínimo de 3:1'
        ]
      }
    };

    const reportPath = path.join(__dirname, '../storage/reports', `performance-analysis-${new Date().toISOString().split('T')[0]}.json`);

    // Criar diretório se não existir
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Relatório salvo em: ${reportPath}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  PerformanceAnalyzer.analyzeAllTrades()
    .then(() => {
      console.log('\n🎉 Análise de performance concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na análise:', error);
      process.exit(1);
    });
}