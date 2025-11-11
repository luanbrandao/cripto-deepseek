import { TradeStorage, Trade } from '../../../core/utils/trade-storage';
import { RiskManager } from '../../services/risk-manager';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import * as path from 'path';

export function createTradeRecord(decision: any, orderResult: any, fileName: string, riskCalculationMethod?: string): Trade {
  const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);

  const trade: Trade = {
    timestamp: new Date().toISOString(),
    symbol: decision.symbol,
    action: decision.action,
    price: decision.price,
    entryPrice: decision.price,
    targetPrice: decision.action === 'BUY'
      ? decision.price * (1 + rewardPercent)
      : decision.price * (1 - rewardPercent),
    stopPrice: decision.action === 'BUY'
      ? decision.price * (1 - riskPercent)
      : decision.price * (1 + riskPercent),
    amount: orderResult ? TradingConfigManager.getConfig().TRADE_AMOUNT_USD : 0,
    balance: 0,
    crypto: 0,
    reason: decision.reason,
    confidence: decision.confidence,
    status: orderResult ? 'pending' : 'completed',
    riskReturn: {
      potentialGain: decision.price * rewardPercent,
      potentialLoss: decision.price * riskPercent,
      riskRewardRatio: rewardPercent / riskPercent
    },
    riskCalculationMethod: riskCalculationMethod || 'Dynamic Risk Manager'
  };

  if (orderResult) {
    trade.result = undefined;
    trade.exitPrice = undefined;
    trade.actualReturn = undefined;
  }

  return trade;
}

export function saveTradeHistory(trade: Trade, fileName: string) {
  const tradesFile = `${TradingConfigManager.getConfig().PATHS.TRADES_DIR}/${fileName}`;

  TradeStorage.saveTrades([trade], tradesFile);
  console.log(`\n💾 Trade salvo no histórico: ${fileName}`);
}
