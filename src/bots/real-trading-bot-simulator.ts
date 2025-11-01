import { BaseTradingBot } from './base-trading-bot';
import { TradeStorage, Trade } from '../storage/trade-storage';
import { TradeDecision, validateTrade, calculateRiskReward } from './utils/trade-validators';
import { validateBinanceKeys } from './utils/env-validator';
import { logBotHeader, logBotStartup } from './utils/bot-logger';
import { handleBotError } from './utils/bot-executor';
import { checkActiveSimulationTradesLimit } from './utils/simulation-limit-checker';
import { getMarketData } from './utils/market-data-fetcher';
import { TRADING_CONFIG } from './config/trading-config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

interface SymbolAnalysis {
  symbol: string;
  decision: TradeDecision;
  score: number;
}

export class RealTradingBotSimulator extends BaseTradingBot {
  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret, true);
  }

  protected logBotInfo() {
    logBotHeader('REAL TRADING BOT SIMULATOR', 'Simulação do Real Trading Bot Multi-Moeda');
    console.log('🚀 NÃO EXECUTA TRADE REAIS\n');
  }

  private async parseDeepSeekAnalysis(analysis: string, symbol: string, price: number): Promise<TradeDecision> {
    const analysisLower = analysis.toLowerCase();

    if (analysisLower.includes('buy') || analysisLower.includes('bullish') ||
      analysisLower.includes('uptrend') || analysisLower.includes('breakout above')) {
      return {
        action: 'BUY',
        confidence: 75,
        reason: 'DeepSeek AI sugere compra baseado na análise técnica',
        symbol,
        price
      };
    }

    if (analysisLower.includes('sell') || analysisLower.includes('bearish') ||
      analysisLower.includes('downtrend') || analysisLower.includes('break below')) {
      return {
        action: 'SELL',
        confidence: 70,
        reason: 'DeepSeek AI sugere venda baseado na análise técnica',
        symbol,
        price
      };
    }

    return {
      action: 'HOLD',
      confidence: 50,
      reason: 'DeepSeek AI sugere aguardar - mercado indefinido',
      symbol,
      price
    };
  }

  private async executeTradeDecision(decision: TradeDecision) {
    console.log(`\n🤖 Decisão AI: ${decision.action} ${decision.symbol}`);
    console.log(`📊 Confiança: ${decision.confidence}%`);
    console.log(`💭 Razão: ${decision.reason}`);

    if (decision.action === 'HOLD') {
      console.log('⏸️ Nenhuma ação executada - aguardando melhor oportunidade');
      return null;
    }

    try {
      const accountInfo = await this.binancePrivate.getAccountInfo();
      console.log('✅ Conta verificada - executando trade simulado');

      console.log('🚨 MODO SIMULAÇÃO - Ordem não executada na exchange');
      console.log(`📝 Ordem simulada: ${decision.action} ${decision.symbol} @ $${decision.price}`);

      return {
        orderId: 'SIMULATED_' + Date.now(),
        symbol: decision.symbol,
        side: decision.action,
        price: decision.price,
        status: 'SIMULATED'
      };

    } catch (error) {
      console.error('❌ Erro ao executar trade:', error);
      return null;
    }
  }

  private async analyzeBestSymbol(symbols: string[]): Promise<SymbolAnalysis | null> {
    console.log(`\n🔍 Analisando ${symbols.length} moedas para encontrar a melhor oportunidade...`);

    const analyses: SymbolAnalysis[] = [];

    for (const symbol of symbols) {
      try {
        console.log(`\n📊 Analisando ${symbol}...`);
        const { price, stats } = await getMarketData(this.binancePublic, symbol);

        const analysis = await this.deepseek!.analyzeMarket(
          { price, stats },
          `Analyze ${symbol} market data and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning.`
        );

        const decision = await this.parseDeepSeekAnalysis(analysis, symbol, parseFloat(price.price));

        let score = 0;
        if (decision.action === 'BUY' || decision.action === 'SELL') {
          score = decision.confidence;
        }

        analyses.push({ symbol, decision, score });
        console.log(`   ${symbol}: ${decision.action} (${decision.confidence}% confiança, score: ${score})`);

      } catch (error) {
        console.log(`   ❌ Erro ao analisar ${symbol}:`, error);
      }
    }

    console.log('\n📋 RESUMO DAS ANÁLISES:');
    console.log('═'.repeat(60));
    analyses.forEach(analysis => {
      const emoji = analysis.decision.action === 'BUY' ? '🟢' : analysis.decision.action === 'SELL' ? '🔴' : '⚪';
      console.log(`${emoji} ${analysis.symbol.padEnd(10)} | ${analysis.decision.action.padEnd(4)} | ${analysis.decision.confidence}% | ${analysis.decision.reason}`);
    });
    console.log('═'.repeat(60));

    const validAnalyses = analyses.filter(a => a.decision.action !== 'HOLD');
    const bestAnalysis = validAnalyses.sort((a, b) => b.score - a.score)[0];

    if (bestAnalysis) {
      console.log('\n🏆 DECISÃO FINAL:');
      console.log(`🎯 VENCEDORA: ${bestAnalysis.symbol} (${bestAnalysis.decision.action})`);
      console.log(`📊 Confiança: ${bestAnalysis.score}%`);
      console.log(`💡 Motivo da escolha: Maior confiança entre ${validAnalyses.length} oportunidades válidas`);

      if (validAnalyses.length > 1) {
        const secondBest = validAnalyses[1];
        console.log(`📈 Segunda opção: ${secondBest.symbol} (${secondBest.score}% confiança)`);
        console.log(`⚡ Vantagem: +${(bestAnalysis.score - secondBest.score).toFixed(1)}% de confiança`);
      }

      return bestAnalysis;
    }

    console.log('\n⏸️ RESULTADO: Nenhuma oportunidade encontrada');
    console.log('📊 Todas as moedas estão em HOLD - aguardando melhores condições');
    return null;
  }

  async executeTrade() {
    this.logBotInfo();

    const tradesFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);
    if (!checkActiveSimulationTradesLimit(tradesFile)) {
      return null;
    }

    console.log('🚀 Iniciando Multi-Symbol Trading Bot com DeepSeek AI');

    try {
      const symbols = this.getSymbols();
      const bestAnalysis = await this.analyzeBestSymbol(symbols);

      if (!bestAnalysis) {
        console.log('\n⏸️ Nenhuma oportunidade de trade encontrada');
        return null;
      }

      const decision = bestAnalysis.decision;

      const { riskPercent, rewardPercent } = calculateRiskReward(decision.confidence);

      if (!validateTrade(decision, riskPercent, rewardPercent)) {
        console.log('❌ Simulação cancelada - Validações falharam');
        return null;
      }

      const orderResult = await this.executeTradeDecision(decision);

      const trade: Trade = {
        timestamp: new Date().toISOString(),
        symbol: decision.symbol,
        action: decision.action,
        price: decision.price,
        entryPrice: decision.price,
        targetPrice: decision.action === 'BUY' ? decision.price * 1.02 : decision.price * 0.98,
        stopPrice: decision.action === 'BUY' ? decision.price * 0.99 : decision.price * 1.01,
        amount: orderResult ? this.getTradeAmount() : 0,
        balance: TRADING_CONFIG.SIMULATION.INITIAL_BALANCE,
        crypto: 0,
        reason: `${decision.reason} (Melhor entre ${this.getSymbols().length} moedas analisadas)`,
        confidence: decision.confidence,
        status: orderResult ? 'pending' : 'completed',
        riskReturn: {
          potentialGain: decision.price * 0.02,
          potentialLoss: decision.price * 0.01,
          riskRewardRatio: 2.0
        }
      };

      if (orderResult) {
        trade.result = 'win';
        trade.exitPrice = decision.price;
        trade.actualReturn = 0;
      }

      const saveFile = path.join(__dirname, `trades/${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);
      TradeStorage.saveTrades([trade], saveFile);
      console.log(`\n💾 Trade salvo no histórico: ${TRADING_CONFIG.FILES.REAL_BOT_SIMULATOR}`);

      console.log('\n✅ Execução completa do Trading Bot');
      return orderResult;

    } catch (error) {
      return handleBotError('Real Trading Bot Simulator', error);
    }
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  async function main() {
    const keys = validateBinanceKeys();
    if (!keys) return;

    const { apiKey, apiSecret } = keys;
    const simulator = new RealTradingBotSimulator(apiKey, apiSecret);
    await simulator.executeTrade();
  }

  logBotStartup(
    'Real Trading Bot Simulator',
    '🧪 Simulação do Real Trading Bot com múltiplas moedas + DeepSeek AI'
  ).then(() => main());
}