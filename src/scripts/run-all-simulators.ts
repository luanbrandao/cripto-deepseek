import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const simulators = [
  // 🛡️ ULTRA-CONSERVATIVE SIMULATORS (v5.0 - Win Rate Target: 75-85%)
  // mesma coisa do smart-trading-bot-buy-simulator
  // { name: 'Ultra-Conservative Smart Simulator', command: 'npm run ultra-conservative-smart-simulator' },
  { name: 'Ultra-Conservative Real Simulator', command: 'npm run ultra-conservative-real-simulator' },
  { name: 'Ultra-Conservative EMA Bot Simulator', command: 'npm run ultra-conservative-ema-bot-simulator' },
  { name: 'Ultra-Conservative S/R Bot Simulator', command: 'npm run ultra-conservative-sr-bot-simulator' },
  { name: 'Smart Entry Bot Simulator', command: 'npm run smart-entry-bot-simulator' },

  // 📊 PATTERN SIMULATORS (Legacy)
  { name: '123 Pattern Simulator', command: 'npm run simulate-123' },
  { name: 'EMA Pattern Simulator', command: 'npm run simulate-ema' },
  { name: 'Support/Resistance Simulator', command: 'npm run simulate-support' },

  // 🔄 NEUTRAL SIMULATORS (BUY/SELL/HOLD)
  // { name: 'Real Trading Bot Simulator', command: 'npm run real-trading-bot-simulator' },

  // 📈 BUY ONLY SIMULATORS (Long-Only)
  { name: 'Smart Trading Bot BUY Simulator', command: 'npm run smart-trading-bot-buy-simulator' },
  { name: 'Multi-Smart Trading Bot BUY Simulator', command: 'npm run multi-smart-trading-bot-buy-simulator' },
  { name: 'Elite Trading Bot Simulator', command: 'npm run elite-trading-bot-simulator' },

  // 📉 SELL ONLY SIMULATORS (Short-Only)
  { name: 'Smart Trading Bot SELL Simulator', command: 'npm run smart-trading-bot-sell-simulator' },
  { name: 'Multi-Smart Trading Bot SELL Simulator', command: 'npm run multi-smart-trading-bot-sell-simulator' }
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
      if (error.message.includes('TSError')) {
        console.log('🔧 Erro de compilação TypeScript - imports incorretos');
      }
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