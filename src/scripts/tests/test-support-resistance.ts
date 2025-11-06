/**
 * Teste específico para suporte e resistência
 */

import { findSupportResistanceLevels, findLocalExtrema, findPivotPoints } from '../../bots/utils/analysis/support-resistance-calculator';

console.log('🧪 TESTE SUPPORT/RESISTANCE CALCULATOR\n');

// Teste 1: Extremos locais básicos
console.log('=== TESTE 1: EXTREMOS LOCAIS ===');
const prices1 = [100, 102, 101, 105, 103, 107, 104, 106, 102, 108];
const maxima = findLocalExtrema(prices1, 'max');
const minima = findLocalExtrema(prices1, 'min');
console.log(`Preços: [${prices1.join(', ')}]`);
console.log(`Máximas: [${maxima.join(', ')}]`);
console.log(`Mínimas: [${minima.join(', ')}]`);
console.log(`Encontrou extremos: ${maxima.length > 0 || minima.length > 0 ? '✅' : '❌'}\n`);

// Teste 2: Suporte e resistência com klines
console.log('=== TESTE 2: SUPORTE/RESISTÊNCIA KLINES ===');
const mockKlines = [
  [0, '100', '105', '95', '100', 0],  // [open, high, low, close, volume, time]
  [0, '102', '107', '97', '102', 0],
  [0, '101', '106', '96', '101', 0],
  [0, '103', '108', '98', '103', 0],
  [0, '102', '107', '97', '102', 0]
];
const currentPrice = 102;
const levels = findSupportResistanceLevels(mockKlines, currentPrice);

console.log(`Preço atual: ${currentPrice}`);
console.log(`Resistência: ${levels.resistance.toFixed(2)}`);
console.log(`Suporte: ${levels.support.toFixed(2)}`);
console.log(`Resistência > Preço: ${levels.resistance > currentPrice ? '✅' : '❌'}`);
console.log(`Suporte < Preço: ${levels.support < currentPrice ? '✅' : '❌'}\n`);

// Teste 3: Fallback quando não encontra níveis
console.log('=== TESTE 3: FALLBACK NÍVEIS ===');
const flatKlines = [
  [0, '100', '100', '100', '100', 0],
  [0, '100', '100', '100', '100', 0],
  [0, '100', '100', '100', '100', 0]
];
const flatPrice = 100;
const flatLevels = findSupportResistanceLevels(flatKlines, flatPrice);

console.log(`Preços planos: ${flatPrice}`);
console.log(`Resistência fallback: ${flatLevels.resistance.toFixed(2)}`);
console.log(`Suporte fallback: ${flatLevels.support.toFixed(2)}`);
console.log(`Resistência = Preço * 1.05: ${Math.abs(flatLevels.resistance - flatPrice * 1.05) < 0.01 ? '✅' : '❌'}`);
console.log(`Suporte = Preço * 0.95: ${Math.abs(flatLevels.support - flatPrice * 0.95) < 0.01 ? '✅' : '❌'}\n`);

// Teste 4: Pontos de pivô
console.log('=== TESTE 4: PONTOS DE PIVÔ ===');
const mockCandles = [
  { high: 100, low: 95, timestamp: 1000 },
  { high: 102, low: 97, timestamp: 2000 },
  { high: 110, low: 105, timestamp: 3000 },  // Máxima local
  { high: 108, low: 103, timestamp: 4000 },
  { high: 104, low: 99, timestamp: 5000 },
  { high: 106, low: 90, timestamp: 6000 },   // Mínima local (90)
  { high: 109, low: 95, timestamp: 7000 },
  { high: 115, low: 110, timestamp: 8000 },  // Máxima local
  { high: 112, low: 107, timestamp: 9000 }
];

const pivots = findPivotPoints(mockCandles, 2);
console.log(`Candles: ${mockCandles.length}`);
console.log(`Pivôs encontrados: ${pivots.length}`);
console.log(`Tipos: ${pivots.map(p => p.type).join(', ')}`);
console.log(`Preços: ${pivots.map(p => p.price).join(', ')}`);
console.log(`Encontrou pivôs: ${pivots.length > 0 ? '✅' : '❌'}\n`);

// Teste 5: Ordenação de extremos
console.log('=== TESTE 5: ORDENAÇÃO EXTREMOS ===');
const unsortedPrices = [100, 105, 102, 108, 101, 110, 103, 106, 99];
const sortedMax = findLocalExtrema(unsortedPrices, 'max');
const sortedMin = findLocalExtrema(unsortedPrices, 'min');

console.log(`Preços: [${unsortedPrices.join(', ')}]`);
console.log(`Máximas ordenadas: [${sortedMax.join(', ')}]`);
console.log(`Mínimas ordenadas: [${sortedMin.join(', ')}]`);

// Verificar se máximas estão em ordem decrescente
const maxDescending = sortedMax.length === 0 || sortedMax.every((val, i) => i === 0 || val <= sortedMax[i - 1]);
console.log(`Máximas decrescentes: ${maxDescending ? '✅' : '❌'}`);

// Verificar se mínimas estão em ordem crescente
const minAscending = sortedMin.length === 0 || sortedMin.every((val, i) => i === 0 || val >= sortedMin[i - 1]);
console.log(`Mínimas crescentes: ${minAscending ? '✅' : '❌'}`);
console.log(`Função funciona: ${(sortedMax.length > 0 || sortedMin.length > 0) ? '✅' : '❌'}\n`);

console.log('🎯 TESTE SUPPORT/RESISTANCE CONCLUÍDO');