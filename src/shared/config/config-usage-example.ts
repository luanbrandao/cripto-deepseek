/**
 * 📖 EXEMPLO DE USO DO GERENCIADOR DE CONFIGURAÇÕES
 * Como alternar entre modos BALANCED e ULTRA_CONSERVATIVE
 */

import { TradingConfigManager } from './trading-config-manager';

// 🎯 EXEMPLO 1: Usar modo balanceado (padrão)
console.log('=== MODO BALANCEADO ===');
TradingConfigManager.setMode('BALANCED');

const balancedConfig = TradingConfigManager.getConfig();
const balancedBotConfig = TradingConfigManager.getBotConfig();

console.log('Símbolos:', balancedConfig.SYMBOLS);
console.log('Confiança mínima:', balancedConfig.MIN_CONFIDENCE);
console.log('Risk/Reward:', balancedConfig.MIN_RISK_REWARD_RATIO);
console.log('Suporte/Resistência - Min touches:', balancedBotConfig.SUPPORT_RESISTANCE.MIN_TOUCHES);

// 🛡️ EXEMPLO 2: Alternar para modo ultra-conservador
console.log('\n=== MODO ULTRA-CONSERVADOR ===');
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

const ultraConfig = TradingConfigManager.getConfig();
const ultraBotConfig = TradingConfigManager.getBotConfig();

console.log('Símbolos:', ultraConfig.SYMBOLS);
console.log('Confiança mínima:', ultraConfig.MIN_CONFIDENCE);
console.log('Risk/Reward:', ultraConfig.MIN_RISK_REWARD_RATIO);
console.log('Suporte/Resistência - Min touches:', ultraBotConfig.SUPPORT_RESISTANCE.MIN_TOUCHES);

// 🔄 EXEMPLO 3: Usar funções auxiliares
console.log('\n=== FUNÇÕES AUXILIARES ===');
console.log('Max trades ativos (real):', TradingConfigManager.getMaxActiveTrades(false));
console.log('Max trades ativos (simulação):', TradingConfigManager.getMaxActiveTrades(true));
console.log('Max trades por símbolo:', TradingConfigManager.getMaxTradesPerSymbol());

// 📊 EXEMPLO 4: Verificar se pode fazer trade
const mockTrades = [
  { result: 'loss', actualReturn: -5, timestamp: new Date().toISOString() },
  { result: 'win', actualReturn: 10, timestamp: new Date().toISOString() }
];

console.log('Pode fazer trade?', TradingConfigManager.canTrade(mockTrades));

// 🎛️ EXEMPLO 5: Verificar modo atual
console.log('Modo atual:', TradingConfigManager.getMode());

export { TradingConfigManager };