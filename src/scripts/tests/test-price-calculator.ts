import { calculateTargetAndStopPrices, calculateTargetAndStopPricesRealMarket, calculateTargetAndStopPricesWithLevels } from '../../bots/utils/risk/price-calculator';

// ============================================================================
// 🧮 PRICE CALCULATOR TESTING SUITE
// ============================================================================

/**
 * Test configuration for price calculator methods
 */
interface PriceCalculatorTestConfig {
  price: number;
  confidence: number;
  action: 'BUY' | 'SELL';
  volatility: number;
  mockKlines: any[];
}

const TEST_CONFIG: PriceCalculatorTestConfig = {
  price: 100000, // $100k
  confidence: 75, // 75% confidence
  action: 'BUY',
  volatility: 0.5, // 0.5% volatility
  mockKlines: generateMockKlines(100000, 50) // 50 candles around $100k
};

// ============================================================================
// 🧪 MAIN TEST FUNCTION
// ============================================================================

async function testPriceCalculator() {
  console.log('🧮 PRICE CALCULATOR TESTING SUITE');
  console.log('='.repeat(70));
  console.log(`💰 Preço de teste: $${TEST_CONFIG.price.toLocaleString()}`);
  console.log(`📊 Confiança: ${TEST_CONFIG.confidence}%`);
  console.log(`🎯 Ação: ${TEST_CONFIG.action}`);
  console.log(`📈 Volatilidade: ${TEST_CONFIG.volatility}%`);
  console.log('='.repeat(70));

  try {
    // Test Method 1: Basic Calculator
    console.log('\n📊 MÉTODO 1: Basic Calculator (2:1 Fixo)');
    console.log('-'.repeat(50));
    
    const basicResult = calculateTargetAndStopPrices(
      TEST_CONFIG.price,
      TEST_CONFIG.confidence,
      TEST_CONFIG.action
    );
    
    displayResults('Basic', basicResult, TEST_CONFIG.price);

    // Test Method 2: Real Market Calculator
    console.log('\n📊 MÉTODO 2: Real Market Calculator (Dinâmico + Volatilidade)');
    console.log('-'.repeat(50));
    
    const realMarketResult = calculateTargetAndStopPricesRealMarket(
      TEST_CONFIG.price,
      TEST_CONFIG.confidence,
      TEST_CONFIG.action,
      TEST_CONFIG.volatility
    );
    
    displayResults('Real Market', realMarketResult, TEST_CONFIG.price);

    // Test Method 3: Technical Levels Calculator
    console.log('\n📊 MÉTODO 3: Technical Levels Calculator (Suporte/Resistência)');
    console.log('-'.repeat(50));
    
    const levelsResult = calculateTargetAndStopPricesWithLevels(
      TEST_CONFIG.price,
      TEST_CONFIG.confidence,
      TEST_CONFIG.action,
      TEST_CONFIG.mockKlines
    );
    
    displayResults('Technical Levels', levelsResult, TEST_CONFIG.price);

    // Comparison
    console.log('\n🔍 COMPARAÇÃO DOS 3 MÉTODOS');
    console.log('='.repeat(70));
    
    compareResults({
      basic: basicResult,
      realMarket: realMarketResult,
      levels: levelsResult
    }, TEST_CONFIG.price);

    // Test with different scenarios
    console.log('\n🧪 TESTES COM CENÁRIOS DIFERENTES');
    console.log('='.repeat(70));
    
    await testDifferentScenarios();

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  }

  console.log('\n🏁 PRICE CALCULATOR TEST FINALIZADO');
  console.log('='.repeat(70));
}

// ============================================================================
// 📊 DISPLAY FUNCTIONS
// ============================================================================

function displayResults(methodName: string, result: any, price: number) {
  const gain = Math.abs(result.targetPrice - price);
  const loss = Math.abs(price - result.stopPrice);
  const ratio = gain / loss;
  
  console.log(`🎯 Target: $${result.targetPrice.toFixed(2)} (+${((gain / price) * 100).toFixed(2)}%)`);
  console.log(`🛑 Stop: $${result.stopPrice.toFixed(2)} (-${((loss / price) * 100).toFixed(2)}%)`);
  console.log(`⚖️ Risk/Reward: ${ratio.toFixed(2)}:1`);
  console.log(`📊 Risk %: ${result.riskPercent?.toFixed(2)}%`);
  
  if (result.levels) {
    console.log(`📈 Suporte: $${result.levels.support.toFixed(2)}`);
    console.log(`📉 Resistência: $${result.levels.resistance.toFixed(2)}`);
    console.log(`🌊 Volatilidade: ${result.volatility?.toFixed(2)}%`);
  }
}

