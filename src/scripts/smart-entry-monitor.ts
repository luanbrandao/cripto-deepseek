import { SmartEntryMonitor } from '../monitor/smart-entry-monitor';
import * as path from 'path';

async function runSmartEntryMonitor() {
  console.log('🎯 SMART ENTRY MONITOR - Verificando ordens pendentes\n');

  const monitor = new SmartEntryMonitor();
  
  // Arquivos de Smart Entry Orders
  const smartEntryFiles = [
    './src/storage/trades/smartEntryOrders.json',
    './src/storage/trades/ultraConservativeSmartEntry.json',
    './src/storage/trades/realBotSmartEntry.json',
    './src/storage/trades/emaBotSmartEntry.json'
  ];

  for (const filePath of smartEntryFiles) {
    const fileName = path.basename(filePath);
    console.log(`\n📁 Verificando: ${fileName}`);
    console.log('─'.repeat(50));
    
    await monitor.checkSmartEntryOrders(filePath);
  }

  console.log('\n✅ SMART ENTRY MONITOR CONCLUÍDO');
}

if (require.main === module) {
  runSmartEntryMonitor();
}