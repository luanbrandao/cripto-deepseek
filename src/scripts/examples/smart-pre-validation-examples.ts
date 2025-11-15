import { SmartPreValidationService } from '../../shared/services/smart-pre-validation-service';

// Exemplo de dados de mercado
const mockMarketData = {
  marketData: {
    price24h: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
    currentPrice: 110,
    volumes: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000],
    stats: {
      priceChangePercent: '2.5'
    }
  },
  decision: {
    confidence: 85,
    action: 'BUY'
  },
  symbol: 'BTCUSDT',
  levels: [
    { price: 108, type: 'support', touches: 3, strength: 0.8 },
    { price: 112, type: 'resistance', touches: 2, strength: 0.7 }
  ]
};

console.log('🧪 EXEMPLOS DE PRÉ-VALIDAÇÃO INTELIGENTE\n');

// Exemplo 1: Validação customizada para EMA Bot
console.log('📊 EXEMPLO 1: EMA Bot Customizado');
const emaValidation = SmartPreValidationService.create(mockMarketData)
  .withEma(12, 26, 30)        // EMA com peso alto
  .withRSI(14, 20)            // RSI padrão
  .withVolume(1.2, 25)        // Volume com peso alto
  .withMomentum(15)           // Momentum
  .withConfidence(70, 10)     // Confiança mínima
  .validate();

console.log(`Resultado: ${emaValidation.isValid ? '✅ APROVADO' : '❌ REJEITADO'}`);
console.log(`Score: ${emaValidation.score}/${emaValidation.maxScore}`);
console.log(`Confiança: ${emaValidation.confidence}%`);
console.log(`Risco: ${emaValidation.riskLevel}\n`);

// Exemplo 2: Validação ultra-conservadora
console.log('🛡️ EXEMPLO 2: Ultra-Conservador');
const ultraValidation = SmartPreValidationService.create(mockMarketData)
  .withEma(12, 26, 20)
  .withRSI(14, 15)
  .withVolume(1.8, 20)        // Volume muito alto exigido
  .withSupportResistance(0.005, 25) // Tolerância muito baixa
  .withMomentum(10)
  .withVolatility(0.5, 2, 10) // Volatilidade muito controlada
  .validate();

console.log(`Resultado: ${ultraValidation.isValid ? '✅ APROVADO' : '❌ REJEITADO'}`);
console.log(`Score: ${ultraValidation.score}/${ultraValidation.maxScore}`);
console.log(`Confiança: ${ultraValidation.confidence}%`);
console.log(`Risco: ${ultraValidation.riskLevel}\n`);

// Exemplo 3: Validação focada em S/R
console.log('🎯 EXEMPLO 3: Foco em Suporte/Resistência');
const srValidation = SmartPreValidationService.create(mockMarketData)
  .withSupportResistance(0.01, 40) // Peso muito alto para S/R
  .withEma(12, 26, 20)
  .withVolume(1.2, 20)
  .withMomentum(20)
  .validate();

console.log(`Resultado: ${srValidation.isValid ? '✅ APROVADO' : '❌ REJEITADO'}`);
console.log(`Score: ${srValidation.score}/${srValidation.maxScore}`);
console.log(`Confiança: ${srValidation.confidence}%`);
console.log(`Risco: ${srValidation.riskLevel}\n`);

// Exemplo 4: Usando presets
console.log('⚡ EXEMPLO 4: Usando Presets');
console.log('Smart Bot Preset:');
const smartPreset = SmartPreValidationService.forSmartBot(mockMarketData);
console.log(`Resultado: ${smartPreset.isValid ? '✅ APROVADO' : '❌ REJEITADO'}`);
console.log(`Score: ${smartPreset.score}/${smartPreset.maxScore}`);

console.log('\nUltra-Conservative Preset:');
const ultraPreset = SmartPreValidationService.forUltraConservative(mockMarketData);
console.log(`Resultado: ${ultraPreset.isValid ? '✅ APROVADO' : '❌ REJEITADO'}`);
console.log(`Score: ${ultraPreset.score}/${ultraPreset.maxScore}`);

console.log('\nEMA Bot Preset:');
const emaPreset = SmartPreValidationService.forEmaBot(mockMarketData);
console.log(`Resultado: ${emaPreset.isValid ? '✅ APROVADO' : '❌ REJEITADO'}`);
console.log(`Score: ${emaPreset.score}/${emaPreset.maxScore}`);

console.log('\n🎯 COMO USAR NO SEU BOT:');
console.log(`
// Exemplo de uso em um bot:
const validation = SmartPreValidationService.create(data)
  .withEma(12, 26, 25)        // EMA 12/26 com peso 25
  .withRSI(14, 20)            // RSI com peso 20
  .withVolume(1.5, 20)        // Volume 1.5x com peso 20
  .withSupportResistance(0.01, 15) // S/R com tolerância 1% e peso 15
  .withMomentum(10)           // Momentum com peso 10
  .withConfidence(75, 10)     // Confiança mín 75% com peso 10
  .validate();

if (validation.isValid) {
  console.log('✅ Validação aprovada!');
  console.log(\`Score: \${validation.score}/\${validation.maxScore}\`);
  console.log(\`Confiança: \${validation.confidence}%\`);
  console.log(\`Risco: \${validation.riskLevel}\`);
  // Prosseguir com o trade...
}
`);