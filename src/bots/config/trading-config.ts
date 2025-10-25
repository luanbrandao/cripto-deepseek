export const TRADING_CONFIG = {
  TRADE_AMOUNT_USD: 15,
  MIN_CONFIDENCE: 70,
  TRADE_COOLDOWN_MINUTES: 5,
  MIN_RISK_REWARD_RATIO: 2.0,
  RISK: {
    BASE_PERCENT: 0.5,
    MAX_PERCENT: 1.5
  }
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