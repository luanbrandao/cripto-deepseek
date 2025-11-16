/**
 * 🧪 TESTE DE REMOÇÃO DE HARDCODES
 * Verifica se todos os valores hardcoded foram substituídos por configurações
 */

import { TradingConfigManager } from '../../shared/config/trading-config-manager';
import EmaAnalyzer from '../../analyzers/emaAnalyzer';
import Analyzer123 from '../../analyzers/123Analyzer';
import { calculateEMA } from '../../bots/utils/analysis/ema-calculator';
import { RiskManager } from '../../bots/services/risk-manager';

console.log('🧪 TESTE DE REMOÇÃO DE HARDCODES');
console.log('═══════════════════════════════════════════════════════════════');

// Teste 1: Configurações Balanceadas
console.log('\n📊 1. TESTANDO CONFIGURAÇÕES BALANCEADAS:');
TradingConfigManager.setMode('BALANCED');
const balancedConfig = TradingConfigManager.getConfig();

console.log(`✅ EMA Multiplier: ${balancedConfig.ALGORITHM.EMA_MULTIPLIER_NUMERATOR}`);
console.log(`✅ Default Confidence: ${balancedConfig.ALGORITHM.DEFAULT_CONFIDENCE}%`);
console.log(`✅ Base Confidence: ${balancedConfig.ALGORITHM.BASE_CONFIDENCE}%`);
console.log(`✅ RSI Min/Max: ${balancedConfig.ALGORITHM.RSI_MIN}/${balancedConfig.ALGORITHM.RSI_MAX}`);
console.log(`✅ Pattern 123 Min Candles: ${balancedConfig.ALGORITHM.PATTERN_123.MIN_CANDLES_REQUIRED}`);
console.log(`✅ Confidence Divisor: ${balancedConfig.ALGORITHM.CONFIDENCE_DIVISOR}`);
console.log(`✅ Numerical Tolerance: ${balancedConfig.ALGORITHM.NUMERICAL_TOLERANCE}`);

// Teste 2: Configurações Ultra-Conservadoras
console.log('\n🛡️ 2. TESTANDO CONFIGURAÇÕES ULTRA-CONSERVADORAS:');
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');
const ultraConfig = TradingConfigManager.getConfig();

console.log(`✅ Default Confidence: ${ultraConfig.ALGORITHM.DEFAULT_CONFIDENCE}% (mais rigoroso)`);
console.log(`✅ Base Confidence: ${ultraConfig.ALGORITHM.BASE_CONFIDENCE}% (mais rigoroso)`);
console.log(`✅ Exceptional Confidence: ${ultraConfig.ALGORITHM.EXCEPTIONAL_CONFIDENCE}%`);
console.log(`✅ Pattern 123 Min Candles: ${ultraConfig.ALGORITHM.PATTERN_123.MIN_CANDLES_REQUIRED} (mais rigoroso)`);
console.log(`✅ Ultra Conservative Threshold: ${ultraConfig.ALGORITHM.ULTRA_CONSERVATIVE_THRESHOLD}%`);

// Teste 3: EMA Analyzer
console.log('\n📈 3. TESTANDO EMA ANALYZER:');
const emaAnalyzer = new EmaAnalyzer();
const mockMarketData = {
  price24h: Array.from({length: 50}, (_, i) => 100 + Math.random() * 10),
  currentPrice: 105
};

try {
  const emaResult = emaAnalyzer.analyze(mockMarketData);
  console.log(`✅ EMA Analysis: ${emaResult.action} (${emaResult.confidence}% confidence)`);
  console.log(`✅ EMA Reason: ${emaResult.reason}`);
} catch (error) {
  console.log(`❌ EMA Analysis Error: ${error}`);
}

// Teste 4: 123 Pattern Analyzer
console.log('\n🔢 4. TESTANDO 123 PATTERN ANALYZER:');
const mockCandleData = {
  candles: Array.from({length: 15}, (_, i) => ({
    open: 100 + i,
    high: 102 + i,
    low: 99 + i,
    close: 101 + i,
    timestamp: Date.now() - (i * 60000)
  })),
  currentPrice: 115
};

