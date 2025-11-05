import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const simulators = [
  { name: '123 Pattern Simulator', command: 'npm run simulate-123' },
  { name: 'EMA Pattern Simulator', command: 'npm run simulate-ema' },
  { name: 'Support/Resistance Simulator', command: 'npm run simulate-support' },
  { name: 'Real Trading Bot Simulator', command: 'npm run real-trading-bot-simulator' },
  { name: 'Smart Trading Bot Simulator', command: 'npm run smart-trading-bot-simulator' },
  { name: 'Multi-Smart Trading Bot Simulator', command: 'npm run multismart-trading-bot-simulator' }
];

async function runAllSimulators() {
  console.log('🚀 EXECUTANDO TODOS OS SIMULADORES EM SEQUÊNCIA\n');

  for (let i = 0; i < simulators.length; i++) {
    const simulator = simulators[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 [${i + 1}/${simulators.length}] ${simulator.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const { stdout, stderr } = await execAsync(simulator.command);
      console.log(stdout);
      if (stderr) console.error(stderr);

      // Detectar se executou trade
      const executedTrade = stdout.includes('EXECUTADA COM SUCESSO') || stdout.includes('Ordem executada') || stdout.includes('Trade simulado salvo');
      const noTrade = stdout.includes('NÃO EXECUTOU TRADE') || stdout.includes('Nenhuma oportunidade encontrada') || stdout.includes('Total de trades: 0');

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

    if (i < simulators.length - 1) {
      console.log('\n⏳ Aguardando 2 segundos antes do próximo simulador...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 TODOS OS SIMULADORES EXECUTADOS!');
  console.log(`${'='.repeat(60)}`);
}

if (require.main === module) {
  runAllSimulators();
}