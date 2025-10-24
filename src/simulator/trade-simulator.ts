import SimpleAnalyzer from '../analyzers/simpleAnalyzer';
import { BinancePublicClient } from '../clients/binance-public-client';

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

    if (analysis.action === 'BUY' && this.portfolio.balance >= amount) {
      const cryptoAmount = amount / currentPrice;
      this.portfolio.balance -= amount;
      this.portfolio.crypto += cryptoAmount;
      this.portfolio.totalTrades++;
      console.log(`🟢 COMPRA: $${amount} (${cryptoAmount.toFixed(6)} crypto)`);
    } else if (analysis.action === 'SELL' && this.portfolio.crypto > 0) {
      const sellValue = this.portfolio.crypto * currentPrice;
      this.portfolio.balance += sellValue;
      this.portfolio.crypto = 0;
      this.portfolio.totalTrades++;
      console.log(`🔴 VENDA: $${sellValue.toFixed(2)}`);
    } else {
      console.log(`⏸️ HOLD: Mantendo posição`);
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
    console.log(`${profit >= 0 ? '📈' : '📉'} P&L: $${profit.toFixed(2)} (${((profit/1000)*100).toFixed(2)}%)`);
    console.log(`🔄 Trades: ${this.portfolio.totalTrades}`);
  }
}