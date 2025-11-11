import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { MarketTrendAnalyzer } from '../../services/market-trend-analyzer';
import { calculateRiskRewardDynamic, validateConfidence } from '../../utils/risk/trade-validators';
import { calculateTargetAndStopPrices } from '../../utils/risk/price-calculator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import { ULTRA_CONSERVATIVE_CONFIG } from '../../../shared/config/ultra-conservative-config';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
import { boostConfidence, validateDeepSeekDecision, validateTrendAnalysis } from '../../../shared/validators/trend-validator';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';

export class SmartTradingBotSimulatorBuy extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private trendAnalyzer: MarketTrendAnalyzer;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative Smart Simulator BUY',
      isSimulation: true,
      tradesFile: 'ultraConservativeSmartSimulatorBuy.json',
      requiresFiltering: true,
      requiresValidation: true,
      riskCalculationMethod: 'Ultra-Conservative Method'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.trendAnalyzer = new MarketTrendAnalyzer();
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: ULTRA_CONSERVATIVE_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: ULTRA_CONSERVATIVE_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🛡️ ULTRA-CONSERVATIVE SIMULATOR - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ ULTRA-CONSERVATIVE SMART SIMULATOR BUY v4.0', 'Win Rate Target: 80%+ | Máxima Segurança | Apenas Simulação', true);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`   📊 Confiança Mínima: ${ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`   🛡️ Risk/Reward: ${ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`   ⏰ Cooldown: ${ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_HOURS}h`);
    console.log(`   🪙 Símbolos: ${ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', ')}`);
    console.log('   🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async analyzeWithSmartTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeSmartTradeBuy(this.deepseek!, symbol, marketData);
  }

  private async filterSymbolsByEma(symbols: string[]): Promise<string[]> {
    const validSymbols = [];

    for (const symbol of symbols) {
      console.log(`\n📊 Analisando Tendência EMA: ${symbol}...`);
      const klines = await this.getBinancePublic().getKlines(symbol, ULTRA_CONSERVATIVE_CONFIG.CHART.TIMEFRAME, ULTRA_CONSERVATIVE_CONFIG.CHART.PERIODS);
      const prices = klines.map((k: any) => parseFloat(k[4]));
      const currentPrice = prices[prices.length - 1];
      const emaAnalysis = this.emaAnalyzer.analyze({ price24h: prices, currentPrice });

      if (emaAnalysis.action === 'BUY' && emaAnalysis.reason.includes('Tendência de alta confirmada')) {
        validSymbols.push(symbol);
      }
    }

    return validSymbols;
  }

  private async validateSmartDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;
    
    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA PARA SIMULAÇÃO...');
    
    // 🚨 ANÁLISE ULTRA-RIGOROSA EM 5 CAMADAS
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);
    
    if (!ultraAnalysis.isValid) {
      console.log('❌ SIMULAÇÃO REJEITADA pela análise ultra-conservadora:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }
    
    console.log('✅ SIMULAÇÃO APROVADA pela análise ultra-conservadora:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);
    console.log('🧪 Esta seria uma excelente oportunidade para trade real!');
    
    // Atualizar decisão com análise ultra-conservadora
    decision.confidence = ultraAnalysis.confidence;
    decision.ultraConservativeScore = ultraAnalysis.score;
    decision.riskLevel = ultraAnalysis.riskLevel;
    
    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeWithSmartTradeLogic.bind(this),
      this.filterSymbolsByEma.bind(this),
      this.validateSmartDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const smartBotSimulatorBuy = new SmartTradingBotSimulatorBuy();
    await smartBotSimulatorBuy.executeTrade();
  }

  logBotStartup(
    'Ultra-Conservative Smart Simulator Buy',
    '🛡️ Ultra-Conservador v4.0 - Win Rate Target: 80%+\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}
