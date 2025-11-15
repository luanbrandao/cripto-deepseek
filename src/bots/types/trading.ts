export interface TechnicalLevels {
  support?: number[];
  resistance?: number[];
  targets?: number[];
  stopLoss?: number[];
}

export interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
  technicalLevels?: TechnicalLevels;
  validationScore?: number;
  activeLayers?: string[];
  riskLevel?: string;
}

export interface RiskRewardCalculation {
  riskPercent: number;
  rewardPercent: number;
}