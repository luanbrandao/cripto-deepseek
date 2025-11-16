export class ValidationLogger {
  static logSmartValidation(smartValidation: any) {
    if (!smartValidation.isValid) {
      console.log('❌ SMART PRÉ-VALIDAÇÃO FALHOU:');
      smartValidation.warnings.forEach((warning: string) => console.log(`   ${warning}`));
      return;
    }

    console.log('✅ SMART PRÉ-VALIDAÇÃO APROVADA:');
    smartValidation.reasons.forEach((reason: string) => console.log(`   ${reason}`));
    console.log(`📊 Score Total: ${smartValidation.totalScore}/100`);
    console.log(`🛡️ Nível de Risco: ${smartValidation.riskLevel}`);
    console.log(`🔍 Camadas Ativas: ${smartValidation.activeLayers.join(', ')}`);
  }

  static logUltraConservativeAnalysis(ultraAnalysis: any) {
    if (!ultraAnalysis.isValid) {
      console.log('❌ ANÁLISE ULTRA-CONSERVADORA FALHOU:');
      ultraAnalysis.warnings.forEach((warning: string) => console.log(`   ${warning}`));
      return false;
    }

    console.log('✅ ANÁLISE ULTRA-CONSERVADORA APROVADA:');
    ultraAnalysis.reasons.forEach((reason: string) => console.log(`   ${reason}`));
    console.log(`🛡️ Nível de Risco: ${ultraAnalysis.riskLevel}`);
    return true;
  }

  static logValidationHeader(botType: string, isSimulation: boolean = false) {
    const mode = isSimulation ? 'SIMULATOR' : 'REAL BOT';
    console.log(`🛡️ PRÉ-VALIDAÇÃO ${botType} ${mode}...`);
  }
}