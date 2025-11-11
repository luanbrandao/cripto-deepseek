
import { ULTRA_CONSERVATIVE_CONFIG } from '../../shared/config/ultra-conservative-config';
import { UltraConservativeAnalyzer } from '../../shared/analyzers/ultra-conservative-analyzer';
import EmaAnalyzer from '../../analyzers/emaAnalyzer';
import { TradeSimulator } from './trade-simulator';

async function runUltraConservativeEmaSimulation() {
  console.log('🛡️ EMA SIMULATOR v4.0');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📊 Estratégia: EMA ${ULTRA_CONSERVATIVE_CONFIG.EMA.FAST_PERIOD}/${ULTRA_CONSERVATIVE_CONFIG.EMA.SLOW_PERIOD} Ultra-Conservador`);
  console.log(`🎯 Win Rate Target: 75%+ | Risk/Reward: ${ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`🛡️ Confiança Mínima: ${ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE}%`);
  console.log(`🪙 Símbolos: ${ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', ')} (apenas os mais estáveis)`);
  console.log(`⏰ Cooldown: ${ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_HOURS}h entre trades`);
  console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');

  // Configurar EMA ultra-conservador
  const emaConfig = {
    fastPeriod: ULTRA_CONSERVATIVE_CONFIG.EMA.FAST_PERIOD,
    slowPeriod: ULTRA_CONSERVATIVE_CONFIG.EMA.SLOW_PERIOD
  };
  const analyzer = new EmaAnalyzer(emaConfig);

  const tradesFile = `./src/storage/trades/ema${emaConfig.fastPeriod}-${emaConfig.slowPeriod}Trades.json`;
  const simulator = new TradeSimulator(analyzer, 1000, ULTRA_CONSERVATIVE_CONFIG.SYMBOLS, tradesFile);

  console.log('🔍 VALIDAÇÃO ULTRA-RIGOROSA ATIVADA:');
  console.log('   📊 Análise Técnica: Score mín. 80/100');
  console.log('   📈 Análise de Volume: Score mín. 75/100');
  console.log('   🎯 Análise de Tendência: Score mín. 85/100');
  console.log('   🤖 Validação IA: Confiança mín. 90%');
  console.log('   🚫 Filtros de Exclusão: Volume >$2B, Volatilidade <2.5%\n');

  await simulator.simulate(ULTRA_CONSERVATIVE_CONFIG.SYMBOLS);
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  runUltraConservativeEmaSimulation();
}