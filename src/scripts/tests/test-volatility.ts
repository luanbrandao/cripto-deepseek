/**
 * Teste específico para cálculo de volatilidade
 */

import { calculateVolatility } from '../../bots/utils/risk/volatility-calculator';

console.log('🧪 TESTE VOLATILITY CALCULATOR\n');

// Teste 1: Volatilidade básica
console.log('=== TESTE 1: VOLATILIDADE BÁSICA ===');
const klines1 = [
  [0, 0, 0, 0, '100', 0],
  [0, 0, 0, 0, '102', 0],
  [0, 0, 0, 0, '101', 0],
  [0, 0, 0, 0, '103', 0]
];
const vol1 = calculateVolatility(klines1);
console.log(`Preços: [100, 102, 101, 103]`);
console.log(`Volatilidade: ${vol1.toFixed(4)}%`);
console.log(`Dentro do limite (≤5%): ${vol1 <= 5 ? '✅' : '❌'}\n`);

// Teste 2: Dados insuficientes
console.log('=== TESTE 2: DADOS INSUFICIENTES ===');
const klines2 = [[0, 0, 0, 0, '100', 0]];
const vol2 = calculateVolatility(klines2);
console.log(`Klines: 1 (insuficiente)`);
console.log(`Volatilidade: ${vol2}%`);
console.log(`Retorna padrão (1.0): ${vol2 === 1.0 ? '✅' : '❌'}\n`);

// Teste 3: Preços estáveis (baixa volatilidade)
console.log('=== TESTE 3: PREÇOS ESTÁVEIS ===');
const klines3 = [
  [0, 0, 0, 0, '100', 0],
  [0, 0, 0, 0, '100.1', 0],
  [0, 0, 0, 0, '99.9', 0],
  [0, 0, 0, 0, '100.05', 0]
];
const vol3 = calculateVolatility(klines3);
console.log(`Preços estáveis: [100, 100.1, 99.9, 100.05]`);
console.log(`Volatilidade: ${vol3.toFixed(4)}%`);
console.log(`Baixa volatilidade (<1%): ${vol3 < 1 ? '✅' : '❌'}\n`);

// Teste 4: Preços voláteis (alta volatilidade)
console.log('=== TESTE 4: PREÇOS VOLÁTEIS ===');
const klines4 = [
  [0, 0, 0, 0, '100', 0],
  [0, 0, 0, 0, '110', 0],
  [0, 0, 0, 0, '90', 0],
  [0, 0, 0, 0, '105', 0]
];
const vol4 = calculateVolatility(klines4);
console.log(`Preços voláteis: [100, 110, 90, 105]`);
console.log(`Volatilidade: ${vol4.toFixed(4)}%`);
console.log(`Volatilidade limitada a 5%: ${vol4 === 5.0 ? '✅' : '❌'}\n`);

// Teste 5: Limite máximo (5%)
console.log('=== TESTE 5: LIMITE MÁXIMO ===');
const klines5 = [
  [0, 0, 0, 0, '100', 0],
  [0, 0, 0, 0, '150', 0],  // +50%
  [0, 0, 0, 0, '50', 0],   // -66%
  [0, 0, 0, 0, '200', 0]   // +300%
];
const vol5 = calculateVolatility(klines5);
console.log(`Preços extremos: [100, 150, 50, 200]`);
console.log(`Volatilidade calculada: ${vol5.toFixed(4)}%`);
console.log(`Limitada a 5%: ${vol5 === 5.0 ? '✅' : '❌'}\n`);

// Teste 6: Cálculo manual de retornos
console.log('=== TESTE 6: VALIDAÇÃO MANUAL ===');
const prices = [100, 102, 101];
const returns = [];
for (let i = 1; i < prices.length; i++) {
  const returnPct = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
  returns.push(Math.abs(returnPct));
}
const manualVol = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

const klines6 = prices.map(p => [0, 0, 0, 0, p.toString(), 0]);
const calcVol = calculateVolatility(klines6);

console.log(`Preços: [${prices.join(', ')}]`);
console.log(`Retornos: [${returns.map(r => r.toFixed(2)).join(', ')}]%`);
console.log(`Volatilidade manual: ${manualVol.toFixed(4)}%`);
console.log(`Volatilidade calculada: ${calcVol.toFixed(4)}%`);
console.log(`Valores iguais: ${Math.abs(manualVol - calcVol) < 0.0001 ? '✅' : '❌'}\n`);

console.log('🎯 TESTE VOLATILITY CALCULATOR CONCLUÍDO');