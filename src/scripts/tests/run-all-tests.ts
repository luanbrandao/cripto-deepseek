/**
 * Executa todos os testes do sistema
 */

import { spawn } from 'child_process';
import * as path from 'path';

console.log('🚀 EXECUTANDO TODOS OS TESTES DO SISTEMA\n');

const tests = [
  {
    name: 'Teste Completo de Cálculos',
    script: 'test-calculations.ts',
    description: 'Valida todos os cálculos principais'
  },
  {
    name: 'Teste EMA Calculator',
    script: 'test-ema-calculator.ts',
    description: 'Testa cálculos de EMA'
  },
  {
    name: 'Teste Support/Resistance',
    script: 'test-support-resistance.ts',
    description: 'Testa análise de suporte e resistência'
  },
  {
    name: 'Teste Volatility',
    script: 'test-volatility.ts',
    description: 'Testa cálculo de volatilidade'
  },
  {
    name: 'Teste Risk/Reward',
    script: 'test-risk-reward.ts',
    description: 'Testa validação de risk/reward'
  }
];

let completedTests = 0;
let passedTests = 0;
const results: Array<{name: string, passed: boolean, output?: string}> = [];

function runTest(test: typeof tests[0]): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 EXECUTANDO: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`${'='.repeat(60)}`);

    const scriptPath = path.join(__dirname, test.script);
    const child = spawn('ts-node', [scriptPath], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      const passed = code === 0;
      results.push({
        name: test.name,
        passed,
        output: output + errorOutput
      });

      completedTests++;
      if (passed) {
        passedTests++;
        console.log(`\n✅ ${test.name} - PASSOU`);
      } else {
        console.log(`\n❌ ${test.name} - FALHOU (código: ${code})`);
      }

      resolve(passed);
    });

    child.on('error', (error) => {
      console.error(`\n💥 Erro ao executar ${test.name}:`, error.message);
      results.push({
        name: test.name,
        passed: false,
        output: error.message
      });
      completedTests++;
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log(`📋 Total de testes: ${tests.length}\n`);

  // Executar testes sequencialmente
  for (const test of tests) {
    await runTest(test);
  }

  // Relatório final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${index + 1}. ${result.name}: ${status}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`🎯 RESULTADO GERAL: ${passedTests}/${completedTests} testes passaram`);
  
  const successRate = (passedTests / completedTests) * 100;
  console.log(`📈 Taxa de sucesso: ${successRate.toFixed(1)}%`);

  if (passedTests === completedTests) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.');
    process.exit(0);
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM! Verifique os erros acima.');
    
    // Mostrar testes que falharam
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}`);
      });
    }
    
    process.exit(1);
  }
}

// Executar todos os testes
runAllTests().catch(error => {
  console.error('💥 Erro fatal ao executar testes:', error);
  process.exit(1);
});