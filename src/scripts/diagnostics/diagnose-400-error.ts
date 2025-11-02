import { BinancePrivateClient } from '../../clients/binance-private-client';
import * as dotenv from 'dotenv';

dotenv.config();

async function diagnose400Error() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ BINANCE_API_KEY ou BINANCE_API_SECRET não encontradas no .env');
    return;
  }

  console.log('🔍 Diagnosticando erro 400 da Binance API...\n');
  const client = new BinancePrivateClient(apiKey, apiSecret);

  try {
    console.log('1️⃣ Testando acesso à conta...');
    const accountInfo = await client.getAccountInfo();
    console.log('✅ Conta acessível');
    console.log(`   Pode negociar: ${accountInfo.canTrade}`);

    const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT');
    const usdtFree = parseFloat(usdtBalance?.free || '0');
    console.log(`   USDT disponível: $${usdtFree.toFixed(2)}\n`);

    console.log('🎉 Diagnóstico concluído - API funcionando!');

  } catch (error: any) {
    console.error('\n❌ ERRO 400 DETECTADO:');

    if (error.response?.status === 400) {
      console.error('Status: 400 Bad Request');
      console.error('Detalhes:', error.response.data);

      const errorCode = error.response.data.code;
      const errorMsg = error.response.data.msg;

      console.log('\n🔍 Análise do erro:');

      switch (errorCode) {
        case -1021:
          console.log('⏰ Erro de timestamp - Sincronize o relógio do sistema');
          break;
        case -1022:
          console.log('🔐 Assinatura inválida - Verifique as chaves API');
          break;
        case -2010:
          console.log('💰 Saldo insuficiente');
          break;
        case -1013:
          console.log('📏 Filtro de quantidade inválido');
          break;
        case -1111:
          console.log('📊 Precisão inválida');
          break;
        default:
          console.log(`❓ Código de erro: ${errorCode}`);
          console.log(`📝 Mensagem: ${errorMsg}`);
      }
    } else {
      console.error('Erro geral:', error.message);
    }
  }
}

diagnose400Error();