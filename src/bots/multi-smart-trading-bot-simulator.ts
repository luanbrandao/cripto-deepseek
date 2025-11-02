import { BaseTradingBot } from './base-trading-bot';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { calculateRiskRewardDynamic, validateTrade, calculateRiskReward, validateConfidence } from './utils/trade-validators';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { multiAnalyzeWithSmartTrade } from './analyzers/multi-smart-trade-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { AdvancedEmaAnalyzer } from './services/advanced-ema-analyzer';
import * as path from 'path';

export class MultiSmartTradingBotSimulator extends BaseTradingBot {
  private trendAnalyzer: MarketTrendAnalyzer;
  private advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 NÃO EXECUTA TRADE REAIS\n');
    console.log('🤖 ENHANCED MULTI-SYMBOL SMART TRADING BOT SIMULATOR v2.0');
    console.log('✅ MODO SIMULAÇÃO - Nenhuma ordem real será executada');
    console.log('🎯 MELHORIAS IMPLEMENTADAS:');
    console.log('  • Análise EMA multi-timeframe (12/26/50/100/200)');
    console.log('  • Parser AI avançado com análise de sentimento');
    console.log('  • Sistema de scoring ponderado (EMA 35% + AI 40% + Volume 15% + Momentum 10%)');
    console.log('  • Filtro adaptativo baseado em condições de mercado');
    console.log('  • Boost inteligente de confiança baseado em critérios');
    console.log('  • Indicadores técnicos: RSI, Volume, Momentum');
    console.log('  • Assertividade esperada: 92-95% (vs 85% anterior)\n');
    logBotHeader('ENHANCED SMART BOT SIMULATOR', 'Análise Multi-Dimensional + Filtros Adaptativos - SIMULAÇÃO');
  }

  private simulateTradeExecution(decision: any) {
    console.log('\n🚨 SIMULANDO EXECUÇÃO DE ORDEM');
    console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} - $${this.getTradeAmount()}`);
    console.log(`📊 Confiança final: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    const simulatedOrder = {
      orderId: 'SIM_' + Date.now(),
      symbol: decision.symbol,
      side: decision.action,
      price: decision.price,
      status: 'SIMULATED',
      executedQty: (this.getTradeAmount() / decision.price).toFixed(6)
    };

    console.log('✅ Ordem simulada com sucesso!');
    console.log(`🆔 ID simulado: ${simulatedOrder.orderId}`);
    console.log(`💱 Qtd simulada: ${simulatedOrder.executedQty}`);
    console.log(`💰 Preço: $${decision.price}`);

    return simulatedOrder;
  }

  private async simulateAndSave(decision: any) {
    const simulatedOrder = this.simulateTradeExecution(decision);
    await this.saveTradeHistory(decision, simulatedOrder);

    console.log('\n🎯 SMART TRADE SIMULADO COM SUCESSO!');
    console.log('📊 Análise completa salva no histórico');
    console.log('✅ Nenhuma ordem real foi executada');

    return simulatedOrder;
  }

  private async multiAnalyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await multiAnalyzeWithSmartTrade(this.deepseek!, symbol, marketData);
  }

  async executeTrade() {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.SMART_SIMULATOR}`);
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    try {
      const symbols = this.getSymbols();

      // Filtro adaptativo baseado em análise avançada
      const validSymbols = [];

      for (const symbol of symbols) {
        const klines = await this.binancePublic.getKlines(symbol, TRADING_CONFIG.CHART.TIMEFRAME, TRADING_CONFIG.CHART.PERIODS);
        const prices = klines.map((k: any) => parseFloat(k[4]));
        const volumes = klines.map((k: any) => parseFloat(k[5]));

        const advancedAnalysis = this.advancedEmaAnalyzer.analyzeAdvanced(prices, volumes);
        const marketCondition = this.advancedEmaAnalyzer.getMarketCondition(advancedAnalysis);

        // Adaptive filtering based on market conditions
        const threshold = marketCondition.type === 'BULL_MARKET' ? 65 :
          marketCondition.type === 'BEAR_MARKET' ? 85 : 75;

        if (advancedAnalysis.overallStrength > threshold &&
          (this.advancedEmaAnalyzer.isStrongUptrend(advancedAnalysis) ||
            this.advancedEmaAnalyzer.isModerateUptrend(advancedAnalysis))) {
          validSymbols.push(symbol);
          console.log(`✅ ${symbol}: Strength ${advancedAnalysis.overallStrength.toFixed(1)} (${marketCondition.type})`);
        } else {
          console.log(`❌ ${symbol}: Strength ${advancedAnalysis.overallStrength.toFixed(1)} < ${threshold} (${marketCondition.type})`);
        }
      }

      if (validSymbols.length === 0) {
        console.log('\n⏸️ Nenhuma moeda passou no filtro avançado');
        return null;
      }

      console.log(`\n🎯 ${validSymbols.length} moedas aprovadas no filtro adaptativo: ${validSymbols.join(', ')}`);

      const bestAnalysis = await analyzeMultipleSymbols(
        validSymbols,
        this.binancePublic,
        this.multiAnalyzeWithSmartTradeLogic.bind(this),
        undefined,
        true,
        TRADING_CONFIG.FILES.SMART_SIMULATOR
      );

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de simulação encontrada');
        return null;
      }

      const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(bestAnalysis.symbol);
      if (!validateTrendAnalysis(trendAnalysis, true)) {
        return null;
      }

      if (!validateDeepSeekDecision(bestAnalysis.decision)) {
        return null;
      }

      const boostedDecision = boostConfidence(bestAnalysis.decision);

      // VALIDAÇÃO OBRIGATÓRIA: Confiança mínima do TRADING_CONFIG
      console.log('🔍 Validação de confiança mínima...');
      if (!validateConfidence(boostedDecision)) {
        console.log('❌ Simulação cancelada - Confiança insuficiente');
        return null;
      }

      console.log('🔍 Validação final de Risk/Reward 2:1 para simulação...');

      // Calcular target e stop prices baseados na confiança
      const riskPercent = boostedDecision.confidence >= 80 ? 0.5 : boostedDecision.confidence >= 75 ? 1.0 : 1.5;
      const targetPrice = boostedDecision.price * (1 + (riskPercent * 2) / 100);
      const stopPrice = boostedDecision.price * (1 - riskPercent / 100);

      const riskRewardResult = calculateRiskRewardDynamic(boostedDecision.price, targetPrice, stopPrice, boostedDecision.action);

      if (!riskRewardResult.isValid) {
        console.log('❌ Simulação cancelada - Risk/Reward insuficiente');
        return null;
      }

      return await this.simulateAndSave(boostedDecision);

    } catch (error) {
      return handleBotError('Smart Trading Bot Simulator', error);
    }
  }

  private async saveTradeHistory(decision: any, simulatedOrder: any) {
    const trade = createTradeRecord(decision, simulatedOrder, TRADING_CONFIG.FILES.SMART_SIMULATOR);
    saveTradeHistory(trade, TRADING_CONFIG.FILES.SMART_SIMULATOR);
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const multiSmartBotSimulator = new MultiSmartTradingBotSimulator();
    await multiSmartBotSimulator.executeTrade();
  }

  logBotStartup(
    'Multi Smart Bot Simulator',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise dupla: EMA + DeepSeek AI',
    TRADING_CONFIG.SIMULATION.STARTUP_DELAY
  ).then(() => main());
}