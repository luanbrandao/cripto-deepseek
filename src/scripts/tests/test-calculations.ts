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
// Algorithm constants for testing
const TEST_PRICES = [100, 102, 101, 103, 105]; // Algorithm constant - test data
const EMA_PERIOD = 3; // Algorithm constant - test period
const EXPECTED_EMA = 103.5; // Algorithm constant - expected result
const TOLERANCE = 0.01; // Algorithm constant - calculation tolerance

const ema3 = calculateEMA(TEST_PRICES, EMA_PERIOD);
test('EMA Calculation', Math.abs(ema3 - EXPECTED_EMA) < TOLERANCE, `Expected ~${EXPECTED_EMA}, got ${ema3}`);

// 2. TESTE RISK/REWARD
console.log('\n=== 2. TESTE RISK/REWARD ===');
const HIGH_CONFIDENCE_TEST = 85; // Algorithm constant - test confidence
const EXPECTED_RATIO = 2; // Algorithm constant - expected 2:1 ratio

const { riskPercent, rewardPercent } = calculateRiskReward(HIGH_CONFIDENCE_TEST);
const ratio = rewardPercent / riskPercent;
test('Risk/Reward 2:1', Math.abs(ratio - EXPECTED_RATIO) < TOLERANCE, `Expected ${EXPECTED_RATIO}:1, got ${ratio.toFixed(2)}:1`);

// 3. TESTE RISK/REWARD DINÂMICO
console.log('\n=== 3. TESTE RISK/REWARD DINÂMICO ===');
// Test data for dynamic risk/reward
const TEST_ENTRY_PRICE = 931.71; // Algorithm constant - test entry price
const TEST_TARGET_PRICE = 941.0271; // Algorithm constant - test target
const TEST_STOP_PRICE = 927.05145; // Algorithm constant - test stop

const dynamicResult = calculateRiskRewardDynamic(TEST_ENTRY_PRICE, TEST_TARGET_PRICE, TEST_STOP_PRICE, 'BUY');
test('Dynamic Risk/Reward Valid', dynamicResult.isValid, 'Should validate 2:1 ratio');
test('Dynamic Ratio Calculation', Math.abs((dynamicResult.rewardPercent / dynamicResult.riskPercent) - EXPECTED_RATIO) < TOLERANCE);

// 4. TESTE VOLATILIDADE
console.log('\n=== 4. TESTE VOLATILIDADE ===');
// Test data for volatility calculation
const VOLATILITY_TEST_DATA = [
  [0, 0, 0, 0, '100', 0], // Algorithm constant - test kline data
  [0, 0, 0, 0, '102', 0],
  [0, 0, 0, 0, '101', 0],
  [0, 0, 0, 0, '103', 0]
];
const MAX_VOLATILITY_THRESHOLD = 5; // Algorithm constant - max expected volatility

const volatility = calculateVolatility(VOLATILITY_TEST_DATA);
test('Volatility Calculation', volatility > 0 && volatility <= MAX_VOLATILITY_THRESHOLD, `Got ${volatility.toFixed(2)}%`);

// 5. TESTE SUPORTE/RESISTÊNCIA
console.log('\n=== 5. TESTE SUPORTE/RESISTÊNCIA ===');
// Test data for support/resistance
const SR_TEST_DATA = [
  [0, 0, '105', '95', '100', 0], // Algorithm constant - S/R test klines
  [0, 0, '107', '97', '102', 0],
  [0, 0, '106', '96', '101', 0]
];
const SR_TEST_PRICE = 100; // Algorithm constant - test current price

const levels = findSupportResistanceLevels(SR_TEST_DATA, SR_TEST_PRICE);
test('Support/Resistance Levels', levels.resistance > SR_TEST_PRICE && levels.support < SR_TEST_PRICE);

// 6. TESTE EXTREMOS LOCAIS
console.log('\n=== 6. TESTE EXTREMOS LOCAIS ===');
// Test data for local extrema
const EXTREMA_TEST_DATA = [100, 102, 101, 105, 103, 107, 104, 106, 102]; // Algorithm constant

const maxima = findLocalExtrema(EXTREMA_TEST_DATA, 'max');
const minima = findLocalExtrema(EXTREMA_TEST_DATA, 'min');
test('Local Extrema Detection', maxima.length > 0 || minima.length > 0, `Maxima: ${maxima.length}, Minima: ${minima.length}`);

// 7. TESTE TARGET/STOP PRICES
console.log('\n=== 7. TESTE TARGET/STOP PRICES ===');
// Test constants for target/stop prices
const TEST_BASE_PRICE = 1000; // Algorithm constant - test base price
const TEST_CONFIDENCE = 85; // Algorithm constant - test confidence level

const priceResult = calculateTargetAndStopPrices(TEST_BASE_PRICE, TEST_CONFIDENCE, 'BUY');
const calculatedGain = priceResult.targetPrice - TEST_BASE_PRICE;
const calculatedLoss = TEST_BASE_PRICE - priceResult.stopPrice;
const calculatedRatio = calculatedGain / calculatedLoss;
test('Target/Stop Prices 2:1', Math.abs(calculatedRatio - 2) < 0.01, `Ratio: ${calculatedRatio.toFixed(2)}:1`);

// 8. TESTE RISK MANAGER
console.log('\n=== 8. TESTE RISK MANAGER ===');
// Risk Manager test constants
const RM_TEST_PRICE = 1000; // Algorithm constant
const RM_TEST_CONFIDENCE = 75; // Algorithm constant
const TEST_RISK_PERCENT = 0.01; // Algorithm constant - 1% risk
const TEST_REWARD_PERCENT = 0.02; // Algorithm constant - 2% reward
const HIGH_CONFIDENCE_EXTREME = 95; // Algorithm constant
const LOW_CONFIDENCE_EXTREME = 65; // Algorithm constant
const HIGH_CONF_MAX_RISK = 0.006; // Algorithm constant - 0.6% max risk
const LOW_CONF_MIN_RISK = 0.014; // Algorithm constant - 1.4% min risk
const SEPARATOR_LENGTH = 50; // Algorithm constant

const rmResult = RiskManager.calculateDynamicRiskReward(RM_TEST_PRICE, RM_TEST_CONFIDENCE);
const rmRatio = rmResult.rewardPercent / rmResult.riskPercent;
test('Risk Manager 2:1', Math.abs(rmRatio - EXPECTED_RATIO) < TOLERANCE, `Ratio: ${rmRatio.toFixed(2)}:1`);

// 9. TESTE VALIDAÇÃO RISK/REWARD
console.log('\n=== 9. TESTE VALIDAÇÃO ===');
const isValid = validateRiskReward(TEST_RISK_PERCENT, TEST_REWARD_PERCENT);
test('Risk/Reward Validation', isValid, 'Should validate 2% reward / 1% risk');

// 10. TESTE CONFIANÇA EXTREMA
console.log('\n=== 10. TESTE CONFIANÇA EXTREMA ===');
const highConf = calculateRiskReward(HIGH_CONFIDENCE_EXTREME);
const lowConf = calculateRiskReward(LOW_CONFIDENCE_EXTREME);
test('High Confidence Low Risk', highConf.riskPercent <= HIGH_CONF_MAX_RISK, `Risk: ${(highConf.riskPercent * 100).toFixed(1)}%`);
test('Low Confidence High Risk', lowConf.riskPercent >= LOW_CONF_MIN_RISK, `Risk: ${(lowConf.riskPercent * 100).toFixed(1)}%`);

// RESULTADO FINAL
console.log('\n' + '='.repeat(SEPARATOR_LENGTH));
console.log(`🎯 RESULTADO: ${passedTests}/${totalTests} testes passaram`);

if (passedTests === totalTests) {
  console.log('✅ TODOS OS CÁLCULOS ESTÃO CORRETOS!');
  process.exit(0);
} else {
  console.log('❌ ALGUNS TESTES FALHARAM!');
  process.exit(1);
}