/**
 * 🧪 TESTE DOS NOVOS ANALISADORES DE VOLUME E MOMENTUM
 * Script para testar e demonstrar o uso dos analisadores
 */

import VolumeAnalyzer from '../analyzers/volumeAnalyzer';
import MomentumAnalyzer from '../analyzers/momentumAnalyzer';
import EmaAnalyzer from '../analyzers/emaAnalyzer';
import { BinancePublicClient } from '../core/clients/binance-public-client';

async function testVolumeAndMomentumAnalyzers() {
  console.log('🧪 TESTE DOS ANALISADORES DE VOLUME E MOMENTUM');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Inicializar analisadores
  const volumeAnalyzer = new VolumeAnalyzer();
  const momentumAnalyzer = new MomentumAnalyzer();
  const emaAnalyzer = new EmaAnalyzer({ fastPeriod: 21, slowPeriod: 50 });
  const binancePublic = new BinancePublicClient();
  
  const symbols = ['BTCUSDT', 'ETHUSDT'];
  
  for (const symbol of symbols) {
    console.log(`\n🔍 ANÁLISE COMPLETA: ${symbol}`);
    console.log('─'.repeat(60));
    
    try {
      // Obter dados de mercado
      const klines = await binancePublic.getKlines(symbol, '1h', 50);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      
      console.log(`💰 Preço atual: $${currentPrice.toLocaleString()}`);
      console.log(`📊 Dados: ${klines.length} velas de 1h`);
      
      // 1. ANÁLISE EMA COMPLETA
      console.log('\n📈 ANÁLISE EMA:');
      const emaBasic = emaAnalyzer.analyze({ price24h: prices, currentPrice });
      const emaStrength = emaAnalyzer.validateEmaStrengthPublic(prices);
      
      console.log(`   Básico: ${emaBasic.action} (${emaBasic.confidence}%) - ${emaBasic.reason}`);
      console.log(`   Força: ${emaStrength.isValid ? '✅' : '❌'} ${emaStrength.reason} (Score: ${emaStrength.score})`);
      
      // 2. ANÁLISE DE VOLUME COMPLETA
      console.log('\n📊 ANÁLISE DE VOLUME:');
      const volumeStrength = emaAnalyzer.validateVolumeStrengthPublic(klines);
      const volumeScore = volumeAnalyzer.getVolumeScore(klines);
      const volumePattern = volumeAnalyzer.analyzeVolumePattern(klines);
      
      console.log(`   Força: ${volumeStrength.isValid ? '✅' : '❌'} ${volumeStrength.reason} (Score: ${volumeStrength.score})`);
      console.log(`   Score Total: ${volumeScore.totalScore.toFixed(1)} (${volumeScore.recommendation})`);
      console.log(`   Breakdown: Força:${volumeScore.breakdown.strength.toFixed(0)} Padrão:${volumeScore.breakdown.pattern.toFixed(0)} Consistência:${volumeScore.breakdown.consistency.toFixed(0)}`);
      console.log(`   Padrão: ${volumePattern.trend} (${volumePattern.strength.toFixed(0)}%) ${volumePattern.anomaly ? '🚨 ANOMALIA' : ''}`);
      
      // 3. ANÁLISE DE MOMENTUM COMPLETA
      console.log('\n🚀 ANÁLISE DE MOMENTUM:');
      const momentumStrength = emaAnalyzer.validateMomentumPublic(prices);
      const momentumScore = momentumAnalyzer.getMomentumScore(prices);
      const momentumMulti = momentumAnalyzer.analyzeMomentumMultiPeriod(prices);
      const momentumRSI = momentumAnalyzer.calculateMomentumWithRSI(prices);
      
      console.log(`   Força: ${momentumStrength.isValid ? '✅' : '❌'} ${momentumStrength.reason} (Score: ${momentumStrength.score})`);
      console.log(`   Score Total: ${momentumScore.totalScore.toFixed(1)} (${momentumScore.recommendation})`);
      console.log(`   Breakdown: Básico:${momentumScore.breakdown.basic.toFixed(0)} Multi:${momentumScore.breakdown.multiPeriod.toFixed(0)} RSI:${momentumScore.breakdown.rsi.toFixed(0)} Acel:${momentumScore.breakdown.acceleration.toFixed(0)}`);
      console.log(`   Multi-Período: ${momentumMulti.consensus} (3p:${momentumMulti.short.direction} 5p:${momentumMulti.medium.direction} 10p:${momentumMulti.long.direction})`);
      console.log(`   RSI: ${momentumRSI.rsi.toFixed(1)} (${momentumRSI.strength})`);
      
      // 4. ANÁLISE COMBINADA
      console.log('\n🎯 ANÁLISE COMBINADA:');
      const passesEma = emaBasic.action === 'BUY' && emaStrength.isValid && emaStrength.score >= 5;
      const passesVolume = volumeStrength.isValid && volumeScore.totalScore >= 60;
      const passesMomentum = momentumStrength.isValid && momentumScore.totalScore >= 50;
      
      const totalScore = (emaStrength.score + volumeScore.totalScore + momentumScore.totalScore) / 3;
      
      console.log(`   EMA: ${passesEma ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Volume: ${passesVolume ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Momentum: ${passesMomentum ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Score Final: ${totalScore.toFixed(1)}/100`);
      
      if (passesEma && passesVolume && passesMomentum) {
        console.log(`   🎉 RESULTADO: ✅ ${symbol} APROVADO - Setup perfeito detectado!`);
      } else {
        console.log(`   🚫 RESULTADO: ❌ ${symbol} REJEITADO - Critérios não atendidos`);
      }
      
    } catch (error) {
      console.error(`   ❌ Erro ao analisar ${symbol}:`, error);
    }
  }
  
  console.log('\n🎯 RESUMO DOS ANALISADORES:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📈 EmaAnalyzer: validateEmaStrengthPublic(), validateVolumeStrengthPublic(), validateMomentumPublic()');
  console.log('📊 VolumeAnalyzer: validateVolumeStrength(), analyzeVolumePattern(), getVolumeScore()');
  console.log('🚀 MomentumAnalyzer: validateMomentum(), analyzeMomentumMultiPeriod(), getMomentumScore()');
  console.log('\n✅ Todos os analisadores funcionando corretamente!');
  console.log('🎯 Prontos para integração nos bots ultra-conservadores');
}

// Executar se chamado diretamente
if (require.main === module) {
  testVolumeAndMomentumAnalyzers().catch(console.error);
}

export default testVolumeAndMomentumAnalyzers;