/**
 * 🚀 CONFIGURAÇÃO OTIMIZADA PARA MAXIMIZAÇÃO DE GANHOS
 * Baseada em análise técnica e estatística dos dados históricos
 */

import { TradingConfigManager } from '../../shared/config/trading-config-manager';

export const OPTIMIZED_TRADING_CONFIG = {
  // 💰 CONFIGURAÇÕES FINANCEIRAS OTIMIZADAS
  TRADE_AMOUNT_USD: 20,              // ↑ Aumentado de $15 para $20
  MIN_CONFIDENCE: TradingConfigManager.getConfig().MIN_CONFIDENCE,
  MIN_RISK_REWARD_RATIO: 1.7,       // ↓ Reduzido de 2.0 para 1.7
  TRADE_COOLDOWN_MINUTES: 2,         // ↓ Reduzido de 5 para 2 minutos

  // 📊 SÍMBOLOS OTIMIZADOS POR VOLATILIDADE E VOLUME
  SYMBOLS: [
    'BTCUSDT',    // Líder de mercado, alta liquidez
    'ETHUSDT',    // Alta volatilidade, boas oportunidades  
    'BNBUSDT',    // Performance histórica comprovada
    'SOLUSDT',    // Alta volatilidade, potencial de ganhos
    'ADAUSDT'     // Diversificação, movimentos consistentes
  ],

  // 📈 CONFIGURAÇÕES DE GRÁFICO OTIMIZADAS
  CHART: {
    TIMEFRAME: '30m',              // ↓ Reduzido de 1h para 30m (mais oportunidades)
    PERIODS: 80                    // ↑ Aumentado de 50 para 80 (melhor contexto)
  },

  // 🎯 EMA OTIMIZADA PARA SINAIS MAIS RÁPIDOS
  EMA: {
    FAST_PERIOD: 9,                // ↓ Reduzido de 12 para 9 (mais responsivo)
    SLOW_PERIOD: 21                // ↓ Reduzido de 26 para 21 (sinais mais rápidos)
  },

  // 🔥 THRESHOLDS RELAXADOS PARA MAIS EXECUÇÕES
  THRESHOLDS: {
    // Smart Bots (Moderadamente Agressivos)
    SMART_BUY: 25,                 // ↓ Threshold mais baixo
    SMART_SELL: 30,                // ↓ Threshold mais baixo

    // Multi-Smart Bots (Seletivos mas Executáveis)
    MULTI_SMART_BUY: {
      BULL_MARKET: 25,             // ↓ de 45 para 25
      BEAR_MARKET: 35,             // ↓ de 65 para 35
      SIDEWAYS: 30,                // ↓ de 55 para 30
      DEFAULT: 32                  // ↓ de 60 para 32
    },

    MULTI_SMART_SELL: {
      BULL_MARKET: 40,             // ↓ de 70 para 40
      BEAR_MARKET: 20,             // ↓ de 35 para 20
      SIDEWAYS: 25,                // ↓ de 50 para 25
      DEFAULT: 30                  // ↓ de 55 para 30
    }
  },

  // 📊 LIMITES AUMENTADOS PARA MAIS OPORTUNIDADES
  LIMITS: {
    OPEN_ORDERS: 2,
    MAX_ACTIVE_TRADES: 5,          // ↑ Aumentado de 4 para 5
    MAX_TRADES_PER_SYMBOL: 2       // ↑ Permitir re-entrada (de 1 para 2)
  },

  SIMULATION: {
    MAX_ACTIVE_TRADES: 4           // ↑ Aumentado de 2 para 4
  },

  // 🎯 SISTEMA DE CONFIANÇA DINÂMICA
  CONFIDENCE_BOOST: {
    EMA_CONFIRMATION: 5,           // Boost quando EMA confirma
    HIGH_VOLUME: 3,                // Boost com volume alto
    MARKET_MOMENTUM: 4,            // Boost em mercado forte
    VOLATILITY_SPIKE: 2            // Boost com volatilidade favorável
  },

  // 🛡️ RISK MANAGEMENT OTIMIZADO
  RISK: {
    BASE_PERCENT: 0.4,             // ↓ Risco base reduzido (de 0.5%)
    MAX_PERCENT: 1.2,              // ↓ Risco máximo reduzido (de 1.5%)
    VOLATILITY_MULTIPLIER: 0.8     // Multiplicador de volatilidade
  },

  // 📈 CONFIGURAÇÕES DE PERFORMANCE
  PERFORMANCE: {
    TARGET_WIN_RATE: 65,           // Meta de win rate
    TARGET_TRADES_PER_DAY: 10,     // Meta de trades por dia
    MAX_DRAWDOWN: 15,              // Drawdown máximo permitido
    PROFIT_FACTOR_MIN: 1.5         // Fator de lucro mínimo
  },

  // 🔄 CONFIGURAÇÕES DE EXECUÇÃO
  EXECUTION: {
    RETRY_ATTEMPTS: 3,             // Tentativas de retry
    ORDER_TIMEOUT: 30,             // Timeout de ordem (segundos)
    SLIPPAGE_TOLERANCE: 0.1        // Tolerância de slippage (%)
  },

  // 📊 CONFIGURAÇÕES DE ANÁLISE AVANÇADA
  ANALYSIS: {
    VOLUME_SPIKE_THRESHOLD: 1.5,   // Threshold para pico de volume
    MOMENTUM_PERIODS: 14,          // Períodos para cálculo de momentum
    VOLATILITY_PERIODS: 20,        // Períodos para volatilidade
    TREND_STRENGTH_MIN: 0.6        // Força mínima de tendência
  }
};

