// Base class
export { BaseTradingBot } from './base-trading-bot';

// Trading bots
export { RealTradingBot } from './real-trading-bot';
export { EmaTradingBot } from './ema-trading-bot';
export { SmartTradingBotBuy } from './smart-trading-bot-buy';

// Simulation bots
export { RealTradingBotSimulator } from './real-trading-bot-simulator';
export { SmartTradingBotSimulatorBuy } from './smart-trading-bot-simulator-buy';

// Simulator
export { TradeSimulator } from '../scripts/simulators/trade-simulator';

// Configuration
export { TRADING_CONFIG } from './config/trading-config';

// Types
export * from './types/trading';