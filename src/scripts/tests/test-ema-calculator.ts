/**
 * Teste específico para calculadora EMA
 */

import { calculateEMA } from '../../bots/utils/analysis/ema-calculator';

console.log('🧪 TESTE EMA CALCULATOR\n');

// Teste 1: EMA básico
console.log('=== TESTE 1: EMA BÁSICO ===');
const prices1 = [100, 102, 101, 103, 105];
const ema3 = calculateEMA(prices1, 3);
console.log(`Preços: [${prices1.join(', ')}]`);
console.log(`EMA(3): ${ema3.toFixed(4)}`);
console.log(`Esperado: ~103.5000`);
console.log(`Resultado: ${Math.abs(ema3 - 103.5) < 0.01 ? '✅' : '❌'}\n`);

// Teste 2: EMA com dados insuficientes
console.log('=== TESTE 2: DADOS INSUFICIENTES ===');
const prices2 = [100, 102];
const ema5 = calculateEMA(prices2, 5);
console.log(`Preços: [${prices2.join(', ')}] (2 valores)`);
console.log(`EMA(5): ${ema5}`);
console.log(`Esperado: ${prices2[prices2.length - 1]} (último preço)`);
console.log(`Resultado: ${ema5 === prices2[prices2.length - 1] ? '✅' : '❌'}\n`);

// Teste 3: EMA período 1 (deve ser igual ao último preço)
console.log('=== TESTE 3: EMA PERÍODO 1 ===');
const prices3 = [100, 102, 101, 103, 105];
const ema1 = calculateEMA(prices3, 1);
console.log(`Preços: [${prices3.join(', ')}]`);
console.log(`EMA(1): ${ema1}`);
console.log(`Esperado: ${prices3[prices3.length - 1]} (último preço)`);
console.log(`Resultado: ${ema1 === prices3[prices3.length - 1] ? '✅' : '❌'}\n`);

// Teste 4: EMA com sequência crescente
console.log('=== TESTE 4: SEQUÊNCIA CRESCENTE ===');
const prices4 = [100, 101, 102, 103, 104, 105];
const ema4_3 = calculateEMA(prices4, 3);
console.log(`Preços: [${prices4.join(', ')}]`);
console.log(`EMA(3): ${ema4_3.toFixed(4)}`);
console.log(`Deve ser > SMA inicial (101): ${ema4_3 > 101 ? '✅' : '❌'}\n`);

// Teste 5: Comparação EMA vs SMA
console.log('=== TESTE 5: EMA vs SMA ===');
const prices5 = [100, 100, 100, 100, 110]; // Spike no final
const ema5_3 = calculateEMA(prices5, 3);
const sma5_3 = prices5.slice(-3).reduce((a, b) => a + b) / 3;
console.log(`Preços: [${prices5.join(', ')}]`);
console.log(`EMA(3): ${ema5_3.toFixed(4)}`);
console.log(`SMA(3): ${sma5_3.toFixed(4)}`);
console.log(`EMA deve reagir mais rápido: ${ema5_3 > sma5_3 ? '✅' : '❌'}\n`);

console.log('🎯 TESTE EMA CALCULATOR CONCLUÍDO');