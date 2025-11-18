import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedSellStrength } from '../../utils/validation/advanced-sell-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';
import { TradingConfigManager } from '../../../core';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';

export class MultiSmartTradingBotSimulatorSell extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator SELL',
      isSimulation: true,
      tradesFile: TradingConfigManager.getConfig().FILES.MULTI_SMART_SIMULATOR_SELL,
      requiresFiltering: true,
      requiresValidation: true,
      riskCalculationMethod: 'Real Market Method'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.advancedEmaAnalyzer = new AdvancedEmaAnalyzer({
      fastPeriod: TradingConfigManager.getConfig().EMA.FAST_PERIOD,
      slowPeriod: TradingConfigManager.getConfig().EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🚀 MODO SIMULAÇÃO - SEM TRADES REAIS\n');
    console.log('🔴 FOCO EXCLUSIVO EM VENDAS - Estratégia Short-Only Otimizada');
    logBotHeader('MULTI-SMART BOT SIMULATOR SELL v4.0 - VALIDAÇÕES OTIMIZADAS', 'Análise Multi-Dimensional + Validações Baseadas em Performance - SIMULAÇÃO - APENAS VENDAS', true);

    console.log('🎯 RECURSOS OTIMIZADOS PARA VENDAS (v4.0):');
    console.log('  • 📊 Filtro de Variação 24h (-0.3% a -2.5%)');
    console.log('  • ⏰ Cooldown Dinâmico por Símbolo (BTC:15min, BNB:30min, ETH:45min)');
    console.log('  • 🎯 Confiança Dinâmica (BTC:75%, BNB:82%, ETH:85%)');
    console.log('  • 🔍 Validação de Padrões Técnicos (2/5 obrigatório)');
    console.log('  • 🕰️ Filtro de Timing (melhor: 14h-19h UTC)');
    console.log('  • 🚀 Boost Baseado em Padrões (até +8%)');
    console.log('  • 🛡️ Validação Smart Simplificada');
    console.log('  • 🏆 Baseado em 48% Win Rate (12/25 trades)');
    console.log('  • 💰 Retorno Médio: +$249.40 por trade');
    console.log('  • Assertividade Esperada: 55-65% (REALISTA)\n');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeMultiSmartTradeSell(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro BEARISH adaptativo...`);

    const validSymbols = [];

    for (const symbol of symbols) {
      const klines = await this.getBinancePublic().getKlines(
        symbol,
        TradingConfigManager.getConfig().CHART.TIMEFRAME,
        TradingConfigManager.getConfig().CHART.PERIODS
      );

      const prices = klines.map((k: any) => parseFloat(k[4]));
      const volumes = klines.map((k: any) => parseFloat(k[5]));

      const analysis = this.advancedEmaAnalyzer.analyzeAdvanced(prices, volumes);
      const condition = this.advancedEmaAnalyzer.getMarketCondition(analysis);

      const threshold = this.getThresholdSellMarketCondition(condition.type);

      console.log(`📊 ${symbol}: Score ${analysis.overallStrength.toFixed(1)}, Mercado: ${condition.type}, Threshold: ${threshold}`);

      if (this.isSymbolValid(analysis, threshold)) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: APROVADO`);
      } else {
        console.log(`❌ ${symbol}: REJEITADO`);
      }
    }

    return validSymbols;
  }

  private getThresholdSellMarketCondition(marketType: string): number {
    // Critérios OTIMIZADOS baseados na análise de performance
    switch (marketType) {
      case 'BULL_MARKET': return 40;  // Mais rigoroso em bull market
      case 'BEAR_MARKET': return 20;  // Permissivo em bear market
      case 'SIDEWAYS': return 30;     // Moderado para mercado atual
      default: return 32;             // Padrão mais rigoroso
    }
  }

  // private getThresholdSellMarketCondition(marketType: string): number {
  //   switch (marketType) {
  //     case 'BULL_MARKET': return 40;  // Mais rigoroso em mercado de alta
  //     case 'BEAR_MARKET': return 20;  // Muito permissivo em mercado de baixa
  //     case 'SIDEWAYS': return 30;     // Moderado em mercado lateral
  //     default: return 35;             // Padrão para mercado lateral
  //   }
  // }

  private isSymbolValid(analysis: any, threshold: number): boolean {
    // Validação específica para vendas - procura por tendências de baixa
    const isBearishTrend = this.isBearishByEma(analysis);

    return validateAdvancedSellStrength(analysis, threshold) && isBearishTrend;
  }

  private isBearishByEma(analysis: any): boolean {
    // Detectar tendência bearish baseada em EMAs
    const isBearish = (
      analysis.shortTerm.trend === 'DOWN' ||
      analysis.mediumTerm.trend === 'DOWN' ||
      analysis.longTerm.trend === 'DOWN'
    );

    const isNotUptrend = !this.advancedEmaAnalyzer.isStrongUptrend(analysis) &&
      !this.advancedEmaAnalyzer.isModerateUptrend(analysis);

    return isBearish || isNotUptrend;
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ VALIDAÇÃO MULTI-SMART SELL OTIMIZADA...');

    // Preparar dados de mercado
    const klines = await this.getBinancePublic().getKlines(symbol, TradingConfigManager.getConfig().CHART.TIMEFRAME, TradingConfigManager.getConfig().CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    // 1. FILTRO DE VARIAÇÃO 24H (baseado na análise)
    const priceChange = parseFloat(stats.priceChangePercent);
    console.log(`📊 Variação 24h: ${priceChange.toFixed(2)}%`);

    if (priceChange > 0) {
      console.log('❌ Mercado em alta - não adequado para SELL');
      return false;
    }

    if (priceChange < -2.5) {
      console.log('⚠️ Queda muito acentuada (< -2.5%) - risco de reversão');
      return false;
    }

    if (priceChange > -0.3) {
      console.log('⚠️ Queda insuficiente (> -0.3%) - aguardar mais momentum bearish');
      return false;
    }

    console.log('✅ Variação 24h adequada para SELL');

    // 2. COOLDOWN POR SÍMBOLO (baseado na performance)
    const lastTradeKey = `lastSellTrade_${symbol}`;
    const lastTradeTime = (global as any)[lastTradeKey] || 0;
    let cooldownMinutes = 20; // Padrão

    switch (symbol) {
      case 'BTCUSDT': cooldownMinutes = 15; break; // Melhor performance
      case 'BNBUSDT': cooldownMinutes = 30; break; // Teve losses consecutivas
      case 'ETHUSDT': cooldownMinutes = 45; break; // Baixa assertividade
      default: cooldownMinutes = 25; break;
    }

    const cooldownMs = cooldownMinutes * 60 * 1000;
    if (Date.now() - lastTradeTime < cooldownMs) {
      console.log(`❌ COOLDOWN ATIVO: Aguarde ${cooldownMinutes}min para ${symbol}`);
      return false;
    }

    // 3. CONFIANÇA DINÂMICA POR SÍMBOLO
    let minConfidence = 80; // Padrão
    switch (symbol) {
      case 'BTCUSDT': minConfidence = 80; break; // Melhor performance
      case 'BNBUSDT': minConfidence = 82; break; // Performance média
      case 'ETHUSDT': minConfidence = 85; break; // Pior performance
      default: minConfidence = 80; break;
    }

    if (decision.confidence < minConfidence) {
      console.log(`❌ Confiança ${decision.confidence}% < ${minConfidence}% para ${symbol}`);
      return false;
    }

    // 4. VALIDAÇÃO DE PADRÕES TÉCNICOS (baseado nos winners)
    const reason = decision.reason?.toLowerCase() || '';
    const winningPatterns = [
      'duplo topo', 'death cross', 'volume de distribuição',
      'rompimento de suporte', 'exaustão de compradores'
    ];

    const patternCount = winningPatterns.filter(pattern => reason.includes(pattern)).length;
    if (patternCount < 2) {
      console.log(`❌ Padrões insuficientes: ${patternCount}/2 mínimo`);
      console.log(`🔍 Padrões encontrados: ${winningPatterns.filter(p => reason.includes(p)).join(', ')}`);
      return false;
    }

    console.log(`✅ Padrões técnicos aprovados: ${patternCount}/5`);

    // 5. FILTRO DE TIMING (baseado na performance)
    const hour = new Date().getUTCHours();
    if (hour >= 20 || hour <= 2) {
      console.log(`⚠️ Horário desfavorável: ${hour}h UTC (evitar 20h-2h)`);
      // Não bloquear completamente, mas aumentar threshold
      minConfidence += 5;
      if (decision.confidence < minConfidence) {
        console.log(`❌ Confiança insuficiente para horário: ${decision.confidence}% < ${minConfidence}%`);
        return false;
      }
    }

    // 6. VALIDAÇÃO SMART SIMPLIFICADA
    const config = TradingConfigManager.getConfig();
    const validationMarketData = {
      price: { price: decision.price.toString() },
      stats: stats,
      klines: klines,
      price24h: prices,
      volumes: volumes
    };

    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .withVolume(config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER * 0.4, 25)
      .withConfidence(minConfidence, 25)
      .build()
      .validate(symbol, validationMarketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid && decision.confidence < 85) {
      console.log('❌ Smart validação falhou e confiança < 85%');
      return false;
    }

    // 7. VALIDAÇÕES FINAIS
    if (decision.action !== 'SELL') {
      console.log('❌ DeepSeek não recomenda SELL');
      return false;
    }

    // Registrar timestamp do trade
    (global as any)[lastTradeKey] = Date.now();

    // Boost conservador baseado na qualidade dos padrões
    const boost = Math.min(patternCount * 2, 8); // Máximo 8%
    decision.confidence = Math.min(95, decision.confidence + boost);
    decision.reason = `${decision.reason} + Padrões validados (+${boost}% boost)`;

    console.log(`✅ VALIDAÇÃO MULTI-SMART SELL APROVADA!`);
    console.log(`📊 Confiança final: ${decision.confidence}%`);
    console.log(`🎯 Padrões: ${patternCount}, Boost: +${boost}%`);

    // 8. VALIDAÇÃO FINAL DE RISK/REWARD
    const priceResult = calculateTargetAndStopPrices(
      decision.price,
      decision.confidence,
      decision.action
    );

    const riskRewardResult = calculateRiskRewardDynamic(
      decision.price,
      priceResult.targetPrice,
      priceResult.stopPrice,
      decision.action
    );

    if (!riskRewardResult.isValid) {
      console.log('❌ Risk/Reward insuficiente');
      return false;
    }

    // Atualizar metadados da decisão
    decision.validationScore = smartValidation.isValid ? smartValidation.totalScore : 70;
    (decision as any).riskLevel = 'MEDIUM';
    (decision as any).patternCount = patternCount;
    (decision as any).priceChange24h = priceChange;

    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbol.bind(this),
      this.filterSymbolsByStrength.bind(this),
      this.validateMultiSmartDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const multiSmartBotSimulatorSell = new MultiSmartTradingBotSimulatorSell();
    await multiSmartBotSimulatorSell.executeTrade();
  }

  logBotStartup(
    'Multi Smart Bot Simulator SELL v3.1',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🔴 Análise multi-dimensional + Pré-validação otimizada - APENAS VENDAS',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
