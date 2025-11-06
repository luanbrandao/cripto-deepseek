import { TradeExecutor } from '../../services/trade-executor';
import { BinancePrivateClient } from '../../../clients/binance-private-client';
import { TradeDecision, calculateRiskReward } from '../risk/trade-validators';
import { createTradeRecord, saveTradeHistory } from './trade-history-saver';
import { logTradeSuccess, logRiskReward } from '../logging/bot-logger';

export async function executeAndSaveTradeWithValidation(
  decision: TradeDecision,
  binancePrivate: BinancePrivateClient,
  fileName: string,
  botType: string = 'BOT'
) {
  // Calcular e logar risk/reward
  const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);
  logRiskReward(riskPercent, rewardPercent);
  
  // Executar trade
  const orderResult = await TradeExecutor.executeRealTrade(decision, binancePrivate);
  
  // Salvar histórico
  const trade = createTradeRecord(decision, orderResult, fileName);
  saveTradeHistory(trade, fileName);

  // Log de sucesso
  if (orderResult) {
    logTradeSuccess(botType);
  }

  return orderResult;
}

export function handleBotError(botName: string, error: any) {
  console.error(`❌ Erro no ${botName}:`, error);
  return null;
}
