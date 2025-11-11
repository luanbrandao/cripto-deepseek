import { ULTRA_CONSERVATIVE_CONFIG } from '../../shared/config/ultra-conservative-config';
import { UltraConservativeAnalyzer } from '../../shared/analyzers/ultra-conservative-analyzer';
import SupportResistanceAnalyzer from '../../analyzers/supportResistanceAnalyzer';
import * as fs from 'fs';
import * as path from 'path';
import { TradeSimulator } from './trade-simulator';

interface SupportResistanceTrade {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  entryPrice: number;
  targetPrice?: number;
  stopPrice?: number;
  potentialGain?: number;
  potentialLoss?: number;
  riskRewardRatio?: number;
  status: 'pending' | 'completed';
  result?: 'win' | 'loss';
  levels: any[];
}

function saveTrade(trade: SupportResistanceTrade, tradesFile: string) {
  let trades: SupportResistanceTrade[] = [];

  if (fs.existsSync(tradesFile)) {
    const data = fs.readFileSync(tradesFile, 'utf8');
    trades = JSON.parse(data);
  }

  trades.push(trade);
  fs.writeFileSync(tradesFile, JSON.stringify(trades, null, 2));
  console.log(`💾 Trade salvo em: ${tradesFile}`);
}

async function runUltraConservativeSupportResistanceSimulation() {
  console.log('🛡️ ULTRA-CONSERVATIVE SUPPORT/RESISTANCE SIMULATOR v4.0');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 Estratégia: S/R Ultra-Conservador + Níveis Psicológicos');
  console.log(`🎯 Win Rate Target: 78%+ | Risk/Reward: ${ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`🛡️ Confiança Mínima: ${ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE}%`);
  console.log(`🪙 Símbolos: ${ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', ')} (apenas os mais estáveis)`);
  console.log(`⏰ Cooldown: ${ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_HOURS}h entre trades`);
  console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');

  // Configuração ultra-conservadora para S/R
  const supportConfig = {
    tolerance: 0.005,              // ↓ Mais rigoroso (era 0.008)
    minTouches: 3,                 // ↑ Mínimo 3 toques (era 2)
    lookbackPeriods: 50,           // ↑ Mais histórico (era 25)
    strengthThreshold: 0.8         // Força mínima do nível 80%
  };

  const analyzer = new SupportResistanceAnalyzer(supportConfig);
  const tradesFile = `./src/storage/trades/ultraConservativeSupportResistanceTrades.json`;

  const simulator = new TradeSimulator(analyzer, 1000, ULTRA_CONSERVATIVE_CONFIG.SYMBOLS, tradesFile);
  
  console.log('🔍 VALIDAÇÃO ULTRA-RIGOROSA ATIVADA:');
  console.log('   📊 Análise Técnica: Score mín. 80/100');
  console.log('   📈 Análise de Volume: Score mín. 75/100');
  console.log('   🎯 Análise de Tendência: Score mín. 85/100');
  console.log('   🤖 Validação IA: Confiança mín. 90%');
  console.log('   🚫 Filtros S/R: Mín. 3 toques, Força >80%\n');

  await simulator.simulate(ULTRA_CONSERVATIVE_CONFIG.SYMBOLS);

  // Verificar se há trades recentes no arquivo
  let executedTrade = false;
  try {
    if (fs.existsSync(tradesFile)) {
      const data = fs.readFileSync(tradesFile, 'utf8');
      const trades = JSON.parse(data);
      const recentTrades = trades.filter((trade: any) => {
        const tradeTime = new Date(trade.timestamp).getTime();
        const now = Date.now();
        return (now - tradeTime) < 60000;
      });
      executedTrade = recentTrades.length > 0;
    }
  } catch (error) {
    // Ignorar erros
  }

  console.log('\n' + '='.repeat(60));
  if (executedTrade) {
    console.log('✅ SIMULAÇÃO CONCLUÍDA - 🟢 TRADE EXECUTADO');
    console.log('📊 Estratégia: Suporte/Resistência identificou oportunidade');
  } else {
    console.log('✅ SIMULAÇÃO CONCLUÍDA - ⏸️ NENHUM TRADE EXECUTADO');
    console.log('📊 Aguardando níveis de suporte/resistência serem testados');
  }
  console.log('='.repeat(60));

  console.log('\n💡 SOBRE A ESTRATÉGIA:');
  console.log('🎯 Identifica níveis de suporte e resistência baseado em:');
  console.log('   • Número de toques (quanto mais, mais forte)');
  console.log('   • Histórico de preços (níveis testados anteriormente)');
  console.log('   • Níveis psicológicos (números redondos)');
  console.log('   • Zonas de preços (áreas entre níveis próximos)');
  console.log('   • Rompimentos (breakouts de níveis importantes)');
  console.log('\n📈 Sinais de entrada:');
  console.log('   • COMPRA: Preço próximo ao suporte ou rompimento de resistência');
  console.log('   • VENDA: Preço próximo à resistência ou rompimento de suporte');
  console.log('   • HOLD: Preço em área neutra sem níveis significativos');
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  runUltraConservativeSupportResistanceSimulation();
}