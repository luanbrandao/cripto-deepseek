import { BinancePrivateClient } from '../../clients/binance-private-client';
import { TradeDecision } from '../types/trading';
import { TRADING_CONFIG, TradingState } from '../config/trading-config';
import { RiskManager } from './risk-manager';

export class TradeExecutor {
  static async executeRealTrade(decision: TradeDecision, binancePrivate: BinancePrivateClient) {
    console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    if (TradingState.isCurrentlyTrading()) {
      console.log('⏸️ Trade já em execução - aguarde...');
      return null;
    }

    const now = Date.now();
    const timeSinceLastTrade = (now - TradingState.getLastTradeTime()) / (1000 * 60);

    if (timeSinceLastTrade < TRADING_CONFIG.TRADE_COOLDOWN_MINUTES && TradingState.getLastTradeTime() > 0) {
      console.log(`⏸️ Cooldown ativo - aguarde ${(TRADING_CONFIG.TRADE_COOLDOWN_MINUTES - timeSinceLastTrade).toFixed(1)} minutos`);
      return null;
    }

    if (decision.action === 'HOLD' || decision.confidence < TRADING_CONFIG.MIN_CONFIDENCE) {
      console.log(`⏸️ Trade não executado - Confiança ${decision.confidence}% < ${TRADING_CONFIG.MIN_CONFIDENCE}% mínimo`);
      return null;
    }

    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);
    const riskRewardRatio = rewardPercent / riskPercent;

    console.log(`📊 Risk/Reward calculado: ${(rewardPercent * 100).toFixed(1)}% ganho / ${(riskPercent * 100).toFixed(1)}% perda (${riskRewardRatio.toFixed(1)}:1)`);

    if (!RiskManager.validateRiskReward(riskPercent, rewardPercent)) {
      console.log(`❌ Trade rejeitado - Risk/Reward ${riskRewardRatio.toFixed(1)}:1 < ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1 mínimo`);
      return null;
    }

    console.log(`✅ Risk/Reward aprovado: ${riskRewardRatio.toFixed(1)}:1 ≥ ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1`);

    TradingState.setTradingState(true);

    try {
      const accountInfo = await binancePrivate.getAccountInfo();
      
      if (!this.validateBalance(accountInfo, decision)) {
        return null;
      }

      console.log(`\n🚨 EXECUTANDO ORDEM REAL NA BINANCE 🚨`);
      console.log(`📝 ${decision.action} ${decision.symbol} - Valor: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);

      const orderResult = await binancePrivate.createMarketOrder(
        decision.symbol,
        decision.action,
        TRADING_CONFIG.TRADE_AMOUNT_USD
      );

      console.log('✅ Ordem executada com sucesso!');
      console.log(`🆔 Order ID: ${orderResult.orderId}`);
      console.log(`💱 Quantidade: ${orderResult.executedQty}`);
      console.log(`💰 Preço médio: $${orderResult.fills?.[0]?.price || decision.price}`);

      await this.createStopLossAndTakeProfit(orderResult, decision, binancePrivate);

      TradingState.setLastTradeTime(Date.now());
      return orderResult;

    } catch (error: any) {
      console.error('❌ Erro ao executar ordem real:', error.response?.data || error.message);
      return null;
    } finally {
      TradingState.setTradingState(false);
    }
  }

  private static validateBalance(accountInfo: any, decision: TradeDecision): boolean {
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT');
    const usdtFree = parseFloat(usdtBalance?.free || '0');

    console.log(`💰 Saldo USDT disponível: $${usdtFree.toFixed(2)}`);

    if (decision.action === 'BUY' && usdtFree < TRADING_CONFIG.TRADE_AMOUNT_USD) {
      console.log(`❌ Saldo insuficiente para compra. Necessário: $${TRADING_CONFIG.TRADE_AMOUNT_USD}, Disponível: $${usdtFree.toFixed(2)}`);
      return false;
    }

    if (decision.action === 'SELL') {
      const baseAsset = decision.symbol.replace('USDT', '');
      const assetBalance = accountInfo.balances.find((b: any) => b.asset === baseAsset);
      const assetFree = parseFloat(assetBalance?.free || '0');
      const assetValueUSD = assetFree * decision.price;

      console.log(`🪙 Saldo ${baseAsset}: ${assetFree.toFixed(6)} (~$${assetValueUSD.toFixed(2)})`);

      if (assetValueUSD < TRADING_CONFIG.TRADE_AMOUNT_USD) {
        console.log(`❌ Saldo insuficiente de ${baseAsset} para venda. Necessário: ~$${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
        return false;
      }
    }

    return true;
  }

