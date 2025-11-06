import { BaseTradingBot } from './base-trading-bot';
import { BotFlowManager, BotConfig } from './utils/bot-flow-manager';
import { validateBinanceKeys } from './utils/env-validator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import * as dotenv from 'dotenv';

// 🚀 MÓDULOS UNIFICADOS - Nova arquitetura centralizada
import { UNIFIED_TRADING_CONFIG } from '../shared/config/unified-trading-config';
import { UnifiedDeepSeekAnalyzer } from '../shared/analyzers/unified-deepseek-analyzer';

dotenv.config();

export class RealTradingBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
    
    const config: BotConfig = {
      name: 'Real Trading Bot Simulator',
      isSimulation: true,
      tradesFile: UNIFIED_TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR
    };
    
    this.flowManager = new BotFlowManager(this, config);
  }

  protected logBotInfo() {
    console.log('🚀 NÃO EXECUTA TRADE REAIS\n');
    logBotHeader('REAL TRADING BOT SIMULATOR', 'Simulação do Real Trading Bot Multi-Moeda', true);
  }

  private async analyzeWithRealTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeRealTrade(this.deepseek!, symbol, marketData);
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeWithRealTradeLogic.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const simulator = new RealTradingBotSimulator(apiKey, apiSecret);
    await simulator.executeTrade();
  }

  logBotStartup(
    'Real Trading Bot Simulator',
    '🧪 Simulação do Real Trading Bot com múltiplas moedas + DeepSeek AI',
    5000,
    true
  ).then(() => main());
}
