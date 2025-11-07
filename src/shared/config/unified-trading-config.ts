export const UNIFIED_TRADING_CONFIG = {
  // CONFIGURAÇÕES DE MOEDA E TRADING
  SYMBOLS: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT', 'SOLUSDT'],
  DEFAULT_SYMBOL: 'BTCUSDT',
  TRADE_AMOUNT_USD: 15,

  // CONFIGURAÇÕES DE CONFIANÇA E TEMPO
  MIN_CONFIDENCE: 75,
  HIGH_CONFIDENCE: 85,
  MEDIUM_CONFIDENCE: 80,
  TRADE_COOLDOWN_MINUTES: 5,

  // GARANTIA 2:1 - Reward sempre 2x maior que risco
  MIN_RISK_REWARD_RATIO: 2.0,

  // CONFIGURAÇÕES DE RISCO
  RISK: {
    BASE_PERCENT: 0.5,
    MAX_PERCENT: 1.5
  },

  // CONFIGURAÇÕES DE ANÁLISE
  CHART: {
    TIMEFRAME: '1h',
    PERIODS: 50
  },

  EMA: {
    FAST_PERIOD: 12,
    SLOW_PERIOD: 26
  },

  // CONFIGURAÇÕES DE SIMULAÇÃO
  SIMULATION: {
    STARTUP_DELAY: 3000,
    INITIAL_BALANCE: 1000,
    MAX_ACTIVE_TRADES: 2
  },

  // CONFIGURAÇÕES DE LIMITES
  LIMITS: {
    OPEN_ORDERS: 2,
    MAX_ACTIVE_TRADES: 2,
    MAX_TRADES_PER_SYMBOL: 1
  },

  // CONFIGURAÇÕES DE CAMINHOS
  PATHS: {
    TRADES_DIR: './src/storage/trades'
  },

  // CONFIGURAÇÕES DE ARQUIVOS
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
  },

  // FUNÇÕES AUXILIARES
  getMaxActiveTrades: (isSimulation: boolean = false): number => {
    return isSimulation
      ? UNIFIED_TRADING_CONFIG.SIMULATION.MAX_ACTIVE_TRADES
      : UNIFIED_TRADING_CONFIG.LIMITS.MAX_ACTIVE_TRADES * UNIFIED_TRADING_CONFIG.LIMITS.OPEN_ORDERS;
  },

  getMaxTradesPerSymbol: (): number => {
    return UNIFIED_TRADING_CONFIG.LIMITS.MAX_TRADES_PER_SYMBOL;
  }
};

export class UnifiedTradingState {
  private static lastTradeTime = 0;
  private static isTrading = false;

  static getLastTradeTime(): number {
    return this.lastTradeTime;
  }

  static setLastTradeTime(time: number): void {
    this.lastTradeTime = time;
  }

  static isCurrentlyTrading(): boolean {
    return this.isTrading;
  }

  static setTradingState(trading: boolean): void {
    this.isTrading = trading;
  }
}