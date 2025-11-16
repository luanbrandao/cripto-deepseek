/**
 * 🎛️ GERENCIADOR DE CONFIGURAÇÕES DE TRADING
 * Moved from src/shared/config/trading-config-manager.ts
 */

interface BaseTradingConfig {
  SYMBOLS: string[];
  DEFAULT_SYMBOL: string;
  TRADE_AMOUNT_USD: number;
  MIN_CONFIDENCE: number;
  HIGH_CONFIDENCE: number;
  MEDIUM_CONFIDENCE: number;
  TRADE_COOLDOWN_MINUTES: number;
  MIN_RISK_REWARD_RATIO: number;
  RISK: {
    BASE_PERCENT: number;
    MAX_PERCENT: number;
  };
  CHART: {
    TIMEFRAME: string;
    PERIODS: number;
  };
  EMA: {
    FAST_PERIOD: number;
    SLOW_PERIOD: number;
  };
  SIMULATION: {
    STARTUP_DELAY: number;
    INITIAL_BALANCE: number;
    MAX_ACTIVE_TRADES: number;
  };
  LIMITS: {
    OPEN_ORDERS: number;
    MAX_ACTIVE_TRADES: number;
    MAX_TRADES_PER_SYMBOL: number;
    MAX_DAILY_LOSS: number;
    MAX_CONSECUTIVE_LOSSES: number;
    EMERGENCY_STOP_LOSS: number;
  };
  MARKET_FILTERS: {
    MIN_VOLATILITY: number;
    MAX_VOLATILITY: number;
    REQUIRE_BTC_UPTREND: boolean;
    MIN_VOLUME_MULTIPLIER: number;
    AVOID_WEEKENDS: boolean;
  };
  EMA_ADVANCED: {
    MIN_SEPARATION: number;
    MIN_EMA_SCORE: number;
    REQUIRE_ALIGNMENT: boolean;
    MIN_TREND_STRENGTH: number;
    MOMENTUM_CONFIRMATION: boolean;
  };
  VALIDATION_SCORES: {
    EMA_ALIGNMENT: number;
    PRICE_ABOVE_EMA: number;
    EMA_SEPARATION: number;
    RSI_NEUTRAL: number;
    RSI_OVERSOLD: number;
    RSI_OVERBOUGHT: number;
    VOLUME_HIGH: number;
    VOLUME_ADEQUATE: number;
    VOLUME_LOW: number;
    VOLUME_HIGH_MULTIPLIER: number;
    MIN_VALID_SCORE: number;
    MIN_APPROVAL_SCORE: number;
    MIN_CONFIDENCE: number;
    LOW_RISK_THRESHOLD: number;
    MEDIUM_RISK_THRESHOLD: number;
  };
  RSI: {
    OVERSOLD_THRESHOLD: number;
    OVERBOUGHT_THRESHOLD: number;
    PERIOD: number;
  };
  PATHS: {
    TRADES_DIR: string;
  };
  FILES: {
    REAL_BOT: string;
    REAL_BOT_SIMULATOR: string;
    SMART_BOT_BUY: string;
    SMART_BOT_SELL: string;
    EMA_BOT: string;
    EMA_SIMULATOR: string;
    SMART_SIMULATOR_BUY: string;
    SMART_SIMULATOR_SELL: string;
    MULTI_SMART_BUY: string;
    MULTI_SMART_SIMULATOR_BUY: string;
    MULTI_SMART_SIMULATOR_SELL: string;
    ELITE_SIMULATOR: string;
    SUPPORT_RESISTANCE: string;
  };
}

const BALANCED_CONFIG: BaseTradingConfig = {
  SYMBOLS: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT', 'SOLUSDT'],
  DEFAULT_SYMBOL: 'BTCUSDT',
  TRADE_AMOUNT_USD: 15,
  MIN_CONFIDENCE: 75,
  HIGH_CONFIDENCE: 80,
  MEDIUM_CONFIDENCE: 78,
  TRADE_COOLDOWN_MINUTES: 30,
  MIN_RISK_REWARD_RATIO: 2.0,
  RISK: {
    BASE_PERCENT: 0.25,
    MAX_PERCENT: 0.75
  },
  CHART: {
    TIMEFRAME: '1h',
    PERIODS: 50
  },
  EMA: {
    FAST_PERIOD: 12,
    SLOW_PERIOD: 26
  },
  SIMULATION: {
    STARTUP_DELAY: 3000,
    INITIAL_BALANCE: 1000,
    MAX_ACTIVE_TRADES: 2
  },
  LIMITS: {
    OPEN_ORDERS: 2,
    MAX_ACTIVE_TRADES: 2,
    MAX_TRADES_PER_SYMBOL: 2,
    MAX_DAILY_LOSS: 50,
    MAX_CONSECUTIVE_LOSSES: 2,
    EMERGENCY_STOP_LOSS: 100
  },
  MARKET_FILTERS: {
    MIN_VOLATILITY: 0.5,
    MAX_VOLATILITY: 4.0,
    REQUIRE_BTC_UPTREND: true,
    MIN_VOLUME_MULTIPLIER: 2.0,
    AVOID_WEEKENDS: false
  },
  EMA_ADVANCED: {
    MIN_SEPARATION: 0.005,
    MIN_EMA_SCORE: 10,
    REQUIRE_ALIGNMENT: true,
    MIN_TREND_STRENGTH: 0.01,
    MOMENTUM_CONFIRMATION: true
  },
  VALIDATION_SCORES: {
    EMA_ALIGNMENT: 40,
    PRICE_ABOVE_EMA: 40,
    EMA_SEPARATION: 20,
    RSI_NEUTRAL: 100,
    RSI_OVERSOLD: 80,
    RSI_OVERBOUGHT: 20,
    VOLUME_HIGH: 100,
    VOLUME_ADEQUATE: 80,
    VOLUME_LOW: 40,
    VOLUME_HIGH_MULTIPLIER: 1.5,
    MIN_VALID_SCORE: 60,
    MIN_APPROVAL_SCORE: 60,
    MIN_CONFIDENCE: 50,
    LOW_RISK_THRESHOLD: 80,
    MEDIUM_RISK_THRESHOLD: 65
  },
  RSI: {
    OVERSOLD_THRESHOLD: 25,
    OVERBOUGHT_THRESHOLD: 75,
    PERIOD: 14
  },
  PATHS: {
    TRADES_DIR: './src/storage/trades'
  },
  FILES: {
    REAL_BOT: 'realTradingBot.json',
    REAL_BOT_SIMULATOR: 'realTradingBotSimulator.json',
    SMART_BOT_BUY: 'smartTradingBotBuy.json',
    SMART_BOT_SELL: 'smartTradingBotSell.json',
    EMA_BOT: 'emaTradingBot.json',
    EMA_SIMULATOR: 'emaTradingBotSimulator.json',
    SMART_SIMULATOR_BUY: 'smartTradingBotSimulatorBuy.json',
    SMART_SIMULATOR_SELL: 'smartTradingBotSimulatorSell.json',
    MULTI_SMART_BUY: 'multiSmartTradingBotBuy.json',
    MULTI_SMART_SIMULATOR_BUY: 'multiSmartTradingBotSimulatorBuy.json',
    MULTI_SMART_SIMULATOR_SELL: 'multiSmartTradingBotSimulatorSell.json',
    ELITE_SIMULATOR: 'eliteTradingBotSimulator.json',
    SUPPORT_RESISTANCE: 'supportResistanceTrades.json'
  }
};

