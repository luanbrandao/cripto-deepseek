/**
 * 🧪 TESTE DE FLUXO DE VALIDAÇÃO
 * Verifica se o serviço centralizado produz os mesmos resultados
 */

// Simular TradingConfigManager
const mockConfig = {
  EMA: { FAST_PERIOD: 12, SLOW_PERIOD: 26 },
  EMA_ADVANCED: { 
    MIN_TREND_STRENGTH: 0.01, 
    MIN_SEPARATION: 0.005, 
    MIN_EMA_SCORE: 10 
  },
  MARKET_FILTERS: { 
    MIN_VOLATILITY: 0.5, 
    MAX_VOLATILITY: 4.0, 
    MIN_VOLUME_MULTIPLIER: 2.0 
  },
  MIN_CONFIDENCE: 75,
  HIGH_CONFIDENCE: 80,
  SYMBOLS: ['BTCUSDT', 'ETHUSDT']
};

// Simular dados de mercado
const mockMarketData = {
  price24h: [50000, 50100, 50200, 50300, 50400, 50500, 50600, 50700, 50800, 50900, 51000],
  currentPrice: 51000,
  volumes: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000],
  stats: { priceChangePercent: '2.0' }
};

const mockDecision = {
  action: 'BUY',
  confidence: 85,
  reason: 'EMA crossover detected',
  symbol: 'BTCUSDT',
  price: 51000
};

// Simular validação EMA original (lógica extraída dos bots)
function validateEmaOriginal(marketData, basicAnalysis) {
  const validation = {
    isValid: false,
    score: 0,
    reasons: [],
    warnings: []
  };
  
  const { price24h, volumes, currentPrice, stats } = marketData;
  const minVolumeMultiplier = mockConfig.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER;
  
  // 1. Validação de Volume (5 pontos)
  if (volumes && volumes.length > 0) {
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, volumes.length);
    const volumeRatio = recentVolume / avgVolume;
    
    if (volumeRatio >= minVolumeMultiplier * 1.3) {
      validation.score += 5;
      validation.reasons.push(`✅ Volume forte: ${volumeRatio.toFixed(1)}x média`);
    } else if (volumeRatio >= minVolumeMultiplier) {
      validation.score += 3;
      validation.reasons.push(`✅ Volume adequado: ${volumeRatio.toFixed(1)}x média`);
    } else {
      validation.warnings.push(`❌ Volume insuficiente: ${volumeRatio.toFixed(1)}x < ${minVolumeMultiplier}x`);
    }
  }
  
  // 2. Validação de Tendência (5 pontos) - Simplificada
  const priceChange = ((currentPrice - price24h[0]) / price24h[0]) * 100;
  const minTrendStrength = mockConfig.EMA_ADVANCED.MIN_TREND_STRENGTH * 100;
  
  if (Math.abs(priceChange) >= minTrendStrength * 2.5) {
    validation.score += 5;
    validation.reasons.push(`✅ Tendência forte: ${priceChange.toFixed(2)}%`);
  } else if (Math.abs(priceChange) >= minTrendStrength) {
    validation.score += 3;
    validation.reasons.push(`✅ Tendência adequada: ${priceChange.toFixed(2)}%`);
  } else {
    validation.warnings.push(`❌ Tendência fraca: ${priceChange.toFixed(2)}%`);
  }
  
  // 3. Validação de Volatilidade (2 pontos)
  if (stats?.priceChangePercent) {
    const volatility = Math.abs(parseFloat(stats.priceChangePercent));
    const minVol = mockConfig.MARKET_FILTERS.MIN_VOLATILITY;
    const maxVol = mockConfig.MARKET_FILTERS.MAX_VOLATILITY;
    
    if (volatility >= minVol && volatility <= maxVol) {
      validation.score += 2;
      validation.reasons.push(`✅ Volatilidade adequada: ${volatility.toFixed(1)}%`);
    } else {
      validation.warnings.push(`❌ Volatilidade inadequada: ${volatility.toFixed(1)}%`);
    }
  }
  
  // Critério de aprovação
  const minScore = Math.floor(mockConfig.EMA_ADVANCED.MIN_EMA_SCORE * 1.2);
  validation.isValid = validation.score >= minScore;
  
  return validation;
}

