import { AnalysisParser } from './bots/services/analysis-parser';
import { RiskManager } from './bots/services/risk-manager';
import * as path from 'path';
import { Trade, TradeStorage } from './core/utils/trade-storage';
import { BinancePublicClient } from './core/clients/binance-public-client';
import { DeepSeekService } from './core/clients/deepseek-client';
import TradingConfigManager from './shared/config/trading-config-manager';

async function main() {
  const binancePublic = new BinancePublicClient();
  const deepseek = new DeepSeekService();

  console.log('🚀 ANÁLISE DE MERCADO COM DEEPSEEK AI e API public da Binance');

  try {
    const symbol = TradingConfigManager.getConfig().DEFAULT_SYMBOL;
    const price = await binancePublic.getPrice(symbol);
    const stats = await binancePublic.get24hrStats(symbol);
    const klines = await binancePublic.getKlines(symbol, TradingConfigManager.getConfig().CHART.TIMEFRAME, 24);

    console.log(`💰 ${symbol}: $${parseFloat(price.price).toLocaleString()}`);
    console.log(`📈 Variação 24h: ${parseFloat(stats.priceChangePercent).toFixed(2)}%`);
    console.log(`📊 Volume 24h: ${parseFloat(stats.volume).toLocaleString()} ${symbol}`);

    console.log('\n🧠 Analisando mercado com DeepSeek AI...');
    const analysis = await deepseek.analyzeMarket(
      { price, stats, klines },
      `Analyze ${symbol} market data including 24h klines. Provide a CLEAR trading recommendation: BUY, SELL, or HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators.`
    );

    console.log('\n📋 Análise DeepSeek (primeiros 500 chars):');
    console.log(analysis.substring(0, 500) + '...');

    const decision = await AnalysisParser.parseDeepSeekAnalysis(analysis, symbol, parseFloat(price.price));
    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);

    console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);
    console.log(`📊 Risk/Reward: ${(rewardPercent * 100).toFixed(1)}%/${(riskPercent * 100).toFixed(1)}% (${(rewardPercent / riskPercent).toFixed(1)}:1)`);

    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: decision.symbol,
      action: decision.action,
      price: decision.price,
      entryPrice: decision.price,
      targetPrice: decision.action === 'BUY' ? decision.price * (1 + rewardPercent) : decision.price * (1 - rewardPercent),
      stopPrice: decision.action === 'BUY' ? decision.price * (1 - riskPercent) : decision.price * (1 + riskPercent),
      amount: 0,
      balance: 0,
      crypto: 0,
      reason: decision.reason,
      confidence: decision.confidence,
      status: 'pending',
      riskReturn: {
        potentialGain: decision.price * rewardPercent,
        potentialLoss: decision.price * riskPercent,
        riskRewardRatio: rewardPercent / riskPercent
      },
      result: undefined,
      exitPrice: decision.price,
      actualReturn: 0
    };

    const tradesFile = `${TradingConfigManager.getConfig().PATHS.TRADES_DIR}/deepseekAnalysis.json`;
    TradeStorage.saveTrades([trade], tradesFile);
    console.log('\n💾 Análise salva no histórico: deepseekAnalysis.json');

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  main();
}