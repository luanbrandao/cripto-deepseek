
import { validateBinanceKeys } from '../../bots/utils/validation/env-validator';
import * as fs from 'fs';
import * as path from 'path';
import { CalculateTargetTestBot } from '../../bots/execution/test/calculate-target-test-bot';

// ============================================================================
// 🧮 CALCULATOR TESTING FRAMEWORK
// ============================================================================

/**
 * Available calculator methods for testing
 */
const CALCULATOR_METHODS = {
  BASIC: 'calculateTargetAndStopPrices',
  REAL_MARKET: 'calculateTargetAndStopPricesRealMarket',
  TECHNICAL_LEVELS: 'calculateTargetAndStopPricesWithLevels'
} as const;

/**
 * Test configuration for calculator comparison
 */
interface CalculatorTestConfig {
  name: string;
  description: string;
  methods: string[];
  expectedFiles: string[];
}

const CALCULATOR_TEST_CONFIG: CalculatorTestConfig = {
  name: 'Target & Stop Price Calculators (3 Methods)',
  description: 'Compara 3 métodos de cálculo: Básico, Real Market e Technical Levels',
  methods: [CALCULATOR_METHODS.BASIC, CALCULATOR_METHODS.REAL_MARKET, CALCULATOR_METHODS.TECHNICAL_LEVELS],
  expectedFiles: ['basicTest.json', 'realMarketTest.json', 'technicalLevelsTest.json']
};

// ============================================================================
// 🧪 MAIN TEST FUNCTION
// ============================================================================

async function testCalculateTargetMethods() {
  console.log('🧮 CALCULATOR TESTING FRAMEWORK');
  console.log('='.repeat(70));
  console.log(`📊 Teste: ${CALCULATOR_TEST_CONFIG.name}`);
  console.log(`🎯 Descrição: ${CALCULATOR_TEST_CONFIG.description}`);
  console.log(`🔧 Métodos: ${CALCULATOR_TEST_CONFIG.methods.join(' vs ')}`);
  console.log(`📁 Arquivos: ${CALCULATOR_TEST_CONFIG.expectedFiles.join(', ')}`);
  console.log('='.repeat(70));

  try {
    // 1. Environment Validation
    console.log('\n🔍 VALIDAÇÃO DO AMBIENTE:');
    const keys = validateBinanceKeys();
    if (!keys) {
      console.error('❌ Chaves da Binance não configuradas');
      return;
    }
    console.log('✅ Chaves da Binance validadas');

    // 2. Test Execution
    console.log('\n🚀 EXECUTANDO TESTE DE CALCULADORAS:');
    const { apiKey, apiSecret } = keys;
    const testBot = new CalculateTargetTestBot(apiKey, apiSecret);

    const startTime = Date.now();
    await testBot.executeTest();
    const endTime = Date.now();

    const executionTime = ((endTime - startTime) / 1000).toFixed(2);

    // 3. Results Validation
    await validateCalculatorResults(executionTime);

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    printTroubleshootingGuide();
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 CALCULATOR TEST FINALIZADO');
  console.log('='.repeat(70));
}

// ============================================================================
// 🔍 RESULTS VALIDATION
// ============================================================================

async function validateCalculatorResults(executionTime: string) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 VALIDAÇÃO DOS RESULTADOS');
  console.log('='.repeat(70));

  const tradesDir = path.resolve('./src/storage/trades');
  const results = [];

  // Validate each expected file
  for (const fileName of CALCULATOR_TEST_CONFIG.expectedFiles) {
    const filePath = path.join(tradesDir, fileName);
    const methodName = fileName.replace('Test.json', '');

    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const trades = JSON.parse(data);
        results.push({
          method: methodName,
          file: fileName,
          exists: true,
          trades: trades.length,
          lastTrade: trades[trades.length - 1]
        });
      } else {
        results.push({
          method: methodName,
          file: fileName,
          exists: false,
          trades: 0,
          lastTrade: null
        });
      }
    } catch (error) {
      console.log(`⚠️ Erro ao ler ${fileName}:`, error);
      results.push({
        method: methodName,
        file: fileName,
        exists: false,
        trades: 0,
        lastTrade: null,
        error: error
      });
    }
  }

  // Print results summary
  console.log(`⏱️ Tempo de execução: ${executionTime}s`);
  console.log('\n📊 RESULTADOS POR CALCULADORA:');

  results.forEach(result => {
    const status = result.exists ? '✅' : '❌';
    console.log(`${status} ${result.method.padEnd(20)} | ${result.file.padEnd(25)} | ${result.trades} trades`);
  });

  // Check if all tests passed
  const allPassed = results.every(r => r.exists && r.trades > 0);

  if (allPassed) {
    console.log('\n🎉 TODOS OS CALCULADORES TESTADOS COM SUCESSO!');
    console.log('✅ Todos os métodos foram executados e salvos');

    // Show comparison of last trades
    console.log('\n📊 COMPARAÇÃO DOS ÚLTIMOS TRADES:');
    results.forEach(result => {
      if (result.lastTrade) {
        const trade = result.lastTrade;
        console.log(`🔹 ${result.method}: ${trade.symbol} ${trade.action} - Target: $${trade.targetPrice?.toFixed(4)} | Stop: $${trade.stopPrice?.toFixed(4)}`);
      }
    });

    console.log('\n📁 Arquivos gerados:');
    results.forEach(result => {
      if (result.exists) {
        console.log(`   • ${path.resolve('./src/storage/trades', result.file)}`);
      }
    });

  } else {
    console.log('\n❌ ALGUNS TESTES FALHARAM!');
    const failed = results.filter(r => !r.exists || r.trades === 0);
    console.log('❌ Calculadoras que falharam:');
    failed.forEach(result => {
      console.log(`   • ${result.method} (${result.file})`);
    });
  }
}

// ============================================================================
// 🔧 TROUBLESHOOTING GUIDE
// ============================================================================

function printTroubleshootingGuide() {
  console.log('\n🔧 GUIA DE SOLUÇÃO DE PROBLEMAS:');
  console.log('  1. ✅ Verificar chaves da Binance (.env)');
  console.log('  2. ✅ Verificar chave do DeepSeek (.env)');
  console.log('  3. 🌐 Verificar conexão com internet');
  console.log('  4. 📁 Verificar se pasta storage/trades existe');
  console.log('  5. 💰 Verificar se há moedas com oportunidades de trade');
  console.log('  6. 🔄 Tentar executar novamente em alguns minutos');
}

// ============================================================================
// 🚀 EXECUTION
// ============================================================================

// Executar teste
if (require.main === module) {
  testCalculateTargetMethods();
}

export { testCalculateTargetMethods };