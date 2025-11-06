// Consolidação dos validadores de trade
export { validateTrade, calculateRiskReward, calculateRiskRewardDynamic, validateConfidence } from './risk/trade-validators';
export { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from '../../shared/validators/trend-validator';
export { validateBinanceKeys } from './validation/env-validator';
export { hasActiveTradeForSymbol } from './validation/symbol-trade-checker';
export { checkActiveTradesLimit } from './validation/trade-limit-checker';