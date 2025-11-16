/**
 * 🎛️ GERENCIADOR DE CONFIGURAÇÕES DE TRADING
 * Centraliza e padroniza as configurações para facilitar a troca entre modos
 */

// Tipo base para todas as configurações
interface BaseTradingConfig {
  // CONFIGURAÇÕES BÁSICAS
  SYMBOLS: string[];
  DEFAULT_SYMBOL: string;
  TRADE_AMOUNT_USD: number;

  // CONFIANÇA E TEMPO
  MIN_CONFIDENCE: number;
  HIGH_CONFIDENCE: number;
  MEDIUM_CONFIDENCE: number;
  TRADE_COOLDOWN_MINUTES: number;

  // RISK/REWARD
  MIN_RISK_REWARD_RATIO: number;

  // RISCO
  RISK: {
    BASE_PERCENT: number;
    MAX_PERCENT: number;
  };

  // ANÁLISE
  CHART: {
    TIMEFRAME: string;
    PERIODS: number;
  };

  EMA: {
    FAST_PERIOD: number;
    SLOW_PERIOD: number;
  };

  // SIMULAÇÃO
  SIMULATION: {
    STARTUP_DELAY: number;
    INITIAL_BALANCE: number;
    MAX_ACTIVE_TRADES: number;
  };

  // LIMITES
  LIMITS: {
    OPEN_ORDERS: number;
    MAX_ACTIVE_TRADES: number;
    MAX_TRADES_PER_SYMBOL: number;
    MAX_DAILY_LOSS: number;
    MAX_CONSECUTIVE_LOSSES: number;
    EMERGENCY_STOP_LOSS: number;
  };

  // FILTROS DE MERCADO
  MARKET_FILTERS: {
    MIN_VOLATILITY: number;
    MAX_VOLATILITY: number;
    REQUIRE_BTC_UPTREND: boolean;
    MIN_VOLUME_MULTIPLIER: number;
    AVOID_WEEKENDS: boolean;
  };

  // EMA AVANÇADO
  EMA_ADVANCED: {
    MIN_SEPARATION: number;
    MIN_EMA_SCORE: number;
    REQUIRE_ALIGNMENT: boolean;
    MIN_TREND_STRENGTH: number;
    MOMENTUM_CONFIRMATION: boolean;
  };

  // ALGORITMO E CONSTANTES TÉCNICAS
  ALGORITHM: {
    // EMA
    EMA_MULTIPLIER_NUMERATOR: number;
    EMA_COMPLEMENT_FACTOR: number;

    // Confiança
    DEFAULT_CONFIDENCE: number;
    LOW_CONFIDENCE: number;
    BASE_CONFIDENCE: number;
    HIGH_CONFIDENCE_THRESHOLD: number;
    EXCEPTIONAL_CONFIDENCE: number;
    VERY_HIGH_CONFIDENCE: number;

    // RSI
    RSI_MIN: number;
    RSI_MAX: number;
    RSI_OPTIMAL_MIN: number;
    RSI_OPTIMAL_MAX: number;

    // Padrão 123
    PATTERN_123: {
      MIN_CANDLES_REQUIRED: number;
      PATTERN_CANDLES_COUNT: number;
      TREND_ANALYSIS_CANDLES: number;
      TREND_OFFSET: number;
      BASE_CONFIDENCE: number;
      TREND_CONFIDENCE: number;
    };

    // Multiplicadores
    STRENGTH_MULTIPLIER: number;
    CONFIDENCE_DIVISOR: number;
    HIGH_AMOUNT_MULTIPLIER: number;
    MEDIUM_AMOUNT_MULTIPLIER: number;
    DEFAULT_AMOUNT: number;

    // Tolerâncias
    NUMERICAL_TOLERANCE: number;

    // Scores
    EXCEPTIONAL_SCORE: number;
    VERY_HIGH_SCORE: number;
    MIN_SCORE: number;
    ACTION_SCORE: number;
    SIMULATION_CONFIDENCE_SCORE: number;

    // Thresholds
    ULTRA_CONSERVATIVE_THRESHOLD: number;
    SIMULATION_THRESHOLD: number;
    MIN_SCORE_THRESHOLD: number;
  };

