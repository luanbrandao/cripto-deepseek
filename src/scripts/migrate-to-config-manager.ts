/**
 * 🔄 MIGRAÇÃO PARA TRADING CONFIG MANAGER
 * Atualiza todos os arquivos que ainda usam UNIFIED_TRADING_CONFIG
 */

import * as fs from 'fs';
import * as path from 'path';

const filesToUpdate = [
  'src/analyzers/emaAnalyzer.ts',
  'src/bots/core/base-trading-bot.ts',
  'src/bots/execution/real/multi-smart-trading-bot-buy.ts',
  'src/bots/execution/real/real-trading-bot.ts',
  'src/bots/execution/simulators/elite-trading-bot-simulator.ts',
  'src/bots/execution/simulators/multi-smart-trading-bot-simulator-buy.ts',
  'src/bots/execution/simulators/multi-smart-trading-bot-simulator-sell.ts',
  'src/bots/execution/simulators/smart-trading-bot-simulator-sell.ts',
  'src/bots/execution/test/calculate-target-test-bot.ts',
  'src/bots/services/advanced-ema-analyzer.ts',
  'src/bots/services/market-trend-analyzer.ts',
  'src/bots/services/risk-manager.ts',
  'src/bots/services/smart-scoring-system.ts',
  'src/bots/services/trade-executor.ts',
  'src/bots/utils/data/market-data-fetcher.ts',
  'src/bots/utils/execution/bot-flow-manager.ts',
  'src/bots/utils/execution/trade-history-saver.ts',
  'src/bots/utils/logging/bot-logger.ts',
  'src/bots/utils/risk/trade-validators.ts',
  'src/bots/utils/validation/advanced-buy-validator.ts',
  'src/bots/utils/validation/advanced-sell-validator.ts',
  'src/bots/utils/validation/symbol-trade-checker.ts',
  'src/crons/real-trading-bot-simulator-cron.ts',
  'src/crons/smart-trading-bot-buy-cron.ts',
  'src/crons/smart-trading-bot-simulator-buy-cron.ts',
  'src/index.ts',
  'src/scripts/check-trades.ts',
  'src/scripts/simulators/simulate-123.ts',
  'src/scripts/simulators/trade-simulator.ts',
  'src/scripts/tests/test-all-simulators.ts',
  'src/scripts/update-all-trades.ts',
  'src/shared/analyzers/unified-deepseek-analyzer.ts',
  'src/shared/config/optimized-trading-config.ts',
  'src/shared/parsers/unified-analysis-parser.ts',
  'src/shared/validators/trend-validator.ts'
];

