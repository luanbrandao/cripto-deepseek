export const UNIFIED_TRADING_CONFIG = {
  // CONFIGURAÇÕES DE MOEDA E TRADING
  SYMBOLS: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT', 'SOLUSDT'],
  DEFAULT_SYMBOL: 'BTCUSDT',
  TRADE_AMOUNT_USD: 15, // Reduzido de 15 para 15 (Fase 1)

  // CONFIGURAÇÕES DE CONFIANÇA E TEMPO - BALANCEADAS
  MIN_CONFIDENCE: 80, // Mínimo 80%
  HIGH_CONFIDENCE: 90, // Máximo 90%
  MEDIUM_CONFIDENCE: 85, // Médio 85%
  TRADE_COOLDOWN_MINUTES: 30, // Reduzido (era 60)

  // GARANTIA 2.5:1 - Reward balanceado
  MIN_RISK_REWARD_RATIO: 2.5, // Balanceado (era 3.0)

  // CONFIGURAÇÕES DE RISCO - MAIS CONSERVADORAS
  RISK: {
    BASE_PERCENT: 0.25, // Reduzido de 0.5 para 0.25
    MAX_PERCENT: 0.75   // Reduzido de 1.5 para 0.75
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

  // CONFIGURAÇÕES DE LIMITES - MAIS RESTRITIVAS
  LIMITS: {
    OPEN_ORDERS: 2, // Reduzido de 2 para 1
    MAX_ACTIVE_TRADES: 2, // Reduzido de 2 para 1
    MAX_TRADES_PER_SYMBOL: 1,
    MAX_DAILY_LOSS: 50, // Novo: máximo $50 perda/dia
    MAX_CONSECUTIVE_LOSSES: 2, // Novo: máximo 2 perdas consecutivas
    EMERGENCY_STOP_LOSS: 100 // Novo: parar tudo se perder $100
  },

  // NOVOS FILTROS DE MERCADO
  MARKET_FILTERS: {
    MIN_VOLATILITY: 0.5, // Mínimo 0.5% volatilidade
    MAX_VOLATILITY: 4.0, // Máximo 4% volatilidade
    REQUIRE_BTC_UPTREND: true, // BTC deve estar em alta
    MIN_VOLUME_MULTIPLIER: 2.0, // Volume 2x acima da média
    AVOID_WEEKENDS: false // Por enquanto operar 24/7
  },

  // CONFIGURAÇÕES EMA BALANCEADAS
  EMA_ADVANCED: {
    MIN_SEPARATION: 0.005, // Reduzido (era 0.008)
    MIN_EMA_SCORE: 10, // Reduzido (era 16)
    REQUIRE_ALIGNMENT: true, // EMA 8>21>55 obrigatório
    MIN_TREND_STRENGTH: 0.01, // Reduzido (era 0.02)
    MOMENTUM_CONFIRMATION: true // Confirmar momentum positivo
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
    ELITE_SIMULATOR: 'eliteTradingBotSimulator.json',
  },

  // FUNÇÕES AUXILIARES
  getMaxActiveTrades: (isSimulation: boolean = false): number => {
    return isSimulation
      ? UNIFIED_TRADING_CONFIG.SIMULATION.MAX_ACTIVE_TRADES
      : UNIFIED_TRADING_CONFIG.LIMITS.MAX_ACTIVE_TRADES;
  },

  getMaxTradesPerSymbol: (): number => {
    return UNIFIED_TRADING_CONFIG.LIMITS.MAX_TRADES_PER_SYMBOL;
  },

  // NOVA FUNÇÃO: Verificar se pode fazer trade baseado em perdas
  canTrade: (recentTrades: any[]): boolean => {
    const today = new Date().toDateString();
    const todayTrades = recentTrades.filter(t =>
      new Date(t.timestamp).toDateString() === today
    );

    // Verificar perda diária
    const dailyLoss = todayTrades
      .filter(t => t.result === 'loss')
      .reduce((sum, t) => sum + Math.abs(t.actualReturn || 0), 0);

    if (dailyLoss >= UNIFIED_TRADING_CONFIG.LIMITS.MAX_DAILY_LOSS) {
      return false;
    }

    // Verificar perdas consecutivas
    const recentLosses = recentTrades
      .slice(-UNIFIED_TRADING_CONFIG.LIMITS.MAX_CONSECUTIVE_LOSSES)
      .filter(t => t.result === 'loss');

    return recentLosses.length < UNIFIED_TRADING_CONFIG.LIMITS.MAX_CONSECUTIVE_LOSSES;
  }
};

// CONFIGURAÇÕES ESPECÍFICAS POR BOT
export const BOT_SPECIFIC_CONFIG = {
  SMART_BOT_BUY: {
    MIN_CONFIDENCE: 85, // Médio 85%
    MIN_EMA_SCORE: 12, // Reduzido (era 18)
    MIN_TOTAL_SCORE: 80, // Mais flexível (era 95)
    VOLUME_MULTIPLIER: 1.5, // Reduzido (era 3.0)
    RISK_PERCENT: 0.5, // Aumentado (era 0.2)
    REWARD_MULTIPLIER: 2.5 // Balanceado (era 4.0)
  },

  REAL_BOT: {
    MIN_CONFIDENCE: 90, // Máximo 90%
    REQUIRE_EMA_CONFIRMATION: true,
    REQUIRE_VOLUME_SPIKE: true,
    STOP_LOSS_PERCENT: 1.0, // Stop loss mais próximo
    MAX_LOSS_PER_TRADE: 5 // Máximo $5 por trade
  },

  EMA_BOT: {
    MIN_SEPARATION: 0.01, // 1% separação mínima
    VOLUME_CONFIRMATION: true,
    CANDLE_CONFIRMATION: 3, // 3 candles de confirmação
    MIN_VOLATILITY: 0.5,
    MAX_VOLATILITY: 3.0,
    POSITION_SIZE: 75 // Reduzir posição para $75
  },

  SUPPORT_RESISTANCE: {
    MIN_TOUCHES: 2, // Mínimo 2 toques
    MAX_DISTANCE: 0.005, // Máximo 0.5% de distância
    RECENT_TEST: true,
    VOLUME_CONFIRMATION: true,
    BOUNCE_CONFIRMATION: true,
    RSI_OVERSOLD: true
  }
};

// SISTEMA DE MONITORAMENTO
export const MONITORING_CONFIG = {
  ALERTS: {
    WIN_RATE_CRITICAL: 30, // Alertar se win rate < 30%
    DAILY_LOSS_WARNING: 25, // Alertar se perda > $25/dia
    CONSECUTIVE_LOSSES: 2 // Alertar após 2 perdas consecutivas
  },

  TARGETS: {
    MIN_WIN_RATE: 60, // Target mínimo 60%
    MIN_DAILY_RETURN: 0, // Target mínimo 0% diário
    MAX_DRAWDOWN: 5, // Máximo 5% drawdown
    MIN_SHARPE_RATIO: 1.5 // Mínimo 1.5 Sharpe ratio
  }
};

// CONFIGURAÇÃO DE EMERGÊNCIA
export const EMERGENCY_CONFIG = {
  STOP_ALL_TRADING: false,
  CONSERVATIVE_MODE: true, // Ativar modo conservador
  REDUCE_POSITION_SIZE: 0.5, // Reduzir posições pela metade
  INCREASE_CONFIDENCE_THRESHOLD: 5 // Aumentar threshold em 5%
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