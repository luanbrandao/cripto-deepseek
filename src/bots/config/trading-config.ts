export const TRADING_CONFIG = {
  TRADE_AMOUNT_USD: 15,
  MIN_CONFIDENCE: 70,
  TRADE_COOLDOWN_MINUTES: 5,
  
  // GARANTIA 2:1 - Reward sempre 2x maior que risco
  MIN_RISK_REWARD_RATIO: 2.0,  // OBRIGATÓRIO: Mínimo 2:1
  
  RISK: {
    BASE_PERCENT: 0.5,    // 0.5% risco mínimo → 1.0% reward
    MAX_PERCENT: 1.5      // 1.5% risco máximo → 3.0% reward
  }
  // Resultado: Risk 0.5%-1.5% | Reward 1.0%-3.0% (sempre 2:1)
};

export class TradingState {
  private static lastTradeTime = 0;
  private static isTrading = false;

  static getLastTradeTime(): number {
    return this.lastTradeTime;
  }

  static setLastTradeTime(time: number): void {
    this.lastTradeTime = time;
  }

  static isCurrentlyTrading(): boolean {
    return this.isTrading;
  }

  static setTradingState(trading: boolean): void {
    this.isTrading = trading;
  }
}