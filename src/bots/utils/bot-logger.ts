import { TRADING_CONFIG } from '../config/trading-config';

export function logBotHeader(botName: string, strategy: string) {
  console.log(`🚀 ${botName}`);
  console.log('⚠️  ATENÇÃO: Este bot executará ordens reais na Binance!');
  console.log(`💵 Valor por trade: $${TRADING_CONFIG.TRADE_AMOUNT_USD}`);
  console.log(`📊 Confiança mínima: ${TRADING_CONFIG.MIN_CONFIDENCE}%`);
  console.log(`🎯 Risk/Reward OBRIGATÓRIO: ${TRADING_CONFIG.MIN_RISK_REWARD_RATIO}:1 (SEMPRE 2:1)`);
  console.log(`📈 Estratégia: ${strategy}\n`);
}

export function logTradeSuccess(botType: string) {
  console.log(`\n🎯 ${botType} TRADE EXECUTADO COM SUCESSO!`);
  console.log('📱 Monitore a posição');
  console.log('⚠️  Trading automatizado envolve riscos!');
}

export function logRiskReward(riskPercent: number, rewardPercent: number) {
  console.log('🔍 Validação final de Risk/Reward 2:1 obrigatório...');
  console.log(`📊 R/R calculado: ${(rewardPercent*100).toFixed(1)}%/${(riskPercent*100).toFixed(1)}% (${(rewardPercent/riskPercent).toFixed(1)}:1)`);
}

export function logBotStartup(botName: string, description: string, delay: number = 5000) {
  console.log(`⚠️  ATENÇÃO: ${botName} executará ordens REAIS na Binance!`);
  console.log(description);
  console.log('🛑 Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');
  
  return new Promise(resolve => setTimeout(resolve, delay));
}