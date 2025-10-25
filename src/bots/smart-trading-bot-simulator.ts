import { BinancePublicClient } from '../clients/binance-public-client';
import { DeepSeekService } from '../clients/deepseek-client';
import { AnalysisParser } from './services/analysis-parser';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { logMarketInfo } from './utils/market-data-logger';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import * as path from 'path';

class SmartTradingBotSimulator {
  private binancePublic: BinancePublicClient;
  private deepseek: DeepSeekService;
  private trendAnalyzer: MarketTrendAnalyzer;

  constructor() {
    this.binancePublic = new BinancePublicClient();
    this.deepseek = new DeepSeekService();
    this.trendAnalyzer = new MarketTrendAnalyzer();
  }

  private logBotInfo() {
    console.log('🚀 SMART TRADING BOT SIMULATOR - ANÁLISE DUPLA (EMA + DEEPSEEK AI)');
    console.log('✅ MODO SIMULAÇÃO - Nenhuma ordem real será executada');
    console.log(`💵 Valor simulado por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%\n`);
  }

  private async getMarketData(symbol: string) {
    const price = await this.binancePublic.getPrice(symbol);
    const stats = await this.binancePublic.get24hrStats(symbol);
    const klines = await this.binancePublic.getKlines(symbol, '1h', 24);

    logMarketInfo(symbol, price, stats);
    
    return { price, stats, klines };
  }



  private async analyzeWithDeepSeek(symbol: string, marketData: any) {
    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    
    const analysis = await this.deepseek.analyzeMarket(
      marketData,
      `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`
    );

    console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
    console.log(analysis.substring(0, 500) + '...');

    return await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(marketData.price.price));
  }

  private validateTrendAnalysis(trendAnalysis: any): boolean {
    if (!trendAnalysis.isUptrend) {
      console.log('❌ MERCADO NÃO ESTÁ EM TENDÊNCIA DE ALTA');
      console.log('⏸️ Simulação cancelada - aguardando condições favoráveis');
      console.log(`💭 Razão: ${trendAnalysis.reason}\n`);
      return false;
    }

    console.log('✅ TENDÊNCIA DE ALTA CONFIRMADA PELO EMA');
    console.log('🎯 Prosseguindo com análise DeepSeek AI...\n');
    return true;
  }

  private validateDeepSeekDecision(decision: any): boolean {
    if (decision.action !== 'BUY') {
      console.log('⏸️ DeepSeek não recomenda compra - aguardando');
      return false;
    }
    return true;
  }

  private boostConfidence(decision: any) {
    const boostedConfidence = Math.min(95, decision.confidence + 10);
    decision.confidence = boostedConfidence;
    decision.reason = `${decision.reason} + Tendência de alta confirmada pelo EMA`;
    
    console.log('🎯 DUPLA CONFIRMAÇÃO: EMA + DEEPSEEK AI APROVAM COMPRA!');
    return decision;
  }

  private simulateTradeExecution(decision: any) {
    console.log('\n🚨 SIMULANDO EXECUÇÃO DE ORDEM');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} - $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
    console.log(`📊 Confiança final: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    // Simular resultado da ordem
    const simulatedOrder = {
      orderId: 'SIM_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED',
      executedQty: (TRADING_CONFIG.TRADE_AMOUNT_USD / decision.price).toFixed(6)
    };

    console.log('✅ Ordem simulada com sucesso!');
    console.log(`🆔 ID simulado: ${simulatedOrder.orderId}`);
    console.log(`💱 Qtd simulada: ${simulatedOrder.executedQty}`);
    console.log(`💰 Preço: $${decision.price}`);

    return simulatedOrder;
  }

  private async simulateAndSave(decision: any) {
    const simulatedOrder = this.simulateTradeExecution(decision);
    await this.saveTradeHistory(decision, simulatedOrder);

    console.log('\n🎯 SMART TRADE SIMULADO COM SUCESSO!');
    console.log('📊 Análise completa salva no histórico');
    console.log('✅ Nenhuma ordem real foi executada');

    return simulatedOrder;
  }

  async simulateTrade(symbol: string = 'BTCUSDT') {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, 'trades/smartTradingBotSimulator.json');
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    try {
      // 1. Verificar tendência com EMA
      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
      if (!this.validateTrendAnalysis(trendAnalysis)) {
        return null;
      }

      // 2. Obter dados de mercado e analisar com DeepSeek
      const marketData = await this.getMarketData(symbol);
      const decision = await this.analyzeWithDeepSeek(symbol, marketData);

      // 3. Validar decisão do DeepSeek
      if (!this.validateDeepSeekDecision(decision)) {
        return null;
      }

      // 4. Boost de confiança e simular trade
      const boostedDecision = this.boostConfidence(decision);
      return await this.simulateAndSave(boostedDecision);

    } catch (error) {
      console.error('❌ Erro no Smart Trading Bot Simulator:', error);
      return null;
    }
  }

  private async saveTradeHistory(decision: any, simulatedOrder: any) {
    const trade = createTradeRecord(decision, simulatedOrder, 'smartTradingBotSimulator.json');
    saveTradeHistory(trade, 'smartTradingBotSimulator.json');
  }
}

async function main() {
  const smartBotSimulator = new SmartTradingBotSimulator();
  await smartBotSimulator.simulateTrade('BTCUSDT');
}

console.log('🧪 SMART TRADING BOT SIMULATOR');
console.log('✅ Modo seguro - Apenas simulação, sem trades reais');
console.log('🧠 Análise dupla: EMA + DeepSeek AI');
console.log('⏳ Iniciando em 3 segundos...');

setTimeout(() => {
  main();
}, 3000);