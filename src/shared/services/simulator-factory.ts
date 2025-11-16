/**
 * 🏭 SIMULATOR FACTORY
 * Unified factory for all trading bot simulators
 */

import { BaseTradingBot } from '../../bots/core/base-trading-bot';
import { TradingConfigManager } from '../config/trading-config-manager';
import { UnifiedTestRunner } from './unified-test-runner';

export type SimulatorType = 
  | 'real-bot' 
  | 'smart-bot-buy' 
  | 'smart-bot-sell'
  | 'ema-bot'
  | 'elite-bot'
  | 'smart-entry'
  | 'support-resistance'
  | 'multi-smart-buy'
  | 'multi-smart-sell';

export interface SimulatorConfig {
  type: SimulatorType;
  name: string;
  tradesFile: string;
  symbols?: string[];
}

export interface SimulatorResult {
  success: boolean;
  summary: {
    analyzed: number;
    executed: number;
    skipped: number;
  };
  errors?: string[];
}

export class SimulatorFactory {
  private static configs = new Map<SimulatorType, SimulatorConfig>();

  static {
    const config = TradingConfigManager.getConfig();
    
    this.configs.set('real-bot', {
      type: 'real-bot',
      name: 'Real Trading Bot Simulator',
      tradesFile: config.FILES.REAL_BOT_SIMULATOR
    });

    this.configs.set('smart-bot-buy', {
      type: 'smart-bot-buy',
      name: 'Smart Trading Bot BUY Simulator',
      tradesFile: config.FILES.SMART_SIMULATOR_BUY
    });

    this.configs.set('ema-bot', {
      type: 'ema-bot',
      name: 'EMA Trading Bot Simulator',
      tradesFile: `ema${config.EMA.FAST_PERIOD}-${config.EMA.SLOW_PERIOD}Trades.json`
    });

    this.configs.set('support-resistance', {
      type: 'support-resistance',
      name: 'Support/Resistance Bot Simulator',
      tradesFile: 'supportResistanceTrades.json'
    });

    this.configs.set('smart-entry', {
      type: 'smart-entry',
      name: 'Smart Entry Bot Simulator',
      tradesFile: 'smartEntryOrders.json'
    });

    this.configs.set('multi-smart-buy', {
      type: 'multi-smart-buy',
      name: 'Multi-Smart Trading Bot BUY Simulator',
      tradesFile: config.FILES.MULTI_SMART_SIMULATOR_BUY
    });

    this.configs.set('smart-bot-sell', {
      type: 'smart-bot-sell',
      name: 'Smart Trading Bot SELL Simulator',
      tradesFile: config.FILES.SMART_SIMULATOR_SELL
    });

    this.configs.set('multi-smart-sell', {
      type: 'multi-smart-sell',
      name: 'Multi-Smart Trading Bot SELL Simulator',
      tradesFile: config.FILES.MULTI_SMART_SIMULATOR_SELL
    });

    this.configs.set('elite-bot', {
      type: 'elite-bot',
      name: 'Elite Trading Bot Simulator',
      tradesFile: config.FILES.ELITE_SIMULATOR || 'eliteTradingBotSimulator.json'
    });
  }

  /**
   * 🔄 RUN SIMULATOR
   */
  static async runSimulator(type: SimulatorType): Promise<SimulatorResult> {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`Unknown simulator type: ${type}`);
    }

    console.log(`🚀 Running ${config.name}...`);
    
    try {
      // Dynamic execution based on type
      switch (type) {
        case 'real-bot':
          const { RealTradingBotSimulator } = await import('../../bots/execution/simulators/real-trading-bot-simulator');
          const realBot = new RealTradingBotSimulator('', '');
          await realBot.executeTrade();
          break;

        case 'smart-bot-buy':
          const { SmartTradingBotSimulatorBuy } = await import('../../bots/execution/simulators/smart-trading-bot-simulator-buy');
          const smartBot = new SmartTradingBotSimulatorBuy();
          await smartBot.executeTrade();
          break;

        case 'ema-bot':
          const { EmaTradingBotSimulator } = await import('../../bots/execution/simulators/ema-trading-bot-simulator');
          const emaBot = new EmaTradingBotSimulator();
          await emaBot.executeTrade();
          break;

        case 'smart-entry':
          const { SmartEntryBotSimulator } = await import('../../bots/execution/simulators/smart-entry-bot-simulator');
          const entryBot = new SmartEntryBotSimulator();
          await entryBot.executeTrade();
          break;

        case 'multi-smart-buy':
          const { MultiSmartTradingBotSimulatorBuy } = await import('../../bots/execution/simulators/multi-smart-trading-bot-simulator-buy');
          const multiSmartBot = new MultiSmartTradingBotSimulatorBuy();
          await multiSmartBot.executeTrade();
          break;

        case 'support-resistance':
          const { SupportResistanceBotSimulator } = await import('../../bots/execution/simulators/support-resistance-bot-simulator');
          const srBot = new SupportResistanceBotSimulator();
          await srBot.executeTrade();
          break;

        case 'smart-bot-sell':
          const { SmartTradingBotSimulatorSell } = await import('../../bots/execution/simulators/smart-trading-bot-simulator-sell');
          const smartSellBot = new SmartTradingBotSimulatorSell();
          await smartSellBot.executeTrade();
          break;

        case 'multi-smart-sell':
          const { MultiSmartTradingBotSimulatorSell } = await import('../../bots/execution/simulators/multi-smart-trading-bot-simulator-sell');
          const multiSmartSellBot = new MultiSmartTradingBotSimulatorSell();
          await multiSmartSellBot.executeTrade();
          break;

        case 'elite-bot':
          const { EliteTradingBotSimulator } = await import('../../bots/execution/simulators/elite-trading-bot-simulator');
          const eliteBot = new EliteTradingBotSimulator('', '');
          await eliteBot.executeTrade();
          break;

        default:
          throw new Error(`Simulator type ${type} not implemented`);
      }

      return {
        success: true,
        summary: { analyzed: 1, executed: 1, skipped: 0 }
      };

    } catch (error) {
      return {
        success: false,
        summary: { analyzed: 0, executed: 0, skipped: 1 },
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 🔄 RUN MULTIPLE SIMULATORS
   */
  static async runMultipleSimulators(types: SimulatorType[]): Promise<Map<SimulatorType, SimulatorResult>> {
    const results = new Map<SimulatorType, SimulatorResult>();

    for (const type of types) {
      const result = await this.runSimulator(type);
      results.set(type, result);
    }

    return results;
  }

  /**
   * 🧪 RUN ALL SIMULATORS
   */
  static async runAllSimulators(): Promise<void> {
    const allTypes: SimulatorType[] = [
      'real-bot', 
      'smart-bot-buy', 
      'smart-bot-sell',
      'ema-bot', 
      'elite-bot',
      'smart-entry', 
      'multi-smart-buy', 
      'multi-smart-sell',
      'support-resistance'
    ];
    
    console.log('🧪 RUNNING ALL SIMULATORS\n');
    
    const results = await this.runMultipleSimulators(allTypes);
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const [type, result] of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${type}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) totalSuccess++;
      else totalFailed++;
    }
    
    console.log(`\n🎯 Total: ${totalSuccess} successful, ${totalFailed} failed`);
  }

  /**
   * 🎯 GET AVAILABLE SIMULATORS
   */
  static getAvailableSimulators(): SimulatorType[] {
    return Array.from(this.configs.keys());
  }
}