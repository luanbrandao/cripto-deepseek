import * as cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let cycleCount = 0;

// Algorithm constants
const LOG_SEPARATOR_LENGTH = 60; // Algorithm constant
const DELAY_BETWEEN_OPERATIONS = 10000; // Algorithm constant - 10 seconds

async function runUpdateAndSimulate() {
  cycleCount++;
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n🕐 [${timestamp}] CICLO #${cycleCount} - Update + Simuladores`);
  console.log('='.repeat(LOG_SEPARATOR_LENGTH));

  try {
    // 1. Atualizar todos os trades
    console.log('📊 1/3 - Atualizando status dos trades...');
    await execAsync('npm run update-all-trades');
    console.log('✅ Trades atualizados com sucesso');

    // Aguardar entre operações
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_OPERATIONS));

    // 2. Executar todos os simuladores
    console.log('\n🤖 2/3 - Executando todos os simuladores...');
    await execAsync('npm run run-all-simulators');
    console.log('✅ Simuladores executados com sucesso');

    // Aguardar entre operações
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_OPERATIONS));

    // 3. Executar smart entry monitor
    console.log('\n📈 3/3 - Executando Smart Entry Monitor...');
    await execAsync('npm run smart-entry-monitor');
    console.log('✅ Smart Entry Monitor executado com sucesso');

    console.log(`\n🎉 [${timestamp}] CICLO #${cycleCount} CONCLUÍDO COM SUCESSO`);

  } catch (error) {
    console.error(`\n❌ [${timestamp}] ERRO NO CICLO #${cycleCount}:`, error);
  }

  console.log('='.repeat(LOG_SEPARATOR_LENGTH));
}

// Executar a cada 10 minutos
cron.schedule('*/10 * * * *', runUpdateAndSimulate);

console.log('🚀 UPDATE & SIMULATE CRON INICIADO');
console.log('⏰ Executando a cada 10 minutos');
console.log('📋 Sequência: update-all-trades → run-all-simulators → smart-entry-monitor');
console.log('🛑 Pressione Ctrl+C para parar\n');

// Executar uma vez no início
runUpdateAndSimulate();