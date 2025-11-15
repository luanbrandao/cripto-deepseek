export interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  symbol: string;
  price: number;
  validationScore?: number;
  activeLayers?: string[];
  riskLevel?: string;
}

export interface RiskRewardCalculation {
  riskPercent: number;
  rewardPercent: number;
}

export interface BotConfig {
  name: string;
  isSimulation: boolean;
  tradesFile: string;
}

export interface MarketData {
  price: number;
  stats: any;
  klines: any[];
}

export interface AnalysisResult {
  decision: TradeDecision;
  confidence: number;
  riskReward: RiskRewardCalculation;
}