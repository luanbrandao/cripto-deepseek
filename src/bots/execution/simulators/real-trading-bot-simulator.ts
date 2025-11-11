import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { DeepSeekHistoryLogger } from '../../../shared/utils/deepseek-history-logger';
import * as dotenv from 'dotenv';

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
    
    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA REAL BOT SIMULATOR...');
    
    // Calcular alvos e stops baseados nos níveis técnicos extraídos
    const enhancedTargets = this.calculateEnhancedTargetsAndStops(decision, marketData.price);
    
    // Exibir dados extraídos do parser melhorado
    if (decision.technicalLevels) {
      console.log('📈 NÍVEIS TÉCNICOS DETECTADOS:');
      
      if (decision.technicalLevels.support?.length > 0) {
        console.log(`   🟢 Suportes: ${decision.technicalLevels.support.map((s: number) => `$${s.toLocaleString()}`).join(', ')}`);
      }
      
      if (decision.technicalLevels.resistance?.length > 0) {
        console.log(`   🔴 Resistências: ${decision.technicalLevels.resistance.map((r: number) => `$${r.toLocaleString()}`).join(', ')}`);
      }
      
      if (decision.technicalLevels.targets?.length > 0) {
        console.log(`   🎯 Targets AI: ${decision.technicalLevels.targets.map((t: number) => `$${t.toLocaleString()}`).join(', ')}`);
      }
      
      if (decision.technicalLevels.stopLoss?.length > 0) {
        console.log(`   🛑 Stop Loss AI: ${decision.technicalLevels.stopLoss.map((sl: number) => `$${sl.toLocaleString()}`).join(', ')}`);
      }
    }
    
    // Exibir alvos e stops calculados
    if (enhancedTargets) {
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
    
    // Atualizar decisão com análise ultra-conservadora e dados técnicos
    decision.confidence = ultraAnalysis.confidence;
    decision.ultraConservativeScore = ultraAnalysis.score;
    decision.riskLevel = ultraAnalysis.riskLevel;
    
    // Salvar análise com níveis técnicos no histórico DeepSeek
    if (decision.technicalLevels || enhancedTargets) {
      console.log('💾 Salvando níveis técnicos no histórico DeepSeek...');
      
      DeepSeekHistoryLogger.logAnalysisWithTechnicals(
        {
          symbol: symbol!,
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
    
    return true;
  }
  
  private calculateEnhancedTargetsAndStops(decision: any, currentPrice: number) {
    const config = TradingConfigManager.getConfig();
    const action = decision.action;
    
    if (!decision.technicalLevels) {
      return null; // Sem níveis técnicos, usar cálculo padrão
    }
    
    let target: number;
    let stop: number;
    let method: string;
    
    if (action === 'BUY') {
      // Para BUY: Target = próxima resistência, Stop = suporte mais próximo
      const nearestResistance = decision.technicalLevels.resistance?.find((r: number) => r > currentPrice);
      const nearestSupport = decision.technicalLevels.support?.find((s: number) => s < currentPrice);
      
      if (nearestResistance && nearestSupport) {
        target = nearestResistance;
        stop = nearestSupport;
        method = 'Níveis Técnicos AI (Resistência/Suporte)';
      } else if (decision.technicalLevels.targets?.[0]) {
        target = decision.technicalLevels.targets[0];
        stop = decision.technicalLevels.stopLoss?.[0] || currentPrice * 0.98;
        method = 'Targets AI Diretos';
      } else {
        // Fallback para cálculo percentual
        target = currentPrice * 1.03; // 3% ganho
        stop = currentPrice * 0.985; // 1.5% perda
        method = 'Cálculo Percentual (Fallback)';
      }
    } else if (action === 'SELL') {
      // Para SELL: Target = próximo suporte, Stop = resistência mais próxima
      const nearestSupport = decision.technicalLevels.support?.find((s: number) => s < currentPrice);
      const nearestResistance = decision.technicalLevels.resistance?.find((r: number) => r > currentPrice);
      
      if (nearestSupport && nearestResistance) {
        target = nearestSupport;
        stop = nearestResistance;
        method = 'Níveis Técnicos AI (Suporte/Resistência)';
      } else if (decision.technicalLevels.targets?.[0]) {
        target = decision.technicalLevels.targets[0];
        stop = decision.technicalLevels.stopLoss?.[0] || currentPrice * 1.02;
        method = 'Targets AI Diretos';
      } else {
        // Fallback para cálculo percentual
        target = currentPrice * 0.97; // 3% ganho
        stop = currentPrice * 1.015; // 1.5% perda
        method = 'Cálculo Percentual (Fallback)';
      }
    } else {
      return null; // HOLD não precisa de targets
    }
    
    // Calcular risk/reward ratio
    const risk = Math.abs(currentPrice - stop);
    const reward = Math.abs(target - currentPrice);
    const riskRewardRatio = reward / risk;
    
    // Validar se atende ao mínimo de R/R
    if (riskRewardRatio < config.MIN_RISK_REWARD_RATIO) {
      // Ajustar target para atender R/R mínimo
      if (action === 'BUY') {
        target = currentPrice + (risk * config.MIN_RISK_REWARD_RATIO);
      } else {
        target = currentPrice - (risk * config.MIN_RISK_REWARD_RATIO);
      }
      method += ' (Ajustado para R/R mínimo)';
    }
    
    return {
      target,
      stop,
      riskRewardRatio: Math.abs(target - currentPrice) / Math.abs(currentPrice - stop),
      method
    };
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
