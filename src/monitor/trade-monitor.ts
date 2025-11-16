import { BinancePublicClient } from '../core/clients/binance-public-client';
import * as fs from 'fs';
import { Trade } from '../core/utils/trade-storage';

export class TradeMonitor {
  private binance: BinancePublicClient;

  constructor() {
    this.binance = new BinancePublicClient();
  }

  async checkTrades(filePath: string): Promise<void> {
    console.log('🔍 Atualizando trades');
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
        const result = await this.evaluateTradeWithHistory(trade);

        if (result) {
          trade.status = 'completed';
          trade.result = result.outcome;
          trade.exitPrice = result.exitPrice;
          trade.actualReturn = result.actualReturn;

          console.log(`${result.outcome === 'win' ? '🟢' : '🔴'} ${trade.symbol} ${trade.action}: ${result.outcome.toUpperCase()} @ $${result.exitPrice}`);
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

  private async getCandleHistory(symbol: string): Promise<{ high: number, low: number, timestamp: number }[]> {
    // Buscar últimos 30 minutos de dados (1m interval) - Algorithm constants
    const historyMinutes = 30;
    const timeframe = '1m';
    const klines = await this.binance.getKlines(symbol, timeframe, historyMinutes);
    return klines.map((k: any) => ({
      high: parseFloat(k[2]),  // High price
      low: parseFloat(k[3]),   // Low price
      timestamp: k[0]          // Open time
    }));
  }

  private async evaluateTradeWithHistory(trade: Trade): Promise<{ outcome: 'win' | 'loss', actualReturn: number, exitPrice: number } | null> {
    try {
      const candleHistory = await this.getCandleHistory(trade.symbol);

      console.log(`\n🔍 Avaliando ${trade.symbol} ${trade.action}:`);
      console.log(`📊 Target: ${trade.targetPrice} | Stop: ${trade.stopPrice}`);

      const allHighs = candleHistory.map(c => c.high);
      const allLows = candleHistory.map(c => c.low);
      console.log(`📈 Mínimo absoluto: ${Math.min(...allLows)} | Máximo absoluto: ${Math.max(...allHighs)}`);

      // Verificar cada candle no histórico para ver qual condição foi atingida primeiro
      for (let i = 0; i < candleHistory.length; i++) {
        const candle = candleHistory[i];

        if (trade.action === 'BUY') {
          // Para BUY: verificar se HIGH atingiu target ou LOW atingiu stop
          if (candle.high >= trade.targetPrice) {
            console.log(`✅ WIN: Candle ${i} - High ${candle.high} >= Target ${trade.targetPrice}`);
            return {
              outcome: 'win',
              actualReturn: trade.targetPrice - trade.entryPrice,
              exitPrice: trade.targetPrice
            };
          } else if (candle.low <= trade.stopPrice) {
            console.log(`❌ LOSS: Candle ${i} - Low ${candle.low} <= Stop ${trade.stopPrice}`);
            return {
              outcome: 'loss',
              actualReturn: trade.stopPrice - trade.entryPrice,
              exitPrice: trade.stopPrice
            };
          }
        } else if (trade.action === 'SELL') {
          // Para SELL: verificar se LOW atingiu target ou HIGH atingiu stop
          if (candle.low <= trade.targetPrice) {
            console.log(`✅ WIN: Candle ${i} - Low ${candle.low} <= Target ${trade.targetPrice}`);
            return {
              outcome: 'win',
              actualReturn: trade.entryPrice - trade.targetPrice,
              exitPrice: trade.targetPrice
            };
          } else if (candle.high >= trade.stopPrice) {
            console.log(`❌ LOSS: Candle ${i} - High ${candle.high} >= Stop ${trade.stopPrice}`);
            return {
              outcome: 'loss',
              actualReturn: trade.entryPrice - trade.stopPrice,
              exitPrice: trade.stopPrice
            };
          }
        }
      }

      console.log(`⏳ Trade ainda pendente - nenhuma condição atingida`);
      return null; // Trade ainda pendente
    } catch (error) {
      console.error(`❌ Erro ao avaliar trade ${trade.symbol}:`, error);
      return null;
    }
  }
}