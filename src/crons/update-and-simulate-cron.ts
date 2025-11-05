import * as cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let cycleCount = 0;

async function runUpdateAndSimulate() {
  cycleCount++;
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n🕐 [${timestamp}] CICLO #${cycleCount} - Update + Simuladores`);
  console.log('='.repeat(60));

  try {
    // 1. Atualizar todos os trades
    console.log('📊 1/2 - Atualizando status dos trades...');
    await execAsync('npm run update-all-trades');
    console.log('✅ Trades atualizados com sucesso');

    // Aguardar 10 segundos entre operações
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 2. Executar todos os simuladores
    console.log('\n🤖 2/2 - Executando todos os simuladores...');
    await execAsync('npm run run-all-simulators');
    console.log('✅ Simuladores executados com sucesso');

    console.log(`\n🎉 [${timestamp}] CICLO #${cycleCount} CONCLUÍDO COM SUCESSO`);

  } catch (error) {
    console.error(`\n❌ [${timestamp}] ERRO NO CICLO #${cycleCount}:`, error);
  }

  console.log('='.repeat(60));
}

// Executar a cada 10 minutos
cron.schedule('*/10 * * * *', runUpdateAndSimulate);

console.log('🚀 UPDATE & SIMULATE CRON INICIADO');
console.log('⏰ Executando a cada 10 minutos');
console.log('📋 Sequência: update-all-trades → run-all-simulators');
console.log('🛑 Pressione Ctrl+C para parar\n');

// Executar uma vez no início
runUpdateAndSimulate();