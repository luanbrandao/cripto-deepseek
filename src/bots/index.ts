// === CORE ===
export { BaseTradingBot } from './core/base-trading-bot';
export * from './core/types';

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

// === UTILS (Consolidated) ===
export * from './utils/market-analyzer';
export * from './utils/trade-validator';
export * from './utils/bot-logger';
export * from './utils/flow-manager';

// === CONFIGURATION ===
export { TRADING_CONFIG } from './config/trading-config';