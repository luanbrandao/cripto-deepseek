import { BinancePublicClient } from './clients/binance-public-client';

async function testBinancePublic() {
  const client = new BinancePublicClient();

  console.log('🚀 Testando cliente público da Binance...\n');

  try {
    // Teste 1: Preço do Bitcoin
    console.log('📊 Preço do Bitcoin:');
    const btcPrice = await client.getPrice('BTCUSDT');
    console.log(btcPrice);
    console.log('✅ Sucesso!\n');

    // Teste 2: Top 5 criptos
    console.log('💰 Top 5 preços:');
    const allPrices = await client.getAllPrices();
    console.log(allPrices.slice(0, 5));
    console.log('✅ Sucesso!\n');

    // Teste 3: Stats 24h
    console.log('📈 Stats 24h BTC:');
    const stats = await client.get24hrStats('BTCUSDT');
    console.log({
      symbol: stats.symbol,
      priceChange: stats.priceChange,
      priceChangePercent: stats.priceChangePercent,
      volume: stats.volume
    });
    console.log('✅ Sucesso!\n');

    console.log('🎉 Todos os testes passaram!');
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }
}

testBinancePublic();