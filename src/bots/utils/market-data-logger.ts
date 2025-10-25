export function logMarketInfo(symbol: string, price: any, stats: any) {
  console.log(`💰 ${symbol}: $${parseFloat(price.price).toLocaleString()}`);
  console.log(`📈 Variação 24h: ${parseFloat(stats.priceChangePercent).toFixed(2)}%`);
  console.log(`📊 Volume 24h: ${parseFloat(stats.volume).toLocaleString()} ${symbol}`);
}