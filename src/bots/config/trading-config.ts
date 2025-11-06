// 🔄 ARQUIVO DE COMPATIBILIDADE - Redireciona para módulos unificados
// Este arquivo mantém compatibilidade com imports antigos

import { 
  UNIFIED_TRADING_CONFIG as TRADING_CONFIG, 
  UnifiedTradingState as TradingState 
} from '../../shared/config/unified-trading-config';

export { TRADING_CONFIG, TradingState };