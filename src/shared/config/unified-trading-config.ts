/**
 * 🎯 CONFIGURAÇÃO UNIFICADA DE TRADING
 * MIGRADO PARA: trading-config-manager.ts
 * Use TradingConfigManager.setMode('BALANCED') para ativar (padrão)
 */

import { TradingConfigManager } from './trading-config-manager';

// Garantir modo balanceado por padrão
TradingConfigManager.setMode('BALANCED');

// Exportar configurações do gerenciador para compatibilidade
export const UNIFIED_TRADING_CONFIG = TradingConfigManager.getConfig();

// Adicionar funções auxiliares como métodos estáticos
Object.assign(UNIFIED_TRADING_CONFIG, {
  getMaxActiveTrades: TradingConfigManager.getMaxActiveTrades,
  getMaxTradesPerSymbol: TradingConfigManager.getMaxTradesPerSymbol,
  canTrade: TradingConfigManager.canTrade
});

export const BOT_SPECIFIC_CONFIG = TradingConfigManager.getBotConfig();

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