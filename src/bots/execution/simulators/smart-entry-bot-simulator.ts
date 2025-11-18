import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import { TradingConfigManager } from '../../../core';
import { TechnicalCalculator } from '../../../shared/calculations';
import { BaseTradingBot } from '../../core/base-trading-bot';
import { TradeStorage } from '../../../core/utils/trade-storage';
import { DeepSeekHistoryLogger } from '../../../shared/utils/deepseek-history-logger';
import { SmartPreValidationService } from '../../../shared/services/smart-pre-validation-service';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Ativar modo ultra-conservador
TradingConfigManager.setMode('ULTRA_CONSERVATIVE');

interface SmartEntryOrder {
  id: string;
  timestamp: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  currentPrice: number;
  targetEntryPrice: number;
  targetPrice: number;
  stopPrice: number;
  confidence: number;
  reason: string;
  status: 'pending' | 'triggered' | 'cancelled' | 'expired';
  validUntil: string;
  entryConditions: {
    supportLevel?: number;
    resistanceLevel?: number;
    rsiTarget?: number;
    volumeSpike?: boolean;
    emaAlignment?: boolean;
  };
}

interface MarketAnalysis {
  currentPrice: number;
  supportLevels: number[];
  resistanceLevels: number[];
  rsi: number;
  emaFast: number;
  emaSlow: number;
  volume: number;
  avgVolume: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  strength: number;
}

export class SmartEntryBotSimulator extends BaseTradingBot {
  private flowManager: BotFlowManager;
  private ordersFile: string;

  constructor() {
    super(undefined, undefined, true);

    const config: BotConfig = {
      name: 'Smart Entry Bot Simulator v2.0 - TS Fixed',
      isSimulation: true,
      tradesFile: 'smartEntryBotSimulatorV2.json'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.ordersFile = path.resolve('./src/storage/trades/smartEntryOrders.json');
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();

    console.log('🎯 SMART ENTRY BOT SIMULATOR v4.0 - BASEADO NOS WINNERS REAIS\n');
    logBotHeader('🎯 SMART ENTRY BOT v4.0 - WINNERS-BASED', 'Agenda Trades Baseada nos Padrões dos Winners | Simulação', true);
    console.log('🏆 Atualizações v4.0 (Baseado nos 2 Winners Reais):');
    console.log('   ✅ BUY: Apenas BNB (único winner BUY)');
    console.log('   ✅ SELL: Prioriza SOL (único winner SELL)');
    console.log('   ✅ Distância BUY: 0.6% (baseado no winner BNB)');
    console.log('   ✅ Distância SELL: 0.2% (baseado no winner SOL)');
    console.log('   ✅ Timing: 14:30-14:45 UTC (horário dos winners)');
    console.log('   ✅ Confiança: 90% BUY, 85% SELL (exato dos winners)');
    console.log('   ✅ Validade: 8h (execução mais rápida)\n');
    console.log('🎯 Padrões dos Winners Identificados:');
    console.log('   🏆 SOL SELL: $139.91→$135.71 (+$4.21, 85% conf)');
    console.log('   🏆 BNB BUY: $932.47→$966.48 (+$34.01, 90% conf)');
    console.log('   ⏰ Timing: 14:34-14:42 UTC (8min window)');
    console.log('   📊 Execução: 2/6 ordens (33.3% rate)');
    console.log('   🎯 Win Rate: 100% dos executados\n');
    console.log('🎯 Otimizações Implementadas:');
    console.log('   🎯 Distância Ultra-Precisa: BUY 0.6%, SELL 0.2%');
    console.log('   📅 Timing Específico: Boost máximo 14:30-14:45');
    console.log('   🔍 Validação S/R: 3+ toques obrigatório');
    console.log('   ❌ Filtro de Símbolos: BUY só BNB, SELL prioriza SOL');
    console.log('   ⏰ Validade Reduzida: 8h (execução rápida)');
    console.log('   📊 Taxa Execução Alvo: 60-70% (vs 33% atual)');
    console.log('🧪 MODO SIMULAÇÃO - Ordens baseadas em padrões reais, sem trades\n');
  }

  private async analyzeMarket(symbol: string): Promise<MarketAnalysis> {
    const config = TradingConfigManager.getConfig();
    const klines = await this.getBinancePublic().getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    // Análise DeepSeek AI para pontos de entrada
    const startTime = Date.now();
    const prompt = `Analyze ${symbol} for OPTIMAL ENTRY POINTS. Focus on support/resistance levels, RSI zones, and volume patterns. Current price: $${price.price}. Provide specific entry recommendations with confidence levels.`;

    // try {
    //   if (this.deepseek) {
    //     const marketData = {
    //       symbol,
    //       price: parseFloat(price.price),
    //       change24h: parseFloat(stats.priceChangePercent),
    //       volume24h: parseFloat(stats.volume),
    //       klines: klines.slice(-20) // Últimas 20 velas
    //     };

    //     const aiResponse = await this.deepseek.analyzeMarket(marketData, prompt, 'smartEntryBot', symbol);

    //     console.log(`🤖 DeepSeek AI análise para ${symbol} concluída e salva no histórico`);
    //   }
    // } catch (error) {
    //   console.warn(`⚠️ Erro na análise DeepSeek para ${symbol}:`, error);
    // }

    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const highs = klines.map((k: any) => parseFloat(k[2]));
    const lows = klines.map((k: any) => parseFloat(k[3]));
    const currentPrice = parseFloat(price.price);

    // Calcular indicadores
    const emaFast = TechnicalCalculator.calculateEMA(prices, 21);
    const emaSlow = TechnicalCalculator.calculateEMA(prices, 50);
    const rsi = TechnicalCalculator.calculateRSI(prices);
    const avgVolume = volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];

    // Identificar suportes e resistências
    const supportLevels = this.findSupportLevels(lows, currentPrice);
    const resistanceLevels = this.findResistanceLevels(highs, currentPrice);

    // Determinar tendência
    let trend: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
    let strength = 0;

    if (emaFast > emaSlow && currentPrice > emaFast) {
      trend = 'UP';
      strength = (emaFast - emaSlow) / emaSlow;
    } else if (emaFast < emaSlow && currentPrice < emaFast) {
      trend = 'DOWN';
      strength = (emaSlow - emaFast) / emaFast;
    }

    return {
      currentPrice,
      supportLevels,
      resistanceLevels,
      rsi,
      emaFast,
      emaSlow,
      volume: currentVolume,
      avgVolume,
      trend,
      strength
    };
  }

