import { calculateRiskRewardDynamic, validateRiskReward, calculateRiskReward } from '../../bots/utils/trade-validators';
import { UNIFIED_TRADING_CONFIG as TRADING_CONFIG } from '../../shared/config/unified-trading-config';

function testRiskRewardValidation() {
  console.log('🧪 TESTANDO VALIDAÇÃO RISK/REWARD 2:1\n');
  
  // Teste 1: Confiança alta (85%)
  console.log('1️⃣ Teste com confiança alta (85%):');
  const highConfidence = calculateRiskReward(85);
  const highRatio = highConfidence.rewardPercent / highConfidence.riskPercent;
  console.log(`   Risk: ${highConfidence.riskPercent.toFixed(2)}%`);
  console.log(`   Reward: ${highConfidence.rewardPercent.toFixed(2)}%`);
  console.log(`   Ratio: ${highRatio.toFixed(2)}:1`);
  console.log(`   Válido: ${validateRiskReward(highConfidence.riskPercent, highConfidence.rewardPercent) ? '✅' : '❌'}\n`);
  
  // Teste 2: Confiança média (75%)
  console.log('2️⃣ Teste com confiança média (75%):');
  const mediumConfidence = calculateRiskReward(75);
  const mediumRatio = mediumConfidence.rewardPercent / mediumConfidence.riskPercent;
  console.log(`   Risk: ${mediumConfidence.riskPercent.toFixed(2)}%`);
  console.log(`   Reward: ${mediumConfidence.rewardPercent.toFixed(2)}%`);
  console.log(`   Ratio: ${mediumRatio.toFixed(2)}:1`);
  console.log(`   Válido: ${validateRiskReward(mediumConfidence.riskPercent, mediumConfidence.rewardPercent) ? '✅' : '❌'}\n`);
  
  // Teste 3: Confiança baixa (70%)
  console.log('3️⃣ Teste com confiança baixa (70%):');
  const lowConfidence = calculateRiskReward(70);
  const lowRatio = lowConfidence.rewardPercent / lowConfidence.riskPercent;
  console.log(`   Risk: ${lowConfidence.riskPercent.toFixed(2)}%`);
  console.log(`   Reward: ${lowConfidence.rewardPercent.toFixed(2)}%`);
  console.log(`   Ratio: ${lowRatio.toFixed(2)}:1`);
  console.log(`   Válido: ${validateRiskReward(lowConfidence.riskPercent, lowConfidence.rewardPercent) ? '✅' : '❌'}\n`);
  
  // Teste 4: Configuração atual
  console.log('4️⃣ Configuração atual:');
  console.log(`   MIN_RISK_REWARD_RATIO: ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`   RISK BASE: ${TRADING_CONFIG.RISK.BASE_PERCENT}%`);
  console.log(`   RISK MAX: ${TRADING_CONFIG.RISK.MAX_PERCENT}%`);
  
  console.log('\n🎯 RESULTADO: Todos os testes devem mostrar ratio = 2.00:1');
  console.log('✅ Se todos mostrarem "Válido: ✅", a validação 2:1 está funcionando!');
}

testRiskRewardValidation();