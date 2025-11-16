import { TradingConfigManager, SupportResistanceAnalyzer } from '../../core';
import * as fs from 'fs';
import { TradeSimulator } from './trade-simulator';

// Ativar modo ultra-conservador para este simulador
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

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
  const config = TradingConfigManager.getConfig();
  const botConfig = TradingConfigManager.getBotConfig();

  console.log('🛡️ SUPPORT/RESISTANCE SIMULATOR v7.0 - VALIDAÇÃO CENTRALIZADA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🎯 Modo: ${TradingConfigManager.getMode()}`);
  console.log('📊 Estratégia: S/R + Níveis Psicológicos (Validação Centralizada)');
  console.log(`🎯 Win Rate Target: 70%+ | Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`🛡️ Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
  console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')} (apenas os mais estáveis)`);
  console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos entre trades`);
  console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');

  // Configuração baseada no modo atual
  const supportConfig = {
    tolerance: botConfig.SUPPORT_RESISTANCE.MAX_DISTANCE,
    minTouches: botConfig.SUPPORT_RESISTANCE.MIN_TOUCHES,
    lookbackPeriods: config.CHART.PERIODS,
    strengthThreshold: 0.65  // Mais realista (era 0.8)
  };

  const analyzer = new SupportResistanceAnalyzer(supportConfig);
  const tradesFile = `./src/storage/trades/${config.FILES.SUPPORT_RESISTANCE}`;

  // Criar simulador com validação centralizada (analyzer já usa PreValidationService)
  const simulator = new TradeSimulator(analyzer, config.SIMULATION.INITIAL_BALANCE, config.SYMBOLS, tradesFile);

  console.log('🔍 VALIDAÇÕES CENTRALIZADAS IMPLEMENTADAS:');
  console.log(`   📊 S/R Toques Mín: ${botConfig.SUPPORT_RESISTANCE.MIN_TOUCHES} (aplicado)`);
  console.log(`   📈 Confiança Mín: ${config.MIN_CONFIDENCE}% (aplicada)`);
  console.log(`   🎯 Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1 (garantido)`);
  console.log(`   🛡️ Tolerância Máx: ${(botConfig.SUPPORT_RESISTANCE.MAX_DISTANCE * 100).toFixed(1)}%`);
  console.log(`   🔧 Validação: SupportResistanceAnalyzer usa PreValidationService`);
  console.log(`   🚫 APENAS SIMULAÇÃO - Trades reais bloqueados\n`);

  await simulator.simulate(config.SYMBOLS);

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