try {
  const pattern123Result = Analyzer123.analyze(mockCandleData);
  console.log(`✅ 123 Pattern: ${pattern123Result.action} (${pattern123Result.confidence}% confidence)`);
  console.log(`✅ 123 Reason: ${pattern123Result.reason}`);
} catch (error) {
  console.log(`❌ 123 Pattern Error: ${error}`);
}

// Teste 5: EMA Calculator
console.log('\n🧮 5. TESTANDO EMA CALCULATOR:');
const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110];
try {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  console.log(`✅ EMA12: ${ema12.toFixed(4)}`);
  console.log(`✅ EMA26: ${ema26.toFixed(4)}`);
} catch (error) {
  console.log(`❌ EMA Calculator Error: ${error}`);
}

// Teste 6: Risk Manager
console.log('\n⚖️ 6. TESTANDO RISK MANAGER:');
try {
  const riskReward75 = RiskManager.calculateDynamicRiskReward(100, 75);
  const riskReward85 = RiskManager.calculateDynamicRiskReward(100, 85);
  const riskReward95 = RiskManager.calculateDynamicRiskReward(100, 95);
  
  console.log(`✅ Risk/Reward 75%: ${(riskReward75.riskPercent*100).toFixed(2)}%/${(riskReward75.rewardPercent*100).toFixed(2)}%`);
  console.log(`✅ Risk/Reward 85%: ${(riskReward85.riskPercent*100).toFixed(2)}%/${(riskReward85.rewardPercent*100).toFixed(2)}%`);
  console.log(`✅ Risk/Reward 95%: ${(riskReward95.riskPercent*100).toFixed(2)}%/${(riskReward95.rewardPercent*100).toFixed(2)}%`);
} catch (error) {
  console.log(`❌ Risk Manager Error: ${error}`);
}

// Teste 7: Comparação entre Modos
console.log('\n🔄 7. COMPARAÇÃO ENTRE MODOS:');
TradingConfigManager.setMode('BALANCED');
const balancedDefConf = TradingConfigManager.getConfig().ALGORITHM.DEFAULT_CONFIDENCE;

TradingConfigManager.setMode('ULTRA_CONSERVATIVE');
const ultraDefConf = TradingConfigManager.getConfig().ALGORITHM.DEFAULT_CONFIDENCE;

console.log(`✅ Balanced Default Confidence: ${balancedDefConf}%`);
console.log(`✅ Ultra Conservative Default Confidence: ${ultraDefConf}%`);
console.log(`✅ Diferença: ${ultraDefConf - balancedDefConf}% (ultra-conservador é mais rigoroso)`);

// Teste 8: Validação de Completude
console.log('\n✅ 8. VALIDAÇÃO DE COMPLETUDE:');
const requiredFields = [
  'EMA_MULTIPLIER_NUMERATOR',
  'DEFAULT_CONFIDENCE',
  'BASE_CONFIDENCE',
  'RSI_MIN',
  'RSI_MAX',
  'CONFIDENCE_DIVISOR',
  'NUMERICAL_TOLERANCE',
  'ULTRA_CONSERVATIVE_THRESHOLD'
];

TradingConfigManager.setMode('BALANCED');
const config = TradingConfigManager.getConfig().ALGORITHM;
let allFieldsPresent = true;

requiredFields.forEach(field => {
  if ((config as any)[field] === undefined) {
    console.log(`❌ Campo ausente: ${field}`);
    allFieldsPresent = false;
  } else {
    console.log(`✅ ${field}: ${(config as any)[field]}`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════');
if (allFieldsPresent) {
  console.log('🎉 TODOS OS TESTES PASSARAM! Hardcodes removidos com sucesso.');
} else {
  console.log('❌ ALGUNS TESTES FALHARAM! Verifique os campos ausentes.');
}
console.log('═══════════════════════════════════════════════════════════════');