import { TradeMonitor } from '../monitor/trade-monitor';
import * as fs from 'fs';
import * as path from 'path';
import { UNIFIED_TRADING_CONFIG } from '../shared/config/unified-trading-config';

const TRADES_DIR = `${UNIFIED_TRADING_CONFIG.PATHS.TRADES_DIR}`;

async function updateAllTrades() {
  console.log('🔄 ATUALIZANDO TODOS OS ARQUIVOS DE TRADES\n');

  try {
    // Verificar se diretório existe
    if (!fs.existsSync(TRADES_DIR)) {
      console.log('❌ Diretório de trades não encontrado:', TRADES_DIR);
      return;
    }

    // Listar todos os arquivos JSON
    const tradeFiles = fs.readdirSync(TRADES_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(TRADES_DIR, file));

    if (tradeFiles.length === 0) {
      console.log('⚠️ Nenhum arquivo de trades encontrado');
      return;
    }

    console.log(`📊 Encontrados ${tradeFiles.length} arquivos de trades:`);
    tradeFiles.forEach(file => {
      console.log(`   - ${path.basename(file)}`);
    });

    console.log('\n🔍 Iniciando atualização...\n');

    const monitor = new TradeMonitor();

    // Atualizar cada arquivo
    for (const tradeFile of tradeFiles) {
      const fileName = path.basename(tradeFile);
      console.log(`📈 Processando ${fileName}...`);

      try {
        await monitor.checkTrades(tradeFile);
        console.log(`   ✅ Arquivo processado`);
      } catch (error) {
        console.log(`   ❌ Erro: ${(error as Error).message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 ATUALIZAÇÃO CONCLUÍDA`);
    console.log(`📁 Arquivos processados: ${tradeFiles.length}`);
    console.log(`📊 Verifique os logs acima para detalhes dos trades atualizados`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erro na atualização:', error);
  }
}

if (require.main === module) {
  updateAllTrades();
}

export { updateAllTrades };