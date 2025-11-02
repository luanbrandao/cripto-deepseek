export interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
}

export interface RiskRewardCalculation {
  riskPercent: number;
  rewardPercent: number;
}