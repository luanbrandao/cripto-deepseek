// Base class
export { BaseTradingBot } from './base-trading-bot';

// Trading bots
export { RealTradingBot } from './real/real-trading-bot';
export { EmaTradingBot } from './real/ema-trading-bot';
export { SmartTradingBotBuy } from './smart/smart-trading-bot-buy';

// Simulation bots
export { RealTradingBotSimulator } from './simulators/real-trading-bot-simulator';
export { SmartTradingBotSimulatorBuy } from './simulators/smart-trading-bot-simulator-buy';

// Simulator
export { TradeSimulator } from '../scripts/simulators/trade-simulator';

// Configuration
export { TRADING_CONFIG } from './config/trading-config';

// Types
export * from './types/trading';
