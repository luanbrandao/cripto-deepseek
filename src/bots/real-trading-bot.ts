import { BaseTradingBot } from './base-trading-bot';
import { BotFlowManager, BotConfig } from './utils/bot-flow-manager';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { analyzeWithRealTrade } from './analyzers/real-trade-analyzer';
import { validateBinanceKeys } from './utils/env-validator';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';

dotenv.config();

export class RealTradingBot extends BaseTradingBot {
  private flowManager: BotFlowManager;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
    
    const config: BotConfig = {
      name: 'Real Trading Bot',
      isSimulation: false,
      tradesFile: TRADING_CONFIG.FILES.REAL_BOT
    };
    
    this.flowManager = new BotFlowManager(this, config);
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL REAL TRADING BOT', 'Análise de Múltiplas Moedas + DeepSeek AI');
  }

  private async analyzeWithRealTradeLogic(symbol: string, marketData: any) {
    return await analyzeWithRealTrade(this.deepseek!, symbol, marketData);
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
  async function main() {
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