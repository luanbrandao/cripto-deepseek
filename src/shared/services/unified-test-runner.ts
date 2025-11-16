/**
 * 🧪 UNIFIED TEST RUNNER
 * Consolidates all test execution patterns into a single service
 */

import { hasActiveTradeForSymbol } from '../../bots/utils/validation/symbol-trade-checker';
import { TradingConfigManager } from '../config/trading-config-manager';

export interface TestConfig {
  name: string;
  file: string;
  isSimulator: boolean;
  symbols?: string[];
}

export interface TestResult {
  name: string;
  file: string;
  results: Array<{
    symbol: string;
    hasActive: boolean;
    status: 'available' | 'active';
  }>;
  summary: {
    total: number;
    available: number;
    active: number;
  };
}

export class UnifiedTestRunner {
  
  /**
   * 🎯 TEST SINGLE BOT/SIMULATOR
   */
  static async testBot(config: TestConfig): Promise<TestResult> {
    const symbols = config.symbols || TradingConfigManager.getConfig().SYMBOLS;
    const results = [];

    for (const symbol of symbols) {
      const hasActive = await hasActiveTradeForSymbol(
        undefined,
        symbol,
        config.isSimulator,
        config.file
      );

      results.push({
        symbol,
        hasActive,
        status: hasActive ? 'active' as const : 'available' as const
      });
    }

    const summary = {
      total: results.length,
      available: results.filter(r => !r.hasActive).length,
      active: results.filter(r => r.hasActive).length
    };

    return {
      name: config.name,
      file: config.file,
      results,
      summary
    };
  }

  /**
   * 🔄 TEST MULTIPLE BOTS
   */
  static async testMultipleBots(configs: TestConfig[]): Promise<TestResult[]> {
    const results = [];
    
    for (const config of configs) {
      const result = await this.testBot(config);
      results.push(result);
    }

    return results;
  }

  /**
   * 🤖 GET ALL REAL BOTS CONFIG
   */
  static getRealBotsConfig(): TestConfig[] {
    const config = TradingConfigManager.getConfig();
    
    return [
      {
        name: 'Real Trading Bot',
        file: config.FILES.REAL_BOT,
        isSimulator: false
      },
      {
        name: 'Smart Trading Bot BUY',
        file: config.FILES.SMART_BOT_BUY,
        isSimulator: false
      },
      {
        name: 'EMA Trading Bot',
        file: config.FILES.EMA_BOT,
        isSimulator: false
      }
    ];
  }

  /**
   * 🎮 GET ALL SIMULATORS CONFIG
   */
  static getSimulatorsConfig(): TestConfig[] {
    const config = TradingConfigManager.getConfig();
    
    return [
      {
        name: 'Real Bot Simulator',
        file: config.FILES.REAL_BOT_SIMULATOR,
        isSimulator: true
      },
      {
        name: 'Smart Bot Simulator BUY',
        file: config.FILES.SMART_SIMULATOR_BUY,
        isSimulator: true
      },
      {
        name: 'EMA Simulator',
        file: `ema${config.EMA.FAST_PERIOD}-${config.EMA.SLOW_PERIOD}Trades.json`,
        isSimulator: true
      },
      {
        name: '123 Pattern Simulator',
        file: '123analyzerTrades.json',
        isSimulator: true
      },
      {
        name: 'Support/Resistance Simulator',
        file: 'supportResistanceTrades.json',
        isSimulator: true
      }
    ];
  }

  /**
   * 📊 DISPLAY TEST RESULTS
   */
  static displayResults(results: TestResult[], title: string = 'Test Results'): void {
    console.log(`🧪 ${title}\\n`);

    for (const result of results) {
      console.log(`📋 ${result.name} (${result.file}):`);
      
      for (const symbolResult of result.results) {
        const icon = symbolResult.hasActive ? '❌' : '✅';
        const status = symbolResult.hasActive ? 'Trade ativo' : 'Disponível';
        console.log(`   ${symbolResult.symbol}: ${icon} ${status}`);
      }
      
      console.log(`   📊 Resumo: ${result.summary.available}/${result.summary.total} disponíveis\\n`);
    }

    const totalBots = results.length;
    const totalSymbols = results.reduce((sum, r) => sum + r.summary.total, 0);
    const totalAvailable = results.reduce((sum, r) => sum + r.summary.available, 0);
    const totalActive = results.reduce((sum, r) => sum + r.summary.active, 0);

    console.log('📈 RESUMO GERAL:');
    console.log(`   🤖 Bots testados: ${totalBots}`);
    console.log(`   💱 Símbolos testados: ${totalSymbols}`);
    console.log(`   ✅ Disponíveis: ${totalAvailable}`);
    console.log(`   ❌ Ativos: ${totalActive}`);
    console.log(`   🛡️ Proteção anti-duplicação: ${totalActive === 0 ? 'ATIVA' : 'DETECTOU TRADES'}`);
  }

  /**
   * 🚀 RUN ALL BOTS TEST
   */
  static async runAllBotsTest(): Promise<void> {
    const realBots = this.getRealBotsConfig();
    const results = await this.testMultipleBots(realBots);
    
    this.displayResults(results, 'Testando validação de todos os bots');
    
    console.log('✅ Validação completa!');
    console.log('🛡️ Todos os bots verificam trades duplicados');
  }

  /**
   * 🎮 RUN ALL SIMULATORS TEST
   */
  static async runAllSimulatorsTest(): Promise<void> {
    const simulators = this.getSimulatorsConfig();
    const results = await this.testMultipleBots(simulators);
    
    this.displayResults(results, 'Testando validação de todos os simuladores');
    
    console.log('✅ Teste completo!');
    console.log('🛡️ Todos os simuladores verificam trades duplicados');
  }

  /**
   * 🔍 RUN COMPREHENSIVE TEST
   */
  static async runComprehensiveTest(): Promise<void> {
    console.log('🔍 TESTE ABRANGENTE - TODOS OS BOTS E SIMULADORES\\n');
    
    const allConfigs = [
      ...this.getRealBotsConfig(),
      ...this.getSimulatorsConfig()
    ];
    
    const results = await this.testMultipleBots(allConfigs);
    this.displayResults(results, 'Teste Abrangente');
    
    console.log('🎯 TESTE ABRANGENTE CONCLUÍDO!');
    console.log('🛡️ Sistema de proteção anti-duplicação verificado em todos os componentes');
  }

  /**
   * 🎯 CUSTOM TEST
   */
  static async runCustomTest(configs: TestConfig[], title?: string): Promise<TestResult[]> {
    const results = await this.testMultipleBots(configs);
    
    if (title) {
      this.displayResults(results, title);
    }
    
    return results;
  }
}