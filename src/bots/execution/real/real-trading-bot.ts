import * as dotenv from 'dotenv';
import { BaseTradingBot } from '../../core/base-trading-bot';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { TradingConfigManager } from '../../../shared/config/trading-config-manager';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';

dotenv.config();

export class RealTradingBot extends BaseTradingBot {
  private flowManager: BotFlowManager;

  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);

    const config: BotConfig = {
      name: 'Real Trading Bot',
      isSimulation: false,
      tradesFile: TradingConfigManager.getConfig().FILES.REAL_BOT
    };

    this.flowManager = new BotFlowManager(this, config);
  }

  protected logBotInfo() {
    logBotHeader('MULTI-SYMBOL REAL TRADING BOT v3.0 - REFATORADO', 'Análise de Múltiplas Moedas + DeepSeek AI');
  }

  private async analyzeWithRealTradeLogic(symbol: string, marketData: any) {
    return await UnifiedDeepSeekAnalyzer.analyzeRealTrade(this.deepseek!, symbol, marketData);
  }

  private async validateRealTradingDecision(decision: any, symbol?: string, marketData?: any): Promise<boolean> {
    if (!symbol || !marketData) return false;

    console.log('🛡️ SMART PRÉ-VALIDAÇÃO REAL TRADING BOT...');

    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .usePreset('RealBot')
      .build()
      .validate(symbol, marketData, decision, this.getBinancePublic());

    if (!smartValidation.isValid) {
      console.log('❌ SMART PRÉ-VALIDAÇÃO FALHOU:');
      smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
    smartValidation.reasons.forEach(reason => console.log(`   ${reason}`));
    console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
    console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    console.log(`🔍 Camadas Ativas: ${smartValidation.activeLayers.join(', ')}`);

    decision.confidence = smartValidation.confidence || decision.confidence;
    decision.validationScore = smartValidation.totalScore;
    decision.riskLevel = smartValidation.riskLevel;
    decision.smartValidationPassed = true;
    decision.activeLayers = smartValidation.activeLayers;

    return true;
  }

  async executeTrade() {
    this.logBotInfo();
    return await this.flowManager.executeStandardFlow(
      this.analyzeWithRealTradeLogic.bind(this),
      undefined,
      this.validateRealTradingDecision.bind(this)
    );
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const realBot = new RealTradingBot(apiKey, apiSecret);
    await realBot.executeTrade();
  }

  logBotStartup(
    'Real Trading Bot',
    '💰 Certifique-se de que entende os riscos envolvidos'
  ).then(() => main());
}