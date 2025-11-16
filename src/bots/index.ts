// === CORE ===
export { BaseTradingBot } from './core/base-trading-bot';
export { TradeDecision, RiskRewardCalculation, BotConfig as CoreBotConfig, MarketData, AnalysisResult } from './core/types';

// === EXECUTION BOTS (Real Trading) ===
export { RealTradingBot } from './execution/real/real-trading-bot';
export { EmaTradingBot } from './execution/real/ema-trading-bot';
export { SmartTradingBotBuy } from './execution/real/smart-trading-bot-buy';
export { MultiSmartTradingBotBuy } from './execution/real/multi-smart-trading-bot-buy';

// === SIMULATION BOTS ===
export { RealTradingBotSimulator } from './execution/simulators/real-trading-bot-simulator';
export { SmartTradingBotSimulatorBuy } from './execution/simulators/smart-trading-bot-simulator-buy';

// === SERVICES ===
export { AnalysisParser } from './services/analysis-parser';
export { RiskManager } from './services/risk-manager';
export { TradeExecutor } from './services/trade-executor';
export { MarketTrendAnalyzer } from './services/market-trend-analyzer';

// === UTILS (Direct Exports) ===
export * from './utils/logging/bot-logger';
export { BotFlowManager, BotConfig as FlowBotConfig, TradeExecutionResult } from './utils/execution/bot-flow-manager';
export * from './utils/risk/trade-validators';
export * from './utils/analysis/ema-calculator';
export * from './utils/analysis/support-resistance-calculator';