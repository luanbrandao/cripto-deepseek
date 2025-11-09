import * as fs from 'fs';
import * as path from 'path';

interface BotAnalysis {
  name: string;
  path: string;
  usesBotSpecificConfig: boolean;
  usesUnifiedConfig: boolean;
  configDetails: string[];
  issues: string[];
}

const BOTS_TO_ANALYZE = [
  // Real Trading Bots
  { name: 'Real Trading Bot', path: 'src/bots/execution/real/real-trading-bot.ts' },
  { name: 'Smart Trading Bot BUY', path: 'src/bots/execution/real/smart-trading-bot-buy.ts' },
  { name: 'Multi-Smart Trading Bot BUY', path: 'src/bots/execution/real/multi-smart-trading-bot-buy.ts' },
  { name: 'EMA Trading Bot', path: 'src/bots/execution/real/ema-trading-bot.ts' },
  
  // Simulators
  { name: 'Real Trading Bot Simulator', path: 'src/bots/execution/simulators/real-trading-bot-simulator.ts' },
  { name: 'Smart Trading Bot Simulator BUY', path: 'src/bots/execution/simulators/smart-trading-bot-simulator-buy.ts' },
  { name: 'Smart Trading Bot Simulator SELL', path: 'src/bots/execution/simulators/smart-trading-bot-simulator-sell.ts' },
  { name: 'Multi-Smart Trading Bot Simulator BUY', path: 'src/bots/execution/simulators/multi-smart-trading-bot-simulator-buy.ts' },
  { name: 'Multi-Smart Trading Bot Simulator SELL', path: 'src/bots/execution/simulators/multi-smart-trading-bot-simulator-sell.ts' }
];

function analyzeBotFile(botPath: string): BotAnalysis {
  const fullPath = path.resolve(botPath);
  const name = path.basename(botPath, '.ts');
  
  const analysis: BotAnalysis = {
    name,
    path: botPath,
    usesBotSpecificConfig: false,
    usesUnifiedConfig: false,
    configDetails: [],
    issues: []
  };

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check imports
    if (content.includes('BOT_SPECIFIC_CONFIG')) {
      analysis.usesBotSpecificConfig = true;
      analysis.configDetails.push('✅ Importa BOT_SPECIFIC_CONFIG');
    } else {
      analysis.issues.push('❌ NÃO importa BOT_SPECIFIC_CONFIG');
    }
    
    if (content.includes('UNIFIED_TRADING_CONFIG')) {
      analysis.usesUnifiedConfig = true;
      analysis.configDetails.push('✅ Importa UNIFIED_TRADING_CONFIG');
    } else {
      analysis.issues.push('❌ NÃO importa UNIFIED_TRADING_CONFIG');
    }

    // Check specific usage patterns
    if (content.includes('BOT_SPECIFIC_CONFIG.SMART_BOT_BUY')) {
      analysis.configDetails.push('✅ Usa BOT_SPECIFIC_CONFIG.SMART_BOT_BUY');
    }
    
    if (content.includes('BOT_SPECIFIC_CONFIG.REAL_BOT')) {
      analysis.configDetails.push('✅ Usa BOT_SPECIFIC_CONFIG.REAL_BOT');
    }
    
    if (content.includes('BOT_SPECIFIC_CONFIG.EMA_BOT')) {
      analysis.configDetails.push('✅ Usa BOT_SPECIFIC_CONFIG.EMA_BOT');
    }

    // Check for hardcoded values that should use config
    const hardcodedPatterns = [
      { pattern: /confidence\s*[<>=]+\s*\d+/, issue: 'Possível confiança hardcoded' },
      { pattern: /MIN_CONFIDENCE.*=.*\d+/, issue: 'MIN_CONFIDENCE hardcoded' },
      { pattern: /VOLUME_MULTIPLIER.*=.*\d+/, issue: 'VOLUME_MULTIPLIER hardcoded' },
      { pattern: /REWARD_MULTIPLIER.*=.*\d+/, issue: 'REWARD_MULTIPLIER hardcoded' }
    ];

    hardcodedPatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(content)) {
        analysis.issues.push(`⚠️ ${issue}`);
      }
    });

    // Check for proper configuration usage
    if (content.includes('botConfig.MIN_CONFIDENCE') || content.includes('smartConfig.MIN_CONFIDENCE')) {
      analysis.configDetails.push('✅ Usa configuração dinâmica de confiança');
    }
    
    if (content.includes('botConfig.VOLUME_MULTIPLIER') || content.includes('smartConfig.VOLUME_MULTIPLIER')) {
      analysis.configDetails.push('✅ Usa configuração dinâmica de volume');
    }
    
    if (content.includes('botConfig.REWARD_MULTIPLIER') || content.includes('smartConfig.REWARD_MULTIPLIER')) {
      analysis.configDetails.push('✅ Usa configuração dinâmica de reward');
    }

  } catch (error) {
    analysis.issues.push(`❌ Erro ao ler arquivo: ${error}`);
  }

  return analysis;
}

