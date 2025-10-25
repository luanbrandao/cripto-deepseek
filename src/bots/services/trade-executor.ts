import { BinancePrivateClient } from '../../clients/binance-private-client';
import { TradeDecision } from '../types/trading';
import { TRADING_CONFIG, TradingState } from '../config/trading-config';
import { RiskManager } from './risk-manager';

export class TradeExecutor {
  static async executeRealTrade(decision: TradeDecision, binancePrivate: BinancePrivateClient) {
    this.logDecision(decision);

    if (!this.canExecuteTrade(decision)) {
      return null;
    }

    if (!this.validateRiskReward(decision)) {
      return null;
    }

    return await this.executeTrade(decision, binancePrivate);
  }

  private static logDecision(decision: TradeDecision) {
    console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);
  }

  private static canExecuteTrade(decision: TradeDecision): boolean {
    if (TradingState.isCurrentlyTrading()) {
      console.log('⏸️ Trade já em execução - aguarde...');
      return false;
    }

    if (this.isInCooldown()) {
      return false;
    }

    if (decision.action === 'HOLD' || decision.confidence < TRADING_CONFIG.MIN_CONFIDENCE) {
      console.log(`⏸️ Trade não executado - Confiança ${decision.confidence}% < ${TRADING_CONFIG.MIN_CONFIDENCE}% mínimo`);
      return false;
    }

    return true;
  }

  private static isInCooldown(): boolean {
    const timeSinceLastTrade = (Date.now() - TradingState.getLastTradeTime()) / (1000 * 60);

    if (timeSinceLastTrade < TRADING_CONFIG.TRADE_COOLDOWN_MINUTES && TradingState.getLastTradeTime() > 0) {
      const remainingTime = (TRADING_CONFIG.TRADE_COOLDOWN_MINUTES - timeSinceLastTrade).toFixed(1);
      console.log(`⏸️ Cooldown ativo - aguarde ${remainingTime} minutos`);
      return true;
    }

    return false;
  }

  private static validateRiskReward(decision: TradeDecision): boolean {
    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(decision.price, decision.confidence);
    const riskRewardRatio = rewardPercent / riskPercent;

    console.log(`📊 Risk/Reward: ${(rewardPercent * 100).toFixed(1)}%/${(riskPercent * 100).toFixed(1)}% (${riskRewardRatio.toFixed(1)}:1)`);

    if (!RiskManager.validateRiskReward(riskPercent, rewardPercent)) {
      console.log(`❌ Trade rejeitado - R/R ${riskRewardRatio.toFixed(1)}:1 < ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
      return false;
    }

    console.log(`✅ Risk/Reward aprovado: ${riskRewardRatio.toFixed(1)}:1`);
    return true;
  }

  private static async executeTrade(decision: TradeDecision, binancePrivate: BinancePrivateClient) {
    TradingState.setTradingState(true);

    try {
      const accountInfo = await binancePrivate.getAccountInfo();

      if (!this.validateBalance(accountInfo, decision)) {
        return null;
      }

      const orderResult = await this.placeOrder(decision, binancePrivate);
      await this.createProtectionOrders(orderResult, decision, binancePrivate);

      TradingState.setLastTradeTime(Date.now());
      return orderResult;

    } catch (error: any) {
      console.error('❌ Erro ao executar ordem:', error.response?.data || error.message);
      return null;
    } finally {
      TradingState.setTradingState(false);
    }
  }

  private static async placeOrder(decision: TradeDecision, binancePrivate: BinancePrivateClient) {
    console.log(`\n🚨 EXECUTANDO ORDEM: ${decision.action} ${decision.symbol} - $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);

    if (decision.action !== 'BUY' && decision.action !== 'SELL') {
      throw new Error(`Ação inválida: ${decision.action}`);
    }

    const orderResult = await binancePrivate.createMarketOrder(
      decision.symbol,
      decision.action,
      TRADING_CONFIG.TRADE_AMOUNT_USD
    );

    console.log('✅ Ordem executada!');
    console.log(`🆔 ID: ${orderResult.orderId}`);
    console.log(`💱 Qtd: ${orderResult.executedQty}`);
    console.log(`💰 Preço: $${orderResult.fills?.[0]?.price || decision.price}`);

    return orderResult;
  }

  private static validateBalance(accountInfo: any, decision: TradeDecision): boolean {
    if (decision.action === 'BUY') {
      return this.validateUSDTBalance(accountInfo);
    }

    if (decision.action === 'SELL') {
      return this.validateAssetBalance(accountInfo, decision);
    }

    return true;
  }

  private static validateUSDTBalance(accountInfo: any): boolean {
    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT');
    const usdtFree = parseFloat(usdtBalance?.free || '0');

    console.log(`💰 USDT: $${usdtFree.toFixed(2)}`);

    if (usdtFree < TRADING_CONFIG.TRADE_AMOUNT_USD) {
      console.log(`❌ Saldo insuficiente. Necessário: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
      return false;
    }

    return true;
  }

  private static validateAssetBalance(accountInfo: any, decision: TradeDecision): boolean {
    const baseAsset = decision.symbol.replace('USDT', '');
    const assetBalance = accountInfo.balances.find((b: any) => b.asset === baseAsset);
    const assetFree = parseFloat(assetBalance?.free || '0');
    const assetValueUSD = assetFree * decision.price;

    console.log(`🪙 ${baseAsset}: ${assetFree.toFixed(6)} (~$${assetValueUSD.toFixed(2)})`);

    if (assetValueUSD < TRADING_CONFIG.TRADE_AMOUNT_USD) {
      console.log(`❌ Saldo insuficiente de ${baseAsset}`);
      return false;
    }

    return true;
  }

  private static async createProtectionOrders(orderResult: any, decision: TradeDecision, binancePrivate: BinancePrivateClient) {
    const executedQty = parseFloat(orderResult.executedQty);
    const avgPrice = parseFloat(orderResult.fills?.[0]?.price || decision.price);
    const { riskPercent, rewardPercent } = RiskManager.calculateDynamicRiskReward(avgPrice, decision.confidence);

    try {
      await this.createOCOOrder(decision, executedQty, avgPrice, riskPercent, rewardPercent, binancePrivate);
    } catch (error: any) {
      console.log('⚠️ OCO falhou:', error.response?.data?.msg || error.message);
      await this.createTakeProfitOnly(decision, executedQty, avgPrice, rewardPercent, binancePrivate);
    }
  }

  private static async createOCOOrder(
    decision: TradeDecision,
    executedQty: number,
    avgPrice: number,
    riskPercent: number,
    rewardPercent: number,
    binancePrivate: BinancePrivateClient
  ) {
    const isLong = decision.action === 'BUY';
    const side = isLong ? 'SELL' : 'BUY';

    const takeProfitPrice = parseFloat((avgPrice * (1 + (isLong ? rewardPercent : -rewardPercent))).toFixed(2));
    const stopLossPrice = parseFloat((avgPrice * (1 + (isLong ? -riskPercent : riskPercent))).toFixed(2));
    const stopLimitPrice = parseFloat((avgPrice * (1 + (isLong ? -riskPercent * 1.1 : riskPercent * 1.1))).toFixed(2));

    const ocoOrder = await binancePrivate.createOCOOrder(
      decision.symbol, side, executedQty, takeProfitPrice, stopLossPrice, stopLimitPrice
    );

    console.log(`🎯 OCO criada: ${ocoOrder.orderListId}`);
    console.log(`📈 TP: $${takeProfitPrice} | 🛑 SL: $${stopLossPrice}`);
  }

  private static async createTakeProfitOnly(
    decision: TradeDecision,
    executedQty: number,
    avgPrice: number,
    rewardPercent: number,
    binancePrivate: BinancePrivateClient
  ) {
    try {
      const isLong = decision.action === 'BUY';
      const side = isLong ? 'SELL' : 'BUY';
      const takeProfitPrice = parseFloat((avgPrice * (1 + (isLong ? rewardPercent : -rewardPercent))).toFixed(2));

      const tpOrder = await binancePrivate.createLimitOrder(
        decision.symbol, side, executedQty, takeProfitPrice
      );

      console.log(`🎯 TP criado: ${tpOrder.orderId} @ $${takeProfitPrice}`);
    } catch (error: any) {
      console.log('⚠️ Configure ordens manualmente');
    }
  }
}