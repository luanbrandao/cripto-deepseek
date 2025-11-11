import * as dotenv from 'dotenv';
import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';

dotenv.config();

export class RealTradingBot extends BaseTradingBot {
  private flowManager: BotFlowManager;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);

    const config: BotConfig = {
      name: 'Real Trading Bot',
      isSimulation: false,
      tradesFile: TradingConfigManager.getConfig().FILES.REAL_BOT
    };

    this.flowManager = new BotFlowManager(this, config);
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL REAL TRADING BOT v3.0 - REFATORADO', 'Análise de Múltiplas Moedas + DeepSeek AI');
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
    const realBot = new RealTradingBot(apiKey, apiSecret);
    await realBot.executeTrade();
  }

  logBotStartup(
    'Real Trading Bot',
    '💰 Certifique-se de que entende os riscos envolvidos'
  ).then(() => main());
}