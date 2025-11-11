/**
 * 🧪 TESTE DO GERENCIADOR DE CONFIGURAÇÕES
 * Testa a troca entre modos BALANCED e ULTRA_CONSERVATIVE
 */

import { TradingConfigManager } from '../shared/config/trading-config-manager';

function testConfigManager() {
  console.log('🧪 TESTE DO GERENCIADOR DE CONFIGURAÇÕES\n');

  // Teste modo BALANCED
  console.log('='.repeat(50));
  console.log('🎯 MODO BALANCED');
  console.log('='.repeat(50));
  
  TradingConfigManager.setMode('BALANCED');
  const balanced = TradingConfigManager.getConfig();
  const balancedBot = TradingConfigManager.getBotConfig();
  
  console.log(`Símbolos: ${balanced.SYMBOLS.join(', ')}`);
  console.log(`Confiança: ${balanced.MIN_CONFIDENCE}%`);
  console.log(`Risk/Reward: ${balanced.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`S/R Min Touches: ${balancedBot.SUPPORT_RESISTANCE.MIN_TOUCHES}`);
  console.log(`Max Trades: ${balanced.LIMITS.MAX_ACTIVE_TRADES}`);

  // Teste modo ULTRA_CONSERVATIVE
  console.log('\n' + '='.repeat(50));
  console.log('🛡️ MODO ULTRA_CONSERVATIVE');
  console.log('='.repeat(50));
  
  TradingConfigManager.setMode('ULTRA_CONSERVATIVE');
  const ultra = TradingConfigManager.getConfig();
  const ultraBot = TradingConfigManager.getBotConfig();
  
  console.log(`Símbolos: ${ultra.SYMBOLS.join(', ')}`);
  console.log(`Confiança: ${ultra.MIN_CONFIDENCE}%`);
  console.log(`Risk/Reward: ${ultra.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`S/R Min Touches: ${ultraBot.SUPPORT_RESISTANCE.MIN_TOUCHES}`);
  console.log(`Max Trades: ${ultra.LIMITS.MAX_ACTIVE_TRADES}`);

  // Comparação
  console.log('\n' + '='.repeat(50));
  console.log('📊 COMPARAÇÃO');
  console.log('='.repeat(50));
  console.log('BALANCED vs ULTRA_CONSERVATIVE:');
  console.log(`Símbolos: ${balanced.SYMBOLS.length} vs ${ultra.SYMBOLS.length}`);
  console.log(`Confiança: ${balanced.MIN_CONFIDENCE}% vs ${ultra.MIN_CONFIDENCE}%`);
  console.log(`S/R Touches: ${balancedBot.SUPPORT_RESISTANCE.MIN_TOUCHES} vs ${ultraBot.SUPPORT_RESISTANCE.MIN_TOUCHES}`);
  
  console.log('\n✅ Teste concluído!');
}

if (require.main === module) {
  testConfigManager();
}

export { testConfigManager };