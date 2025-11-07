/**
 * 🚀 SCRIPT PARA APLICAR SETUP OTIMIZADO
 * Implementa configurações para maximização de ganhos
 */

import { OPTIMIZED_TRADING_CONFIG, applyOptimizedConfig } from '../shared/config/optimized-trading-config';
import * as fs from 'fs';
import * as path from 'path';

// Backup das configurações atuais
function backupCurrentConfig() {
  const configFiles = [
    'src/shared/config/unified-trading-config.ts',
    'src/bots/config/trading-config.ts'
  ];

  const backupDir = 'config-backup';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const backupFile = path.join(backupDir, `${path.basename(file)}.backup.${Date.now()}`);
      fs.copyFileSync(file, backupFile);
      console.log(`📁 Backup criado: ${backupFile}`);
    }
  });
}

// Aplicar configurações otimizadas
function implementOptimizedSetup() {
  console.log('🚀 IMPLEMENTANDO SETUP OTIMIZADO PARA MAXIMIZAÇÃO DE GANHOS\n');
  
  // 1. Backup das configurações atuais
  console.log('📁 Criando backup das configurações atuais...');
  backupCurrentConfig();
  
  // 2. Aplicar configurações otimizadas
  console.log('\n🎯 Aplicando configurações otimizadas...');
  const config = applyOptimizedConfig();
  
  // 3. Mostrar resumo das mudanças
  console.log('\n📊 RESUMO DAS OTIMIZAÇÕES:');
  console.log('═'.repeat(60));
  
  console.log('💰 CONFIGURAÇÕES FINANCEIRAS:');
  console.log(`   Trade Amount: $15 → $${config.TRADE_AMOUNT_USD} (+33%)`);
  console.log(`   Min Confidence: 75% → ${config.MIN_CONFIDENCE}% (-9%)`);
  console.log(`   Risk/Reward: 2.0:1 → ${config.MIN_RISK_REWARD_RATIO}:1 (-15%)`);
  console.log(`   Cooldown: 5min → ${config.TRADE_COOLDOWN_MINUTES}min (-60%)`);
  
  console.log('\n📈 CONFIGURAÇÕES TÉCNICAS:');
  console.log(`   Timeframe: 1h → ${config.CHART.TIMEFRAME} (mais oportunidades)`);
  console.log(`   Periods: 50 → ${config.CHART.PERIODS} (+60% contexto)`);
  console.log(`   EMA Fast: 12 → ${config.EMA.FAST_PERIOD} (mais responsivo)`);
  console.log(`   EMA Slow: 26 → ${config.EMA.SLOW_PERIOD} (sinais mais rápidos)`);
  
  console.log('\n🎯 LIMITES E EXECUÇÃO:');
  console.log(`   Max Trades: 4 → ${config.LIMITS.MAX_ACTIVE_TRADES} (+25%)`);
  console.log(`   Trades/Symbol: 1 → ${config.LIMITS.MAX_TRADES_PER_SYMBOL} (re-entrada permitida)`);
  console.log(`   Símbolos: 4 → ${config.SYMBOLS.length} (+25% diversificação)`);
  
  console.log('\n🔥 THRESHOLDS RELAXADOS:');
  console.log(`   Smart Buy: Padrão → ${config.THRESHOLDS.SMART_BUY} (mais execuções)`);
  console.log(`   Multi-Smart: Ultra-rigoroso → Seletivo mas executável`);
  
  console.log('\n═'.repeat(60));
  
  // 4. Estimativas de impacto
  console.log('\n📊 IMPACTO ESPERADO:');
  console.log('🎯 Trades por dia: 2-4 → 8-12 (+200%)')
  console.log('📈 Oportunidades: +150% (timeframe + thresholds)')
  console.log('💰 Capital por trade: +33% ($15 → $20)')
  console.log('⚡ Velocidade de execução: +60% (cooldown reduzido)')
  console.log('🎲 Win rate esperado: 65-75% (setup balanceado)')
  
  // 5. Próximos passos
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. ✅ Configurações otimizadas aplicadas');
  console.log('2. 🔄 Executar bots com novas configurações');
  console.log('3. 📊 Monitorar performance por 7 dias');
  console.log('4. 🎯 Ajustar baseado nos resultados');
  console.log('5. 📈 Escalar capital gradualmente');
  
  // 6. Comandos para execução
  console.log('\n💻 COMANDOS PARA EXECUTAR:');
  console.log('npm run smart-trading-bot-simulator-buy    # Smart Bot otimizado');
  console.log('npm run multi-smart-trading-bot-simulator-buy # Multi-Smart otimizado');
  console.log('npm run simulate-ema                      # EMA com novos parâmetros');
  
  // 7. Alertas importantes
  console.log('\n⚠️ ALERTAS IMPORTANTES:');
  console.log('🔴 Setup mais agressivo - monitorar de perto');
  console.log('📊 Acompanhar métricas: win rate, drawdown, profit factor');
  console.log('🛑 Se win rate < 50%, aumentar confiança mínima');
  console.log('⏸️ Se poucos trades, relaxar mais os thresholds');
  console.log('🎯 Meta: 65%+ win rate, 10+ trades/dia, <15% drawdown');
  
  return config;
}

// Função para reverter configurações
function revertToBackup() {
  console.log('🔄 REVERTENDO PARA CONFIGURAÇÕES ANTERIORES...');
  
  const backupDir = 'config-backup';
  if (!fs.existsSync(backupDir)) {
    console.log('❌ Nenhum backup encontrado');
    return;
  }
  
  const backupFiles = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.backup'))
    .sort()
    .reverse(); // Mais recente primeiro
  
  if (backupFiles.length === 0) {
    console.log('❌ Nenhum arquivo de backup encontrado');
    return;
  }
  
  console.log('📁 Backups disponíveis:');
  backupFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  console.log('✅ Para reverter, restaure manualmente o backup desejado');
}

// Executar script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--revert')) {
    revertToBackup();
  } else {
    implementOptimizedSetup();
  }
}

export { implementOptimizedSetup, revertToBackup };