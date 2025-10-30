import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { TradeExecutor } from './services/trade-executor';
import { AnalysisParser } from './services/analysis-parser';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';
import { getMarketData } from './utils/market-data-fetcher';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { validateBinanceKeys } from './utils/env-validator';
import { analyzeWithDeepSeek } from './utils/deepseek-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import * as dotenv from 'dotenv';

dotenv.config();

class SmartTradingBot {
  private binancePublic: BinancePublicClient;
  private binancePrivate: BinancePrivateClient;
  private deepseek: DeepSeekService;
  private trendAnalyzer: MarketTrendAnalyzer;

  constructor(apiKey: string, apiSecret: string) {
    this.binancePublic = new BinancePublicClient();
    this.binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
    this.deepseek = new DeepSeekService();
    this.trendAnalyzer = new MarketTrendAnalyzer();
  }


  private logBotInfo() {
    console.log('🚀 SMART TRADING BOT - ANÁLISE DUPLA (EMA + DEEPSEEK AI)');
    console.log('⚠️  ATENÇÃO: Este bot executará ordens reais na Binance!');
    console.log(`💵 Valor por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%\n`);
  }

  private async executeAndSave(decision: any) {
    const orderResult = await TradeExecutor.executeRealTrade(decision, this.binancePrivate);
    await this.saveTradeHistory(decision, orderResult);

    if (orderResult) {
      console.log('\n🎯 SMART TRADE EXECUTADO COM SUCESSO!');
      console.log('📱 Monitore a posição');
      console.log('⚠️  Trading automatizado envolve riscos!');
    }

    return orderResult;
  }

  async executeTrade(symbol: string = 'BTCUSDT') {
    this.logBotInfo();

    try {
      // 1. Verificar trades ativos
      if (!await checkActiveTradesLimit(this.binancePrivate)) {
        return null;
      }

      // 2. Verificar tendência com EMA
      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
      if (!validateTrendAnalysis(trendAnalysis)) {
        return null;
      }

      // 3. Obter dados de mercado e analisar com DeepSeek
      const marketData = await getMarketData(this.binancePublic, symbol);
      const decision = await analyzeWithDeepSeek(this.deepseek, symbol, marketData);

      // 4. Validar decisão do DeepSeek
      if (!validateDeepSeekDecision(decision)) {
        return null;
      }

      // 5. Boost de confiança e executar trade
      const boostedDecision = boostConfidence(decision);
      return await this.executeAndSave(boostedDecision);

    } catch (error) {
      console.error('❌ Erro no Smart Trading Bot:', error);
      return null;
    }
  }

  private async saveTradeHistory(decision: any, orderResult: any) {
    const trade = createTradeRecord(decision, orderResult, 'smartTradingBot.json');
    saveTradeHistory(trade, 'smartTradingBot.json');
  }
}

async function main() {
  const keys = validateBinanceKeys();
  if (!keys) return;

  const { apiKey, apiSecret } = keys;

  const smartBot = new SmartTradingBot(apiKey, apiSecret);
  await smartBot.executeTrade('BTCUSDT');
}

console.log('⚠️  ATENÇÃO: Smart Bot executará ordens REAIS na Binance!');
console.log('🧠 Análise dupla: EMA + DeepSeek AI para máxima precisão');
console.log('🛑 Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');

setTimeout(() => {
  main();
}, 5000);