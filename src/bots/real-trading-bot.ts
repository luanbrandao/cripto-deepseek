import { AnalysisParser } from './services/analysis-parser';
import { calculateRiskReward } from './utils/trade-validators';
import { initializeBotClients, validateTradingConditions } from './utils/bot-initializer';
import { executeAndSaveTradeWithValidation, handleBotError } from './utils/bot-executor';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { getMarketData } from './utils/market-data-fetcher';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const clients = await initializeBotClients();
  if (!clients) return;

  const { binancePublic, binancePrivate, deepseek } = clients;

  logBotHeader('BOT DE TRADING REAL COM DEEPSEEK AI', 'Análise de IA + Execução Real');

  try {
    if (!await validateTradingConditions(binancePrivate)) {
      return;
    }

    const symbol = 'BNBUSDT';
    const { price, stats, klines } = await getMarketData(binancePublic, symbol);

    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    const analysis = await deepseek.analyzeMarket(
      { price, stats, klines },
      `Analyze ${symbol} market data including 24h klines. Provide a CLEAR trading recommendation: BUY, SELL, or HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators.`
    );

    console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
    console.log(analysis.substring(0, 500) + '...');

    const decision = await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(price.price));
    
    const orderResult = await executeAndSaveTradeWithValidation(
      decision, 
      binancePrivate, 
      'realTradingBot.json', 
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