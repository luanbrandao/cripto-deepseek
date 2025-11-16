/**
 * ⏰ UNIFIED CRON SERVICE
 * Consolidates all cron job patterns into a single service
 */

import cron from 'node-cron';
import { TradingConfigManager } from '../config/trading-config-manager';
import { validateBinanceKeys } from '../../bots/utils/validation/env-validator';

export type BotType = 'smart-bot-buy' | 'smart-bot-simulator-buy' | 'real-bot-simulator';

export interface CronConfig {
  botType: BotType;
  name: string;
  intervalMinutes?: number;
  requiresKeys?: boolean;
}

export class UnifiedCronService {
  private static jobs = new Map<string, any>();
  private static configs = new Map<BotType, CronConfig>();

  static {
    // Initialize default configurations
    this.configs.set('smart-bot-buy', {
      botType: 'smart-bot-buy',
      name: 'Smart Trading Bot BUY',
      requiresKeys: true
    });

    this.configs.set('smart-bot-simulator-buy', {
      botType: 'smart-bot-simulator-buy',
      name: 'Smart Trading Bot Simulator BUY',
      requiresKeys: false
    });

    this.configs.set('real-bot-simulator', {
      botType: 'real-bot-simulator',
      name: 'Real Trading Bot Simulator',
      requiresKeys: false
    });
  }

  /**
   * 🚀 START CRON JOB
   */
  static startCronJob(botType: BotType, customConfig?: Partial<CronConfig>): boolean {
    const baseConfig = this.configs.get(botType);
    if (!baseConfig) {
      console.error(`❌ Unknown bot type: ${botType}`);
      return false;
    }
    const config = { ...baseConfig, ...customConfig };

    // Validate requirements
    if (config.requiresKeys) {
      const keys = validateBinanceKeys();
      if (!keys) {
        console.error('❌ Chaves da Binance não configuradas. Encerrando...');
        return false;
      }
    }

    const intervalMinutes = config.intervalMinutes || TradingConfigManager.getConfig().TRADE_COOLDOWN_MINUTES;
    const cronExpression = `*/${intervalMinutes} * * * *`;

    console.log(`🤖 ${config.name} Cron iniciado - Execução a cada ${intervalMinutes} minutos`);

    const job = cron.schedule(cronExpression, async () => {
      await this.executeCronCycle(botType, config);
    });

    this.jobs.set(botType, job);

    // Setup graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\\n🛑 Encerrando ${config.name} Cron...`);
      this.stopCronJob(botType);
      process.exit(0);
    });

    console.log('✅ Cron job configurado. Pressione Ctrl+C para parar.');
    return true;
  }

  /**
   * 🔄 EXECUTE CRON CYCLE
   */
  private static async executeCronCycle(botType: BotType, config: CronConfig): Promise<void> {
    const timestamp = new Date().toLocaleString('pt-BR');
    console.log(`\\n⏰ [${timestamp}] Executando ${config.name}...`);

    try {
      let bot: any;
      let tradeResult: any;

      // Dynamic bot creation based on type
      switch (botType) {
        case 'smart-bot-buy':
          const { SmartTradingBotBuy } = await import('../../bots/execution/real/smart-trading-bot-buy');
          const keys = validateBinanceKeys();
          if (!keys) throw new Error('Binance keys not configured');
          bot = new SmartTradingBotBuy(keys.apiKey, keys.apiSecret);
          break;

        case 'smart-bot-simulator-buy':
          const { SmartTradingBotSimulatorBuy } = await import('../../bots/execution/simulators/smart-trading-bot-simulator-buy');
          bot = new SmartTradingBotSimulatorBuy();
          break;

        case 'real-bot-simulator':
          const { RealTradingBotSimulator } = await import('../../bots/execution/simulators/real-trading-bot-simulator');
          bot = new RealTradingBotSimulator('', '');
          break;

        default:
          throw new Error(`Bot type ${botType} not implemented`);
      }

      tradeResult = await bot.executeTrade();

      if (tradeResult) {
        const tradeType = config.requiresKeys ? 'real' : 'simulado';
        console.log(`📊 Trade ${tradeType} executado com sucesso`);
      } else {
        const tradeType = config.requiresKeys ? '' : 'simulado ';
        console.log(`⚠️ Nenhum trade ${tradeType}executado neste ciclo`);
      }

      console.log(`✅ [${timestamp}] Ciclo completo finalizado\\n`);

    } catch (error) {
      console.error(`❌ [${timestamp}] Erro no ciclo:`, error);
      console.log('⏳ Aguardando próximo ciclo...\\n');
    }
  }

  /**
   * 🛑 STOP CRON JOB
   */
  static stopCronJob(botType: BotType): boolean {
    const job = this.jobs.get(botType);
    if (job) {
      job.stop();
      this.jobs.delete(botType);
      console.log(`🛑 Cron job ${botType} parado`);
      return true;
    }
    return false;
  }

  /**
   * 🛑 STOP ALL CRON JOBS
   */
  static stopAllCronJobs(): void {
    for (const [botType, job] of this.jobs) {
      job.stop();
      console.log(`🛑 Cron job ${botType} parado`);
    }
    this.jobs.clear();
  }

  /**
   * 📊 GET ACTIVE JOBS
   */
  static getActiveJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * 🔧 UPDATE CRON CONFIG
   */
  static updateCronConfig(botType: BotType, updates: Partial<CronConfig>): void {
    const existing = this.configs.get(botType);
    if (existing) {
      this.configs.set(botType, { ...existing, ...updates });
    }
  }

  /**
   * 🚀 START MULTIPLE CRON JOBS
   */
  static startMultipleCronJobs(botTypes: BotType[]): Map<BotType, boolean> {
    const results = new Map<BotType, boolean>();

    for (const botType of botTypes) {
      const success = this.startCronJob(botType);
      results.set(botType, success);
    }

    return results;
  }
}