function compareResults(results: any, price: number) {
  console.log('📊 TARGETS:');
  console.log(`  Básico:        $${results.basic.targetPrice.toFixed(2)}`);
  console.log(`  Real Market:   $${results.realMarket.targetPrice.toFixed(2)}`);
  console.log(`  Tech Levels:   $${results.levels.targetPrice.toFixed(2)}`);
  
  console.log('\n🛑 STOPS:');
  console.log(`  Básico:        $${results.basic.stopPrice.toFixed(2)}`);
  console.log(`  Real Market:   $${results.realMarket.stopPrice.toFixed(2)}`);
  console.log(`  Tech Levels:   $${results.levels.stopPrice.toFixed(2)}`);
  
  // Calculate differences
  const basicVsReal = Math.abs(results.basic.targetPrice - results.realMarket.targetPrice);
  const basicVsLevels = Math.abs(results.basic.targetPrice - results.levels.targetPrice);
  const realVsLevels = Math.abs(results.realMarket.targetPrice - results.levels.targetPrice);
  
  console.log('\n📈 DIFERENÇAS NOS TARGETS:');
  console.log(`  Básico vs Real Market:   $${basicVsReal.toFixed(2)}`);
  console.log(`  Básico vs Tech Levels:   $${basicVsLevels.toFixed(2)}`);
  console.log(`  Real Market vs Tech Levels: $${realVsLevels.toFixed(2)}`);
  
  // Identify most conservative
  const targets = [
    { name: 'Básico', value: results.basic.targetPrice },
    { name: 'Real Market', value: results.realMarket.targetPrice },
    { name: 'Tech Levels', value: results.levels.targetPrice }
  ];
  
  const sortedTargets = TEST_CONFIG.action === 'BUY' 
    ? targets.sort((a, b) => a.value - b.value) // Lower target = more conservative for BUY
    : targets.sort((a, b) => b.value - a.value); // Higher target = more conservative for SELL
    
  console.log(`\n🛡️ Mais conservador: ${sortedTargets[0].name}`);
  console.log(`🚀 Mais agressivo: ${sortedTargets[2].name}`);
}

// ============================================================================
// 🧪 SCENARIO TESTING
// ============================================================================

async function testDifferentScenarios() {
  const scenarios = [
    { name: 'Alta Confiança + Baixa Volatilidade', confidence: 90, volatility: 0.2 },
    { name: 'Baixa Confiança + Alta Volatilidade', confidence: 55, volatility: 1.5 },
    { name: 'Média Confiança + Média Volatilidade', confidence: 70, volatility: 0.8 },
    { name: 'SELL Action', confidence: 75, volatility: 0.5, action: 'SELL' as const }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📋 Cenário: ${scenario.name}`);
    console.log('-'.repeat(40));
    
    const action = scenario.action || TEST_CONFIG.action;
    
    const basic = calculateTargetAndStopPrices(TEST_CONFIG.price, scenario.confidence, action);
    const realMarket = calculateTargetAndStopPricesRealMarket(TEST_CONFIG.price, scenario.confidence, action, scenario.volatility);
    const levels = calculateTargetAndStopPricesWithLevels(TEST_CONFIG.price, scenario.confidence, action, TEST_CONFIG.mockKlines);
    
    const basicRatio = calculateRatio(basic, TEST_CONFIG.price);
    const realMarketRatio = calculateRatio(realMarket, TEST_CONFIG.price);
    const levelsRatio = calculateRatio(levels, TEST_CONFIG.price);
    
    console.log(`  Básico:      ${basicRatio.toFixed(2)}:1`);
    console.log(`  Real Market: ${realMarketRatio.toFixed(2)}:1`);
    console.log(`  Tech Levels: ${levelsRatio.toFixed(2)}:1`);
  }
}

// ============================================================================
// 🔧 UTILITY FUNCTIONS
// ============================================================================

function calculateRatio(result: any, price: number): number {
  const gain = Math.abs(result.targetPrice - price);
  const loss = Math.abs(price - result.stopPrice);
  return gain / loss;
}

function generateMockKlines(basePrice: number, count: number): any[] {
  const klines = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < count; i++) {
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const open = currentPrice;
    const close = currentPrice * (1 + variation);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    
    klines.push({
      openTime: Date.now() - (count - i) * 3600000, // 1 hour intervals
      open: open.toString(),
      high: high.toString(),
      low: low.toString(),
      close: close.toString(),
      volume: (Math.random() * 1000).toString()
    });
    
    currentPrice = close;
  }
  
  return klines;
}

// ============================================================================
// 🚀 EXECUTION
// ============================================================================

if (require.main === module) {
  testPriceCalculator();
}

export { testPriceCalculator };