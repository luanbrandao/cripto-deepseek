export const TRADING_CONFIG = {
  // CONFIGURAÇÕES DE MOEDA E TRADING
  SYMBOLS: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT', 'ADAUSDT'], // Array de moedas para análise
  SYMBOLS_EXAMPLE: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT', 'ADAUSDT'], // Array de moedas para análise
  DEFAULT_SYMBOL: 'BTCUSDT',        // Moeda padrão para bots single-symbol
  TRADE_AMOUNT_USD: 15,             // Valor por trade

  // CONFIGURAÇÕES DE CONFIANÇA E TEMPO
  MIN_CONFIDENCE: 70,               // Confiança mínima
  TRADE_COOLDOWN_MINUTES: 5,        // Tempo entre trades

  // GARANTIA 2:1 - Reward sempre 2x maior que risco
  MIN_RISK_REWARD_RATIO: 2.0,       // OBRIGATÓRIO: Mínimo 2:1

  // CONFIGURAÇÕES DE RISCO
  RISK: {
    BASE_PERCENT: 0.5,              // 0.5% risco mínimo → 1.0% reward
    MAX_PERCENT: 1.5                // 1.5% risco máximo → 3.0% reward
  },

  // CONFIGURAÇÕES DE ANÁLISE
  CHART: {
    TIMEFRAME: '1h',                // Tempo gráfico para análise
    PERIODS: 50                     // Analisa 50 velas = 50 horas de histórico
  },

  // // Para análise mais rápida (day trading)
  // CHART: {
  //   TIMEFRAME: '15m',   // Cada vela = 15 minutos  
  //   PERIODS: 100        // Analisa 100 velas = 25 horas de histórico
  // }

  // // Para análise de longo prazo
  // CHART: {
  //   TIMEFRAME: '4h',    // Cada vela = 4 horas
  //   PERIODS: 24         // Analisa 24 velas = 4 dias de histórico
  // }

  EMA: {
    FAST_PERIOD: 12,                // EMA rápida
    SLOW_PERIOD: 26                 // EMA lenta
  },

  // CONFIGURAÇÕES DE SIMULAÇÃO
  SIMULATION: {
    STARTUP_DELAY: 3000,            // Delay de startup (ms)
    INITIAL_BALANCE: 1000           // Saldo inicial simulado
  },

  // CONFIGURAÇÕES DE ARQUIVOS
  FILES: {
    REAL_BOT: 'realTradingBot.json',
    SMART_BOT: 'smartTradingBot.json',
    EMA_BOT: 'emaTradingBot.json',
    SIMULATION: 'aiTradingBot.json',
    SMART_SIMULATOR: 'smartTradingBotSimulator.json'
  }
  // Resultado: Risk 0.5%-1.5% | Reward 1.0%-3.0% (sempre 2:1)
};

export class TradingState {
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