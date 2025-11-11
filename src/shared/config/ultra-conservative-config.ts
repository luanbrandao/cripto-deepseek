/**
 * 🛡️ CONFIGURAÇÃO ULTRA-CONSERVADORA
 * Baseada na análise crítica: Win rates de 14.3%, 0%, 0% - INACEITÁVEL
 * Objetivo: Aumentar win rate para 75-85% com máxima segurança
 */

export const ULTRA_CONSERVATIVE_CONFIG = {
  // 🚨 CRITÉRIOS EXTREMAMENTE RIGOROSOS
  MIN_CONFIDENCE: 90,              // ↑ De 70% para 90% (apenas setups perfeitos)
  MIN_RISK_REWARD_RATIO: 3.0,     // ↑ De 2:1 para 3:1 (proteção máxima)
  TRADE_COOLDOWN_HOURS: 12,       // ↑ De 5min para 12h (paciência extrema)

  // 💰 GESTÃO DE CAPITAL CONSERVADORA
  TRADE_AMOUNT_USD: 10,           // ↓ De $15 para $10 (menor exposição)
  MAX_DAILY_TRADES: 1,            // Máximo 1 trade por dia
  MAX_WEEKLY_TRADES: 3,           // Máximo 3 trades por semana

  // 🎯 SELEÇÃO DE MOEDAS PREMIUM (APENAS AS MAIS ESTÁVEIS)
  SYMBOLS: ['BTCUSDT', 'ETHUSDT'], // Apenas BTC e ETH (máxima estabilidade)

  // 📊 ANÁLISE TÉCNICA RIGOROSA
  CHART: {
    TIMEFRAME: '4h',              // ↑ De 1h para 4h (visão macro)
    PERIODS: 168                  // ↑ De 50 para 168 (1 semana de dados)
  },

  // 🔍 FILTROS DE QUALIDADE EXTREMOS
  FILTERS: {
    MIN_VOLUME_24H: 2000000000,   // Volume mínimo $2B (liquidez máxima)
    MAX_VOLATILITY: 2.5,          // Volatilidade máxima 2.5% (estabilidade)
    MIN_TREND_STRENGTH: 0.8,      // Força de tendência mínima 80%
    VOLUME_SPIKE_MIN: 2.0,        // Volume deve ser 2x a média
    RSI_SAFE_ZONE: [35, 65]       // RSI em zona segura (evita extremos)
  },

  // 🛡️ VALIDAÇÕES MULTI-CAMADAS
  VALIDATION_LAYERS: {
    TECHNICAL_CONFLUENCE: 4,       // Mínimo 4 indicadores concordando
    TIMEFRAME_CONFIRMATION: 3,     // Confirmação em 3 timeframes
    SENTIMENT_SCORE_MIN: 0.7,      // Score de sentiment mínimo 70%
    MARKET_CONDITION_CHECK: true   // Verificar condições gerais do mercado
  },

  // 📈 EMA CONSERVADORA
  EMA: {
    FAST_PERIOD: 21,              // ↑ De 12 para 21 (menos ruído)
    SLOW_PERIOD: 50,              // ↑ De 26 para 50 (tendência clara)
    CONFIRMATION_PERIOD: 100      // EMA adicional para confirmação
  },

  // 🎯 CONDIÇÕES DE ENTRADA RIGOROSAS
  ENTRY_CONDITIONS: {
    EMA_ALIGNMENT_STRICT: true,    // EMA 21 > 50 > 100 obrigatório
    PRICE_ABOVE_ALL_EMAS: true,    // Preço acima de todas as EMAs
    VOLUME_CONFIRMATION: true,     // Volume confirmando movimento
    NO_RECENT_REJECTION: true,     // Sem rejeições recentes em resistências
    SUPPORT_DISTANCE_MIN: 2.0,     // Mínimo 2% de distância do suporte
    RESISTANCE_DISTANCE_MIN: 3.0   // Mínimo 3% até próxima resistência
  },

  // 🚫 FILTROS DE EXCLUSÃO
  EXCLUSION_FILTERS: {
    AVOID_NEWS_EVENTS: true,       // Evitar períodos de notícias importantes
    AVOID_HIGH_VOLATILITY: true,   // Evitar alta volatilidade
    AVOID_LOW_VOLUME: true,        // Evitar baixo volume
    AVOID_WEEKEND_TRADES: true,    // Evitar trades em fins de semana
    AVOID_CORRELATION: true        // Evitar trades correlacionados
  },

  // 📊 THRESHOLDS ULTRA-CONSERVADORES
  THRESHOLDS: {
    SMART_BUY: 85,                // ↑ De 25 para 85 (extremamente seletivo)
    SMART_SELL: 90,               // ↑ De 30 para 90 (apenas vendas certas)
    MULTI_SMART_BUY: 88,          // ↑ Threshold muito alto
    MULTI_SMART_SELL: 92,         // ↑ Threshold máximo
    EMA_CROSSOVER_MIN: 80,        // Crossover com alta confiança
    SUPPORT_RESISTANCE_MIN: 85    // S/R com alta confiança
  },

  // 🔒 LIMITES ULTRA-RESTRITIVOS
  LIMITS: {
    MAX_ACTIVE_TRADES: 2,         // ↓ Apenas 1 trade ativo por vez
    MAX_TRADES_PER_SYMBOL: 1,     // ↓ 1 trade por símbolo
    MAX_DAILY_LOSS: 1.0,          // Máximo 1% de perda diária
    MAX_WEEKLY_LOSS: 3.0,         // Máximo 3% de perda semanal
    STOP_TRADING_AFTER_LOSSES: 2  // Parar após 2 perdas consecutivas
  },

  // 🎯 SISTEMA DE SCORING RIGOROSO
  SCORING_SYSTEM: {
    MIN_TOTAL_SCORE: 85,          // Score mínimo total
    TECHNICAL_WEIGHT: 40,         // Peso da análise técnica
    AI_WEIGHT: 35,                // Peso da análise IA
    VOLUME_WEIGHT: 15,            // Peso do volume
    SENTIMENT_WEIGHT: 10,         // Peso do sentiment
    PENALTY_FOR_UNCERTAINTY: -20  // Penalidade por incerteza
  }
};

