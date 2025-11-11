import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import EmaAnalyzer from '../../../analyzers/emaAnalyzer';
import { ULTRA_CONSERVATIVE_CONFIG } from '../../../shared/config/ultra-conservative-config';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
import { BaseTradingBot } from '../../core/base-trading-bot';

dotenv.config();

interface MarketData {
  price24h: number[];
  currentPrice: number;
}

export class EmaTradingBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private emaAnalyzer: EmaAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative EMA Simulator',
      isSimulation: true,
      tradesFile: 'ultraConservativeEmaSimulator.json'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.emaAnalyzer = new EmaAnalyzer({
      fastPeriod: ULTRA_CONSERVATIVE_CONFIG.EMA.FAST_PERIOD,
      slowPeriod: ULTRA_CONSERVATIVE_CONFIG.EMA.SLOW_PERIOD
    });
  }

  protected logBotInfo() {
    console.log('🛡️ ULTRA-CONSERVATIVE EMA SIMULATOR - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ ULTRA-CONSERVATIVE EMA SIMULATOR v4.0', `Win Rate Target: 75%+ | EMA ${ULTRA_CONSERVATIVE_CONFIG.EMA.FAST_PERIOD}/${ULTRA_CONSERVATIVE_CONFIG.EMA.SLOW_PERIOD} | Apenas Simulação`, true);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`   📊 Confiança Mínima: ${ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`   🛡️ Risk/Reward: ${ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`   ⏰ Cooldown: ${ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_HOURS}h`);
    console.log(`   🪙 Símbolos: ${ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', ')}`);
    console.log('   🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
    const klines = await this.getBinancePublic().getKlines(symbol, ULTRA_CONSERVATIVE_CONFIG.CHART.TIMEFRAME, ULTRA_CONSERVATIVE_CONFIG.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    return {
      price24h: prices,
      currentPrice
    };
  }

  private analyzeWithEma(symbol: string, marketData: MarketData): TradeDecision {
    console.log(`\n📊 Analisando mercado com EMA ${ULTRA_CONSERVATIVE_CONFIG.EMA.FAST_PERIOD}/${ULTRA_CONSERVATIVE_CONFIG.EMA.SLOW_PERIOD}...`);

    const analysis = this.emaAnalyzer.analyze(marketData);

    console.log(`📈 Sinal EMA: ${analysis.action} (${analysis.confidence}%)`);
    console.log(`💭 Razão: ${analysis.reason}`);

    return {
      action: analysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: analysis.confidence,
      reason: analysis.reason,
      symbol,
      price: marketData.currentPrice
    };
  }

  private async analyzeSymbolWithEma(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return this.analyzeWithEma(symbol, fullMarketData);
  }

  private async validateEmaDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;
    
    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA EMA PARA SIMULAÇÃO...');
    
    // 🚨 ANÁLISE ULTRA-RIGOROSA EM 5 CAMADAS
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);
    
    if (!ultraAnalysis.isValid) {
      console.log('❌ SIMULAÇÃO REJEITADA pela análise ultra-conservadora EMA:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }
    
    console.log('✅ SIMULAÇÃO APROVADA pela análise ultra-conservadora EMA:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);
    console.log('🧪 Esta seria uma excelente oportunidade EMA para trade real!');
    
    // Atualizar decisão com análise ultra-conservadora
    decision.confidence = ultraAnalysis.confidence;
    (decision as any).ultraConservativeScore = ultraAnalysis.score;
    (decision as any).riskLevel = ultraAnalysis.riskLevel;
    
    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbolWithEma.bind(this),
      undefined,
      this.validateEmaDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const emaSimulator = new EmaTradingBotSimulator();
    await emaSimulator.executeTrade();
  }

  logBotStartup(
    'Ultra-Conservative EMA Simulator',
    '🛡️ Ultra-Conservador v4.0 - Win Rate Target: 75%+\n🧪 Modo seguro - Apenas simulação EMA, sem trades reais',
    5000,
    true
  ).then(() => main());
}