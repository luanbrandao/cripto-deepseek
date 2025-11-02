import { hasActiveTradeForSymbol } from './utils/symbol-trade-checker';
import { BinancePrivateClient } from '../clients/binance-private-client';
import { validateBinanceKeys } from './utils/env-validator';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSymbolChecker() {
  console.log('🧪 Testando verificação de trades duplicados...\n');

  // Teste 1: API Privada da Binance
  console.log('📋 Teste 1: Verificando trades ativos na Binance API');
  const keys = validateBinanceKeys();
  
  if (keys) {
    const { apiKey, apiSecret } = keys;
    const binancePrivate = new BinancePrivateClient(apiKey, apiSecret);
    const symbols = TRADING_CONFIG.SYMBOLS;

    for (const symbol of symbols) {
      try {
        const hasActive = await hasActiveTradeForSymbol(binancePrivate, symbol);
        console.log(`   ${symbol}: ${hasActive ? '❌ Trade ativo encontrado' : '✅ Sem trades ativos'}`);
      } catch (error) {
        console.log(`   ${symbol}: ⚠️ Erro ao verificar - ${error}`);
      }
    }
  } else {
    console.log('❌ Chaves da Binance não configuradas');
  }

  // Teste 2: Simulação
  console.log('\n📋 Teste 2: Verificando simulações');
  const symbols = TRADING_CONFIG.SYMBOLS;

  for (const symbol of symbols) {
    const hasActive = await hasActiveTradeForSymbol(
      undefined,
      symbol,
      true,
      TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR
    );
    console.log(`   ${symbol}: ${hasActive ? '❌ Simulação ativa' : '✅ Sem simulações ativas'}`);
  }

  console.log('\n✅ Teste concluído!');
  console.log('🛡️ Proteção ativa contra trades duplicados');
}

testSymbolChecker().catch(console.error);