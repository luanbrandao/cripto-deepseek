/**
 * 🛡️ CONFIGURAÇÃO ULTRA-CONSERVADORA
 * MIGRADO PARA: trading-config-manager.ts
 * Use TradingConfigManager.setMode('ULTRA_CONSERVATIVE') para ativar
 */

import { TradingConfigManager } from './trading-config-manager';

// Ativar modo ultra-conservador por padrão neste arquivo
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

// Exportar configurações do gerenciador para compatibilidade
export const ULTRA_CONSERVATIVE_CONFIG = TradingConfigManager.getConfig();
export const BOT_ULTRA_CONSERVATIVE_CONFIG = TradingConfigManager.getBotConfig();

// MÉTRICAS E CONFIGURAÇÕES ADICIONAIS (mantidas para compatibilidade)
export const ULTRA_CONSERVATIVE_TARGETS = {
  WIN_RATE_TARGET: 80,
  TRADES_PER_WEEK: 2,
  MAX_DRAWDOWN: 2.0,
  PROFIT_FACTOR_MIN: 3.0,
  SHARPE_RATIO_MIN: 2.5,
  ROI_MONTHLY_TARGET: 8
};

export const EMERGENCY_STOPS = {
  STOP_IF_WIN_RATE_BELOW: 70,
  STOP_IF_DRAWDOWN_ABOVE: 5,
  STOP_IF_CONSECUTIVE_LOSSES: 3,
  REVIEW_AFTER_TRADES: 10,
  MANDATORY_BREAK_HOURS: 48
};

export default ULTRA_CONSERVATIVE_CONFIG;