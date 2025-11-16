/**
 * Calcula a volatilidade do mercado baseada nos dados históricos de preços
 */
export function calculateVolatility(klines: any[]): number {
  const defaultVolatility = 1.0; // Algorithm constant - default volatility
  const minDataPoints = 2; // Algorithm constant
  
  if (klines.length < minDataPoints) return defaultVolatility;

  const prices = klines.map(k => parseFloat(k[4])); // close prices
  const returns = [];

  // Calcular retornos percentuais
  for (let i = 1; i < prices.length; i++) {
    const returnPct = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
    returns.push(Math.abs(returnPct));
  }

  // Volatilidade = média dos retornos absolutos
  const maxVolatility = 5.0; // Algorithm constant - 5% maximum
  const avgVolatility = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  return Math.min(avgVolatility, maxVolatility);
}

/**
 * Calcula volatilidade com dados de mercado já processados
 */
export async function calculateSymbolVolatility(
  binanceClient: any,
  symbol: string,
  timeframe: string,
  periods: number
): Promise<number> {
  const klines = await binanceClient.getKlines(symbol, timeframe, periods);
  return calculateVolatility(klines);
}
