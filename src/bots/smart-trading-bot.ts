import { BinancePublicClient } from '../clients/binance-public-client';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { calculateRiskReward } from './utils/trade-validators';
import { logBotHeader, } from './utils/bot-logger';
import { getMarketData } from './utils/market-data-fetcher';
import { analyzeWithDeepSeek } from './utils/deepseek-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import * as dotenv from 'dotenv';
import { validateBinanceKeys } from './utils/env-validator';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';
import { TradeExecutor } from './services/trade-executor';

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
    logBotHeader('SMART TRADING BOT', 'Análise Dupla (EMA + DeepSeek AI)');
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

      // 5. Boost de confiança com validação 2:1 obrigatória
      const boostedDecision = boostConfidence(decision);

      // 6. VALIDAÇÃO FINAL: Garantir que TradeExecutor também valide 2:1
      console.log('🔍 Validação final de Risk/Reward antes da execução...');
      const { riskPercent, rewardPercent } = calculateRiskReward(boostedDecision.confidence);
      console.log(`📊 R/R calculado: ${(rewardPercent * 100).toFixed(1)}%/${(riskPercent * 100).toFixed(1)}% (${(rewardPercent / riskPercent).toFixed(1)}:1)`);

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