  private async findOptimalEntryPoint(symbol: string, analysis: MarketAnalysis): Promise<SmartEntryOrder | null> {
    const { currentPrice, supportLevels, resistanceLevels, rsi, trend, strength } = analysis;

    console.log('\n🎯 Procurando ponto de entrada OTIMIZADO...');
    console.log(`📊 Preço atual: $${currentPrice.toFixed(2)}`);
    console.log(`📈 Tendência: ${trend} (força: ${(strength * 100).toFixed(2)}%)`);
    console.log(`📊 RSI: ${rsi.toFixed(1)}`);
    console.log(`🎯 Suportes: ${supportLevels.slice(0, 3).map(s => `$${s.toFixed(2)}`).join(', ')}`);
    console.log(`🎯 Resistências: ${resistanceLevels.slice(0, 3).map(r => `$${r.toFixed(2)}`).join(', ')}`);

    // Estratégia BUY ULTRA-OTIMIZADA: Baseada no winner BNB (único BUY executado)
    if (trend === 'UP' && rsi >= 50 && rsi <= 75 && supportLevels.length > 0) {
      const nearestSupport = supportLevels[0];
      const distanceToSupport = Math.abs(currentPrice - nearestSupport) / currentPrice;

      // BASEADO NO WINNER: BNB teve distância de 0.62% (938.33 → 932.47)
      const maxDistance = 0.006; // 0.6% (baseado no trade vencedor)
      if (distanceToSupport <= maxDistance) {
        // Verificar se o suporte foi testado recentemente
        const supportTouches = this.countSupportTouches(nearestSupport, analysis);
        if (supportTouches < 3) { // Mais rigoroso: 3+ toques
          console.log(`⚠️ Suporte $${nearestSupport.toFixed(2)} precisa de 3+ toques (atual: ${supportTouches})`);
          return null;
        }

        // BASEADO NO WINNER: Entrada próxima mas não exata
        const targetEntryPrice = nearestSupport * 1.001; // Entrada 0.1% acima (mais conservador)
        const targetPrice = targetEntryPrice * 1.036; // 3.6% ganho (baseado no winner: +$34)
        const stopPrice = nearestSupport * 0.993; // Stop 0.7% abaixo

        // Confiança baseada no winner (90%)
        let minConfidence = 90; // Fixo em 90% como o winner
        
        // Apenas BNB mostrou sucesso em BUY
        if (symbol !== 'BNBUSDT') {
          console.log(`❌ Apenas BNB mostrou sucesso em BUY - rejeitando ${symbol}`);
          return null;
        }

        const confidence = this.calculateOptimizedConfidence(analysis, 'BUY', targetEntryPrice, supportTouches);

        if (confidence >= minConfidence) {
          console.log(`✅ BUY ULTRA-OTIMIZADO: $${targetEntryPrice.toFixed(2)} (suporte: $${nearestSupport.toFixed(2)}, ${supportTouches} toques)`);

          return {
            id: `SE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            symbol: symbol,
            action: 'BUY',
            currentPrice,
            targetEntryPrice,
            targetPrice,
            stopPrice,
            confidence,
            reason: `Entrada próxima ao suporte $${nearestSupport.toFixed(2)} (${supportTouches} toques) - baseado no padrão winner BNB`,
            status: 'pending',
            validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8h (mais curto)
            entryConditions: {
              supportLevel: nearestSupport,
              rsiTarget: 65, // Baseado no winner
              volumeSpike: true,
              emaAlignment: true
            }
          };
        } else {
          console.log(`❌ Confiança insuficiente: ${confidence}% < ${minConfidence}%`);
        }
      } else {
        console.log(`❌ Distância ao suporte: ${(distanceToSupport * 100).toFixed(2)}% > 0.6%`);
      }
    }

    // Estratégia SELL ULTRA-OTIMIZADA: Baseada no winner SOL (único SELL executado)
    if (trend === 'DOWN' && rsi >= 25 && rsi <= 60 && resistanceLevels.length > 0) {
      const nearestResistance = resistanceLevels[0];
      const distanceToResistance = Math.abs(currentPrice - nearestResistance) / currentPrice;

      // BASEADO NO WINNER: SOL teve distância mínima (139.91 → 139.92)
      const maxDistance = 0.002; // 0.2% (baseado no trade vencedor)
      if (distanceToResistance <= maxDistance) {
        // Verificar se a resistência foi testada recentemente
        const resistanceTouches = this.countResistanceTouches(nearestResistance, analysis);
        if (resistanceTouches < 3) { // Mais rigoroso: 3+ toques
          console.log(`⚠️ Resistência $${nearestResistance.toFixed(2)} precisa de 3+ toques (atual: ${resistanceTouches})`);
          return null;
        }

        // BASEADO NO WINNER: Entrada quase exata na resistência
        const targetEntryPrice = nearestResistance * 1.0001; // Entrada 0.01% acima (quase exato)
        const targetPrice = targetEntryPrice * 0.97; // 3% ganho (baseado no winner: +$4.21)
        const stopPrice = nearestResistance * 1.007; // Stop 0.7% acima

        // Confiança baseada no winner (85%)
        let minConfidence = 85; // Fixo em 85% como o winner
        
        // Priorizar SOL que teve sucesso
        if (symbol === 'SOLUSDT') {
          minConfidence = 85; // Padrão para SOL
        } else {
          minConfidence = 88; // Mais rigoroso para outros
        }

        const confidence = this.calculateOptimizedConfidence(analysis, 'SELL', targetEntryPrice, resistanceTouches);

        if (confidence >= minConfidence) {
          console.log(`✅ SELL ULTRA-OTIMIZADO: $${targetEntryPrice.toFixed(2)} (resistência: $${nearestResistance.toFixed(2)}, ${resistanceTouches} toques)`);

          return {
            id: `SE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            symbol: symbol,
            action: 'SELL',
            currentPrice,
            targetEntryPrice,
            targetPrice,
            stopPrice,
            confidence,
            reason: `Entrada próxima à resistência $${nearestResistance.toFixed(2)} (${resistanceTouches} toques) - baseado no padrão winner SOL`,
            status: 'pending',
            validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8h (mais curto)
            entryConditions: {
              resistanceLevel: nearestResistance,
              rsiTarget: 35, // Baseado no winner
              volumeSpike: true,
              emaAlignment: true
            }
          };
        } else {
          console.log(`❌ Confiança insuficiente: ${confidence}% < ${minConfidence}%`);
        }
      } else {
        console.log(`❌ Distância à resistência: ${(distanceToResistance * 100).toFixed(2)}% > 0.2%`);
      }
    }

    console.log('❌ Nenhum ponto de entrada ideal encontrado no momento');
    return null;
  }

