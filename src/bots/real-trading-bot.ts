import { AnalysisParser } from './services/analysis-parser';
import { calculateRiskReward } from './utils/trade-validators';
import { initializeBotClients, validateTradingConditions } from './utils/bot-initializer';
import { executeAndSaveTradeWithValidation, handleBotError } from './utils/bot-executor';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const clients = await initializeBotClients();
  if (!clients) return;

  const { binancePublic, binancePrivate, deepseek } = clients;

  logBotHeader('MULTI-SYMBOL REAL TRADING BOT', 'Análise de Múltiplas Moedas + DeepSeek AI');

  try {
    if (!await validateTradingConditions(binancePrivate)) {
      return;
    }

    const symbols = TRADING_CONFIG.SYMBOLS;
    const bestAnalysis = await analyzeMultipleSymbols(
      symbols, 
      binancePublic, 
      deepseek,
      AnalysisParser.parseDeepSeekAnalysis
    );
    
    if (!bestAnalysis) {
      console.log('\n⏸️ Nenhuma oportunidade de trade encontrada');
      return;
    }
    
    const decision = bestAnalysis.decision;
    
    const orderResult = await executeAndSaveTradeWithValidation(
      decision, 
      binancePrivate, 
      TRADING_CONFIG.FILES.REAL_BOT, 
      'REAL'
    );

  } catch (error) {
    handleBotError('Trading Bot', error);
  }
}

logBotStartup(
  'Real Trading Bot',
  '💰 Certifique-se de que entende os riscos envolvidos'
).then(() => main());