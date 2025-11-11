import { DeepSeekService } from './src/core/clients/deepseek-client';
import * as fs from 'fs';

async function testDeepSeekHistory() {
  console.log('🧪 TESTE: Verificando salvamento do histórico DeepSeek\n');

  const deepseek = new DeepSeekService();

  // Dados de teste
  const testMarketData = {
    price: { price: '50000.00' },
    priceChangePercent: '2.5',
    volume: '1000000000',
    currentPrice: 50000
  };

  const testPrompt = 'Analyze BTCUSDT for testing purposes. Provide BUY recommendation with 85% confidence.';

  try {
    console.log('📡 Fazendo chamada de teste para DeepSeek...');

    // Teste com smartBot
    await deepseek.analyzeMarket(testMarketData, testPrompt, 'smartBot', 'BTCUSDT');

    // Teste com realBot  
    await deepseek.analyzeMarket(testMarketData, testPrompt, 'realBot', 'ETHUSDT');

    // Teste com multiSmartBot
    await deepseek.analyzeMarket(testMarketData, testPrompt, 'multiSmartBot', 'BNBUSDT');

    console.log('\n✅ Chamadas concluídas. Verificando arquivo de histórico...');

    // Verificar se arquivo foi criado
    const historyFile = './src/storage/deepseek/deepseek-history.json';
    if (fs.existsSync(historyFile)) {
      const data = JSON.parse(fs.readFileSync(historyFile, 'utf8'));

      console.log('\n📊 HISTÓRICO DEEPSEEK:');
      console.log(`Total de chamadas: ${data.metadata.totalCalls}`);
      console.log(`SmartBot: ${data.metadata.callsByBot.smartBot} chamadas`);
      console.log(`RealBot: ${data.metadata.callsByBot.realBot} chamadas`);
      console.log(`MultiSmartBot: ${data.metadata.callsByBot.multiSmartBot} chamadas`);

      console.log('\n📝 Últimas análises por bot:');
      if (data.smartBot.length > 0) {
        const last = data.smartBot[data.smartBot.length - 1];
        console.log(`SmartBot: ${last.symbol} | ${last.action} | ${last.confidence}% | ${last.timestamp}`);
      }

      if (data.realBot.length > 0) {
        const last = data.realBot[data.realBot.length - 1];
        console.log(`RealBot: ${last.symbol} | ${last.action} | ${last.confidence}% | ${last.timestamp}`);
      }

      if (data.multiSmartBot.length > 0) {
        const last = data.multiSmartBot[data.multiSmartBot.length - 1];
        console.log(`MultiSmartBot: ${last.symbol} | ${last.action} | ${last.confidence}% | ${last.timestamp}`);
      }

      console.log('\n✅ TESTE CONCLUÍDO: Histórico está sendo salvo corretamente!');
    } else {
      console.log('❌ ERRO: Arquivo de histórico não foi criado');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDeepSeekHistory();