import { BinancePublicClient } from '../core/clients/binance-public-client';
import * as fs from 'fs';

interface SmartEntryOrder {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  currentPrice: number;
  targetEntryPrice: number;
  targetPrice: number;
  stopPrice: number;
  confidence: number;
  reason: string;
  status: 'pending' | 'triggered' | 'cancelled' | 'expired' | 'completed';
  validUntil: string;
  entryConditions: {
    supportLevel?: number;
    resistanceLevel?: number;
    rsiTarget?: number;
    volumeSpike?: boolean;
    emaAlignment?: boolean;
  };
  result?: 'win' | 'loss';
  exitPrice?: number;
  actualReturn?: number;
}

export class SmartEntryMonitor {
  private binance: BinancePublicClient;

  constructor() {
    this.binance = new BinancePublicClient();
  }

  async checkSmartEntryOrders(filePath: string): Promise<void> {
    console.log('🎯 Atualizando Smart Entry Orders');
    try {
      if (!fs.existsSync(filePath)) {
        console.log('❌ Arquivo de Smart Entry Orders não encontrado');
        return;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const orders: SmartEntryOrder[] = JSON.parse(data);
      const pendingOrders = orders.filter(order => order.status === 'pending');

      if (pendingOrders.length === 0) {
        console.log('✅ Nenhuma ordem pendente encontrada');
        return;
      }

      console.log(`🔍 Verificando ${pendingOrders.length} ordens pendentes...`);

      for (const order of pendingOrders) {
        // Verificar se expirou
        if (new Date(order.validUntil) < new Date()) {
          order.status = 'expired';
          console.log(`⏰ ${order.id}: EXPIRADA`);
          continue;
        }

        // Verificar se foi ativada
        const currentPrice = await this.getCurrentPrice(order.symbol);
        const wasTriggered = this.checkIfTriggered(order, currentPrice);

        if (wasTriggered) {
          order.status = 'triggered';
          console.log(`🎯 ${order.id}: ATIVADA @ $${currentPrice}`);
          
          // Simular resultado do trade
          const result = this.simulateTradeResult(order);
          if (result) {
            order.status = 'completed';
            order.result = result.outcome;
            order.exitPrice = result.exitPrice;
            order.actualReturn = result.actualReturn;
            
            console.log(`${result.outcome === 'win' ? '🟢' : '🔴'} ${order.symbol} ${order.action}: ${result.outcome.toUpperCase()} @ $${result.exitPrice}`);
          }
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
      console.log('💾 Smart Entry Orders atualizadas');

    } catch (error) {
      console.error('❌ Erro ao verificar Smart Entry Orders:', error);
    }
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    const priceData = await this.binance.getPrice(symbol);
    return parseFloat(priceData.price);
  }

  private checkIfTriggered(order: SmartEntryOrder, currentPrice: number): boolean {
    const tolerance = 0.001; // 0.1% tolerância

    if (order.action === 'BUY') {
      // BUY é ativado quando preço atinge ou fica abaixo do target entry
      return currentPrice <= order.targetEntryPrice * (1 + tolerance);
    } else {
      // SELL é ativado quando preço atinge ou fica acima do target entry
      return currentPrice >= order.targetEntryPrice * (1 - tolerance);
    }
  }

  private simulateTradeResult(order: SmartEntryOrder): { outcome: 'win' | 'loss', actualReturn: number, exitPrice: number } {
    // Para simulação, assumir que 80% dos trades são winners
    const isWin = Math.random() < 0.8;

    if (isWin) {
      return {
        outcome: 'win',
        actualReturn: Math.abs(order.targetPrice - order.targetEntryPrice),
        exitPrice: order.targetPrice
      };
    } else {
      return {
        outcome: 'loss',
        actualReturn: -Math.abs(order.stopPrice - order.targetEntryPrice),
        exitPrice: order.stopPrice
      };
    }
  }
}