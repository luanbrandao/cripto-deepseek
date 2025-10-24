import SimpleAnalyzer from '../analyzers/simpleAnalyzer';
import { BinancePublicClient } from '../clients/binance-public-client';
import * as fs from 'fs';
import * as path from 'path';

interface Portfolio {
  balance: number;
  crypto: number;
  totalTrades: number;
  winTrades: number;
}

interface Trade {
  timestamp: string;
  symbol: string;
  action: string;
  price: number;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  amount: number;
  balance: number;
  crypto: number;
  reason: string;
  confidence: number;
}

export class TradeSimulator {
  private portfolio: Portfolio;
  private binance: BinancePublicClient;
  private symbol: string;
  private trades: Trade[] = [];
  private tradesFile = path.join(__dirname, '../trades/simpleTrades.json');

  constructor(initialBalance: number = 1000, symbol: string = 'BTCUSDT') {
    this.portfolio = {
      balance: initialBalance,
      crypto: 0,
      totalTrades: 0,
      winTrades: 0
    };
    this.binance = new BinancePublicClient();
    this.symbol = symbol;
  }

  async simulate() {
    console.log(`🎯 Iniciando simulação para ${this.symbol}`);
    console.log(`💰 Saldo inicial: $${this.portfolio.balance}\n`);

    try {
      // Obter dados históricos
      const klines = await this.binance.getKlines(this.symbol, '1h', 50);
      const prices = klines.map((k: any) => parseFloat(k[4])); // Close prices
      const currentPrice = prices[prices.length - 1];

      // Analisar mercado
      const analysis = SimpleAnalyzer.analyze({
        price24h: prices,
        currentPrice
      });

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
      confidence: analysis.confidence
    };

    this.trades.push(trade);
    this.saveTradesHistory();
  }

  private showResults(currentPrice: number) {
    const cryptoValue = this.portfolio.crypto * currentPrice;
    const totalValue = this.portfolio.balance + cryptoValue;
    const profit = totalValue - 1000;

    console.log('\n📈 RESULTADO DA SIMULAÇÃO:');
    console.log(`💵 Saldo: $${this.portfolio.balance.toFixed(2)}`);
    console.log(`🪙 Crypto: ${this.portfolio.crypto.toFixed(6)} ($${cryptoValue.toFixed(2)})`);
    console.log(`💎 Valor Total: $${totalValue.toFixed(2)}`);
    console.log(`${profit >= 0 ? '📈' : '📉'} P&L: $${profit.toFixed(2)} (${((profit/1000)*100).toFixed(2)}%)`);
    console.log(`🔄 Trades: ${this.portfolio.totalTrades}`);
  }

  private saveTradesHistory() {
    try {
      let existingTrades: Trade[] = [];
      if (fs.existsSync(this.tradesFile)) {
        const data = fs.readFileSync(this.tradesFile, 'utf8').trim();
        if (data && data !== '') {
          existingTrades = JSON.parse(data);
        }
      }
      
      const allTrades = [...existingTrades, ...this.trades];
      fs.writeFileSync(this.tradesFile, JSON.stringify(allTrades, null, 2));
      console.log(`💾 Histórico salvo: ${this.trades.length} trades`);
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  }
}