// 🎯 CONFIGURAÇÕES ESPECÍFICAS POR BOT TYPE
export const BOT_SPECIFIC_CONFIG = {
  SMART_BOTS: {
    MIN_CONFIDENCE: TradingConfigManager.getConfig().MIN_CONFIDENCE,
    RISK_MULTIPLIER: 0.8,          // Risco reduzido
    BOOST_FACTOR: 1.2              // Boost moderado
  },

  MULTI_SMART_BOTS: {
    MIN_CONFIDENCE: TradingConfigManager.getConfig().MEDIUM_CONFIDENCE,
    RISK_MULTIPLIER: 1.0,          // Risco padrão
    BOOST_FACTOR: 1.5              // Boost maior
  },

  SIMULATORS: {
    MIN_CONFIDENCE: TradingConfigManager.getConfig().MIN_CONFIDENCE,
    RISK_MULTIPLIER: 0.7,          // Risco baixo
    BOOST_FACTOR: 1.1              // Boost mínimo
  }
};

// 🚀 FUNÇÃO PARA APLICAR CONFIGURAÇÕES OTIMIZADAS
export function applyOptimizedConfig() {
  console.log('🚀 APLICANDO CONFIGURAÇÕES OTIMIZADAS PARA MAXIMIZAÇÃO DE GANHOS');
  console.log('📊 Configurações:');
  console.log(`   💰 Trade Amount: $${OPTIMIZED_TRADING_CONFIG.TRADE_AMOUNT_USD}`);
  console.log(`   📈 Min Confidence: ${OPTIMIZED_TRADING_CONFIG.MIN_CONFIDENCE}%`);
  console.log(`   🎯 Risk/Reward: ${OPTIMIZED_TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
  console.log(`   ⏱️ Cooldown: ${OPTIMIZED_TRADING_CONFIG.TRADE_COOLDOWN_MINUTES}min`);
  console.log(`   📊 Timeframe: ${OPTIMIZED_TRADING_CONFIG.CHART.TIMEFRAME}`);
  console.log(`   🪙 Symbols: ${OPTIMIZED_TRADING_CONFIG.SYMBOLS.length} moedas`);
  console.log(`   🔥 Max Trades: ${OPTIMIZED_TRADING_CONFIG.LIMITS.MAX_ACTIVE_TRADES}`);

  return OPTIMIZED_TRADING_CONFIG;
}

// 📊 MÉTRICAS DE MONITORAMENTO
export const MONITORING_METRICS = {
  WIN_RATE_TARGET: 65,
  TRADES_PER_DAY_TARGET: 10,
  PROFIT_FACTOR_MIN: 1.5,
  MAX_DRAWDOWN: 15,
  ROI_MONTHLY_TARGET: 20
};

export default OPTIMIZED_TRADING_CONFIG;