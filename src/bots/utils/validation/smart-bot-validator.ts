import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import { validateTrendAnalysis, validateDeepSeekDecision, boostConfidence } from '../../../shared/validators/trend-validator';
import { calculateTargetAndStopPrices } from '../risk/price-calculator';
import { calculateRiskRewardDynamic } from '../risk/trade-validators';

export class SmartBotValidator {
  static async validateSmartDecision(
    decision: any, 
    symbol: string, 
    marketData: any, 
    binancePublic: any, 
    trendAnalyzer: any,
    preset: string = 'UltraConservative'
  ): Promise<boolean> {
    // 1. SMART PRÉ-VALIDAÇÃO
    const smartValidation = await SmartPreValidationService
      .createBuilder()
      .usePreset(preset)
      .build()
      .validate(symbol, marketData, decision, binancePublic);
    
    if (!smartValidation.isValid) {
      console.log('❌ SMART PRÉ-VALIDAÇÃO FALHOU:');
      smartValidation.warnings.forEach((warning: string) => console.log(`   ${warning}`));
      return false;
    }
    
    console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
    smartValidation.reasons.forEach((reason: string) => console.log(`   ${reason}`));
    console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
    console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    console.log(`🔍 Camadas Ativas: ${smartValidation.activeLayers.join(', ')}`);
    
    // 2. VALIDAÇÕES ESPECÍFICAS
    console.log('🔍 Validações específicas Smart Bot...');
    
    const trendAnalysis = await trendAnalyzer.checkMarketTrendWithEma(symbol);
    if (!validateTrendAnalysis(trendAnalysis, { direction: 'UP', isSimulation: false })) {
      console.log('❌ Tendência EMA não favorável para compra');
      return false;
    }

    if (!validateDeepSeekDecision(decision, 'BUY')) {
      console.log('❌ DeepSeek não recomenda BUY');
      return false;
    }

    // 3. BOOST E VALIDAÇÃO FINAL
    const boostedDecision = boostConfidence(decision, { baseBoost: 5, maxBoost: 15, trendType: 'BUY' });
    console.log(`🚀 Confiança após boost: ${boostedDecision.confidence}%`);

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
      console.log('❌ Risk/Reward insuficiente para trade real');
      return false;
    }
    
    // 4. ATUALIZAR DECISÃO
    decision.confidence = smartValidation.confidence || boostedDecision.confidence;
    decision.validationScore = smartValidation.totalScore;
    decision.riskLevel = smartValidation.riskLevel;
    decision.smartValidationPassed = true;
    decision.activeLayers = smartValidation.activeLayers;
    Object.assign(decision, boostedDecision);
    
    return true;
  }
}