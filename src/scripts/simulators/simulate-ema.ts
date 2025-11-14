
import { TradingConfigManager } from '../../shared/config/trading-config-manager';
import EmaAnalyzer from '../../analyzers/emaAnalyzer';
import { TradeSimulator } from './trade-simulator';
import { UltraConservativeAnalyzer } from '../../shared/analyzers/ultra-conservative-analyzer';

// Ativar modo ultra-conservador
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

async function runUltraConservativeEmaSimulation() {
  const config = TradingConfigManager.getConfig();
  
  console.log('🛡️ EMA SIMULATOR v6.0 - REALISTA CORRIGIDO');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🎯 Modo: ${TradingConfigManager.getMode()}`);
  console.log(`📊 Estratégia: EMA ${config.EMA.FAST_PERIOD}/${config.EMA.SLOW_PERIOD} Ultra-Conservador`);
  console.log(`🎯 Win Rate Target: 80%+ | Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`🛡️ Confiança Mínima: ${config.MIN_CONFIDENCE}% (REAL)`);
  console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')} (apenas os mais estáveis)`);
  console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos entre trades`);
  console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');

  // Configurar EMA ultra-conservador com validações reais
  const emaConfig = {
    fastPeriod: config.EMA.FAST_PERIOD,
    slowPeriod: config.EMA.SLOW_PERIOD,
    minConfidence: config.MIN_CONFIDENCE, // 75% real
    ultraConservative: true
  };
  const analyzer = new EmaAnalyzer(emaConfig);

  const tradesFile = `./src/storage/trades/ema${emaConfig.fastPeriod}-${emaConfig.slowPeriod}Trades.json`;
  const simulator = new TradeSimulator(analyzer, config.SIMULATION.INITIAL_BALANCE, config.SYMBOLS, tradesFile);

  console.log('🔍 VALIDAÇÕES REAIS IMPLEMENTADAS:');
  console.log(`   📊 EMA Separação Mín: ${(config.EMA_ADVANCED.MIN_SEPARATION * 100).toFixed(1)}%`);
  console.log(`   📈 Confiança Mínima: ${config.MIN_CONFIDENCE}% (aplicada)`);
  console.log(`   🎯 Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1 (garantido)`);
  console.log(`   🛡️ Mudança Preço Mín: 1.0% (conservador)`);
  console.log(`   🚫 Apenas ${config.SYMBOLS.length} moedas estáveis\n`);

  await simulator.simulate(config.SYMBOLS);
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  runUltraConservativeEmaSimulation();
}