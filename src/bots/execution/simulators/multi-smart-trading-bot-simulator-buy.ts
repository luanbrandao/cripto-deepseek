import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateAdvancedStrength } from '../../utils/validation/unified-advanced-validator';
import { AdvancedEmaAnalyzer } from '../../services/advanced-ema-analyzer';
import { calculateSymbolVolatility } from '../../utils/risk/volatility-calculator';
import { TradingConfigManager } from '../../../core';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { PreValidationService } from '../../../shared/services/pre-validation-service';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';

export class MultiSmartTradingBotSimulatorBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private readonly trendAnalyzer: MarketTrendAnalyzer;
  private readonly advancedEmaAnalyzer: AdvancedEmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Multi-Smart Trading Bot Simulator BUY',
      isSimulation: true,
      tradesFile: TradingConfigManager.getConfig().FILES.MULTI_SMART_SIMULATOR_BUY,
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
    console.log('🟢 FOCO EXCLUSIVO EM COMPRAS - Estratégia Long-Only Otimizada');
    logBotHeader('MULTI-SMART BOT SIMULATOR BUY v4.0 - VALIDAÇÕES OTIMIZADAS', 'Análise Multi-Dimensional + Validações Baseadas em Performance - SIMULAÇÃO - APENAS COMPRAS', true);

    console.log('🎯 RECURSOS OTIMIZADOS PARA COMPRAS (v4.0):');
    console.log('  • 📊 Filtro de Variação 24h (+0.2% a +3.0%)');
    console.log('  • ⏰ Cooldown Dinâmico por Símbolo (BTC:20min, BNB:25min, ETH:30min, SOL:35min)');
    console.log('  • 🎯 Confiança Dinâmica (BTC:78%, BNB:80%, ETH:82%, SOL:85%)');
    console.log('  • 🔍 Validação de Padrões Bullish (2/6 obrigatório)');
    console.log('  • 🕰️ Filtro de Timing (evitar: 22h-4h UTC)');
    console.log('  • 🚀 Boost Baseado em Padrões (até +8%)');
    console.log('  • 🛡️ Validação Smart Simplificada');
    console.log('  • 🏆 Baseado em Análise de Performance Geral');
    console.log('  • 💰 Foco em Qualidade vs Quantidade');
    console.log('  • Assertividade Esperada: 50-60% (REALISTA)\n');
  }

  private async analyzeSymbol(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeMultiSmartTradeBuy(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByStrength(symbols: string[]): Promise<string[]> {
    console.log(`🔍 Analisando ${symbols.length} moedas com filtro adaptativo...`);

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

      const threshold = this.getThresholdBuyMarketCondition(condition.type);

      const strengthValid = validateAdvancedStrength(analysis, threshold, 'BUY');
      const strongUptrend = this.advancedEmaAnalyzer.isStrongUptrend(analysis);
      const moderateUptrend = this.advancedEmaAnalyzer.isModerateUptrend(analysis);
      const trendValid = strongUptrend || moderateUptrend;
      
      // Mais permissivo: aceitar se tem força OU tendência (não ambos)
      if (strengthValid || trendValid || analysis.overallStrength > threshold * 0.8) {
        validSymbols.push(symbol);
        console.log(`✅ ${symbol}: ${analysis.overallStrength.toFixed(1)} (${condition.type})`);
      } else {
        console.log(`❌ ${symbol}: ${analysis.overallStrength.toFixed(1)} < ${threshold}`);
        if (!trendValid) console.log(`   ❌ Não está em tendência de alta`);
      }
    }

    return validSymbols;
  }

  // private getThresholdBuyMarketCondition(marketType: string): number {
  //   switch (marketType) {
  //     case 'BULL_MARKET': return 25; // Mais oportunidades em bull market
  //     case 'BEAR_MARKET': return 35; // Seletivo em bear market
  //     case 'SIDEWAYS': return 30;    // Moderado em mercado lateral
  //     default: return 31.4;          // Padrão mais realista para mercado atual
  //   }
  // }

  private getThresholdBuyMarketCondition(marketType: string): number {
    // Critérios OTIMIZADOS para Multi-Smart Bot BUY
    switch (marketType) {
      case 'BULL_MARKET': return 25; // Moderado em bull market
      case 'BEAR_MARKET': return 35; // Rigoroso em bear market  
      case 'SIDEWAYS': return 30;    // Moderado para mercado atual
      default: return 30;            // Padrão mais rigoroso
    }
  }

  private async validateMultiSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ VALIDAÇÃO MULTI-SMART BUY OTIMIZADA...');

    // Preparar dados de mercado
    const klines = await this.getBinancePublic().getKlines(symbol, TradingConfigManager.getConfig().CHART.TIMEFRAME, TradingConfigManager.getConfig().CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const stats = await this.getBinancePublic().get24hrStats(symbol);
    
    // 1. FILTRO DE VARIAÇÃO 24H (inverso do SELL)
    const priceChange = parseFloat(stats.priceChangePercent);
    console.log(`📊 Variação 24h: ${priceChange.toFixed(2)}%`);
    
    if (priceChange < 0) {
      console.log('❌ Mercado em queda - não adequado para BUY');
      return false;
    }
    
    if (priceChange > 3.0) {
      console.log('⚠️ Alta muito acentuada (> 3.0%) - risco de correção');
      return false;
    }
    
    if (priceChange < 0.2) {
      console.log('⚠️ Alta insuficiente (< 0.2%) - aguardar mais momentum bullish');
      return false;
    }
    
    console.log('✅ Variação 24h adequada para BUY');

    // 2. COOLDOWN POR SÍMBOLO (baseado na performance geral)
    const lastTradeKey = `lastBuyTrade_${symbol}`;
    const lastTradeTime = (global as any)[lastTradeKey] || 0;
    let cooldownMinutes = 20; // Padrão
    
    switch (symbol) {
      case 'BTCUSDT': cooldownMinutes = 20; break; // Performance moderada
      case 'BNBUSDT': cooldownMinutes = 25; break; // Performance média
      case 'ETHUSDT': cooldownMinutes = 30; break; // Mais cauteloso
      case 'SOLUSDT': cooldownMinutes = 35; break; // Mais rigoroso
      default: cooldownMinutes = 25; break;
    }
    
    const cooldownMs = cooldownMinutes * 60 * 1000;
    if (Date.now() - lastTradeTime < cooldownMs) {
      console.log(`❌ COOLDOWN ATIVO: Aguarde ${cooldownMinutes}min para ${symbol}`);
      return false;
    }
    
    // 3. CONFIANÇA DINÂMICA POR SÍMBOLO (mais rigoroso para BUY)
    let minConfidence = 80; // Padrão
    switch (symbol) {
      case 'BTCUSDT': minConfidence = 78; break; // Mais permissivo
      case 'BNBUSDT': minConfidence = 80; break; // Padrão
      case 'ETHUSDT': minConfidence = 82; break; // Mais rigoroso
      case 'SOLUSDT': minConfidence = 85; break; // Muito rigoroso
      default: minConfidence = 80; break;
    }
    
    if (decision.confidence < minConfidence) {
      console.log(`❌ Confiança ${decision.confidence}% < ${minConfidence}% para ${symbol}`);
      return false;
    }
    
    // 4. VALIDAÇÃO DE PADRÕES TÉCNICOS BULLISH
    const reason = decision.reason?.toLowerCase() || '';
    const winningPatterns = [
      'golden cross', 'rompimento de resistência', 'volume de acumulação', 
      'suporte forte', 'momentum bullish', 'breakout'
    ];
    
    const patternCount = winningPatterns.filter(pattern => reason.includes(pattern)).length;
    if (patternCount < 2) {
      console.log(`❌ Padrões insuficientes: ${patternCount}/2 mínimo`);
      console.log(`🔍 Padrões encontrados: ${winningPatterns.filter(p => reason.includes(p)).join(', ')}`);
      return false;
    }
    
    console.log(`✅ Padrões técnicos aprovados: ${patternCount}/6`);
    
    // 5. FILTRO DE TIMING (baseado na performance geral)
    const hour = new Date().getUTCHours();
    if (hour >= 22 || hour <= 4) {
      console.log(`⚠️ Horário desfavorável: ${hour}h UTC (evitar 22h-4h)`);
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
      .withConfidence(minConfidence - 5, 25)
      .build()
      .validate(symbol, validationMarketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid && decision.confidence < 85) {
      console.log('❌ Smart validação falhou e confiança < 85%');
      return false;
    }

    // 7. VALIDAÇÕES FINAIS
    if (decision.action !== 'BUY') {
      console.log('❌ DeepSeek não recomenda BUY');
      return false;
    }
    
    // Registrar timestamp do trade
    (global as any)[lastTradeKey] = Date.now();
    
    // Boost conservador baseado na qualidade dos padrões
    const boost = Math.min(patternCount * 2, 8); // Máximo 8%
    decision.confidence = Math.min(95, decision.confidence + boost);
    decision.reason = `${decision.reason} + Padrões validados (+${boost}% boost)`;
    
    console.log(`✅ VALIDAÇÃO MULTI-SMART BUY APROVADA!`);
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
    const multiSmartBotSimulator = new MultiSmartTradingBotSimulatorBuy();
    await multiSmartBotSimulator.executeTrade();
  };

  logBotStartup(
    'Multi Smart Bot Simulator BUY v4.1',
    '🧪 Modo seguro - Apenas simulação, sem trades reais\n🧠 Análise multi-dimensional + Pré-validação otimizada',
    TradingConfigManager.getConfig().SIMULATION.STARTUP_DELAY,
    true
  ).then(() => main());
}
