import { BinancePublicClient } from '../clients/binance-public-client';
import { Trade } from '../storage/trade-storage';
import * as fs from 'fs';

export class TradeMonitor {
  private binance: BinancePublicClient;

  constructor() {
    this.binance = new BinancePublicClient();
  }

  async checkTrades(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) {
        console.log('❌ Arquivo de trades não encontrado');
        return;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const trades: Trade[] = JSON.parse(data);
      const pendingTrades = trades.filter(trade => trade.status === 'pending');

      if (pendingTrades.length === 0) {
        console.log('✅ Nenhum trade pendente encontrado');
        return;
      }

      console.log(`🔍 Verificando ${pendingTrades.length} trades pendentes...`);

      for (const trade of pendingTrades) {
        const currentPrice = await this.getCurrentPrice(trade.symbol);
        const result = this.evaluateTrade(trade, currentPrice);
        
        if (result) {
          trade.status = 'completed';
          trade.result = result.outcome;
          trade.exitPrice = currentPrice;
          trade.actualReturn = result.actualReturn;
          
          console.log(`${result.outcome === 'win' ? '🟢' : '🔴'} ${trade.symbol} ${trade.action}: ${result.outcome.toUpperCase()}`);
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(trades, null, 2));
      console.log('💾 Trades atualizados');

    } catch (error) {
      console.error('❌ Erro ao verificar trades:', error);
    }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    const priceData = await this.binance.getPrice(symbol);
    return parseFloat(priceData.price);
  }

  private evaluateTrade(trade: Trade, currentPrice: number): { outcome: 'win' | 'loss', actualReturn: number } | null {
    if (trade.action === 'BUY') {
      if (currentPrice >= trade.targetPrice) {
        return { outcome: 'win', actualReturn: currentPrice - trade.entryPrice };
      } else if (currentPrice <= trade.stopPrice) {
        return { outcome: 'loss', actualReturn: currentPrice - trade.entryPrice };
      }
    } else if (trade.action === 'SELL') {
      if (currentPrice <= trade.targetPrice) {
        return { outcome: 'win', actualReturn: trade.entryPrice - currentPrice };
      } else if (currentPrice >= trade.stopPrice) {
        return { outcome: 'loss', actualReturn: trade.entryPrice - currentPrice };
      }
    }
    
    return null;
  }
}