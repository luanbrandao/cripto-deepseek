import { BinancePublicClient } from '../../core/clients/binance-public-client';
import { checkActiveSimulationTradesLimit } from '../../bots/utils/validation/simulation-limit-checker';
import { hasActiveTradeForSymbol } from '../../bots/utils/validation/symbol-trade-checker';
import { TRADING_CONFIG } from '../../bots/config/trading-config';
import * as path from 'path';
import { Trade, TradeStorage } from '../../core/utils/trade-storage';
import { UNIFIED_TRADING_CONFIG } from '../../shared/config/unified-trading-config';

interface SymbolAnalysis {
  symbol: string;
  analysis: any;
  score: number;
}

interface Portfolio {
  balance: number;
  crypto: number;
  totalTrades: number;
  winTrades: number;
}

export class TradeSimulator {
  private portfolio: Portfolio;
  private binance: BinancePublicClient;
  private symbol: string;
  private trades: Trade[] = [];
  private tradesFile: string;
  private analyzer: any;

  constructor(analyzer: any, initialBalance: number = 1000, symbols?: string[], tradesFile?: string) {
    this.analyzer = analyzer;
    this.portfolio = {
      balance: initialBalance,
      crypto: 0,
      totalTrades: 0,
      winTrades: 0
    };
    this.binance = new BinancePublicClient();
    this.symbol = symbols ? symbols[0] : TRADING_CONFIG.DEFAULT_SYMBOL;
    const analyzerName = analyzer.name || analyzer.constructor.name;
    this.tradesFile = tradesFile || `${UNIFIED_TRADING_CONFIG.PATHS.TRADES_DIR}/${analyzerName.toLowerCase()}Trades.json`;
  }

  async simulate(symbols: string[] = TRADING_CONFIG.SYMBOLS) {
    console.log(`🎯 Iniciando simulação multi-moeda`);
    console.log(`💰 Saldo inicial: $${this.portfolio.balance}`);
    console.log(`🔍 Analisando ${symbols.length} moedas...\n`);

    if (!checkActiveSimulationTradesLimit(this.tradesFile)) {
      return;
    }

    try {
      const bestAnalysis = await this.analyzeMultipleSymbols(symbols);

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade encontrada - todas as moedas em HOLD');
        return;
      }

      this.symbol = bestAnalysis.symbol;

      const klines = await this.binance.getKlines(this.symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
      const currentPrice = parseFloat(klines[klines.length - 1][4]);

      this.executeTrade(bestAnalysis.analysis, currentPrice);
      this.showResults(currentPrice);

    } catch (error) {
      console.error('❌ Erro na simulação:', error);
    }
  }

