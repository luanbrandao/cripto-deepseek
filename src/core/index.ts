/**
 * 🏗️ CORE - Barrel Export
 * Unified export for all core functionality
 */

// === CLIENTS ===
export { BinancePublicClient } from './clients/binance-public-client';
export { BinancePrivateClient } from './clients/binance-private-client';
export { DeepSeekService } from './clients/deepseek-client';

// === CONFIG ===
export { TradingConfigManager, UNIFIED_TRADING_CONFIG, BOT_SPECIFIC_CONFIG } from './config/trading-config-manager';
export type { BaseTradingConfig, BotSpecificConfig, ConfigMode } from './config/trading-config-manager';

// === ANALYZERS ===
export * from './analyzers';

// === UTILS ===
export { TradeStorage } from './utils/trade-storage';
export type { Trade } from './utils/trade-storage';