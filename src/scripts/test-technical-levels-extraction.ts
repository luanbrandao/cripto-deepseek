import { UnifiedAnalysisParser } from '../shared/parsers/unified-analysis-parser';

// Teste específico para extração de níveis técnicos
const technicalLevelsTest = {
  response: `### BTCUSDT Analysis (1h Timeframe)

**Recommendation:** **HOLD**  
**Confidence Level:** 75%

### Key Technical Observations:

**Support/Resistance Levels:**
- **Immediate resistance:** $106,000-107,500 (previous consolidation zone)
- **Strong resistance:** $108,500 and $110,000 levels
- **Current support:** $102,476 (recent low)
- **Key support:** $101,000 psychological level
- **Major support:** $98,500 if breakdown occurs

### Trading Levels:
- **Stop-loss:** Above $103,500 for short positions
- **Target 1:** $101,000 (next significant support)
- **Target 2:** $98,500 if momentum continues
- **Break above $104,000** with volume → Potential BUY opportunity
- **Sustained move above $106,000** → Confirms trend reversal

### Risk Management:
- Support: $102,476, $101,000, $98,500
- Resistance: $106,000, $107,500, $108,500, $110,000
- Stop loss: $103,500
- Targets: $101,000, $98,500`,
  symbol: "BTCUSDT",
  price: 102525.73
};

async function testTechnicalLevelsExtraction() {
  console.log('🔍 TESTANDO EXTRAÇÃO DE NÍVEIS TÉCNICOS\n');
  console.log('=' .repeat(60));

  try {
    const result = await UnifiedAnalysisParser.parseBasic(
      technicalLevelsTest.response, 
      technicalLevelsTest.symbol, 
      technicalLevelsTest.price
    );
    
    console.log(`🎯 AÇÃO: ${result.action}`);
    console.log(`📊 CONFIANÇA: ${result.confidence}%`);
    console.log(`💭 RAZÃO: ${result.reason}`);
    console.log(`💰 PREÇO ATUAL: $${result.price.toLocaleString()}`);
    
    if (result.technicalLevels) {
      console.log(`\n📈 NÍVEIS TÉCNICOS EXTRAÍDOS:`);
      
      if (result.technicalLevels.support && result.technicalLevels.support.length > 0) {
        console.log(`🟢 SUPORTES (${result.technicalLevels.support.length}):`);
        result.technicalLevels.support.forEach((level, index) => {
          console.log(`   ${index + 1}. $${level.toLocaleString()}`);
        });
      }
      
      if (result.technicalLevels.resistance && result.technicalLevels.resistance.length > 0) {
        console.log(`🔴 RESISTÊNCIAS (${result.technicalLevels.resistance.length}):`);
        result.technicalLevels.resistance.forEach((level, index) => {
          console.log(`   ${index + 1}. $${level.toLocaleString()}`);
        });
      }
      
      if (result.technicalLevels.targets && result.technicalLevels.targets.length > 0) {
        console.log(`🎯 TARGETS (${result.technicalLevels.targets.length}):`);
        result.technicalLevels.targets.forEach((level, index) => {
          console.log(`   ${index + 1}. $${level.toLocaleString()}`);
        });
      }
      
      if (result.technicalLevels.stopLoss && result.technicalLevels.stopLoss.length > 0) {
        console.log(`🛑 STOP LOSS (${result.technicalLevels.stopLoss.length}):`);
        result.technicalLevels.stopLoss.forEach((level, index) => {
          console.log(`   ${index + 1}. $${level.toLocaleString()}`);
        });
      }
    } else {
      console.log(`❌ NENHUM NÍVEL TÉCNICO EXTRAÍDO`);
    }
    
    console.log(`\n✅ TESTE CONCLUÍDO COM SUCESSO!`);
    
  } catch (error) {
    console.log(`❌ ERRO NO TESTE: ${error}`);
  }

  console.log('\n' + '='.repeat(60));
}

// Executar teste
testTechnicalLevelsExtraction().catch(console.error);