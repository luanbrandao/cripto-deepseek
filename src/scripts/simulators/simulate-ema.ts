
import { TradingConfigManager } from '../../shared/config/trading-config-manager';
import EmaAnalyzer from '../../analyzers/emaAnalyzer';
import { TradeSimulator } from './trade-simulator';

// Ativar modo ultra-conservador
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

async function runUltraConservativeEmaSimulation() {
  const config = TradingConfigManager.getConfig();
  
  console.log('🛡️ EMA SIMULATOR v5.0');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🎯 Modo: ${TradingConfigManager.getMode()}`);
  console.log(`📊 Estratégia: EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} Ultra-Conservador`);
  console.log(`🎯 Win Rate Target: 75%+ | Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`🛡️ Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
  console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')} (apenas os mais estáveis)`);
  console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos entre trades`);
  console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');

  // Configurar EMA ultra-conservador
  const emaConfig = {
    fastPeriod: config.EMA.FAST_PERIOD,
    slowPeriod: config.EMA.SLOW_PERIOD
  };
  const analyzer = new EmaAnalyzer(emaConfig);

  const tradesFile = `./src/storage/trades/ema${emaConfig.fastPeriod}-${emaConfig.slowPeriod}Trades.json`;
  const simulator = new TradeSimulator(analyzer, config.SIMULATION.INITIAL_BALANCE, config.SYMBOLS, tradesFile);

  console.log('🔍 VALIDAÇÃO ULTRA-RIGOROSA ATIVADA:');
  console.log('   📊 Análise Técnica: Score mín. 80/100');
  console.log('   📈 Análise de Volume: Score mín. 75/100');
  console.log('   🎯 Análise de Tendência: Score mín. 85/100');
  console.log('   🤖 Validação IA: Confiança mín. 90%');
  console.log('   🚫 Filtros de Exclusão: Volume >$2B, Volatilidade <2.5%\n');

  await simulator.simulate(config.SYMBOLS);
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  runUltraConservativeEmaSimulation();
}