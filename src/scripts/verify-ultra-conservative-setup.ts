/**
 * 🔍 VERIFICAÇÃO COMPLETA DAS CONFIGURAÇÕES ULTRA-CONSERVADORAS
 * Valida se todas as configurações foram aplicadas corretamente
 */

import { ULTRA_CONSERVATIVE_CONFIG, BOT_ULTRA_CONSERVATIVE_CONFIG } from '../shared/config/ultra-conservative-config';
import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string;
}

export class UltraConservativeVerifier {
  private results: VerificationResult[] = [];

  async verifyAll(): Promise<void> {
    console.log('🔍 VERIFICAÇÃO COMPLETA DAS CONFIGURAÇÕES ULTRA-CONSERVADORAS v4.0');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    this.verifyConfiguration();
    this.verifyFiles();
    this.verifyBotUpdates();
    this.verifyPackageJson();
    this.verifySimulators();
    
    this.displayResults();
  }

  private verifyConfiguration(): void {
    console.log('\n🛡️ VERIFICANDO CONFIGURAÇÃO ULTRA-CONSERVADORA...');
    
    // Verificar valores críticos
    const checks = [
      {
        name: 'Confiança Mínima',
        actual: ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE,
        expected: 90,
        operator: '>='
      },
      {
        name: 'Risk/Reward Ratio',
        actual: ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO,
        expected: 3.0,
        operator: '>='
      },
      {
        name: 'Cooldown Minutes',
        actual: ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_MINUTES,
        expected: 720,
        operator: '>='
      },
      {
        name: 'Símbolos Count',
        actual: ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.length,
        expected: 2,
        operator: '<='
      },
      {
        name: 'Timeframe',
        actual: ULTRA_CONSERVATIVE_CONFIG.CHART.TIMEFRAME,
        expected: '4h',
        operator: '=='
      },
      {
        name: 'Periods',
        actual: ULTRA_CONSERVATIVE_CONFIG.CHART.PERIODS,
        expected: 100,
        operator: '>='
      }
    ];

    checks.forEach(check => {
      let passed = false;
      switch (check.operator) {
        case '>=':
          passed = check.actual >= check.expected;
          break;
        case '<=':
          passed = check.actual <= check.expected;
          break;
        case '==':
          passed = check.actual === check.expected;
          break;
      }

      this.results.push({
        component: `Config: ${check.name}`,
        status: passed ? 'PASS' : 'FAIL',
        message: `${check.actual} ${check.operator} ${check.expected}`,
        details: passed ? 'Configuração correta' : 'Valor não atende critério ultra-conservador'
      });
    });

    // Verificar símbolos específicos
    const expectedSymbols = ['BTCUSDT', 'ETHUSDT'];
    const symbolsMatch = expectedSymbols.every(symbol => 
      ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.includes(symbol)
    );

    this.results.push({
      component: 'Config: Símbolos',
      status: symbolsMatch ? 'PASS' : 'FAIL',
      message: ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', '),
      details: symbolsMatch ? 'Apenas BTC e ETH (correto)' : 'Símbolos não são ultra-conservadores'
    });
  }

  private verifyFiles(): void {
    console.log('\n📁 VERIFICANDO ARQUIVOS CRIADOS...');
    
    const requiredFiles = [
      'src/shared/config/ultra-conservative-config.ts',
      'src/shared/analyzers/ultra-conservative-analyzer.ts',
      'src/scripts/apply-ultra-conservative-setup.ts',
      'src/scripts/test-ultra-conservative-simulators.ts',
      'CRITICAL_IMPROVEMENTS.md',
      'ULTRA_CONSERVATIVE_UPDATE.md',
      'RESUMO.md'
    ];

    requiredFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const exists = fs.existsSync(fullPath);
      
      this.results.push({
        component: `File: ${path.basename(filePath)}`,
        status: exists ? 'PASS' : 'FAIL',
        message: exists ? 'Arquivo existe' : 'Arquivo não encontrado',
        details: filePath
      });
    });
  }

  private verifyBotUpdates(): void {
    console.log('\n🤖 VERIFICANDO ATUALIZAÇÕES DOS BOTS...');
    
    const botFiles = [
      'src/bots/execution/real/smart-trading-bot-buy.ts',
      'src/bots/execution/real/ema-trading-bot.ts',
      'src/bots/execution/simulators/smart-trading-bot-simulator-buy.ts',
      'src/bots/execution/simulators/real-trading-bot-simulator.ts'
    ];

    botFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Verificar se usa ULTRA_CONSERVATIVE_CONFIG
        const usesUltraConfig = content.includes('ULTRA_CONSERVATIVE_CONFIG');
        const usesUltraAnalyzer = content.includes('UltraConservativeAnalyzer');
        const hasV4Header = content.includes('v4.0') || content.includes('Ultra-Conservative');
        
        const allChecksPass = usesUltraConfig && usesUltraAnalyzer && hasV4Header;
        
        this.results.push({
          component: `Bot: ${path.basename(filePath)}`,
          status: allChecksPass ? 'PASS' : 'WARNING',
          message: allChecksPass ? 'Totalmente atualizado' : 'Parcialmente atualizado',
          details: `Config: ${usesUltraConfig}, Analyzer: ${usesUltraAnalyzer}, v4.0: ${hasV4Header}`
        });
      } else {
        this.results.push({
          component: `Bot: ${path.basename(filePath)}`,
          status: 'FAIL',
          message: 'Arquivo não encontrado',
          details: filePath
        });
      }
    });
  }

  private verifyPackageJson(): void {
    console.log('\n📦 VERIFICANDO PACKAGE.JSON...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Verificar versão
      const isV4 = packageJson.version.startsWith('4.');
      
      // Verificar scripts ultra-conservadores
      const ultraScripts = [
        'ultra-conservative-smart-bot',
        'ultra-conservative-ema-bot',
        'ultra-conservative-smart-simulator',
        'ultra-conservative-real-simulator',
        'apply-ultra-conservative-setup',
        'validate-ultra-conservative'
      ];
      
      const scriptsExist = ultraScripts.filter(script => 
        packageJson.scripts && packageJson.scripts[script]
      );
      
      this.results.push({
        component: 'Package: Version',
        status: isV4 ? 'PASS' : 'FAIL',
        message: packageJson.version,
        details: isV4 ? 'Versão v4.0.0 correta' : 'Versão não atualizada para v4.x'
      });
      
      this.results.push({
        component: 'Package: Scripts',
        status: scriptsExist.length >= 4 ? 'PASS' : 'WARNING',
        message: `${scriptsExist.length}/${ultraScripts.length} scripts`,
        details: `Scripts encontrados: ${scriptsExist.join(', ')}`
      });
    }
  }

  private verifySimulators(): void {
    console.log('\n🧪 VERIFICANDO SIMULADORES...');
    
    const simulatorFiles = [
      'src/bots/execution/simulators/ema-trading-bot-simulator.ts',
      'src/bots/execution/simulators/support-resistance-bot-simulator.ts',
      'src/scripts/simulators/simulate-ema.ts',
      'src/scripts/simulators/simulate-support.ts'
    ];

    simulatorFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        const usesUltraConfig = content.includes('ULTRA_CONSERVATIVE_CONFIG');
        const usesUltraAnalyzer = content.includes('UltraConservativeAnalyzer');
        const hasV4Function = content.includes('UltraConservative') && content.includes('v4.0');
        
        const isNewSimulator = filePath.includes('ema-trading-bot-simulator') || filePath.includes('support-resistance-bot-simulator');
        const allChecksPass = usesUltraConfig && (isNewSimulator ? usesUltraAnalyzer && hasV4Function : hasV4Function);
        
        this.results.push({
          component: `Simulator: ${path.basename(filePath)}`,
          status: allChecksPass ? 'PASS' : 'WARNING',
          message: allChecksPass ? 'Totalmente atualizado v4.0' : 'Precisa de atualização',
          details: isNewSimulator ? `Config: ${usesUltraConfig}, Analyzer: ${usesUltraAnalyzer}, v4.0: ${hasV4Function}` : `Ultra Config: ${usesUltraConfig}, v4.0: ${hasV4Function}`
        });
      }
    });
  }

  private displayResults(): void {
    console.log('\n📊 RESULTADOS DA VERIFICAÇÃO:');
    console.log('═══════════════════════════════════════════════════════════════════════');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ PASSOU: ${passed} | ⚠️ AVISOS: ${warnings} | ❌ FALHOU: ${failed}\n`);
    
    // Agrupar por status
    ['FAIL', 'WARNING', 'PASS'].forEach(status => {
      const items = this.results.filter(r => r.status === status);
      if (items.length > 0) {
        const icon = status === 'PASS' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${icon} ${status}:`);
        items.forEach(item => {
          console.log(`   ${item.component}: ${item.message}`);
          if (item.details) {
            console.log(`      ${item.details}`);
          }
        });
        console.log('');
      }
    });
    
    // Resumo final
    if (failed === 0 && warnings === 0) {
      console.log('🎯 VERIFICAÇÃO COMPLETA: TODAS AS CONFIGURAÇÕES ULTRA-CONSERVADORAS ESTÃO CORRETAS!');
      console.log('🛡️ Sistema pronto para uso com máxima segurança e win rate target de 75-85%');
    } else if (failed === 0) {
      console.log('⚠️ VERIFICAÇÃO QUASE COMPLETA: Algumas melhorias menores recomendadas');
      console.log('🛡️ Sistema funcional, mas pode ser otimizado');
    } else {
      console.log('❌ VERIFICAÇÃO FALHOU: Problemas críticos encontrados');
      console.log('🔧 Corrija os problemas antes de usar o sistema');
    }
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    if (failed === 0) {
      console.log('1. Testar simuladores: npm run test-all-ultra-conservative-simulators');
      console.log('2. Validar win rates em simulação');
      console.log('3. Aplicar gradualmente em bots reais');
    } else {
      console.log('1. Corrigir problemas identificados');
      console.log('2. Executar verificação novamente');
      console.log('3. Prosseguir apenas após todos os testes passarem');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const verifier = new UltraConservativeVerifier();
  verifier.verifyAll();
}

export default UltraConservativeVerifier;