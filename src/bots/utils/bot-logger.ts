import { TRADING_CONFIG } from '../config/trading-config';

export function logBotHeader(botName: string, strategy: string, isSimulation: boolean = false) {
  console.log(`🚀 ${botName}`);
  
  if (isSimulation) {
    console.log('✅ MODO SIMULAÇÃO: Nenhuma ordem real será executada!');
  } else {
    console.log('⚠️  ATENÇÃO: Este bot executará ordens reais na Binance!');
  }
  
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

export function logBotStartup(botName: string, description: string, delay: number = 5000, isSimulation: boolean = false) {
  if (isSimulation) {
    console.log(`✅ SIMULAÇÃO: ${botName} - Modo seguro ativado!`);
  } else {
    console.log(`⚠️  ATENÇÃO: ${botName} executará ordens REAIS na Binance!`);
  }
  
  console.log(description);
  
  if (isSimulation) {
    console.log('🧪 Iniciando simulação em 2 segundos...');
    return new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('🛑 Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...');
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}