function generateReport(analyses: BotAnalysis[]): void {
  console.log('🔍 ANÁLISE DE CONFIGURAÇÕES DOS BOTS');
  console.log('═'.repeat(80));
  
  let totalBots = analyses.length;
  let botsWithBotSpecific = 0;
  let botsWithUnified = 0;
  let botsWithIssues = 0;

  analyses.forEach((analysis, index) => {
    console.log(`\n${index + 1}. ${analysis.name}`);
    console.log('─'.repeat(50));
    console.log(`📁 Arquivo: ${analysis.path}`);
    
    if (analysis.usesBotSpecificConfig) botsWithBotSpecific++;
    if (analysis.usesUnifiedConfig) botsWithUnified++;
    if (analysis.issues.length > 0) botsWithIssues++;
    
    // Configurações encontradas
    if (analysis.configDetails.length > 0) {
      console.log('\n📊 Configurações:');
      analysis.configDetails.forEach(detail => console.log(`  ${detail}`));
    }
    
    // Issues encontrados
    if (analysis.issues.length > 0) {
      console.log('\n⚠️ Issues:');
      analysis.issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    // Status geral
    const status = analysis.issues.length === 0 ? '✅ OK' : '❌ PRECISA CORREÇÃO';
    console.log(`\n🎯 Status: ${status}`);
  });

  // Resumo geral
  console.log('\n' + '═'.repeat(80));
  console.log('📈 RESUMO GERAL');
  console.log('═'.repeat(80));
  console.log(`📊 Total de bots analisados: ${totalBots}`);
  console.log(`✅ Bots usando BOT_SPECIFIC_CONFIG: ${botsWithBotSpecific}/${totalBots} (${Math.round(botsWithBotSpecific/totalBots*100)}%)`);
  console.log(`✅ Bots usando UNIFIED_TRADING_CONFIG: ${botsWithUnified}/${totalBots} (${Math.round(botsWithUnified/totalBots*100)}%)`);
  console.log(`❌ Bots com issues: ${botsWithIssues}/${totalBots} (${Math.round(botsWithIssues/totalBots*100)}%)`);
  
  // Recomendações
  console.log('\n🎯 RECOMENDAÇÕES:');
  if (botsWithBotSpecific < totalBots) {
    console.log(`❌ ${totalBots - botsWithBotSpecific} bots precisam implementar BOT_SPECIFIC_CONFIG`);
  }
  if (botsWithIssues > 0) {
    console.log(`❌ ${botsWithIssues} bots precisam de correções`);
  }
  if (botsWithBotSpecific === totalBots && botsWithIssues === 0) {
    console.log('✅ Todos os bots estão configurados corretamente!');
  }
}

function main(): void {
  console.log('🚀 Iniciando análise de configurações dos bots...\n');
  
  const analyses: BotAnalysis[] = [];
  
  BOTS_TO_ANALYZE.forEach(bot => {
    console.log(`🔍 Analisando: ${bot.name}...`);
    const analysis = analyzeBotFile(bot.path);
    analyses.push(analysis);
  });
  
  generateReport(analyses);
}

if (require.main === module) {
  main();
}