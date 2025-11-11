import { UnifiedAnalysisParser } from '../shared/parsers/unified-analysis-parser';

// Exemplos de respostas do DeepSeek para testar
const testResponses = [
  {
    name: "BTCUSDT HOLD Response",
    response: `### BTCUSDT Analysis (1h Timeframe)

**Recommendation:** **HOLD**  
**Confidence Level:** Medium (65%)

---

### Key Observations:

1. **Price Action & Trend:**
   - Current price: $102,525.73
   - Open price: $105,298.23
   - **Price declined by -2.63%** over the observed period
   - Clear downtrend visible in recent klines, with price falling from ~$107,500 (high) to ~$102,476 (low)

2. **Volume Analysis:**
   - Current volume: 23,772 BTC
   - Several high-volume red candles appear during the decline, indicating selling pressure
   - Volume spikes on downward moves suggest bearish momentum

3. **Support/Resistance Levels:**
   - **Immediate resistance:** ~$106,000-107,500 (previous consolidation zone)
   - **Current support:** ~$102,476 (recent low)
   - Price is trading near the lower end of the recent range

### Key Levels to Watch:
- **Break below $102,476** → Consider SELL with target ~$101,000
- **Break above $104,000** with volume → Potential BUY opportunity
- **Sustained move above $106,000** → Confirms trend reversal`,
    symbol: "BTCUSDT",
    price: 102525.73
  },
  {
    name: "ETHUSDT SELL Response",
    response: `**Recommendation: SELL**  
**Confidence Level: Medium-High (70%)**

### Key Observations:
1. **Price Trend**:  
   - Current price: **$102,570.66**  
   - Open price (50 periods ago): ~$104,633.13  
   - The price has declined by **~2.91%** ($3,074.11) during this period, indicating a bearish short-term trend.

4. **Support and Resistance**:  
   - **Resistance**: Established near $106,500–$107,500 (multiple failed tests).  
   - **Support**: Temporary base at **$102,476.09** (recent low). A break below could trigger further declines toward $101,000–$100,000.

### Reasoning:
- The inability to hold above $105,000 and the repeated rejection at higher levels suggest weakening bullish momentum.  
- The downtrend is supported by elevated volume on down-days and shrinking volume on minor rebounds.  
- A break below **$102,476** could accelerate selling, with the next support near **$101,000**.

**Summary**: The data supports a SELL bias with a stop-loss above $103,500 and a target near $101,000.`,
    symbol: "ETHUSDT", 
    price: 102570.66
  },
  {
    name: "Complex Analysis with Multiple Levels",
    response: `## RECOMMENDATION: **HOLD** with **Medium-Low Confidence**

**BEARISH SIGNALS:**
- **Price Decline**: ETH has dropped -3.75% ($133.06) from the open price of $3,544.22 to current $3,411.16
- **Strong Downtrend**: Consistent lower highs and lower lows throughout the period
- **Recent Breakdown**: Price broke below key support levels around $3,480-3,500

### Critical Levels:
- **Immediate Resistance**: $3,440-3,450
- **Strong Resistance**: $3,480-3,500 (previous support turned resistance)  
- **Key Support**: $3,408 (today's low)
- **Major Support**: $3,400 psychological level

### Reasoning for HOLD Recommendation:
1. **Risk-Reward Unfavorable**: Current position near lows makes selling risky for potential bounce
2. **Oversold Conditions**: The sharp decline increases probability of short-term consolidation or minor recovery
3. **Wait for Confirmation**: Better to wait for either breakdown below $3,408 or recovery above $3,450 for clearer direction

### Next Actions to Monitor:
- **BUY Signal**: If price reclaims $3,450 with volume
- **SELL Signal**: If price breaks below $3,408 with follow-through
- **Continue HOLD**: If price remains range-bound between $3,408-3,450`,
    symbol: "ETHUSDT",
    price: 3411.16
  }
];

async function testEnhancedParser() {
  console.log('🧪 TESTANDO PARSER MELHORADO DO DEEPSEEK\n');
  console.log('=' .repeat(80));

  for (let i = 0; i < testResponses.length; i++) {
    const test = testResponses[i];
    console.log(`\n📋 TESTE ${i + 1}: ${test.name}`);
    console.log('-'.repeat(50));

    try {
      const result = await UnifiedAnalysisParser.parseBasic(test.response, test.symbol, test.price);
      
      console.log(`🎯 AÇÃO: ${result.action}`);
      console.log(`📊 CONFIANÇA: ${result.confidence}%`);
      console.log(`💭 RAZÃO: ${result.reason}`);
      console.log(`💰 PREÇO: $${result.price}`);
      console.log(`🪙 SÍMBOLO: ${result.symbol}`);
      
      if (result.technicalLevels) {
        console.log(`📈 NÍVEIS TÉCNICOS:`);
        if (result.technicalLevels.support) {
          console.log(`   🟢 Suportes: ${result.technicalLevels.support.map(s => `$${s.toLocaleString()}`).join(', ')}`);
        }
        if (result.technicalLevels.resistance) {
          console.log(`   🔴 Resistências: ${result.technicalLevels.resistance.map(r => `$${r.toLocaleString()}`).join(', ')}`);
        }
        if (result.technicalLevels.targets) {
          console.log(`   🎯 Targets: ${result.technicalLevels.targets.map(t => `$${t.toLocaleString()}`).join(', ')}`);
        }
        if (result.technicalLevels.stopLoss) {
          console.log(`   🛑 Stop Loss: ${result.technicalLevels.stopLoss.map(sl => `$${sl.toLocaleString()}`).join(', ')}`);
        }
      }
      
      console.log(`✅ SUCESSO`);
      
    } catch (error) {
      console.log(`❌ ERRO: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 TESTE CONCLUÍDO!');
}

// Executar teste
testEnhancedParser().catch(console.error);