import * as fs from 'fs';
import * as path from 'path';

interface Trade {
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  confidence: number;
  status: 'pending' | 'completed';
  result?: 'win' | 'loss';
  actualReturn?: number;
  reason: string;
  strategy?: string;
}

interface BotStats {
  name: string;
  totalTrades: number;
  completedTrades: number;
  pendingTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  buyTrades: number;
  sellTrades: number;
  totalReturn: number;
  avgReturn: number;
  avgConfidence: number;
  bestTrade: number;
  worstTrade: number;
}

function analyzeAllTrades() {
  const tradesDir = path.resolve('./src/storage/trades');
  const files = fs.readdirSync(tradesDir).filter(file => file.endsWith('.json'));
  
  console.log('📊 ANÁLISE COMPLETA DE TODOS OS TRADES');
  console.log('='.repeat(80));
  
  const allStats: BotStats[] = [];
  
  for (const file of files) {
    const filePath = path.join(tradesDir, file);
    const botName = file.replace('.json', '');
    
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const trades: Trade[] = JSON.parse(data);
      
      if (trades.length === 0) {
        console.log(`⚠️ ${botName}: Nenhum trade encontrado`);
        continue;
      }
      
      const stats = analyzeBotTrades(botName, trades);
      allStats.push(stats);
      
    } catch (error) {
      console.log(`❌ Erro ao analisar ${botName}:`, error);
    }
  }
  
  // Exibir estatísticas de cada bot
  allStats.forEach(stats => displayBotStats(stats));
  
  // Resumo geral
  displayOverallSummary(allStats);
}

function analyzeBotTrades(botName: string, trades: Trade[]): BotStats {
  const completedTrades = trades.filter(t => t.status === 'completed');
  const pendingTrades = trades.filter(t => t.status === 'pending');
  const wins = completedTrades.filter(t => t.result === 'win');
  const losses = completedTrades.filter(t => t.result === 'loss');
  const buyTrades = trades.filter(t => t.action === 'BUY');
  const sellTrades = trades.filter(t => t.action === 'SELL');
  
  const totalReturn = completedTrades.reduce((sum, t) => sum + (t.actualReturn || 0), 0);
  const avgReturn = completedTrades.length > 0 ? totalReturn / completedTrades.length : 0;
  const avgConfidence = trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length;
  
  const returns = completedTrades.map(t => t.actualReturn || 0);
  const bestTrade = returns.length > 0 ? Math.max(...returns) : 0;
  const worstTrade = returns.length > 0 ? Math.min(...returns) : 0;
  
  return {
    name: botName,
    totalTrades: trades.length,
    completedTrades: completedTrades.length,
    pendingTrades: pendingTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0,
    buyTrades: buyTrades.length,
    sellTrades: sellTrades.length,
    totalReturn,
    avgReturn,
    avgConfidence,
    bestTrade,
    worstTrade
  };
}

function displayBotStats(stats: BotStats) {
  console.log(`\n🤖 ${stats.name.toUpperCase()}`);
  console.log('-'.repeat(60));
  
  // Trades básicos
  console.log(`📊 Total de Trades: ${stats.totalTrades}`);
  console.log(`✅ Concluídos: ${stats.completedTrades} | ⏳ Pendentes: ${stats.pendingTrades}`);
  
  // Direção dos trades
  console.log(`📈 Compras (BUY): ${stats.buyTrades} | 📉 Vendas (SELL): ${stats.sellTrades}`);
  
  // Performance
  if (stats.completedTrades > 0) {
    const winRateEmoji = stats.winRate >= 70 ? '🟢' : stats.winRate >= 50 ? '🟡' : '🔴';
    console.log(`${winRateEmoji} Win Rate: ${stats.winRate.toFixed(1)}% (${stats.wins}W/${stats.losses}L)`);
    
    const returnEmoji = stats.totalReturn >= 0 ? '💰' : '💸';
    console.log(`${returnEmoji} Retorno Total: ${stats.totalReturn.toFixed(2)}`);
    console.log(`📊 Retorno Médio: ${stats.avgReturn.toFixed(2)}`);
    console.log(`🎯 Melhor Trade: ${stats.bestTrade.toFixed(2)}`);
    console.log(`💔 Pior Trade: ${stats.worstTrade.toFixed(2)}`);
  }
  
  console.log(`🧠 Confiança Média: ${stats.avgConfidence.toFixed(1)}%`);
}

function displayOverallSummary(allStats: BotStats[]) {
  console.log('\n🏆 RESUMO GERAL DE TODOS OS BOTS');
  console.log('='.repeat(80));
  
  const totalTrades = allStats.reduce((sum, s) => sum + s.totalTrades, 0);
  const totalCompleted = allStats.reduce((sum, s) => sum + s.completedTrades, 0);
  const totalWins = allStats.reduce((sum, s) => sum + s.wins, 0);
  const totalLosses = allStats.reduce((sum, s) => sum + s.losses, 0);
  const totalBuys = allStats.reduce((sum, s) => sum + s.buyTrades, 0);
  const totalSells = allStats.reduce((sum, s) => sum + s.sellTrades, 0);
  const totalReturn = allStats.reduce((sum, s) => sum + s.totalReturn, 0);
  
  const overallWinRate = totalCompleted > 0 ? (totalWins / totalCompleted) * 100 : 0;
  
  console.log(`📊 Total Geral: ${totalTrades} trades`);
  console.log(`✅ Concluídos: ${totalCompleted} | ⏳ Pendentes: ${totalTrades - totalCompleted}`);
  console.log(`📈 Compras: ${totalBuys} (${((totalBuys/totalTrades)*100).toFixed(1)}%)`);
  console.log(`📉 Vendas: ${totalSells} (${((totalSells/totalTrades)*100).toFixed(1)}%)`);
  
  const winRateEmoji = overallWinRate >= 70 ? '🟢' : overallWinRate >= 50 ? '🟡' : '🔴';
  console.log(`${winRateEmoji} Win Rate Geral: ${overallWinRate.toFixed(1)}% (${totalWins}W/${totalLosses}L)`);
  
  const returnEmoji = totalReturn >= 0 ? '💰' : '💸';
  console.log(`${returnEmoji} Retorno Total: ${totalReturn.toFixed(2)}`);
  
  // Ranking por performance
  console.log('\n🏅 RANKING POR WIN RATE:');
  const sortedByWinRate = allStats
    .filter(s => s.completedTrades > 0)
    .sort((a, b) => b.winRate - a.winRate);
    
  sortedByWinRate.forEach((stats, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
    console.log(`${medal} ${stats.name}: ${stats.winRate.toFixed(1)}% (${stats.wins}/${stats.completedTrades})`);
  });
  
  // Ranking por retorno
  console.log('\n💰 RANKING POR RETORNO TOTAL:');
  const sortedByReturn = allStats
    .filter(s => s.completedTrades > 0)
    .sort((a, b) => b.totalReturn - a.totalReturn);
    
  sortedByReturn.forEach((stats, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💰';
    const returnEmoji = stats.totalReturn >= 0 ? '📈' : '📉';
    console.log(`${medal} ${stats.name}: ${returnEmoji} ${stats.totalReturn.toFixed(2)}`);
  });
}

if (require.main === module) {
  analyzeAllTrades();
}