// 🔧 CONFIGURAÇÕES ESPECÍFICAS POR BOT
export const BOT_ULTRA_CONSERVATIVE_CONFIG = {
  SMART_BOT: {
    ...ULTRA_CONSERVATIVE_CONFIG,
    MIN_CONFIDENCE: 90,           // Smart Bot ainda mais rigoroso
    ADDITIONAL_EMA_CHECK: true,   // Verificação EMA adicional
    TREND_CONFIRMATION_HOURS: 24  // Tendência confirmada por 24h
  },

  REAL_BOT: {
    ...ULTRA_CONSERVATIVE_CONFIG,
    MIN_CONFIDENCE: 88,           // Real Bot com IA
    AI_DOUBLE_CHECK: true,        // Dupla verificação IA
    MARKET_SENTIMENT_REQUIRED: true // Sentiment obrigatório
  },

  EMA_BOT: {
    ...ULTRA_CONSERVATIVE_CONFIG,
    MIN_CONFIDENCE: 85,           // EMA Bot técnico puro
    EMA_TRIPLE_CONFIRMATION: true, // Tripla confirmação EMA
    VOLUME_SPIKE_REQUIRED: true   // Pico de volume obrigatório
  },

  SUPPORT_RESISTANCE_BOT: {
    ...ULTRA_CONSERVATIVE_CONFIG,
    MIN_CONFIDENCE: 90,           // S/R Bot muito rigoroso
    LEVEL_TOUCH_COUNT_MIN: 3,     // Mínimo 3 toques no nível
    LEVEL_STRENGTH_MIN: 0.8       // Força do nível mínima 80%
  }
};

// 📊 MÉTRICAS DE PERFORMANCE ESPERADAS
export const ULTRA_CONSERVATIVE_TARGETS = {
  WIN_RATE_TARGET: 80,            // Meta: 80% win rate
  TRADES_PER_WEEK: 2,             // Meta: 2 trades por semana
  MAX_DRAWDOWN: 2.0,              // Máximo 2% drawdown
  PROFIT_FACTOR_MIN: 3.0,         // Fator de lucro mínimo 3:1
  SHARPE_RATIO_MIN: 2.5,          // Sharpe ratio mínimo 2.5
  ROI_MONTHLY_TARGET: 8           // Meta: 8% ROI mensal
};

// 🚨 SISTEMA DE ALERTAS E PARADAS
export const EMERGENCY_STOPS = {
  STOP_IF_WIN_RATE_BELOW: 70,     // Parar se win rate < 70%
  STOP_IF_DRAWDOWN_ABOVE: 5,      // Parar se drawdown > 5%
  STOP_IF_CONSECUTIVE_LOSSES: 3,  // Parar após 3 perdas seguidas
  REVIEW_AFTER_TRADES: 10,        // Revisar estratégia a cada 10 trades
  MANDATORY_BREAK_HOURS: 48       // Pausa obrigatória após stops
};

export default ULTRA_CONSERVATIVE_CONFIG;