import { BaseTradingBot } from '../../core/base-trading-bot';
import { validateBinanceKeys } from '../../utils/validation/env-validator';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { TradingConfigManager } from '../../../core';
import { UnifiedDeepSeekAnalyzer } from '../../../shared/analyzers/unified-deepseek-analyzer';
import { calculateTargetAndStopPrices, calculateTargetAndStopPricesRealMarket, calculateTargetAndStopPricesWithLevels } from '../../utils/risk/price-calculator';
import { getMarketData } from '../../utils/data/market-data-fetcher';
import { calculateVolatility } from '../../utils/risk/volatility-calculator';
import { createTradeRecord, saveTradeHistory } from '../../utils/execution/trade-history-saver';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class CalculateTargetTestBot extends BaseTradingBot {
  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
  }

  protected logBotInfo() {
    logBotHeader('CALCULATE TARGET TEST BOT', 'Comparação de Métodos de Cálculo de Preços', true);
  }

  async executeTrade() {
    return await this.executeTest();
  }

  private async analyzeMultipleSymbols() {
    const symbols = TradingConfigManager.getConfig().SYMBOLS;
    const analyses = [];

    for (const symbol of symbols) {
      try {
        console.log(`\n📊 Analisando ${symbol}...`);

        // Buscar dados de mercado
        const { price, stats, klines } = await getMarketData(this.getBinancePublic(), symbol);

        // Análise com DeepSeek
        const decision = await UnifiedDeepSeekAnalyzer.analyzeRealTrade(this.deepseek!, symbol, { price, stats, klines });

        console.log(`   ${symbol}: ${decision.action} (${decision.confidence}% confiança)`);

        // Para teste de calculadoras, incluir todas as decisões que atendem confiança mínima
        // Se for HOLD, converter para BUY para testar calculadoras
        if (decision.confidence >= TradingConfigManager.getConfig().MIN_CONFIDENCE) {
          let testDecision = decision;

          // Se for HOLD, converter para BUY para fins de teste
          if (decision.action === 'HOLD') {
            testDecision = {
              ...decision,
              action: 'BUY' as const,
              reason: `${decision.reason} (Convertido de HOLD para BUY para teste de calculadoras)`
            };
            console.log(`   🔄 Convertendo HOLD para BUY para teste de calculadoras`);
          }

          analyses.push({
            symbol,
            decision: testDecision,
            marketData: { price, stats, klines },
            score: decision.confidence
          });
        }

      } catch (error) {
        console.log(`   ❌ Erro ao analisar ${symbol}:`, error);
      }
    }

    if (analyses.length === 0) {
      return null;
    }

    // Selecionar melhor oportunidade
    const bestAnalysis = analyses.sort((a, b) => b.score - a.score)[0];

    console.log('\n📋 RESUMO DAS ANÁLISES:');
    console.log('='.repeat(60));
    analyses.forEach(analysis => {
      const emoji = analysis.decision.action === 'BUY' ? '🟢' : '🔴';
      console.log(`${emoji} ${analysis.symbol.padEnd(10)} | ${analysis.decision.action.padEnd(4)} | ${analysis.decision.confidence}%`);
    });
    console.log('='.repeat(60));

    return bestAnalysis;
  }

  async executeTest() {
    this.logBotInfo();

    console.log(`\n🔍 Analisando ${TradingConfigManager.getConfig().SYMBOLS.length} moedas para encontrar a melhor oportunidade...`);

    try {
      // 1. Análise multi-moeda com DeepSeek
      const bestAnalysis = await this.analyzeMultipleSymbols();

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade encontrada em nenhuma moeda');
        return;
      }

      const { symbol, decision, marketData } = bestAnalysis;
      console.log(`\n🏆 MOEDA SELECIONADA: ${symbol}`);
      console.log(`💰 Preço atual: $${decision.price}`);

      console.log(`\n📊 DECISÃO AI FINAL:`);
      console.log(`🎯 Ação: ${decision.action}`);
      console.log(`📈 Confiança: ${decision.confidence}%`);
      console.log(`💭 Razão: ${decision.reason}`);
      console.log(`💰 Preço: $${decision.price}`);

      // Agora todas as decisões já foram convertidas para BUY/SELL se necessário
      console.log(`🔧 Testando calculadoras com ação: ${decision.action}`);

      if (decision.action === 'HOLD') {
        console.log('⚠️ ERRO: Decisão HOLD não deveria chegar aqui após conversão');
        return;
      }

      const { klines } = marketData;

      // 3. Método 1: calculateTargetAndStopPrices (Básico)
      console.log('\n' + '='.repeat(60));
      console.log('📊 MÉTODO 1: Basic Calculator (2:1 Fixo)');
      console.log('='.repeat(60));

      const basicPrices = calculateTargetAndStopPrices(
        decision.price,
        decision.confidence,
        decision.action
      );

      console.log(`🎯 Target Price: $${basicPrices.targetPrice.toFixed(4)}`);
      console.log(`🛑 Stop Price: $${basicPrices.stopPrice.toFixed(4)}`);

      const basicGain = Math.abs(basicPrices.targetPrice - decision.price);
      const basicLoss = Math.abs(decision.price - basicPrices.stopPrice);
      const basicRatio = basicGain / basicLoss;

      console.log(`📈 Ganho Potencial: $${basicGain.toFixed(4)} (${((basicGain / decision.price) * 100).toFixed(2)}%)`);
      console.log(`📉 Perda Potencial: $${basicLoss.toFixed(4)} (${((basicLoss / decision.price) * 100).toFixed(2)}%)`);
      console.log(`⚖️ Risk/Reward: ${basicRatio.toFixed(2)}:1`);

      // 4. Método 2: calculateTargetAndStopPricesRealMarket
      console.log('\n' + '='.repeat(60));
      console.log('📊 MÉTODO 2: Real Market Prices (Dinâmico + Volatilidade)');
      console.log('='.repeat(60));

      const volatility = calculateVolatility(klines);
      console.log(`📊 Volatilidade: ${volatility.toFixed(2)}%`);

      const realMarketPrices = calculateTargetAndStopPricesRealMarket(
        decision.price,
        decision.confidence,
        decision.action,
        volatility
      );

      console.log(`🎯 Target Price: $${realMarketPrices.targetPrice.toFixed(4)}`);
      console.log(`🛑 Stop Price: $${realMarketPrices.stopPrice.toFixed(4)}`);

      const realMarketGain = Math.abs(realMarketPrices.targetPrice - decision.price);
      const realMarketLoss = Math.abs(decision.price - realMarketPrices.stopPrice);
      const realMarketRatio = realMarketGain / realMarketLoss;

      console.log(`📈 Ganho Potencial: $${realMarketGain.toFixed(4)} (${((realMarketGain / decision.price) * 100).toFixed(2)}%)`);
      console.log(`📉 Perda Potencial: $${realMarketLoss.toFixed(4)} (${((realMarketLoss / decision.price) * 100).toFixed(2)}%)`);
      console.log(`⚖️ Risk/Reward: ${realMarketRatio.toFixed(2)}:1`);

      // 5. Método 3: calculateTargetAndStopPricesWithLevels
      console.log('\n' + '='.repeat(60));
      console.log('📊 MÉTODO 3: Technical Levels (Suporte/Resistência)');
      console.log('='.repeat(60));

      const levelsPrices = calculateTargetAndStopPricesWithLevels(
        decision.price,
        decision.confidence,
        decision.action,
        klines
      );

      console.log(`🎯 Target Price: $${levelsPrices.targetPrice.toFixed(4)}`);
      console.log(`🛑 Stop Price: $${levelsPrices.stopPrice.toFixed(4)}`);
      console.log(`📊 Suporte: $${levelsPrices.levels.support.toFixed(4)}`);
      console.log(`📊 Resistência: $${levelsPrices.levels.resistance.toFixed(4)}`);

      const levelsGain = Math.abs(levelsPrices.targetPrice - decision.price);
      const levelsLoss = Math.abs(decision.price - levelsPrices.stopPrice);
      const levelsRatio = levelsGain / levelsLoss;

      console.log(`📈 Ganho Potencial: $${levelsGain.toFixed(4)} (${((levelsGain / decision.price) * 100).toFixed(2)}%)`);
      console.log(`📉 Perda Potencial: $${levelsLoss.toFixed(4)} (${((levelsLoss / decision.price) * 100).toFixed(2)}%)`);
      console.log(`⚖️ Risk/Reward: ${levelsRatio.toFixed(2)}:1`);

      // 5. Comparação
      console.log('\n' + '='.repeat(60));
      console.log('🔍 COMPARAÇÃO DOS MÉTODOS');
      console.log('='.repeat(60));

      const targetDiff = Math.abs(realMarketPrices.targetPrice - levelsPrices.targetPrice);
      const stopDiff = Math.abs(realMarketPrices.stopPrice - levelsPrices.stopPrice);

      console.log(`🎯 Diferença Target: $${targetDiff.toFixed(4)} (${((targetDiff / decision.price) * 100).toFixed(2)}%)`);
      console.log(`🛑 Diferença Stop: $${stopDiff.toFixed(4)} (${((stopDiff / decision.price) * 100).toFixed(2)}%)`);
      console.log(`📊 Diferença R/R: ${Math.abs(realMarketRatio - levelsRatio).toFixed(2)}`);

      // Qual método é mais conservador?
      const moreConservativeTarget = decision.action === 'BUY'
        ? (realMarketPrices.targetPrice < levelsPrices.targetPrice ? 'Real Market' : 'Technical Levels')
        : (realMarketPrices.targetPrice > levelsPrices.targetPrice ? 'Real Market' : 'Technical Levels');

      const moreConservativeStop = decision.action === 'BUY'
        ? (realMarketPrices.stopPrice > levelsPrices.stopPrice ? 'Real Market' : 'Technical Levels')
        : (realMarketPrices.stopPrice < levelsPrices.stopPrice ? 'Real Market' : 'Technical Levels');

      console.log(`\n🛡️ Target mais conservador: ${moreConservativeTarget}`);
      console.log(`🛡️ Stop mais conservador: ${moreConservativeStop}`);

      // 6. Salvar os 3 trades no histórico

      // Garantir que a pasta existe
      const tradesDir = path.resolve('./src/storage/trades');

      if (!fs.existsSync(tradesDir)) {
        fs.mkdirSync(tradesDir, { recursive: true });
        console.log(`📁 Pasta criada: ${tradesDir}`);
      }

      try {
        // Trade 0: Basic Method
        const basicTrade = {
          id: 'TEST_BASIC_' + Date.now(),
          timestamp: new Date().toISOString(),
          symbol: decision.symbol,
          action: decision.action,
          price: decision.price,
          entryPrice: decision.price,
          targetPrice: basicPrices.targetPrice,
          stopPrice: basicPrices.stopPrice,
          amount: this.getTradeAmount(),
          confidence: decision.confidence,
          reason: `${decision.reason} (Basic Method)`,
          status: 'pending',
          method: 'Basic',
          riskRewardRatio: basicRatio
        };

        const basicFile = path.join(tradesDir, 'basicTest.json');
        let basicTrades = [];
        if (fs.existsSync(basicFile)) {
          basicTrades = JSON.parse(fs.readFileSync(basicFile, 'utf8'));
        }
        basicTrades.push(basicTrade);
        fs.writeFileSync(basicFile, JSON.stringify(basicTrades, null, 2));
        console.log(`✅ Basic trade salvo em: ${basicFile}`);

        // Trade 1: Real Market Method
        const realMarketTrade = {
          id: 'TEST_REAL_' + Date.now(),
          timestamp: new Date().toISOString(),
          symbol: decision.symbol,
          action: decision.action,
          price: decision.price,
          entryPrice: decision.price,
          targetPrice: realMarketPrices.targetPrice,
          stopPrice: realMarketPrices.stopPrice,
          amount: this.getTradeAmount(),
          confidence: decision.confidence,
          reason: `${decision.reason} (Real Market Method)`,
          status: 'pending',
          method: 'Real Market',
          volatility: volatility,
          riskRewardRatio: realMarketRatio
        };

        const realMarketFile = path.join(tradesDir, 'realMarketTest.json');
        let realMarketTrades = [];
        if (fs.existsSync(realMarketFile)) {
          realMarketTrades = JSON.parse(fs.readFileSync(realMarketFile, 'utf8'));
        }
        realMarketTrades.push(realMarketTrade);
        fs.writeFileSync(realMarketFile, JSON.stringify(realMarketTrades, null, 2));
        console.log(`✅ Real Market trade salvo em: ${realMarketFile}`);

        // Trade 2: Technical Levels Method
        const levelsTrade = {
          id: 'TEST_LEVELS_' + Date.now(),
          timestamp: new Date().toISOString(),
          symbol: decision.symbol,
          action: decision.action,
          price: decision.price,
          entryPrice: decision.price,
          targetPrice: levelsPrices.targetPrice,
          stopPrice: levelsPrices.stopPrice,
          amount: this.getTradeAmount(),
          confidence: decision.confidence,
          reason: `${decision.reason} (Technical Levels Method)`,
          status: 'pending',
          method: 'Technical Levels',
          support: levelsPrices.levels.support,
          resistance: levelsPrices.levels.resistance,
          riskRewardRatio: levelsRatio
        };

        const levelsFile = path.join(tradesDir, 'technicalLevelsTest.json');
        let levelsTrades = [];
        if (fs.existsSync(levelsFile)) {
          levelsTrades = JSON.parse(fs.readFileSync(levelsFile, 'utf8'));
        }
        levelsTrades.push(levelsTrade);
        fs.writeFileSync(levelsFile, JSON.stringify(levelsTrades, null, 2));
        console.log(`✅ Technical Levels trade salvo em: ${levelsFile}`);

        console.log('✅ Todos os 3 trades foram salvos com sucesso!');

      } catch (saveError) {
        console.error('❌ Erro ao salvar trades:', saveError);
      }

      console.log('\n✅ TESTE CONCLUÍDO - Comparação dos 3 métodos realizada e trades salvos!');

    } catch (error) {
      console.error('❌ Erro no teste:', error);
    }
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const testBot = new CalculateTargetTestBot(apiKey, apiSecret);
    await testBot.executeTest();
  }

  logBotStartup(
    'Calculate Target Test Bot',
    '🧪 Teste de comparação entre métodos de cálculo de preços',
    3000,
    true
  ).then(() => main());
}