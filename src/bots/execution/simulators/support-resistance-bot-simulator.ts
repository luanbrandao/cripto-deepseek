import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import SupportResistanceAnalyzer from '../../../analyzers/supportResistanceAnalyzer';
import { ULTRA_CONSERVATIVE_CONFIG } from '../../../shared/config/ultra-conservative-config';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
import { BaseTradingBot } from '../../core/base-trading-bot';

dotenv.config();

interface MarketDataSR {
  price24h: number[];
  currentPrice: number;
  klines: any[];
  candles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: number;
  }>;
}

export class SupportResistanceBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private srAnalyzer: SupportResistanceAnalyzer;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative Support/Resistance Simulator',
      isSimulation: true,
      tradesFile: 'ultraConservativeSupportResistanceSimulator.json'
    };

    this.flowManager = new BotFlowManager(this, config);
    
    // Configuração ultra-conservadora para S/R
    this.srAnalyzer = new SupportResistanceAnalyzer({
      tolerance: 0.005,              // ↓ Mais rigoroso (era 0.008)
      minTouches: 2,                 // Mínimo 2 toques
      lookbackPeriods: 50            // ↑ Mais histórico (era 25)
    });
  }

  protected logBotInfo() {
    console.log('🛡️ ULTRA-CONSERVATIVE S/R SIMULATOR - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ ULTRA-CONSERVATIVE S/R SIMULATOR v4.0', 'Win Rate Target: 78%+ | Suporte/Resistência Ultra-Rigoroso | Apenas Simulação', true);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`   📊 Confiança Mínima: ${ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`   🛡️ Risk/Reward: ${ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`   ⏰ Cooldown: ${ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_HOURS}h`);
    console.log(`   🪙 Símbolos: ${ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', ')}`);
    console.log('   🎯 S/R Config: Min 2 toques, Força >80%, Tolerância 0.5%');
    console.log('   🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async getMarketData(symbol: string): Promise<MarketDataSR> {
    const klines = await this.getBinancePublic().getKlines(symbol, ULTRA_CONSERVATIVE_CONFIG.CHART.TIMEFRAME, ULTRA_CONSERVATIVE_CONFIG.CHART.PERIODS);
    const prices = klines.map((k: any) => parseFloat(k[4]));
    const currentPrice = prices[prices.length - 1];

    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    // Converter klines para formato de candles
    const candles = klines.map((k: any) => ({
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      timestamp: k[0]
    }));

    return {
      price24h: prices,
      currentPrice,
      klines,
      candles
    };
  }

  private analyzeWithSupportResistance(symbol: string, marketData: MarketDataSR): TradeDecision {
    console.log('\n🎯 Analisando níveis de Suporte e Resistência ultra-conservadores...');

    const analysis = this.srAnalyzer.analyze({
      candles: marketData.candles,
      currentPrice: marketData.currentPrice
    }, true);

    console.log(`📈 Sinal S/R: ${analysis.action} (${analysis.confidence}%)`);
    console.log(`💭 Razão: ${analysis.reason}`);
    
    if (analysis.levels && analysis.levels.length > 0) {
      console.log(`🎯 Níveis identificados: ${analysis.levels.length}`);
      analysis.levels.slice(0, 3).forEach((level: any, index: number) => {
        console.log(`   ${index + 1}. ${level.type}: $${level.price.toFixed(2)} (${level.touches} toques, força: ${(level.strength * 100).toFixed(1)}%)`);
      });
    }

    const tradeDecision: TradeDecision = {
      action: analysis.action as 'BUY' | 'SELL' | 'HOLD',
      confidence: analysis.confidence,
      reason: analysis.reason,
      symbol,
      price: marketData.currentPrice
    };
    
    // Adicionar levels como propriedade extra
    (tradeDecision as any).levels = analysis.levels || [];
    
    return tradeDecision;
  }

  private async analyzeSymbolWithSR(symbol: string, marketData: any): Promise<TradeDecision> {
    const fullMarketData = await this.getMarketData(symbol);
    return this.analyzeWithSupportResistance(symbol, fullMarketData);
  }

  private async validateSRDecision(decision: TradeDecision, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;
    
    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA S/R PARA SIMULAÇÃO...');
    
    // 🚨 ANÁLISE ULTRA-RIGOROSA EM 5 CAMADAS
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);
    
    if (!ultraAnalysis.isValid) {
      console.log('❌ SIMULAÇÃO REJEITADA pela análise ultra-conservadora S/R:');
      ultraAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }
    
    console.log('✅ SIMULAÇÃO APROVADA pela análise ultra-conservadora S/R:');
    ultraAnalysis.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);
    
    // Validação adicional específica para S/R
    const levels = (decision as any).levels;
    if (levels && levels.length > 0) {
      const strongLevels = levels.filter((level: any) => level.strength >= 0.8 && level.touches >= 2);
      if (strongLevels.length > 0) {
        console.log(`🎯 Níveis S/R ultra-fortes identificados: ${strongLevels.length}`);
        console.log('🧪 Esta seria uma excelente oportunidade S/R para trade real!');
      }
    }
    
    // Atualizar decisão com análise ultra-conservadora
    decision.confidence = ultraAnalysis.confidence;
    (decision as any).ultraConservativeScore = ultraAnalysis.score;
    (decision as any).riskLevel = ultraAnalysis.riskLevel;
    
    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeSymbolWithSR.bind(this),
      undefined,
      this.validateSRDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const srSimulator = new SupportResistanceBotSimulator();
    await srSimulator.executeTrade();
  }

  logBotStartup(
    'Ultra-Conservative S/R Simulator',
    '🛡️ Ultra-Conservador v4.0 - Win Rate Target: 78%+\n🧪 Modo seguro - Apenas simulação S/R, sem trades reais',
    5000,
    true
  ).then(() => main());
}