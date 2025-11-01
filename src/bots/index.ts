// Base class
export { BaseTradingBot } from './base-trading-bot';

// Trading bots
export { RealTradingBot } from './real-trading-bot';
export { EmaTradingBot } from './ema-trading-bot';
export { SmartTradingBot } from './smart-trading-bot';

// Simulation bots
export { SimulationBot } from './simulation-bot';
export { SmartTradingBotSimulator } from './smart-trading-bot-simulator';

// Simulator
export { TradeSimulator } from '../simulator/trade-simulator';

// Configuration
export { TRADING_CONFIG } from './config/trading-config';

// Types
export * from './types/trading';