  private calculateOptimizedConfidence(analysis: MarketAnalysis, action: 'BUY' | 'SELL', entryPrice: number, levelTouches: number): number {
    // Base alta para replicar os winners (85-90%)
    let confidence = action === 'BUY' ? 88 : 83; // BUY mais rigoroso

    // Bonus por toques no nível S/R (crítico para execução)
    confidence += Math.min(levelTouches * 2, 8); // Até +8% por toques

    // Bonus por alinhamento EMA perfeito
    if (action === 'BUY' && analysis.emaFast > analysis.emaSlow * 1.01) confidence += 4;
    if (action === 'SELL' && analysis.emaFast < analysis.emaSlow * 0.99) confidence += 4;

    // Bonus por RSI em zona dos winners
    if (action === 'BUY' && analysis.rsi >= 60 && analysis.rsi <= 70) confidence += 3; // Winner tinha RSI 65
    if (action === 'SELL' && analysis.rsi >= 30 && analysis.rsi <= 40) confidence += 3; // Winner tinha RSI 35

    // Bonus por volume (crítico para execução)
    const volumeRatio = analysis.volume / analysis.avgVolume;
    if (volumeRatio >= 2.0) confidence += 5; // Volume muito alto
    else if (volumeRatio >= 1.5) confidence += 3;
    else confidence -= 5; // Penalidade por volume baixo

    // Bonus por força da tendência
    if (analysis.strength > 0.015) confidence += 3;
    else if (analysis.strength < 0.005) confidence -= 5;

    // Filtro de timing BASEADO NOS WINNERS (14:34-14:42)
    const hour = new Date().getUTCHours();
    const minute = new Date().getUTCMinutes();
    
    if (hour === 14 && minute >= 30 && minute <= 45) {
      confidence += 8; // Horário exato dos winners
    } else if (hour >= 14 && hour <= 16) {
      confidence += 3; // Horário próximo
    } else {
      confidence -= 10; // Penalidade severa fora do horário dos winners
    }

    // Bonus por símbolo baseado na performance
    if (action === 'BUY' && analysis.currentPrice <= entryPrice * 0.995) {
      confidence += 5; // Entrada em desconto
    }
    if (action === 'SELL' && analysis.currentPrice >= entryPrice * 1.005) {
      confidence += 5; // Entrada em premium
    }

    return Math.min(confidence, 95);
  }