  private async analyzeMultipleSymbols(symbols: string[]): Promise<SymbolAnalysis | null> {
    const analyses: SymbolAnalysis[] = [];

    for (const symbol of symbols) {
      try {
        // Verificar se já existe trade ativo para este símbolo
        const fileName = path.basename(this.tradesFile);
        if (await hasActiveTradeForSymbol(undefined, symbol, true, fileName)) {
          console.log(`⏭️ Pulando ${symbol} - simulação já ativa`);
          continue;
        }

        console.log(`\n📊 Analisando ${symbol}...`);

        const klines = await this.binance.getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
        const prices = klines.map((k: any) => parseFloat(k[4]));
        const currentPrice = prices[prices.length - 1];

        let marketData: any;
        const analyzerName = this.analyzer.name || this.analyzer.constructor.name;

        if (analyzerName === 'Analyzer123') {
          const candles = klines.map((k: any) => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4])
          }));
          marketData = { candles, currentPrice };
        } else if (analyzerName === 'SupportResistanceAnalyzer') {
          const candles = klines.map((k: any) => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            timestamp: k[0]
          }));
          marketData = { candles, currentPrice };
        } else {
          marketData = { price24h: prices, currentPrice };
        }

        const analysis = this.analyzer.analyze(marketData);

        let score = 0;
        if (analysis.action === 'BUY' || analysis.action === 'SELL') {
          score = analysis.confidence;
        }

        analyses.push({ symbol, analysis, score });
        console.log(`   ${symbol}: ${analysis.action} (${analysis.confidence}% confiança, score: ${score})`);

      } catch (error) {
        console.log(`   ❌ Erro ao analisar ${symbol}:`, error);
      }
    }

    console.log('\n📋 RESUMO DAS ANÁLISES:');
    console.log('═'.repeat(60));
    analyses.forEach(analysis => {
      const emoji = analysis.analysis.action === 'BUY' ? '🟢' : analysis.analysis.action === 'SELL' ? '🔴' : '⚪';
      console.log(`${emoji} ${analysis.symbol.padEnd(10)} | ${analysis.analysis.action.padEnd(4)} | ${analysis.analysis.confidence}% | ${analysis.analysis.reason}`);
    });
    console.log('═'.repeat(60));

    const validAnalyses = analyses.filter(a => a.analysis.action !== 'HOLD');
    const bestAnalysis = validAnalyses.sort((a, b) => b.score - a.score)[0];

    if (bestAnalysis) {
      console.log('\n🏆 DECISÃO FINAL:');
      console.log(`🎯 VENCEDORA: ${bestAnalysis.symbol} (${bestAnalysis.analysis.action})`);
      console.log(`📊 Confiança: ${bestAnalysis.score}%`);
      console.log(`💡 Motivo da escolha: Maior confiança entre ${validAnalyses.length} oportunidades válidas`);

      if (validAnalyses.length > 1) {
        const secondBest = validAnalyses[1];
        console.log(`📈 Segunda opção: ${secondBest.symbol} (${secondBest.score}% confiança)`);
        console.log(`⚡ Vantagem: +${(bestAnalysis.score - secondBest.score).toFixed(1)}% de confiança`);
      }

      return bestAnalysis;
    }

    return null;
  }

  async simulateSingle() {
    console.log(`🎯 Iniciando simulação para ${this.symbol}`);
    console.log(`💰 Saldo inicial: $${this.portfolio.balance}\n`);

    if (!checkActiveSimulationTradesLimit(this.tradesFile)) {
      return;
    }

    try {
      const klines = await this.binance.getKlines(this.symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];

      let marketData: any;
      const analyzerName = this.analyzer.name || this.analyzer.constructor.name;

      if (analyzerName === 'Analyzer123') {
        const candles = klines.map((k: any) => ({
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4])
        }));
        marketData = { candles, currentPrice };
      } else if (analyzerName === 'SupportResistanceAnalyzer') {
        const candles = klines.map((k: any) => ({
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          timestamp: k[0]
        }));
        marketData = { candles, currentPrice };
      } else {
        marketData = { price24h: prices, currentPrice };
      }

      const analysis = this.analyzer.analyze ? this.analyzer.analyze(marketData) : this.analyzer.analyze(marketData);

      console.log(`📊 Análise: ${analysis.action} (${analysis.confidence}%)`);
      console.log(`📝 Razão: ${analysis.reason}`);

      this.executeTrade(analysis, currentPrice);
      this.showResults(currentPrice);

    } catch (error) {
      console.error('❌ Erro na simulação:', error);
    }
  }

  private executeTrade(analysis: any, currentPrice: number) {
    const amount = analysis.suggested_amount * 100;
    let tradeAmount = 0;

    if (analysis.action === 'BUY' && this.portfolio.balance >= amount) {
      const cryptoAmount = amount / currentPrice;
      this.portfolio.balance -= amount;
      this.portfolio.crypto += cryptoAmount;
      this.portfolio.totalTrades++;
      tradeAmount = amount;
      console.log(`🟢 COMPRA: $${amount} (${cryptoAmount.toFixed(6)} crypto)`);
      // Calcular preços com Risk/Reward 2:1
      const riskPercent = analysis.confidence >= 80 ? 0.5 : analysis.confidence >= 75 ? 1.0 : 1.5;
      const targetPrice = currentPrice * (1 + (riskPercent * 2) / 100);
      const stopPrice = currentPrice * (1 - riskPercent / 100);
      console.log(`🎯 Alvo: $${targetPrice.toFixed(2)} | 🛑 Stop: $${stopPrice.toFixed(2)}`);
    } else if (analysis.action === 'SELL' && this.portfolio.crypto > 0) {
      const sellValue = this.portfolio.crypto * currentPrice;
      this.portfolio.balance += sellValue;
      tradeAmount = sellValue;
      this.portfolio.crypto = 0;
      this.portfolio.totalTrades++;
      console.log(`🔴 VENDA: $${sellValue.toFixed(2)}`);
      // Calcular preços com Risk/Reward 2:1
      const riskPercent = analysis.confidence >= 80 ? 0.5 : analysis.confidence >= 75 ? 1.0 : 1.5;
      const targetPrice = currentPrice * (1 - (riskPercent * 2) / 100);
      const stopPrice = currentPrice * (1 + riskPercent / 100);
      console.log(`🎯 Alvo: $${targetPrice.toFixed(2)} | 🛑 Stop: $${stopPrice.toFixed(2)}`);
    } else {
      console.log(`⏸️ HOLD: Mantendo posição`);
      console.log(`📊 Preço atual: $${currentPrice.toFixed(2)}`);
      return; // Não salva trades HOLD
    }

    // Usar sistema de Risk/Reward 2:1 baseado na confiança
    const riskPercent = analysis.confidence >= 80 ? 0.5 : analysis.confidence >= 75 ? 1.0 : 1.5;

    let targetPrice: number;
    let stopPrice: number;

    if (analysis.action === 'BUY') {
      targetPrice = currentPrice * (1 + (riskPercent * 2) / 100);  // Reward = 2x Risk
      stopPrice = currentPrice * (1 - riskPercent / 100);
    } else {
      targetPrice = currentPrice * (1 - (riskPercent * 2) / 100);  // Reward = 2x Risk
      stopPrice = currentPrice * (1 + riskPercent / 100);
    }

    const potentialGain = Math.abs(targetPrice - currentPrice);
    const potentialLoss = Math.abs(stopPrice - currentPrice);
    const riskRewardRatio = potentialGain / potentialLoss;

    const trade: Trade = {
      timestamp: new Date().toISOString(),
      symbol: this.symbol,
      action: analysis.action,
      price: currentPrice,
      entryPrice: currentPrice,
      targetPrice: targetPrice,
      stopPrice: stopPrice,
      amount: tradeAmount,
      balance: this.portfolio.balance,
      crypto: this.portfolio.crypto,
      reason: analysis.reason,
      confidence: analysis.confidence,
      status: 'pending',
      riskReturn: {
        potentialGain: potentialGain,
        potentialLoss: potentialLoss,
        riskRewardRatio: riskRewardRatio
      }
    };

    this.trades.push(trade);
    TradeStorage.saveTrades([trade], this.tradesFile);
    console.log(`💾 Trade simulado salvo: ${this.symbol} ${analysis.action}`);
  }

  private showResults(currentPrice: number) {
    const totalValue = this.portfolio.balance + (this.portfolio.crypto * currentPrice);
    const profit = totalValue - 1000;
    const profitPercent = (profit / 1000) * 100;

    console.log('\n📊 RESULTADO DA SIMULAÇÃO:');
    console.log('═'.repeat(40));
    console.log(`💰 Saldo em USD: $${this.portfolio.balance.toFixed(2)}`);
    console.log(`🪙 Crypto: ${this.portfolio.crypto.toFixed(6)}`);
    console.log(`💎 Valor total: $${totalValue.toFixed(2)}`);
    console.log(`📈 Lucro/Prejuízo: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);
    console.log(`🔢 Total de trades: ${this.portfolio.totalTrades}`);
    console.log('═'.repeat(40));
  }
}