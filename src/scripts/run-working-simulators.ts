import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const workingSimulators = [
  // PATTERN SIMULATORS (funcionam independentemente)
  { name: '123 Pattern Simulator', command: 'yarn simulate-123' },
  { name: 'EMA Pattern Simulator', command: 'yarn simulate-ema' },
  { name: 'Support/Resistance Simulator', command: 'yarn simulate-support' },
  
  // NEUTRAL SIMULATORS (testando)
  { name: 'Real Trading Bot Simulator', command: 'yarn real-trading-bot-simulator' },
  
  // ELITE SIMULATORS (alta performance)
  { name: 'Elite Trading Bot Simulator', command: 'npm run elite-trading-bot-simulator' }
];

async function runWorkingSimulators() {
  console.log('🚀 EXECUTANDO SIMULADORES FUNCIONAIS\n');

  for (let i = 0; i < workingSimulators.length; i++) {
    const simulator = workingSimulators[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 [${i + 1}/${workingSimulators.length}] ${simulator.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const { stdout, stderr } = await execAsync(simulator.command);
      console.log(stdout);
      if (stderr) console.error(stderr);

      // Detectar se executou trade
      const executedTrade = stdout.includes('EXECUTADA COM SUCESSO') || stdout.includes('Ordem executada') || stdout.includes('Trade simulado salvo');
      const noTrade = stdout.includes('NÃO EXECUTOU TRADE') || stdout.includes('Nenhuma oportunidade encontrada') || stdout.includes('Total de trades: 0') || stdout.includes('Nenhuma moeda válida encontrada');

      if (executedTrade) {
        console.log(`✅ ${simulator.name} concluído - 🟢 TRADE EXECUTADO`);
      } else if (noTrade) {
        console.log(`✅ ${simulator.name} concluído - ⏸️ NENHUM TRADE`);
      } else {
        console.log(`✅ ${simulator.name} concluído com sucesso!`);
      }
    } catch (error: any) {
      console.error(`❌ Erro no ${simulator.name}:`, error.message);
    }

    if (i < workingSimulators.length - 1) {
      console.log('\n⏳ Aguardando 2 segundos antes do próximo simulador...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 SIMULADORES FUNCIONAIS EXECUTADOS!');
  console.log(`${'='.repeat(60)}`);
}

if (require.main === module) {
  runWorkingSimulators();
}