  private static async createStopLossAndTakeProfit(orderResult: any, decision: TradeDecision, binancePrivate: BinancePrivateClient) {
    const executedQty = parseFloat(orderResult.executedQty);
    const avgPrice = parseFloat(orderResult.fills?.[0]?.price || decision.price);

    try {
      const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(avgPrice, decision.confidence);

      if (decision.action === 'BUY') {
        const takeProfitPrice = parseFloat((avgPrice * (1 + rewardPercent)).toFixed(2));
        const stopLossPrice = parseFloat((avgPrice * (1 - riskPercent)).toFixed(2));
        const stopLimitPrice = parseFloat((avgPrice * (1 - riskPercent * 1.1)).toFixed(2));

        const ocoOrder = await binancePrivate.createOCOOrder(
          decision.symbol, 'SELL', executedQty, takeProfitPrice, stopLossPrice, stopLimitPrice
        );

        console.log(`🎯 Ordem OCO criada: ${ocoOrder.orderListId}`);
        console.log(`📈 Take Profit: $${takeProfitPrice.toFixed(2)}`);
        console.log(`🛑 Stop Loss: $${stopLossPrice.toFixed(2)}`);

      } else if (decision.action === 'SELL') {
        const takeProfitPrice = parseFloat((avgPrice * (1 - rewardPercent)).toFixed(2));
        const stopLossPrice = parseFloat((avgPrice * (1 + riskPercent)).toFixed(2));
        const stopLimitPrice = parseFloat((avgPrice * (1 + riskPercent * 1.1)).toFixed(2));

        const ocoOrder = await binancePrivate.createOCOOrder(
          decision.symbol, 'BUY', executedQty, takeProfitPrice, stopLossPrice, stopLimitPrice
        );

        console.log(`🎯 Ordem OCO criada: ${ocoOrder.orderListId}`);
        console.log(`📈 Take Profit: $${takeProfitPrice.toFixed(2)}`);
        console.log(`🛑 Stop Loss: $${stopLossPrice.toFixed(2)}`);
      }
    } catch (ocoError: any) {
      console.log('⚠️ Erro ao criar ordem OCO:', ocoError.response?.data?.msg || ocoError.message);
      await this.createFallbackOrders(avgPrice, decision, executedQty, binancePrivate);
    }
  }

  private static async createFallbackOrders(avgPrice: number, decision: TradeDecision, executedQty: number, binancePrivate: BinancePrivateClient) {
    console.log('📱 Tentando criar ordens separadas...');

    try {
      const { rewardPercent } = RiskManager.calculateDynamicRiskReward(avgPrice, decision.confidence);

      if (decision.action === 'BUY') {
        const takeProfitPrice = (avgPrice * (1 + rewardPercent)).toFixed(2);
        const tpOrder = await binancePrivate.createLimitOrder(
          decision.symbol, 'SELL', executedQty, parseFloat(takeProfitPrice)
        );
        console.log(`🎯 Take Profit: ${tpOrder.orderId} @ $${takeProfitPrice}`);
      } else if (decision.action === 'SELL') {
        const takeProfitPrice = (avgPrice * (1 - rewardPercent)).toFixed(2);
        const tpOrder = await binancePrivate.createLimitOrder(
          decision.symbol, 'BUY', executedQty, parseFloat(takeProfitPrice)
        );
        console.log(`🎯 Take Profit: ${tpOrder.orderId} @ $${takeProfitPrice}`);
      }
    } catch (fallbackError: any) {
      console.log('⚠️ Configure stop loss e take profit manualmente');
    }
  }
}