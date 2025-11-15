import * as fs from 'fs';
import * as path from 'path';

interface BotValidationInfo {
  file: string;
  botName: string;
  hasSmartPreValidation: boolean;
  validationMethod: string;
  preset: string | null;
  customConfig: boolean;
  validationFlow: string[];
  issues: string[];
}

class BotValidationTester {
  private botsDir = 'd:\\projetos-luan\\estudos\\cripto-deepseek\\src\\bots\\execution';
  private results: BotValidationInfo[] = [];

  async testAllBots() {
    console.log('🔍 TESTANDO VALIDAÇÃO DE TODOS OS BOTS E SIMULADORES...\n');

    // Test real bots
    await this.testDirectory(path.join(this.botsDir, 'real'), 'REAL BOT');
    
    // Test simulators
    await this.testDirectory(path.join(this.botsDir, 'simulators'), 'SIMULATOR');

    this.generateReport();
  }

  private async testDirectory(dirPath: string, type: string) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.ts'));
    
    console.log(`\n📁 Testando ${type}S (${files.length} arquivos):`);
    console.log('='.repeat(60));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      await this.analyzeBot(filePath, type);
    }
  }

  private async analyzeBot(filePath: string, type: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    const botInfo: BotValidationInfo = {
      file: fileName,
      botName: this.extractBotName(content),
      hasSmartPreValidation: false,
      validationMethod: 'NONE',
      preset: null,
      customConfig: false,
      validationFlow: [],
      issues: []
    };

    // Check imports
    this.checkImports(content, botInfo);
    
    // Check validation methods
    this.checkValidationMethods(content, botInfo);
    
    // Check validation flow
    this.checkValidationFlow(content, botInfo);
    
    // Check for issues
    this.checkForIssues(content, botInfo);

    this.results.push(botInfo);
    this.printBotResult(botInfo, type);
  }

  private extractBotName(content: string): string {
    const classMatch = content.match(/export class (\w+)/);
    return classMatch ? classMatch[1] : 'Unknown';
  }

  private checkImports(content: string, botInfo: BotValidationInfo) {
    if (content.includes('SmartPreValidationService')) {
      botInfo.hasSmartPreValidation = true;
      botInfo.validationMethod = 'SMART_VALIDATION';
    } else if (content.includes('PreValidationService')) {
      botInfo.validationMethod = 'OLD_VALIDATION';
      botInfo.issues.push('❌ Ainda usa PreValidationService antigo');
    }
  }

  private checkValidationMethods(content: string, botInfo: BotValidationInfo) {
    // Check for preset usage
    const presetMatch = content.match(/\.usePreset\(['"`](\w+)['"`]\)/);
    if (presetMatch) {
      botInfo.preset = presetMatch[1];
    }

    // Check for custom configuration
    if (content.includes('.withEma(') || content.includes('.withRSI(') || content.includes('.withVolume(')) {
      botInfo.customConfig = true;
    }

    // Check validation flow
    if (content.includes('SmartPreValidationService')) {
      if (content.includes('.createBuilder()')) {
        botInfo.validationFlow.push('✅ Builder Pattern');
      }
      if (content.includes('.build()')) {
        botInfo.validationFlow.push('✅ Build Method');
      }
      if (content.includes('.validate(')) {
        botInfo.validationFlow.push('✅ Validate Call');
      }
    }
  }

  private checkValidationFlow(content: string, botInfo: BotValidationInfo) {
    // Check for proper validation structure
    if (content.includes('smartValidation.isValid')) {
      botInfo.validationFlow.push('✅ Validation Check');
    }
    if (content.includes('smartValidation.warnings')) {
      botInfo.validationFlow.push('✅ Warning Handling');
    }
    if (content.includes('smartValidation.reasons')) {
      botInfo.validationFlow.push('✅ Reason Logging');
    }
    if (content.includes('smartValidation.totalScore')) {
      botInfo.validationFlow.push('✅ Total Score');
    }
    if (content.includes('smartValidation.riskLevel')) {
      botInfo.validationFlow.push('✅ Risk Level');
    }
    if (content.includes('smartValidation.activeLayers')) {
      botInfo.validationFlow.push('✅ Active Layers');
    }
  }

  private checkForIssues(content: string, botInfo: BotValidationInfo) {
    // Check for old validation patterns
    if (content.includes('preValidation.score') && !content.includes('smartValidation')) {
      botInfo.issues.push('❌ Usa padrão de score antigo');
    }

    // Check for missing async in validation methods
    if (content.includes('SmartPreValidationService') && !content.includes('await SmartPreValidationService')) {
      botInfo.issues.push('⚠️ Possível falta de await na validação');
    }

    // Check for proper error handling
    if (!content.includes('smartValidation.warnings.forEach')) {
      botInfo.issues.push('⚠️ Tratamento de warnings pode estar incompleto');
    }

    // Check for decision updates
    if (!content.includes('decision.validationScore = smartValidation.totalScore')) {
      botInfo.issues.push('⚠️ Não atualiza validationScore na decisão');
    }
  }

  private printBotResult(botInfo: BotValidationInfo, type: string) {
    const status = botInfo.hasSmartPreValidation ? '✅' : '❌';
    const config = botInfo.preset ? `Preset: ${botInfo.preset}` : (botInfo.customConfig ? 'Custom Config' : 'No Config');
    
    console.log(`${status} ${botInfo.botName}`);
    console.log(`   📄 File: ${botInfo.file}`);
    console.log(`   🔧 Validation: ${botInfo.validationMethod}`);
    console.log(`   ⚙️ Config: ${config}`);
    console.log(`   🔄 Flow: ${botInfo.validationFlow.length}/6 steps`);
    
    if (botInfo.issues.length > 0) {
      console.log(`   ⚠️ Issues: ${botInfo.issues.length}`);
      botInfo.issues.forEach(issue => console.log(`      ${issue}`));
    }
    console.log('');
  }

  private generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('='.repeat(80));

    const totalBots = this.results.length;
    const updatedBots = this.results.filter(b => b.hasSmartPreValidation).length;
    const botsWithIssues = this.results.filter(b => b.issues.length > 0).length;

    console.log(`📈 ESTATÍSTICAS GERAIS:`);
    console.log(`   Total de Bots: ${totalBots}`);
    console.log(`   Bots Atualizados: ${updatedBots}/${totalBots} (${Math.round(updatedBots/totalBots*100)}%)`);
    console.log(`   Bots com Issues: ${botsWithIssues}/${totalBots} (${Math.round(botsWithIssues/totalBots*100)}%)`);

    console.log(`\n🎯 CONFIGURAÇÕES UTILIZADAS:`);
    const presets = this.results.filter(b => b.preset).map(b => b.preset);
    const uniquePresets = [...new Set(presets)];
    uniquePresets.forEach(preset => {
      const count = presets.filter(p => p === preset).length;
      console.log(`   ${preset}: ${count} bots`);
    });

    const customConfigs = this.results.filter(b => b.customConfig).length;
    console.log(`   Custom Config: ${customConfigs} bots`);

    console.log(`\n🔄 ANÁLISE DE FLUXO DE VALIDAÇÃO:`);
    const flowSteps = [
      'Builder Pattern',
      'Build Method', 
      'Validate Call',
      'Validation Check',
      'Warning Handling',
      'Reason Logging',
      'Total Score',
      'Risk Level',
      'Active Layers'
    ];

    flowSteps.forEach(step => {
      const count = this.results.filter(b => 
        b.validationFlow.some(f => f.includes(step))
      ).length;
      const percentage = Math.round(count/totalBots*100);
      console.log(`   ${step}: ${count}/${totalBots} (${percentage}%)`);
    });

    if (botsWithIssues > 0) {
      console.log(`\n⚠️ BOTS COM ISSUES:`);
      this.results.filter(b => b.issues.length > 0).forEach(bot => {
        console.log(`   ${bot.botName} (${bot.file}):`);
        bot.issues.forEach(issue => console.log(`      ${issue}`));
      });
    }

    console.log(`\n✅ RESUMO:`);
    if (updatedBots === totalBots && botsWithIssues === 0) {
      console.log(`🎉 PERFEITO! Todos os ${totalBots} bots foram atualizados com sucesso!`);
      console.log(`🛡️ Sistema Smart Pre-Validation implementado em 100% dos bots`);
      console.log(`🔧 Nenhum issue encontrado - Sistema pronto para produção!`);
    } else {
      console.log(`📊 ${updatedBots}/${totalBots} bots atualizados`);
      if (botsWithIssues > 0) {
        console.log(`⚠️ ${botsWithIssues} bots precisam de correções`);
      }
    }
  }
}

// Execute test
if (require.main === module) {
  const tester = new BotValidationTester();
  tester.testAllBots().catch(console.error);
}

export { BotValidationTester };