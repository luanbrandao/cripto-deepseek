import { DeepSeekService } from '../../clients/deepseek-client';

export async function analyzeWithSmartSell(deepseek: DeepSeekService, symbol: string, marketData: any) {
  const { price, stats, klines } = marketData;
  
  const prompt = `
Você é um especialista em análise técnica focado EXCLUSIVAMENTE em identificar oportunidades de VENDA (SHORT).

DADOS DO MERCADO ${symbol}:
- Preço atual: $${price}
- Variação 24h: ${stats.priceChangePercent}%
- Volume 24h: ${stats.volume}
- Máxima 24h: $${stats.highPrice}
- Mínima 24h: $${stats.lowPrice}
- Candlesticks: ${klines.length} velas de 1h

FOCO EXCLUSIVO EM SINAIS BEARISH:
- Procure por padrões de reversão de alta para baixa
- Identifique resistências sendo testadas
- Analise divergências bearish
- Verifique sinais de exaustão de compradores
- Considere volumes de distribuição

CRITÉRIOS PARA VENDA:
1. Resistência forte sendo testada
2. Padrões de reversão bearish (ombro-cabeça-ombro, duplo topo)
3. Rompimento de suportes importantes
4. Divergência bearish em indicadores
5. Sinais de distribuição (volume alto em quedas)

IMPORTANTE: 
- Forneça uma recomendação CLARA de VENDA se as condições forem favoráveis
- Caso contrário, recomende HOLD
- NUNCA recomende BUY - este bot é focado apenas em vendas
- Seja conservador - só recomende venda com alta confiança

Responda em JSON:
{
  "action": "SELL" ou "HOLD",
  "confidence": número de 0-100,
  "reason": "explicação detalhada focada em sinais bearish",
  "price": ${price},
  "symbol": "${symbol}"
}`;

  try {
    const analysis = await deepseek.analyzeMarket(marketData, prompt);
    console.log(`📉 Análise SELL para ${symbol}:`, analysis.reason);
    return analysis;
  } catch (error) {
    console.error(`❌ Erro na análise SELL para ${symbol}:`, error);
    return {
      action: 'HOLD',
      confidence: 0,
      reason: 'Erro na análise - aguardando',
      price: price,
      symbol: symbol
    };
  }
}