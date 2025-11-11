import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager, BotConfig } from '../../utils/execution/bot-flow-manager';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { ULTRA_CONSERVATIVE_CONFIG } from '../../../shared/config/ultra-conservative-config';
import { UltraConservativeAnalyzer } from '../../../shared/analyzers/ultra-conservative-analyzer';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import * as dotenv from 'dotenv';

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
    console.log('🛡️ ULTRA-CONSERVATIVE REAL BOT SIMULATOR - NÃO EXECUTA TRADES REAIS\n');
    logBotHeader('🛡️ ULTRA-CONSERVATIVE REAL BOT SIMULATOR v4.0', 'Win Rate Target: 82%+ | Máxima Segurança | Apenas Simulação', true);
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`   📊 Confiança Mínima: ${ULTRA_CONSERVATIVE_CONFIG.MIN_CONFIDENCE}%`);
    console.log(`   🛡️ Risk/Reward: ${ULTRA_CONSERVATIVE_CONFIG.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`   ⏰ Cooldown: ${ULTRA_CONSERVATIVE_CONFIG.TRADE_COOLDOWN_HOURS}h`);
    console.log(`   🪙 Símbolos: ${ULTRA_CONSERVATIVE_CONFIG.SYMBOLS.join(', ')}`);
    console.log('   🧪 MODO SIMULAÇÃO - Zero risco financeiro\n');
  }

  private async analyzeWithRealTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeRealTrade(this.deepseek!, symbol, marketData);
  }

  private async validateUltraConservativeDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;
    
    console.log('🛡️ VALIDAÇÃO ULTRA-CONSERVADORA REAL BOT SIMULATOR...');
    
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
