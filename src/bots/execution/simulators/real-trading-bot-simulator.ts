import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { TradingConfigManager } from '../../../core';
import { DeepSeekHistoryLogger } from '../../../shared/utils/deepseek-history-logger';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { EnhancedTargetCalculator } from '../../utils/risk/enhanced-target-calculator';
import { ValidationLogger } from '../../utils/validation/validation-logger';
import { DecisionUpdater } from '../../utils/validation/decision-updater';
import * as dotenv from 'dotenv';
import { UnifiedDeepSeekAnalyzer } from '../../../core/analyzers/factories/unified-deepseek-analyzer';
import UltraConservativeAnalyzer from '../../../core/analyzers/factories/ultra-conservative-analyzer';

// Ativar modo ultra-conservador
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

dotenv.config();

export class RealTradingBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);

    const config: BotConfig = {
      name: 'Ultra-Conservative Real Bot Simulator',
      isSimulation: true,
      tradesFile: 'ultraConservativeRealBotSimulator.json',
      riskCalculationMethod: 'Ultra-Conservative Method'
    };

    this.flowManager = new BotFlowManager(this, config);
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();

    console.log('🛡️ ULTRA-CONSERVATIVE REAL BOT SIMULATOR - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ ULTRA-CONSERVATIVE REAL BOT SIMULATOR v4.0', 'Win Rate Target: 82%+ | Máxima Segurança | Apenas Simulação', true);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
    console.log('🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async analyzeWithRealTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeRealTrade(this.deepseek!, symbol, marketData);
  }

  private async validateUltraConservativeDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    ValidationLogger.logValidationHeader('ULTRA-CONSERVADORA REAL BOT', true);

    // 1. SMART PRÉ-VALIDAÇÃO
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .usePreset('Simulation')
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    ValidationLogger.logSmartValidation(smartValidation);
    if (!smartValidation.isValid) return false;

    // 2. CÁLCULO DE ALVOS E STOPS
    const enhancedTargets = this.calculateEnhancedTargetsAndStops(decision, parseFloat(marketData.price.price));
    this.logTechnicalLevels(decision.technicalLevels);
    this.logEnhancedTargets(enhancedTargets, decision);

    // 3. ANÁLISE ULTRA-CONSERVADORA
    const ultraAnalysis = UltraConservativeAnalyzer.analyzeSymbol(symbol, marketData, decision);

    if (!ValidationLogger.logUltraConservativeAnalysis(ultraAnalysis)) {
      console.log('❌ SIMULAÇÃO REJEITADA pela análise ultra-conservadora');
      return false;
    }

    console.log('🧪 Esta seria uma excelente oportunidade para trade real!');

    // 4. ATUALIZAR DECISÃO
    DecisionUpdater.updateWithValidation(decision, smartValidation, ultraAnalysis);
    DecisionUpdater.updateWithEnhancedTargets(decision, enhancedTargets);

    // 5. SALVAR HISTÓRICO
    this.saveAnalysisHistory(symbol, decision, marketData, enhancedTargets);

    return true;
  }

  private saveAnalysisHistory(symbol: string, decision: any, marketData: any, enhancedTargets: any) {
    if (!decision.technicalLevels && !enhancedTargets) return;

    console.log('💾 Salvando níveis técnicos no histórico DeepSeek...');

    DeepSeekHistoryLogger.logAnalysisWithTechnicals(
      {
        symbol,
        botType: 'realBot',
        prompt: `Ultra-Conservative Analysis for ${symbol}`,
        response: `Technical levels and enhanced targets calculated`,
        confidence: decision.confidence,
        action: decision.action,
        reason: decision.reason,
        marketData: {
          price: parseFloat(marketData.price.price),
          change24h: 0,
          volume24h: 0
        },
        executionTime: 0
      },
      decision.technicalLevels,
      enhancedTargets
    );
  }

  private calculateEnhancedTargetsAndStops(decision: any, currentPrice: number) {
    const config = TradingConfigManager.getConfig();

    if (!decision.technicalLevels) return null;

    const calculator = new EnhancedTargetCalculator(config);
    return calculator.calculate(decision, currentPrice);
  }

  private logTechnicalLevels(technicalLevels: any) {
    if (!technicalLevels) return;

    console.log('📈 NÍVEIS TÉCNICOS DETECTADOS:');

    if (technicalLevels.support?.length > 0) {
      console.log(`   🟢 Suportes: ${technicalLevels.support.map((s: number) => `$${s.toLocaleString()}`).join(', ')}`);
    }

    if (technicalLevels.resistance?.length > 0) {
      console.log(`   🔴 Resistências: ${technicalLevels.resistance.map((r: number) => `$${r.toLocaleString()}`).join(', ')}`);
    }

    if (technicalLevels.targets?.length > 0) {
      console.log(`   🎯 Targets AI: ${technicalLevels.targets.map((t: number) => `$${t.toLocaleString()}`).join(', ')}`);
    }

    if (technicalLevels.stopLoss?.length > 0) {
      console.log(`   🛑 Stop Loss AI: ${technicalLevels.stopLoss.map((sl: number) => `$${sl.toLocaleString()}`).join(', ')}`);
    }
  }

  private logEnhancedTargets(enhancedTargets: any, decision: any) {
    if (!enhancedTargets) return;

    console.log('🎯 ALVOS E STOPS OTIMIZADOS:');
    console.log(`   📈 Target Otimizado: $${enhancedTargets.target.toLocaleString()}`);
    console.log(`   🛑 Stop Otimizado: $${enhancedTargets.stop.toLocaleString()}`);
    console.log(`   📊 R/R Ratio: ${enhancedTargets.riskRewardRatio.toFixed(2)}:1`);
    console.log(`   🔍 Método: ${enhancedTargets.method}`);

    // Atualizar decisão com alvos otimizados
    decision.enhancedTarget = enhancedTargets.target;
    decision.enhancedStop = enhancedTargets.stop;
    decision.enhancedRiskReward = enhancedTargets.riskRewardRatio;
    decision.calculationMethod = enhancedTargets.method;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeWithRealTradeLogic.bind(this),
      undefined,
      this.validateUltraConservativeDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const simulator = new RealTradingBotSimulator(apiKey, apiSecret);
    await simulator.executeTrade();
  }

  logBotStartup(
    'Real Trading Bot Simulator',
    '🧪 Simulação do Real Trading Bot com múltiplas moedas + DeepSeek AI',
    5000,
    true
  ).then(() => main());
}