function updateFile(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Adicionar import se não existir
    if (!content.includes('TradingConfigManager') && content.includes('UNIFIED_TRADING_CONFIG')) {
      const importLine = "import { TradingConfigManager } from '../shared/config/trading-config-manager';";
      
      // Encontrar onde inserir o import
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import') && lines[i].includes('unified-trading-config')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      if (insertIndex > 0) {
        lines.splice(insertIndex, 0, importLine);
        content = lines.join('\n');
        updated = true;
      }
    }

    // Substituições específicas
    const replacements = [
      // Configurações básicas
      { from: /UNIFIED_TRADING_CONFIG\.SYMBOLS/g, to: 'TradingConfigManager.getConfig().SYMBOLS' },
      { from: /UNIFIED_TRADING_CONFIG\.DEFAULT_SYMBOL/g, to: 'TradingConfigManager.getConfig().DEFAULT_SYMBOL' },
      { from: /UNIFIED_TRADING_CONFIG\.TRADE_AMOUNT_USD/g, to: 'TradingConfigManager.getConfig().TRADE_AMOUNT_USD' },
      { from: /UNIFIED_TRADING_CONFIG\.MIN_CONFIDENCE/g, to: 'TradingConfigManager.getConfig().MIN_CONFIDENCE' },
      { from: /UNIFIED_TRADING_CONFIG\.HIGH_CONFIDENCE/g, to: 'TradingConfigManager.getConfig().HIGH_CONFIDENCE' },
      { from: /UNIFIED_TRADING_CONFIG\.MEDIUM_CONFIDENCE/g, to: 'TradingConfigManager.getConfig().MEDIUM_CONFIDENCE' },
      { from: /UNIFIED_TRADING_CONFIG\.MIN_RISK_REWARD_RATIO/g, to: 'TradingConfigManager.getConfig().MIN_RISK_REWARD_RATIO' },
      { from: /UNIFIED_TRADING_CONFIG\.TRADE_COOLDOWN_MINUTES/g, to: 'TradingConfigManager.getConfig().TRADE_COOLDOWN_MINUTES' },
      
      // Chart e EMA
      { from: /UNIFIED_TRADING_CONFIG\.CHART\.TIMEFRAME/g, to: 'TradingConfigManager.getConfig().CHART.TIMEFRAME' },
      { from: /UNIFIED_TRADING_CONFIG\.CHART\.PERIODS/g, to: 'TradingConfigManager.getConfig().CHART.PERIODS' },
      { from: /UNIFIED_TRADING_CONFIG\.EMA\.FAST_PERIOD/g, to: 'TradingConfigManager.getConfig().EMA.FAST_PERIOD' },
      { from: /UNIFIED_TRADING_CONFIG\.EMA\.SLOW_PERIOD/g, to: 'TradingConfigManager.getConfig().EMA.SLOW_PERIOD' },
      
      // Simulação e limites
      { from: /UNIFIED_TRADING_CONFIG\.SIMULATION\.STARTUP_DELAY/g, to: 'TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY' },
      { from: /UNIFIED_TRADING_CONFIG\.SIMULATION\.INITIAL_BALANCE/g, to: 'TradingConfigManager.getConfig().SIMULATION.INITIAL_BALANCE' },
      { from: /UNIFIED_TRADING_CONFIG\.SIMULATION\.MAX_ACTIVE_TRADES/g, to: 'TradingConfigManager.getConfig().SIMULATION.MAX_ACTIVE_TRADES' },
      { from: /UNIFIED_TRADING_CONFIG\.LIMITS\.MAX_ACTIVE_TRADES/g, to: 'TradingConfigManager.getConfig().LIMITS.MAX_ACTIVE_TRADES' },
      
      // Risk e paths
      { from: /UNIFIED_TRADING_CONFIG\.RISK/g, to: 'TradingConfigManager.getConfig().RISK' },
      { from: /UNIFIED_TRADING_CONFIG\.PATHS\.TRADES_DIR/g, to: 'TradingConfigManager.getConfig().PATHS.TRADES_DIR' },
      
      // Files
      { from: /UNIFIED_TRADING_CONFIG\.FILES\./g, to: 'TradingConfigManager.getConfig().FILES.' },
      
      // EMA Advanced
      { from: /UNIFIED_TRADING_CONFIG\.EMA_ADVANCED/g, to: 'TradingConfigManager.getConfig().EMA_ADVANCED' },
      
      // Funções auxiliares
      { from: /UNIFIED_TRADING_CONFIG\.getMaxActiveTrades/g, to: 'TradingConfigManager.getMaxActiveTrades' }
    ];

    for (const replacement of replacements) {
      const newContent = content.replace(replacement.from, replacement.to);
      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Atualizado: ${filePath}`);
    } else {
      console.log(`⏸️ Sem alterações: ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Erro ao atualizar ${filePath}:`, error);
  }
}

function main() {
  console.log('🔄 INICIANDO MIGRAÇÃO PARA TRADING CONFIG MANAGER\n');
  
  let updatedCount = 0;
  
  for (const file of filesToUpdate) {
    updateFile(file);
    updatedCount++;
  }
  
  console.log(`\n✅ MIGRAÇÃO CONCLUÍDA: ${updatedCount} arquivos processados`);
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('1. Compile o projeto: npm run build');
  console.log('2. Execute os testes: npm run test-config-manager');
  console.log('3. Verifique se há erros de compilação');
}

if (require.main === module) {
  main();
}

export { main as migrateToConfigManager };