import { BinancePublicClient } from '../clients/binance-public-client';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { checkActiveSimulationTradesLimit } from '../bots/utils/simulation-limit-checker';
import { TRADING_CONFIG } from '../bots/config/trading-config';
import * as path from 'path';

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
    this.tradesFile = tradesFile || path.join(__dirname, `../trades/${analyzerName.toLowerCase()}Trades.json`);
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
      
      // Executar trade da melhor oportunidade
      const klines = await this.binance.getKlines(this.symbol, '1h', 50);
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
        console.log(`\n📊 Analisando ${symbol}...`);
        
        // Obter dados históricos
        const klines = await this.binance.getKlines(symbol, '1h', 50);
        const prices = klines.map((k: any) => parseFloat(k[4]));
        const currentPrice = prices[prices.length - 1];

        // Preparar dados baseado no tipo de analisador
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
        } else {
          marketData = { price24h: prices, currentPrice };
        }

        // Analisar mercado
        const analysis = this.analyzer.analyze(marketData);
        
        // Calcular score
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
    
    // Log resumo
    console.log('\n📋 RESUMO DAS ANÁLISES:');
    console.log('═'.repeat(60));
    analyses.forEach(analysis => {
      const emoji = analysis.analysis.action === 'BUY' ? '🟢' : analysis.analysis.action === 'SELL' ? '🔴' : '⚪';
      console.log(`${emoji} ${analysis.symbol.padEnd(10)} | ${analysis.analysis.action.padEnd(4)} | ${analysis.analysis.confidence}% | ${analysis.analysis.reason}`);
    });
    console.log('═'.repeat(60));
    
    // Encontrar melhor oportunidade
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

  // Método legado para compatibilidade
  async simulateSingle() {
    console.log(`🎯 Iniciando simulação para ${this.symbol}`);
    console.log(`💰 Saldo inicial: $${this.portfolio.balance}\n`);

    if (!checkActiveSimulationTradesLimit(this.tradesFile)) {
      return;
    }

    try {
      // Obter dados históricos
      const klines = await this.binance.getKlines(this.symbol, '1h', 50);
      const prices = klines.map((k: any) => parseFloat(k[4])); // Close prices
      const currentPrice = prices[prices.length - 1];

      // Preparar dados baseado no tipo de analisador
      let marketData: any;
      const analyzerName = this.analyzer.name || this.analyzer.constructor.name;
      
      if (analyzerName === 'Analyzer123') {
        // Dados para 123Analyzer (candles OHLC)
        const candles = klines.map((k: any) => ({
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4])
        }));
        marketData = { candles, currentPrice };
      } else {
        // Dados para SimpleAnalyzer e EmaAnalyzer (apenas preços)
        marketData = { price24h: prices, currentPrice };
      }

      // Analisar mercado
      const analysis = this.analyzer.analyze ? this.analyzer.analyze(marketData) : this.analyzer.analyze(marketData);

      console.log(`📊 Análise: ${analysis.action} (${analysis.confidence}%)`);
      console.log(`📝 Razão: ${analysis.reason}`);

      // Executar trade
      this.executeTrade(analysis, currentPrice);

      // Mostrar resultado
      this.showResults(currentPrice);

    } catch (error) {
      console.error('❌ Erro na simulação:', error);
    }
  }

  private executeTrade(analysis: any, currentPrice: number) {
    const amount = analysis.suggested_amount * 100; // $100 por unidade
    let tradeAmount = 0;

    if (analysis.action === 'BUY' && this.portfolio.balance >= amount) {
      const cryptoAmount = amount / currentPrice;
      this.portfolio.balance -= amount;
      this.portfolio.crypto += cryptoAmount;
      this.portfolio.totalTrades++;
      tradeAmount = amount;
      console.log(`🟢 COMPRA: $${amount} (${cryptoAmount.toFixed(6)} crypto)`);
      console.log(`🎯 Alvo: $${(currentPrice * 1.05).toFixed(2)} | 🛑 Stop: $${(currentPrice * 0.97).toFixed(2)}`);
    } else if (analysis.action === 'SELL' && this.portfolio.crypto > 0) {
      const sellValue = this.portfolio.crypto * currentPrice;
      this.portfolio.balance += sellValue;
      tradeAmount = sellValue;
      this.portfolio.crypto = 0;
      this.portfolio.totalTrades++;
      console.log(`🔴 VENDA: $${sellValue.toFixed(2)}`);
      console.log(`🎯 Alvo: $${(currentPrice * 0.95).toFixed(2)} | 🛑 Stop: $${(currentPrice * 1.03).toFixed(2)}`);
    } else {
      console.log(`⏸️ HOLD: Mantendo posição`);
      console.log(`📊 Preço atual: $${currentPrice.toFixed(2)}`);
    }

    // Calcular preços alvo e stop
    const targetPrice = analysis.action === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95;
    const stopPrice = analysis.action === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03;

    // Calcular risco e retorno
    const potentialGain = Math.abs(targetPrice - currentPrice);
    const potentialLoss = Math.abs(stopPrice - currentPrice);
    const riskRewardRatio = potentialGain / potentialLoss;

    // Salvar trade no histórico
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
        potentialGain,
        potentialLoss,
        riskRewardRatio
      }
    };

    // Só salvar se não for HOLD (padrão encontrado)
    if (analysis.action !== 'HOLD') {
      this.trades.push(trade);
      TradeStorage.saveTrades(this.trades, this.tradesFile);
    }
  }

  private showResults(currentPrice: number) {
    const cryptoValue = this.portfolio.crypto * currentPrice;
    const totalValue = this.portfolio.balance + cryptoValue;
    const profit = totalValue - 1000;

    console.log('\n📈 RESULTADO DA SIMULAÇÃO:');
    console.log(`💵 Saldo: $${this.portfolio.balance.toFixed(2)}`);
    console.log(`🪙 Crypto: ${this.portfolio.crypto.toFixed(6)} ($${cryptoValue.toFixed(2)})`);
    console.log(`💎 Valor Total: $${totalValue.toFixed(2)}`);
    console.log(`${profit >= 0 ? '📈' : '📉'} P&L: $${profit.toFixed(2)} (${((profit / 1000) * 100).toFixed(2)}%)`);
    console.log(`🔄 Trades: ${this.portfolio.totalTrades}`);
  }


}