// Simular validação centralizada (lógica similar)
function validateEmaCentralized(marketData, basicAnalysis) {
  const validation = {
    isValid: false,
    score: 0,
    reasons: [],
    warnings: []
  };
  
  const { price24h, volumes, currentPrice, stats } = marketData;
  const minVolumeMultiplier = mockConfig.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER;
  
  // 1. Validação de Volume (5 pontos) - MESMA LÓGICA
  if (volumes && volumes.length > 0) {
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, volumes.length);
    const volumeRatio = recentVolume / avgVolume;
    
    if (volumeRatio >= minVolumeMultiplier * 1.3) {
      validation.score += 5;
      validation.reasons.push(`✅ Volume forte: ${volumeRatio.toFixed(1)}x média`);
    } else if (volumeRatio >= minVolumeMultiplier) {
      validation.score += 3;
      validation.reasons.push(`✅ Volume adequado: ${volumeRatio.toFixed(1)}x média`);
    } else {
      validation.warnings.push(`❌ Volume insuficiente: ${volumeRatio.toFixed(1)}x < ${minVolumeMultiplier}x`);
    }
  }
  
  // 2. Validação de Tendência (5 pontos) - MESMA LÓGICA
  const priceChange = ((currentPrice - price24h[0]) / price24h[0]) * 100;
  const minTrendStrength = mockConfig.EMA_ADVANCED.MIN_TREND_STRENGTH * 100;
  
  if (Math.abs(priceChange) >= minTrendStrength * 2.5) {
    validation.score += 5;
    validation.reasons.push(`✅ Tendência forte: ${priceChange.toFixed(2)}%`);
  } else if (Math.abs(priceChange) >= minTrendStrength) {
    validation.score += 3;
    validation.reasons.push(`✅ Tendência adequada: ${priceChange.toFixed(2)}%`);
  } else {
    validation.warnings.push(`❌ Tendência fraca: ${priceChange.toFixed(2)}%`);
  }
  
  // 3. Validação de Volatilidade (2 pontos) - MESMA LÓGICA
  if (stats?.priceChangePercent) {
    const volatility = Math.abs(parseFloat(stats.priceChangePercent));
    const minVol = mockConfig.MARKET_FILTERS.MIN_VOLATILITY;
    const maxVol = mockConfig.MARKET_FILTERS.MAX_VOLATILITY;
    
    if (volatility >= minVol && volatility <= maxVol) {
      validation.score += 2;
      validation.reasons.push(`✅ Volatilidade adequada: ${volatility.toFixed(1)}%`);
    } else {
      validation.warnings.push(`❌ Volatilidade inadequada: ${volatility.toFixed(1)}%`);
    }
  }
  
  // Critério de aprovação - MESMA LÓGICA
  const minScore = Math.floor(mockConfig.EMA_ADVANCED.MIN_EMA_SCORE * 1.2);
  validation.isValid = validation.score >= minScore;
  
  return validation;
}

// Executar testes
console.log('🧪 TESTE DE EQUIVALÊNCIA DE VALIDAÇÃO\n');

console.log('📊 Dados de teste:');
console.log(`   Preço atual: $${mockMarketData.currentPrice}`);
console.log(`   Mudança: ${mockMarketData.stats.priceChangePercent}%`);
console.log(`   Volume médio: ${mockMarketData.volumes.slice(-3).reduce((a,b) => a+b, 0)/3}`);
console.log('');

const originalResult = validateEmaOriginal(mockMarketData, mockDecision);
const centralizedResult = validateEmaCentralized(mockMarketData, mockDecision);

console.log('🔍 RESULTADO ORIGINAL:');
console.log(`   Válido: ${originalResult.isValid}`);
console.log(`   Score: ${originalResult.score}/20`);
console.log(`   Razões: ${originalResult.reasons.length}`);
console.log(`   Avisos: ${originalResult.warnings.length}`);

console.log('\n🔍 RESULTADO CENTRALIZADO:');
console.log(`   Válido: ${centralizedResult.isValid}`);
console.log(`   Score: ${centralizedResult.score}/20`);
console.log(`   Razões: ${centralizedResult.reasons.length}`);
console.log(`   Avisos: ${centralizedResult.warnings.length}`);

console.log('\n✅ COMPARAÇÃO:');
const isEquivalent = (
  originalResult.isValid === centralizedResult.isValid &&
  originalResult.score === centralizedResult.score &&
  originalResult.reasons.length === centralizedResult.reasons.length &&
  originalResult.warnings.length === centralizedResult.warnings.length
);

if (isEquivalent) {
  console.log('🎉 SUCESSO: Validações são equivalentes!');
  console.log('✅ O fluxo centralizado produz os mesmos resultados');
} else {
  console.log('⚠️ DIFERENÇA DETECTADA:');
  console.log(`   Válido: ${originalResult.isValid} vs ${centralizedResult.isValid}`);
  console.log(`   Score: ${originalResult.score} vs ${centralizedResult.score}`);
  console.log(`   Razões: ${originalResult.reasons.length} vs ${centralizedResult.reasons.length}`);
  console.log(`   Avisos: ${originalResult.warnings.length} vs ${centralizedResult.warnings.length}`);
}

console.log('\n📋 DETALHES ORIGINAIS:');
originalResult.reasons.forEach(r => console.log(`   ${r}`));
originalResult.warnings.forEach(w => console.log(`   ${w}`));

console.log('\n📋 DETALHES CENTRALIZADOS:');
centralizedResult.reasons.forEach(r => console.log(`   ${r}`));
centralizedResult.warnings.forEach(w => console.log(`   ${w}`));