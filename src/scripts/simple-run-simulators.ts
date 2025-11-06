console.log('🚀 EXECUTANDO SIMULADORES SIMPLES\n');

// Lista de simuladores que funcionam
const workingSimulators = [
  'simulate-123',
  'simulate-ema', 
  'simulate-support',
  'real-trading-bot-simulator'
];

console.log('📋 SIMULADORES DISPONÍVEIS:');
console.log('═'.repeat(40));
workingSimulators.forEach((sim, i) => {
  console.log(`${i + 1}. ${sim}`);
});
console.log('═'.repeat(40));

console.log('\n⚠️ PROBLEMA IDENTIFICADO:');
console.log('❌ Há erros de compilação TypeScript nos imports');
console.log('🔧 Solução: Corrigir imports dos clientes para core/clients/');

console.log('\n📝 COMANDOS PARA EXECUTAR INDIVIDUALMENTE:');
workingSimulators.forEach(sim => {
  console.log(`yarn ${sim}`);
});

console.log('\n🛠️ PARA CORRIGIR:');
console.log('1. Verificar imports em todos os arquivos');
console.log('2. Trocar "../clients/" por "../core/clients/"');
console.log('3. Trocar "../../clients/" por "../../core/clients/"');
console.log('4. Trocar "../../../clients/" por "../../../core/clients/"');

console.log('\n✅ SCRIPT EXECUTADO COM SUCESSO!');