import * as fs from 'fs';
import * as path from 'path';

export interface Trade {
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
  status: 'pending' | 'completed';
  riskReturn: {
    potentialGain: number;
    potentialLoss: number;
    riskRewardRatio: number;
  };
  result?: 'win' | 'loss';
  exitPrice?: number;
  actualReturn?: number;
}

export class TradeStorage {
  static saveTrades(trades: Trade[], filePath: string): void {
    try {
      const tradesDir = path.dirname(filePath);
      if (!fs.existsSync(tradesDir)) {
        fs.mkdirSync(tradesDir, { recursive: true });
      }

      let existingTrades: Trade[] = [];
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8').trim();
        if (data && data !== '') {
          existingTrades = JSON.parse(data);
        }
      }

      const allTrades = [...existingTrades, ...trades];
      fs.writeFileSync(filePath, JSON.stringify(allTrades, null, 2));
      console.log(`💾 Histórico salvo: ${trades.length} trades`);
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  }
}