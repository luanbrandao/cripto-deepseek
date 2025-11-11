/**
 * 🔧 CORREÇÃO RÁPIDA: TRADE_COOLDOWN_HOURS → TRADE_COOLDOWN_MINUTES
 */

import * as fs from 'fs';

const filesToFix = [
  'src/bots/execution/real/ema-trading-bot.ts',
  'src/bots/execution/real/smart-trading-bot-buy.ts',
  'src/bots/execution/simulators/ema-trading-bot-simulator.ts',
  'src/bots/execution/simulators/real-trading-bot-simulator.ts',
  'src/bots/execution/simulators/smart-trading-bot-simulator-buy.ts',
  'src/bots/execution/simulators/support-resistance-bot-simulator.ts'
];

function fixFile(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir TRADE_COOLDOWN_HOURS por TRADE_COOLDOWN_MINUTES
    const newContent = content.replace(
      /ULTRA_CONSERVATIVE_CONFIG\.TRADE_COOLDOWN_HOURS/g,
      'TradingConfigManager.getConfig().TRADE_COOLDOWN_MINUTES'
    ).replace(
      /TradingConfigManager\.getConfig\(\)\.TRADE_COOLDOWN_MINUTES}h/g,
      'TradingConfigManager.getConfig().TRADE_COOLDOWN_MINUTES} minutos'
    );

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Corrigido: ${filePath}`);
    } else {
      console.log(`⏸️ Sem alterações: ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Erro ao corrigir ${filePath}:`, error);
  }
}

function main() {
  console.log('🔧 CORRIGINDO TRADE_COOLDOWN_HOURS\n');
  
  for (const file of filesToFix) {
    fixFile(file);
  }
  
  console.log('\n✅ CORREÇÃO CONCLUÍDA');
}

if (require.main === module) {
  main();
}

export { main as fixCooldownHours };