import { DeepSeekService } from '../../clients/deepseek-client';

export async function multiAnalyzeWithSmartTradeSell(deepseek: DeepSeekService, symbol: string, marketData: any) {
  const { price, stats, klines } = marketData;
  
  const prompt = `
Você é um especialista em análise técnica AVANÇADA focado EXCLUSIVAMENTE em identificar oportunidades de VENDA (SHORT) com análise multi-dimensional.

DADOS DO MERCADO ${symbol}:
- Preço atual: $${price}
- Variação 24h: ${stats.priceChangePercent}%
- Volume 24h: ${stats.volume}
- Máxima 24h: $${stats.highPrice}
- Mínima 24h: $${stats.lowPrice}
- Candlesticks: ${klines.length} velas de 1h

ANÁLISE MULTI-DIMENSIONAL BEARISH:

1. ANÁLISE EMA MULTI-TIMEFRAME:
   - EMA 12/26/50/100/200 em tendência de baixa
   - Death Cross confirmado (EMA rápida < EMA lenta)
   - Preço abaixo das EMAs principais

2. ANÁLISE DE VOLUME E MOMENTUM:
   - Volume de distribuição (altos volumes em quedas)
   - Momentum bearish confirmado
   - Divergência bearish em indicadores

3. PADRÕES BEARISH AVANÇADOS:
   - Ombro-Cabeça-Ombro invertido
   - Duplo topo ou triplo topo
   - Bandeiras e flâmulas de continuação bearish
   - Rompimento de suportes críticos

4. ANÁLISE DE SENTIMENTO:
   - Exaustão de compradores
   - Sinais de distribuição institucional
   - Resistências psicológicas testadas

5. CONDIÇÕES DE MERCADO:
   - Bear Market: Threshold mais baixo (mais oportunidades)
   - Bull Market: Threshold mais alto (mais seletivo)
   - Sideways: Threshold médio

CRITÉRIOS ULTRA-RIGOROSOS PARA VENDA:
- Múltiplas confirmações bearish
- Volume significativo em quedas
- Rompimento de suportes importantes
- Divergências bearish confirmadas
- Padrões de reversão completos

IMPORTANTE: 
- Seja EXTREMAMENTE seletivo - só recomende VENDA com altíssima confiança (85%+)
- NUNCA recomende BUY - este é um bot SHORT-ONLY
- Caso não haja sinais claros, recomende HOLD
- Considere múltiplos timeframes para confirmação

Responda em JSON:
{
  "action": "SELL" ou "HOLD",
  "confidence": número de 0-100 (mínimo 85 para SELL),
  "reason": "explicação detalhada da análise multi-dimensional bearish",
  "price": ${parseFloat(price)},
  "symbol": "${symbol}",
  "smartScore": número de 0-100 (score combinado de todos os fatores),
  "bearishSignals": ["lista", "de", "sinais", "bearish", "identificados"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

  try {
    const rawResponse = await deepseek.analyzeMarket(marketData, prompt);
    
    // Parse da resposta JSON
    let analysis;
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.warn(`⚠️ Erro ao parsear JSON para ${symbol}, usando fallback`);
      analysis = {
        action: 'HOLD',
        confidence: 0,
        reason: 'Erro no parsing da análise - aguardando',
        price: parseFloat(price),
        symbol: symbol,
        smartScore: 0,
        bearishSignals: [],
        riskLevel: 'HIGH'
      };
    }

    // Validações de segurança
    if (!analysis.action || !['SELL', 'HOLD'].includes(analysis.action)) {
      analysis.action = 'HOLD';
    }
    
    if (analysis.action === 'SELL' && analysis.confidence < 85) {
      console.log(`⚠️ ${symbol}: Confiança ${analysis.confidence}% < 85% - Convertendo para HOLD`);
      analysis.action = 'HOLD';
      analysis.confidence = Math.max(50, analysis.confidence - 20);
    }

    console.log(`📉 Análise MULTI-SELL para ${symbol}:`);
    console.log(`   Ação: ${analysis.action} (${analysis.confidence}%)`);
    console.log(`   Smart Score: ${analysis.smartScore || 'N/A'}`);
    console.log(`   Sinais Bearish: ${analysis.bearishSignals?.length || 0}`);
    
    return analysis;
  } catch (error) {
    console.error(`❌ Erro na análise MULTI-SELL para ${symbol}:`, error);
    return {
      action: 'HOLD',
      confidence: 0,
      reason: 'Erro na análise - aguardando condições favoráveis',
      price: parseFloat(price),
      symbol: symbol,
      smartScore: 0,
      bearishSignals: [],
      riskLevel: 'HIGH'
    };
  }
}