interface BotSpecificConfig {
  SMART_BOT_BUY: any;
  REAL_BOT: any;
  EMA_BOT: any;
  SUPPORT_RESISTANCE: any;
}

const BALANCED_BOT_CONFIG: BotSpecificConfig = {
  SMART_BOT_BUY: {
    MIN_CONFIDENCE: 85,
    MIN_EMA_SCORE: 12,
    MIN_TOTAL_SCORE: 80,
    VOLUME_MULTIPLIER: 1.5,
    RISK_PERCENT: 0.5,
    REWARD_MULTIPLIER: 2.5
  },
  REAL_BOT: {
    MIN_CONFIDENCE: 90,
    REQUIRE_EMA_CONFIRMATION: true,
    REQUIRE_VOLUME_SPIKE: true,
    STOP_LOSS_PERCENT: 1.0,
    MAX_LOSS_PER_TRADE: 5
  },
  EMA_BOT: {
    MIN_SEPARATION: 0.01,
    VOLUME_CONFIRMATION: true,
    CANDLE_CONFIRMATION: 3,
    MIN_VOLATILITY: 0.5,
    MAX_VOLATILITY: 3.0,
    POSITION_SIZE: 75
  },
  SUPPORT_RESISTANCE: {
    MIN_TOUCHES: 2,
    MAX_DISTANCE: 0.005,
    RECENT_TEST: true,
    VOLUME_CONFIRMATION: true,
    BOUNCE_CONFIRMATION: true,
    RSI_OVERSOLD: true
  }
};

type ConfigMode = 'BALANCED' | 'ULTRA_CONSERVATIVE';

class TradingConfigManager {
  private static currentMode: ConfigMode = 'BALANCED';

  static setMode(mode: ConfigMode): void {
    this.currentMode = mode;
  }

  static getMode(): ConfigMode {
    return this.currentMode;
  }

  static getConfig(): BaseTradingConfig {
    return BALANCED_CONFIG;
  }

  static getBotConfig(): BotSpecificConfig {
    return BALANCED_BOT_CONFIG;
  }

  static getMaxActiveTrades(isSimulation: boolean = false): number {
    const config = this.getConfig();
    return isSimulation
      ? config.SIMULATION.MAX_ACTIVE_TRADES
      : config.LIMITS.MAX_ACTIVE_TRADES;
  }

  static getMaxTradesPerSymbol(): number {
    return this.getConfig().LIMITS.MAX_TRADES_PER_SYMBOL;
  }

  static canTrade(recentTrades: any[]): boolean {
    const config = this.getConfig();
    const today = new Date().toDateString();
    const todayTrades = recentTrades.filter(t =>
      new Date(t.timestamp).toDateString() === today
    );

    const dailyLoss = todayTrades
      .filter(t => t.result === 'loss')
      .reduce((sum, t) => sum + Math.abs(t.actualReturn || 0), 0);

    if (dailyLoss >= config.LIMITS.MAX_DAILY_LOSS) {
      return false;
    }

    const recentLosses = recentTrades
      .slice(-config.LIMITS.MAX_CONSECUTIVE_LOSSES)
      .filter(t => t.result === 'loss');

    return recentLosses.length < config.LIMITS.MAX_CONSECUTIVE_LOSSES;
  }
}

export const UNIFIED_TRADING_CONFIG = {
  ...TradingConfigManager.getConfig(),
  getMaxActiveTrades: TradingConfigManager.getMaxActiveTrades,
  getMaxTradesPerSymbol: TradingConfigManager.getMaxTradesPerSymbol,
  canTrade: TradingConfigManager.canTrade
};

export const BOT_SPECIFIC_CONFIG = TradingConfigManager.getBotConfig();
export { TradingConfigManager, ConfigMode };
export type { BaseTradingConfig, BotSpecificConfig };
export default TradingConfigManager;