import { BaseTradingBot } from './base-trading-bot';
import { validateTradingConditions } from './utils/bot-initializer';
import { executeAndSaveTradeWithValidation, handleBotError } from './utils/bot-executor';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { analyzeWithRealTradeDeepSeek } from './utils/real-trade-deepseek-analyzer';
import { validateBinanceKeys } from './utils/env-validator';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';

dotenv.config();

export class RealTradingBot extends BaseTradingBot {
  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL REAL TRADING BOT', 'Análise de Múltiplas Moedas + DeepSeek AI');
  }

  private async analyzeWithRealTradeLogic(analysis: string, symbol: string, price: number) {
    return await analyzeWithRealTradeDeepSeek(this.deepseek!, symbol, { 
      price: { price: price.toString() }, 
      stats: {} 
    });
  }

  async executeTrade() {
    this.logBotInfo();

    try {
      if (!await validateTradingConditions(this.binancePrivate)) {
        return null;
      }

      const symbols = this.getSymbols();
      const bestAnalysis = await analyzeMultipleSymbols(
        symbols, 
        this.binancePublic, 
        this.deepseek!,
        this.analyzeWithRealTradeLogic.bind(this),
        this.binancePrivate,
        false,
        TRADING_CONFIG.FILES.REAL_BOT
      );
      
      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de trade encontrada');
        return null;
      }
      
      const decision = bestAnalysis.decision;
      
      return await executeAndSaveTradeWithValidation(
        decision, 
        this.binancePrivate, 
        TRADING_CONFIG.FILES.REAL_BOT, 
        'REAL'
      );

    } catch (error) {
      return handleBotError('Real Trading Bot', error);
    }
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