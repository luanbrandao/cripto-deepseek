export class DecisionUpdater {
  static updateWithValidation(decision: any, smartValidation: any, ultraAnalysis?: any, boostedDecision?: any) {
    decision.confidence = smartValidation.confidence || ultraAnalysis?.confidence || boostedDecision?.confidence;
    decision.validationScore = smartValidation.totalScore;
    decision.riskLevel = smartValidation.riskLevel || ultraAnalysis?.riskLevel;
    decision.smartValidationPassed = true;
    decision.activeLayers = smartValidation.activeLayers;
    
    if (ultraAnalysis) {
      decision.ultraConservativeScore = ultraAnalysis.score;
    }
    
    if (boostedDecision) {
      Object.assign(decision, boostedDecision);
    }
  }

  static updateWithEnhancedTargets(decision: any, enhancedTargets: any) {
    if (!enhancedTargets) return;
    
    decision.enhancedTarget = enhancedTargets.target;
    decision.enhancedStop = enhancedTargets.stop;
    decision.enhancedRiskReward = enhancedTargets.riskRewardRatio;
    decision.calculationMethod = enhancedTargets.method;
  }
}