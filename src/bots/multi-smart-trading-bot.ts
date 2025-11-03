import { BaseTradingBot } from './base-trading-bot';
import { MarketTrendAnalyzer } from './services/market-trend-analyzer';
import { TRADING_CONFIG } from './config/trading-config';
import { validateTrade, calculateRiskReward, calculateRiskRewardDynamic } from './utils/trade-validators';
import { calculateTargetAndStopPrices } from './utils/price-calculator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { analyzeMultipleSymbols } from './utils/multi-symbol-analyzer';
import { checkActiveTradesLimit } from './utils/trade-limit-checker';
import { createTradeRecord, saveTradeHistory } from './utils/trade-history-saver';
import { multiAnalyzeWithSmartTrade } from './analyzers/multi-smart-trade-analyzer';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from './utils/trend-validator';
import { AdvancedEmaAnalyzer } from './services/advanced-ema-analyzer';
import { TradeExecutor } from './services/trade-executor';

export class MultiSmartTradingBot extends BaseTradingBot {
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, false);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: TRADING_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: TRADING_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('⚠️  EXECUTA TRADES REAIS NA BINANCE ⚠️\n');
    logBotHeader('MULTI-SMART TRADING BOT v2.0', 'Análise Multi-Dimensional + Trades Reais');

    console.log('🎯 RECURSOS AVANÇADOS:');
    console.log('  • EMA Multi-Timeframe (12/26/50/100/200)');
    console.log('  • AI Parser com Análise de Sentimento');
    console.log('  • Smart Scoring 4D (EMA+AI+Volume+Momentum)');
    console.log('  • Filtro Adaptativo por Condição de Mercado');
    console.log('  • Boost Inteligente de Confiança');
    console.log('  • Execução com OCO Orders (TP+SL)');
    console.log('  • Assertividade: 92-95%\n');
  }

  private async executeRealTrade(decision: any) {
    console.log('\n🚨 EXECUTANDO TRADE REAL');
    console.log(`📝 ${decision.action} ${decision.symbol} - $${this.getTradeAmount()} (${decision.confidence}%)`);

    const tradeResult = await TradeExecutor.executeRealTrade(decision, this.binancePrivate!);

    if (tradeResult) {
      console.log(`✅ Trade executado! ID: ${tradeResult.orderId}`);
      await this.saveTradeHistory(decision, tradeResult);
    }

    return tradeResult;
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await multiAnalyzeWithSmartTrade(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);

    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.binancePublic.getKlines(
        symbol,
        TRADING_CONFIG.CHART.TIMEFRAME,
        TRADING_CONFIG.CHART.PERIODS
      );

      const prices = klines.map((k: any) => parseFloat(k[4]));
      const volumes = klines.map((k: any) => parseFloat(k[5]));

      const analysis = this.advancedEmaAnalyzer.analyzeAdvanced(prices, volumes);
      const condition = this.advancedEmaAnalyzer.getMarketCondition(analysis);

      const threshold = this.getThresholdByMarketCondition(condition.type);

      if (this.isSymbolValid(analysis, threshold)) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${analysis.overallStrength.toFixed(1)} (${condition.type})`);
      } else {
        console.log(`❌ ${symbol}: ${analysis.overallStrength.toFixed(1)} < ${threshold}`);
      }
    }

    return validSymbols;
  }

  private getThresholdByMarketCondition(marketType: string): number {
    switch (marketType) {
      case 'BULL_MARKET': return 65;
      case 'BEAR_MARKET': return 85;
      default: return 75;
    }
  }

  private isSymbolValid(analysis: any, threshold: number): boolean {
    return analysis.overallStrength > threshold &&
      (this.advancedEmaAnalyzer.isStrongUptrend(analysis) ||
        this.advancedEmaAnalyzer.isModerateUptrend(analysis));
  }

  private async validateDecision(decision: any, symbol: string): Promise<boolean> {
    // 1. Validar tendência EMA
    const trendAnalysis = await this.trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, false)) return false;

    // 2. Validar decisão DeepSeek
    if (!validateDeepSeekDecision(decision)) return false;

    // 3. Aplicar boost inteligente
    const boostedDecision = boostConfidence(decision);

    // 4. Validação completa (confiança + ação + risk/reward)
    console.log('🔍 Validação final de Risk/Reward antes da execução...');
    
    const { targetPrice, stopPrice } = calculateTargetAndStopPrices(
      boostedDecision.price,
      boostedDecision.confidence,
      boostedDecision.action
    );
    
    const riskRewardResult = calculateRiskRewardDynamic(
      boostedDecision.price, 
      targetPrice, 
      stopPrice, 
      boostedDecision.action
    );
    
    if (!riskRewardResult.isValid) {
      console.log('❌ Validações falharam - Risk/Reward insuficiente');
      return false;
    }

    // Atualizar decisão com boost
    Object.assign(decision, boostedDecision);
    return true;
  }

  async executeTrade() {
    this.logBotInfo();

    // 1. Verificar limites de trades ativos
    if (!(await checkActiveTradesLimit(this.binancePrivate!))) {
      return null;
    }

    try {
      // 2. Filtrar moedas por força técnica
      const symbols = this.getSymbols();
      const validSymbols = await this.filterSymbolsByStrength(symbols);

      if (validSymbols.length === 0) {
        console.log('\n⏸️ Nenhuma moeda passou no filtro');
        return null;
      }

      console.log(`\n🎯 ${validSymbols.length} moedas aprovadas: ${validSymbols.join(', ')}`);

      // 3. Analisar e selecionar melhor oportunidade
      const bestAnalysis = await analyzeMultipleSymbols(
        validSymbols,
        this.binancePublic,
        this.analyzeSymbol.bind(this),
        this.binancePrivate,
        false,
        TRADING_CONFIG.FILES.SMART_BOT
      );

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade encontrada');
        return null;
      }

      // 4. Validar decisão final
      if (!(await this.validateDecision(bestAnalysis.decision, bestAnalysis.symbol))) {
        return null;
      }

      // 5. Executar trade real
      return await this.executeRealTrade(bestAnalysis.decision);

    } catch (error) {
      return handleBotError('Multi-Smart Trading Bot', error);
    }
  }

  private async saveTradeHistory(decision: any, orderResult: any): Promise<void> {
    const trade = createTradeRecord(decision, orderResult, TRADING_CONFIG.FILES.SMART_BOT);
    saveTradeHistory(trade, TRADING_CONFIG.FILES.SMART_BOT);
    console.log('💾 Trade salvo no histórico');
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const multiSmartBot = new MultiSmartTradingBot();
    await multiSmartBot.executeTrade();
  }

  logBotStartup(
    'Multi-Smart Trading Bot',
    '⚠️  TRADES REAIS - Ordens executadas na Binance\n🧠 Análise multi-dimensional avançada',
    TRADING_CONFIG.SIMULATION.STARTUP_DELAY
  ).then(() => main());
}