/**
 * Teste completo de todos os cálculos do sistema
 */

import { calculateEMA } from '../../bots/utils/analysis/ema-calculator';
import { calculateRiskReward, calculateRiskRewardDynamic, validateRiskReward } from '../../bots/utils/risk/trade-validators';
import { calculateVolatility } from '../../bots/utils/risk/volatility-calculator';
import { findSupportResistanceLevels, findLocalExtrema } from '../../bots/utils/analysis/support-resistance-calculator';
import { calculateTargetAndStopPrices } from '../../bots/utils/risk/price-calculator';
import { RiskManager } from '../../bots/services/risk-manager';

console.log('🧪 TESTE COMPLETO DE CÁLCULOS\n');

let passedTests = 0;
let totalTests = 0;

function test(name: string, condition: boolean, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${name}`);
    passedTests++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// 1. TESTE EMA
console.log('=== 1. TESTE EMA ===');
const testPrices = [100, 102, 101, 103, 105];
const ema3 = calculateEMA(testPrices, 3);
test('EMA Calculation', Math.abs(ema3 - 103.5) < 0.01, `Expected ~103.5, got ${ema3}`);

// 2. TESTE RISK/REWARD
console.log('\n=== 2. TESTE RISK/REWARD ===');
const { riskPercent, rewardPercent } = calculateRiskReward(85);
const ratio = rewardPercent / riskPercent;
test('Risk/Reward 2:1', Math.abs(ratio - 2) < 0.01, `Expected 2:1, got ${ratio.toFixed(2)}:1`);

// 3. TESTE RISK/REWARD DINÂMICO
console.log('\n=== 3. TESTE RISK/REWARD DINÂMICO ===');
const dynamicResult = calculateRiskRewardDynamic(931.71, 941.0271, 927.05145, 'BUY');
test('Dynamic Risk/Reward Valid', dynamicResult.isValid, 'Should validate 2:1 ratio');
test('Dynamic Ratio Calculation', Math.abs((dynamicResult.rewardPercent / dynamicResult.riskPercent) - 2) < 0.01);

// 4. TESTE VOLATILIDADE
console.log('\n=== 4. TESTE VOLATILIDADE ===');
const mockKlines = [
  [0, 0, 0, 0, '100', 0],
  [0, 0, 0, 0, '102', 0],
  [0, 0, 0, 0, '101', 0],
  [0, 0, 0, 0, '103', 0]
];
const volatility = calculateVolatility(mockKlines);
test('Volatility Calculation', volatility > 0 && volatility <= 5, `Got ${volatility.toFixed(2)}%`);

// 5. TESTE SUPORTE/RESISTÊNCIA
console.log('\n=== 5. TESTE SUPORTE/RESISTÊNCIA ===');
const mockKlinesSupRes = [
  [0, 0, '105', '95', '100', 0],
  [0, 0, '107', '97', '102', 0],
  [0, 0, '106', '96', '101', 0]
];
const levels = findSupportResistanceLevels(mockKlinesSupRes, 100);
test('Support/Resistance Levels', levels.resistance > 100 && levels.support < 100);

// 6. TESTE EXTREMOS LOCAIS
console.log('\n=== 6. TESTE EXTREMOS LOCAIS ===');
const testData = [100, 102, 101, 105, 103, 107, 104, 106, 102];
const maxima = findLocalExtrema(testData, 'max');
const minima = findLocalExtrema(testData, 'min');
test('Local Extrema Detection', maxima.length > 0 || minima.length > 0, `Maxima: ${maxima.length}, Minima: ${minima.length}`);

// 7. TESTE TARGET/STOP PRICES
console.log('\n=== 7. TESTE TARGET/STOP PRICES ===');
const priceResult = calculateTargetAndStopPrices(1000, 85, 'BUY');
const calculatedGain = priceResult.targetPrice - 1000;
const calculatedLoss = 1000 - priceResult.stopPrice;
const calculatedRatio = calculatedGain / calculatedLoss;
test('Target/Stop Prices 2:1', Math.abs(calculatedRatio - 2) < 0.01, `Ratio: ${calculatedRatio.toFixed(2)}:1`);

// 8. TESTE RISK MANAGER
console.log('\n=== 8. TESTE RISK MANAGER ===');
const rmResult = RiskManager.calculateDynamicRiskReward(1000, 75);
const rmRatio = rmResult.rewardPercent / rmResult.riskPercent;
test('Risk Manager 2:1', Math.abs(rmRatio - 2) < 0.01, `Ratio: ${rmRatio.toFixed(2)}:1`);

// 9. TESTE VALIDAÇÃO RISK/REWARD
console.log('\n=== 9. TESTE VALIDAÇÃO ===');
const isValid = validateRiskReward(0.01, 0.02);
test('Risk/Reward Validation', isValid, 'Should validate 2% reward / 1% risk');

// 10. TESTE CONFIANÇA EXTREMA
console.log('\n=== 10. TESTE CONFIANÇA EXTREMA ===');
const highConf = calculateRiskReward(95);
const lowConf = calculateRiskReward(65);
test('High Confidence Low Risk', highConf.riskPercent <= 0.006, `Risk: ${(highConf.riskPercent * 100).toFixed(1)}%`);
test('Low Confidence High Risk', lowConf.riskPercent >= 0.014, `Risk: ${(lowConf.riskPercent * 100).toFixed(1)}%`);

// RESULTADO FINAL
console.log('\n' + '='.repeat(50));
console.log(`🎯 RESULTADO: ${passedTests}/${totalTests} testes passaram`);

if (passedTests === totalTests) {
  console.log('✅ TODOS OS CÁLCULOS ESTÃO CORRETOS!');
  process.exit(0);
} else {
  console.log('❌ ALGUNS TESTES FALHARAM!');
  process.exit(1);
}