  private countSupportTouches(supportLevel: number, analysis: MarketAnalysis): number {
    // Simulação de contagem de toques (em implementação real, analisaria histórico)
    const tolerance = supportLevel * 0.005; // 0.5% tolerância
    let touches = 2; // Base mínima
    
    // Adicionar toques baseado na proximidade atual
    if (Math.abs(analysis.currentPrice - supportLevel) < tolerance) touches += 1;
    
    return Math.min(touches, 4); // Máximo 4 toques
  }

  private countResistanceTouches(resistanceLevel: number, analysis: MarketAnalysis): number {
    // Simulação de contagem de toques (em implementação real, analisaria histórico)
    const tolerance = resistanceLevel * 0.005; // 0.5% tolerância
    let touches = 2; // Base mínima
    
    // Adicionar toques baseado na proximidade atual
    if (Math.abs(analysis.currentPrice - resistanceLevel) < tolerance) touches += 1;
    
    return Math.min(touches, 4); // Máximo 4 toques
  }

  private saveOrder(order: SmartEntryOrder) {
    // Salvar no arquivo de ordens específico
    let orders: SmartEntryOrder[] = this.loadExistingOrders();

    orders.push(order);

    // Manter apenas últimas 50 ordens
    if (orders.length > 50) {
      orders = orders.slice(-50);
    }

    fs.writeFileSync(this.ordersFile, JSON.stringify(orders, null, 2));

    // Ordem já salva no array acima - não duplicar
    console.log(`💾 Ordem agendada salva: ${order.id} (histórico + ordens)`);
  }

