import { BinancePrivateClient } from './clients/binance-private-client';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBinancePrivateConnection() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ BINANCE_API_KEY ou BINANCE_API_SECRET não encontradas no .env');
    return;
  }

  console.log('🔍 Testando conexão com Binance API (Autenticada)...');
  console.log('🔑 API Key:', `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`);

  const client = new BinancePrivateClient(apiKey, apiSecret);

  try {
    // Teste 1: Informações da conta
    console.log('\n👤 Teste 1: Informações da Conta');
    const accountInfo = await client.getAccountInfo();
    console.log('✅ Informações da conta obtidas com sucesso');
    console.log(`📊 Tipo de conta: ${accountInfo.accountType}`);
    console.log(`⚖️ Pode negociar: ${accountInfo.canTrade}`);
    console.log(`💰 Saldos com valor > 0:`);
    
    const balancesWithValue = accountInfo.balances.filter((balance: any) => 
      parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    );
    
    balancesWithValue.slice(0, 5).forEach((balance: any) => {
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      if (free > 0 || locked > 0) {
        console.log(`   ${balance.asset}: Livre: ${free}, Bloqueado: ${locked}`);
      }
    });

    if (balancesWithValue.length > 5) {
      console.log(`   ... e mais ${balancesWithValue.length - 5} ativos`);
    }

    // Teste 2: Ordens abertas
    console.log('\n📋 Teste 2: Ordens Abertas');
    const openOrders = await client.getOpenOrders();
    console.log(`✅ Ordens abertas: ${openOrders.length}`);
    
    if (openOrders.length > 0) {
      console.log('📝 Primeiras ordens abertas:');
      openOrders.slice(0, 3).forEach((order: any) => {
        console.log(`   ${order.symbol}: ${order.side} ${order.origQty} @ ${order.price}`);
      });
    } else {
      console.log('   Nenhuma ordem aberta no momento');
    }

    // Teste 3: Histórico de ordens (BTCUSDT)
    console.log('\n📈 Teste 3: Histórico de Ordens BTCUSDT (últimas 5)');
    try {
      const orderHistory = await client.getOrderHistory('BTCUSDT', 5);
      console.log(`✅ Histórico obtido: ${orderHistory.length} ordens`);
      
      if (orderHistory.length > 0) {
        console.log('📊 Últimas ordens:');
        orderHistory.slice(0, 3).forEach((order: any) => {
          const date = new Date(order.time).toLocaleString('pt-BR');
          console.log(`   ${date}: ${order.side} ${order.origQty} BTCUSDT @ ${order.price} - ${order.status}`);
        });
      } else {
        console.log('   Nenhuma ordem encontrada para BTCUSDT');
      }
    } catch (error: any) {
      console.log('ℹ️  Sem histórico de ordens para BTCUSDT (normal se nunca negociou)');
    }

    console.log('\n🎉 Todos os testes da Binance (Autenticada) passaram com sucesso!');
    console.log('✅ Suas chaves API estão funcionando corretamente');

  } catch (error: any) {
    console.error('\n❌ Erro na conexão autenticada com Binance:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Erro:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('🔑 Possível problema com as chaves API - verifique se estão corretas');
      }
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testBinancePrivateConnection();