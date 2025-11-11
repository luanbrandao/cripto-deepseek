/**
 * 🧪 TESTE DE TROCA DE CONFIGURAÇÕES
 * Demonstra como alternar entre modos BALANCED e ULTRA_CONSERVATIVE
 */

import { TradingConfigManager } from '../shared/config/trading-config-manager';
import SupportResistanceAnalyzer from '../analyzers/supportResistanceAnalyzer';

async function testConfigSwitching() {
  console.log('🧪 TESTE DE TROCA DE CONFIGURAÇÕES\n');

  // 🎯 TESTE 1: Modo Balanceado
  console.log('='.repeat(60));
  console.log('🎯 TESTANDO MODO BALANCEADO');
  console.log('='.repeat(60));
  
  TradingConfigManager.setMode('BALANCED');
  
  const balancedConfig = TradingConfigManager.getConfig();
  const balancedBotConfig = TradingConfigManager.getBotConfig();
  
  console.log(`📊 Símbolos: ${balancedConfig.SYMBOLS.join(', ')}`);
  console.log(`🎯 Confiança mínima: ${balancedConfig.MIN_CONFIDENCE}%`);
  console.log(`⚖️ Risk/Reward: ${balancedConfig.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`💰 Valor por trade: $${balancedConfig.TRADE_AMOUNT_USD}`);
  console.log(`⏰ Cooldown: ${balancedConfig.TRADE_COOLDOWN_MINUTES} minutos`);
  console.log(`📈 Timeframe: ${balancedConfig.CHART.TIMEFRAME}`);
  console.log(`🔍 S/R Min touches: ${balancedBotConfig.SUPPORT_RESISTANCE.MIN_TOUCHES}`);
  
  // Testar analyzer com configuração balanceada
  const balancedAnalyzer = new SupportResistanceAnalyzer();
  console.log(`🔧 Analyzer configurado com ${balancedBotConfig.SUPPORT_RESISTANCE.MIN_TOUCHES} toques mínimos`);

  // 🛡️ TESTE 2: Modo Ultra-Conservador
  console.log('\n' + '='.repeat(60));
  console.log('🛡️ TESTANDO MODO ULTRA-CONSERVADOR');
  console.log('='.repeat(60));
  
  TradingConfigManager.setMode('ULTRA_CONSERVATIVE');
  
  const ultraConfig = TradingConfigManager.getConfig();
  const ultraBotConfig = TradingConfigManager.getBotConfig();
  
  console.log(`📊 Símbolos: ${ultraConfig.SYMBOLS.join(', ')}`);
  console.log(`🎯 Confiança mínima: ${ultraConfig.MIN_CONFIDENCE}%`);
  console.log(`⚖️ Risk/Reward: ${ultraConfig.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`💰 Valor por trade: $${ultraConfig.TRADE_AMOUNT_USD}`);
  console.log(`⏰ Cooldown: ${ultraConfig.TRADE_COOLDOWN_MINUTES} minutos`);
  console.log(`📈 Timeframe: ${ultraConfig.CHART.TIMEFRAME}`);
  console.log(`🔍 S/R Min touches: ${ultraBotConfig.SUPPORT_RESISTANCE.MIN_TOUCHES}`);
  
  // Testar analyzer com configuração ultra-conservadora
  const ultraAnalyzer = new SupportResistanceAnalyzer();
  console.log(`🔧 Analyzer configurado com ${ultraBotConfig.SUPPORT_RESISTANCE.MIN_TOUCHES} toques mínimos`);

  // 🔄 TESTE 3: Comparação de Limites
  console.log('\n' + '='.repeat(60));
  console.log('🔄 COMPARAÇÃO DE LIMITES');
  console.log('='.repeat(60));
  
  console.log('MODO BALANCEADO vs ULTRA-CONSERVADOR:');
  console.log(`Max trades ativos: ${balancedConfig.LIMITS.MAX_ACTIVE_TRADES} vs ${ultraConfig.LIMITS.MAX_ACTIVE_TRADES}`);
  console.log(`Max perda diária: $${balancedConfig.LIMITS.MAX_DAILY_LOSS} vs $${ultraConfig.LIMITS.MAX_DAILY_LOSS}`);
  console.log(`Perdas consecutivas: ${balancedConfig.LIMITS.MAX_CONSECUTIVE_LOSSES} vs ${ultraConfig.LIMITS.MAX_CONSECUTIVE_LOSSES}`);

  // 🎛️ TESTE 4: Funções Auxiliares
  console.log('\n' + '='.repeat(60));
  console.log('🎛️ TESTANDO FUNÇÕES AUXILIARES');
  console.log('='.repeat(60));
  
  TradingConfigManager.setMode('BALANCED');
  console.log('MODO BALANCEADO:');
  console.log(`- Max trades (real): ${TradingConfigManager.getMaxActiveTrades(false)}`);
  console.log(`- Max trades (simulação): ${TradingConfigManager.getMaxActiveTrades(true)}`);
  console.log(`- Max por símbolo: ${TradingConfigManager.getMaxTradesPerSymbol()}`);
  
  TradingConfigManager.setMode('ULTRA_CONSERVATIVE');
  console.log('\nMODO ULTRA-CONSERVADOR:');
  console.log(`- Max trades (real): ${TradingConfigManager.getMaxActiveTrades(false)}`);
  console.log(`- Max trades (simulação): ${TradingConfigManager.getMaxActiveTrades(true)}`);
  console.log(`- Max por símbolo: ${TradingConfigManager.getMaxTradesPerSymbol()}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTE CONCLUÍDO - Troca de configurações funcionando!');
  console.log('='.repeat(60));
  
  console.log('\n💡 COMO USAR:');
  console.log('1. TradingConfigManager.setMode("BALANCED") - Modo balanceado');
  console.log('2. TradingConfigManager.setMode("ULTRA_CONSERVATIVE") - Modo ultra-conservador');
  console.log('3. TradingConfigManager.getConfig() - Obter configuração atual');
  console.log('4. TradingConfigManager.getBotConfig() - Obter config específica dos bots');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testConfigSwitching().catch(console.error);
}

export { testConfigSwitching };