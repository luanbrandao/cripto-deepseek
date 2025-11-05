export function validateBinanceKeys(): { apiKey: string; apiSecret: string } | null {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ Chaves da Binance não encontradas no .env');
    return null;
  }

  return { apiKey, apiSecret };
}