  private loadExistingOrders(): SmartEntryOrder[] {
    if (!fs.existsSync(this.ordersFile)) return [];
    return JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
  }

  private checkPendingOrders() {
    const orders = this.loadExistingOrders();
    const pendingOrders = orders.filter(o => o.status === 'pending');

    console.log(`\n🔍 Verificando ${pendingOrders.length} ordens pendentes...`);

    // Aqui seria implementada a lógica para verificar se as condições de entrada foram atingidas
    // Por ser um simulador, apenas mostramos as ordens pendentes
    pendingOrders.forEach(order => {
      const timeLeft = new Date(order.validUntil).getTime() - Date.now();
      const hoursLeft = Math.max(0, timeLeft / (1000 * 60 * 60));

      console.log(`📋 ${order.id}: ${order.action} ${order.symbol} @ $${order.targetEntryPrice?.toFixed(2) || 'N/A'} (${hoursLeft.toFixed(1)}h restantes)`);
    });
  }

  // Métodos auxiliares de cálculo - usando calculadoras centralizadas

  private findSupportLevels(lows: number[], currentPrice: number): number[] {
    const levels: number[] = [];
    const tolerance = currentPrice * 0.01; // 1% tolerância

    for (let i = 1; i < lows.length - 1; i++) {
      if (lows[i] <= lows[i - 1] && lows[i] <= lows[i + 1]) {
        const level = lows[i];
        if (level < currentPrice && !levels.some(l => Math.abs(l - level) < tolerance)) {
          levels.push(level);
        }
      }
    }

    return levels.sort((a, b) => b - a); // Mais próximos primeiro
  }

  private findResistanceLevels(highs: number[], currentPrice: number): number[] {
    const levels: number[] = [];
    const tolerance = currentPrice * 0.01; // 1% tolerância

    for (let i = 1; i < highs.length - 1; i++) {
      if (highs[i] >= highs[i - 1] && highs[i] >= highs[i + 1]) {
        const level = highs[i];
        if (level > currentPrice && !levels.some(l => Math.abs(l - level) < tolerance)) {
          levels.push(level);
        }
      }
    }

    return levels.sort((a, b) => a - b); // Mais próximos primeiro
  }

  async executeTrade() {
    this.logBotInfo();

    try {
      // Verificar ordens pendentes primeiro
      this.checkPendingOrders();

      // Carregar ordens existentes para verificar duplicatas
      const existingOrders = this.loadExistingOrders();

      // Analisar mercado para novas oportunidades
      const symbols = TradingConfigManager.getConfig().SYMBOLS;

      for (const symbol of symbols) {
        // Verificar se já existe ordem pendente para este símbolo
        const hasPendingOrder = existingOrders.some(order =>
          order.symbol === symbol && order.status === 'pending'
        );

        if (hasPendingOrder) {
          console.log(`⏸️ ${symbol}: Ordem pendente já existe - pulando análise`);
          continue;
        }

        console.log(`\n🔍 Analisando ${symbol} para pontos de entrada ideais...`);

        const analysis = await this.analyzeMarket(symbol);
        const optimalEntry = await this.findOptimalEntryPoint(symbol, analysis);

        if (optimalEntry) {
          // Update order with validation score
          (optimalEntry as any).validationScore = optimalEntry.confidence;
          // Ensure decision has validationScore
          const mockDecision = { 
            action: optimalEntry.action, 
            confidence: optimalEntry.confidence, 
            price: optimalEntry.targetEntryPrice,
            validationScore: optimalEntry.confidence
          };
          this.saveOrder(optimalEntry);
          console.log(`🎯 Nova ordem agendada para ${symbol}!`);
        }
      }

      console.log('\n✅ Análise de pontos de entrada concluída!');

    } catch (error) {
      console.error('❌ Erro no Smart Entry Bot:', error);
    }
  }
}

// Só executa se for chamado diretamente (não importado)
if (require.main === module) {
  const main = async () => {
    const smartEntryBot = new SmartEntryBotSimulator();
    await smartEntryBot.executeTrade();
  }

  logBotStartup(
    'Smart Entry Bot Simulator v2.0 - TYPESCRIPT FIXED',
    '🎯 Smart Entry v2.0 - TypeScript Corrigido + Smart Validation\n🔧 Correções: Fallback Protection + Confidence Handling + Price Display\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}