  // CAMINHOS E ARQUIVOS
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

// 🎯 CONFIGURAÇÃO BALANCEADA (PADRÃO)
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

  ALGORITHM: {
    // EMA
    EMA_MULTIPLIER_NUMERATOR: 2,
    EMA_COMPLEMENT_FACTOR: 1,

    // Confiança
    DEFAULT_CONFIDENCE: 50,
    LOW_CONFIDENCE: 40,
    BASE_CONFIDENCE: 65,
    HIGH_CONFIDENCE_THRESHOLD: 70,
    EXCEPTIONAL_CONFIDENCE: 95,
    VERY_HIGH_CONFIDENCE: 90,

    // RSI
    RSI_MIN: 30,
    RSI_MAX: 70,
    RSI_OPTIMAL_MIN: 40,
    RSI_OPTIMAL_MAX: 60,

    // Padrão 123
    PATTERN_123: {
      MIN_CANDLES_REQUIRED: 10,
      PATTERN_CANDLES_COUNT: 3,
      TREND_ANALYSIS_CANDLES: 7,
      TREND_OFFSET: 3,
      BASE_CONFIDENCE: 65,
      TREND_CONFIDENCE: 80
    },

    // Multiplicadores
    STRENGTH_MULTIPLIER: 0.25,
    CONFIDENCE_DIVISOR: 15,
    HIGH_AMOUNT_MULTIPLIER: 3,
    MEDIUM_AMOUNT_MULTIPLIER: 2,
    DEFAULT_AMOUNT: 1,

    // Tolerâncias
    NUMERICAL_TOLERANCE: 0.01,

    // Scores
    EXCEPTIONAL_SCORE: 25,
    VERY_HIGH_SCORE: 20,
    MIN_SCORE: 15,
    ACTION_SCORE: 20,
    SIMULATION_CONFIDENCE_SCORE: 40,

    // Thresholds
    ULTRA_CONSERVATIVE_THRESHOLD: 80,
    SIMULATION_THRESHOLD: 60,
    MIN_SCORE_THRESHOLD: 10
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

// 🛡️ CONFIGURAÇÃO ULTRA-CONSERVADORA
const ULTRA_CONSERVATIVE_CONFIG: BaseTradingConfig = {
  SYMBOLS: ['BTCUSDT', 'ETHUSDT'], // Apenas as mais estáveis
  DEFAULT_SYMBOL: 'BTCUSDT',
  TRADE_AMOUNT_USD: 10, // Menor exposição

  MIN_CONFIDENCE: 75, // Muito rigoroso
  HIGH_CONFIDENCE: 80,
  MEDIUM_CONFIDENCE: 78,
  TRADE_COOLDOWN_MINUTES: 720, // 12 horas

  MIN_RISK_REWARD_RATIO: 3.0, // Proteção máxima

  RISK: {
    BASE_PERCENT: 0.15, // Muito conservador
    MAX_PERCENT: 0.5
  },

  CHART: {
    TIMEFRAME: '1h', // Para testes
    PERIODS: 50 // Dados para testes
  },

  EMA: {
    FAST_PERIOD: 21, // Menos ruído
    SLOW_PERIOD: 50
  },

  SIMULATION: {
    STARTUP_DELAY: 5000,
    INITIAL_BALANCE: 1000,
    MAX_ACTIVE_TRADES: 2 // Apenas 1 simulação
  },

  LIMITS: {
    OPEN_ORDERS: 2,
    MAX_ACTIVE_TRADES: 2, // Apenas 1 trade ativo
    MAX_TRADES_PER_SYMBOL: 2,
    MAX_DAILY_LOSS: 100, // Muito restritivo
    MAX_CONSECUTIVE_LOSSES: 10, // Para após 1 perda
    EMERGENCY_STOP_LOSS: 25
  },

  MARKET_FILTERS: {
    MIN_VOLATILITY: 0.3,
    MAX_VOLATILITY: 2.5, // Máxima estabilidade
    REQUIRE_BTC_UPTREND: true,
    MIN_VOLUME_MULTIPLIER: 3.0, // Volume muito alto
    AVOID_WEEKENDS: true
  },

  EMA_ADVANCED: {
    MIN_SEPARATION: 0.008, // Mais rigoroso
    MIN_EMA_SCORE: 16,
    REQUIRE_ALIGNMENT: true,
    MIN_TREND_STRENGTH: 0.02,
    MOMENTUM_CONFIRMATION: true
  },

  ALGORITHM: {
    // EMA
    EMA_MULTIPLIER_NUMERATOR: 2,
    EMA_COMPLEMENT_FACTOR: 1,

    // Confiança (mais rigorosa)
    DEFAULT_CONFIDENCE: 60,
    LOW_CONFIDENCE: 50,
    BASE_CONFIDENCE: 75,
    HIGH_CONFIDENCE_THRESHOLD: 80,
    EXCEPTIONAL_CONFIDENCE: 98,
    VERY_HIGH_CONFIDENCE: 95,

    // RSI (mais conservador)
    RSI_MIN: 25,
    RSI_MAX: 75,
    RSI_OPTIMAL_MIN: 35,
    RSI_OPTIMAL_MAX: 65,

    // Padrão 123 (mais rigoroso)
    PATTERN_123: {
      MIN_CANDLES_REQUIRED: 15,
      PATTERN_CANDLES_COUNT: 3,
      TREND_ANALYSIS_CANDLES: 10,
      TREND_OFFSET: 5,
      BASE_CONFIDENCE: 75,
      TREND_CONFIDENCE: 90
    },

    // Multiplicadores (mais conservadores)
    STRENGTH_MULTIPLIER: 0.15,
    CONFIDENCE_DIVISOR: 20,
    HIGH_AMOUNT_MULTIPLIER: 2,
    MEDIUM_AMOUNT_MULTIPLIER: 1.5,
    DEFAULT_AMOUNT: 0.5,

    // Tolerâncias (mais rigorosas)
    NUMERICAL_TOLERANCE: 0.005,

    // Scores (mais altos)
    EXCEPTIONAL_SCORE: 30,
    VERY_HIGH_SCORE: 25,
    MIN_SCORE: 20,
    ACTION_SCORE: 25,
    SIMULATION_CONFIDENCE_SCORE: 50,

    // Thresholds (mais rigorosos)
    ULTRA_CONSERVATIVE_THRESHOLD: 90,
    SIMULATION_THRESHOLD: 70,
    MIN_SCORE_THRESHOLD: 15
  },

  PATHS: {
    TRADES_DIR: './src/storage/trades'
  },

  FILES: {
    REAL_BOT: '1-ultraConservativeRealTradingBot.json',
    REAL_BOT_SIMULATOR: '1-ultraConservativeRealTradingBotSimulator.json',
    SMART_BOT_BUY: '1-ultraConservativeSmartTradingBotBuy.json',
    SMART_BOT_SELL: '1-ultraConservativeSmartTradingBotSell.json',
    EMA_BOT: '1-ultraConservativeEmaTradingBot.json',
    EMA_SIMULATOR: '1-ultraConservativeEmaTradingBotSimulator.json',
    SMART_SIMULATOR_BUY: '1-ultraConservativeSmartTradingBotSimulatorBuy.json',
    SMART_SIMULATOR_SELL: '1-ultraConservativeSmartTradingBotSimulatorSell.json',
    MULTI_SMART_BUY: '1-ultraConservativeMultiSmartTradingBotBuy.json',
    MULTI_SMART_SIMULATOR_BUY: '1-ultraConservativeMultiSmartTradingBotSimulatorBuy.json',
    MULTI_SMART_SIMULATOR_SELL: '1-ultraConservativeMultiSmartTradingBotSimulatorSell.json',
    ELITE_SIMULATOR: '1-ultraConservativeEliteTradingBotSimulator.json',
    SUPPORT_RESISTANCE: '1-ultraConservativeSupportResistanceTrades.json'
  }
};

// 🎛️ CONFIGURAÇÕES ESPECÍFICAS POR BOT (PADRONIZADAS)
interface BotSpecificConfig {
  SMART_BOT_BUY: any;
  REAL_BOT: any;
  EMA_BOT: any;
  SUPPORT_RESISTANCE: any;
}

const BALANCED_BOT_CONFIG: BotSpecificConfig = {
  SMART_BOT_BUY: {
    MIN_CONFIDENCE: 80,
    MIN_EMA_SCORE: 12,
    MIN_TOTAL_SCORE: 80,
    VOLUME_MULTIPLIER: 1.5,
    RISK_PERCENT: 0.5,
    REWARD_MULTIPLIER: 2.5
  },

  REAL_BOT: {
    MIN_CONFIDENCE: 80,
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

const ULTRA_CONSERVATIVE_BOT_CONFIG: BotSpecificConfig = {
  SMART_BOT_BUY: {
    MIN_CONFIDENCE: 80,
    MIN_EMA_SCORE: 18,
    MIN_TOTAL_SCORE: 90,
    VOLUME_MULTIPLIER: 3.0,
    RISK_PERCENT: 0.2,
    REWARD_MULTIPLIER: 4.0
  },

  REAL_BOT: {
    MIN_CONFIDENCE: 80,
    REQUIRE_EMA_CONFIRMATION: true,
    REQUIRE_VOLUME_SPIKE: true,
    STOP_LOSS_PERCENT: 0.5,
    MAX_LOSS_PER_TRADE: 2
  },

  EMA_BOT: {
    MIN_SEPARATION: 0.015,
    VOLUME_CONFIRMATION: true,
    CANDLE_CONFIRMATION: 5,
    MIN_VOLATILITY: 0.3,
    MAX_VOLATILITY: 2.0,
    POSITION_SIZE: 50
  },

  SUPPORT_RESISTANCE: {
    MIN_TOUCHES: 3, // Mais rigoroso
    MAX_DISTANCE: 0.003,
    RECENT_TEST: true,
    VOLUME_CONFIRMATION: true,
    BOUNCE_CONFIRMATION: true,
    RSI_OVERSOLD: true
  }
};

// 🎯 SELETOR DE CONFIGURAÇÃO
type ConfigMode = 'BALANCED' | 'ULTRA_CONSERVATIVE';

class TradingConfigManager {
  private static currentMode: ConfigMode = 'BALANCED';

  static setMode(mode: ConfigMode): void {
    this.currentMode = mode;
    console.log(`🎛️ Modo de configuração alterado para: ${mode}`);
  }

  static getMode(): ConfigMode {
    return this.currentMode;
  }

  static getConfig(): BaseTradingConfig {
    return this.currentMode === 'ULTRA_CONSERVATIVE'
      ? ULTRA_CONSERVATIVE_CONFIG
      : BALANCED_CONFIG;
  }

  static getBotConfig(): BotSpecificConfig {
    return this.currentMode === 'ULTRA_CONSERVATIVE'
      ? ULTRA_CONSERVATIVE_BOT_CONFIG
      : BALANCED_BOT_CONFIG;
  }

  // Funções auxiliares compatíveis
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

// Exportações compatíveis com o sistema atual
export const UNIFIED_TRADING_CONFIG = {
  ...TradingConfigManager.getConfig(),
  getMaxActiveTrades: TradingConfigManager.getMaxActiveTrades,
  getMaxTradesPerSymbol: TradingConfigManager.getMaxTradesPerSymbol,
  canTrade: TradingConfigManager.canTrade
};

export const BOT_SPECIFIC_CONFIG = TradingConfigManager.getBotConfig();

export { TradingConfigManager, ConfigMode };
export type { BaseTradingConfig, BotSpecificConfig };

// Para compatibilidade com imports existentes
export default TradingConfigManager;