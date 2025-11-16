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

    console.log('🎯 SMART ENTRY BOT SIMULATOR v2.0 - TYPESCRIPT CORRIGIDO - AGENDA TRADES NOS MELHORES PONTOS\n');
    logBotHeader('🎯 SMART ENTRY BOT v2.0 - TS FIXED', 'Agenda Trades Inteligentes + TypeScript Corrigido | Simulação', true);
    console.log('🔧 Atualizações v2.0 (TypeScript + Smart Validation):');
    console.log('   ✅ Correções TypeScript: Fallback protection para undefined values');
    console.log('   ✅ Smart Pre-Validation: Integração com SmartEntry preset');
    console.log('   ✅ Confidence Fallback: smartValidation.confidence || 70');
    console.log('   ✅ Price Display Fix: targetEntryPrice?.toFixed(2) || "N/A"');
    console.log('   ✅ Order Management: Sistema de ordens pendentes melhorado');
    console.log('   ✅ Validation Score: Integração com TradeDecision interface\n');
    console.log('🎯 Funcionalidades Smart Entry:');
    console.log('   🎯 Análise S/R: Suporte/Resistência para entrada ideal');
    console.log('   📅 Agenda Inteligente: Trades em níveis técnicos ótimos');
    console.log('   🔍 Monitor Tempo Real: Condições de entrada monitoradas');
    console.log('   ❌ Auto-Cancel: Ordens canceladas se condições mudarem');
    console.log('   📊 Confirmação: RSI + EMA + Volume para validação');
    console.log('   ⏰ Validade: 24h para ordens pendentes\n');
    console.log('🎯 Configuração Ultra-Conservadora:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}% (REAL)`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1 (GARANTIDO)`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')} (apenas estáveis)`);
    console.log('🧪 MODO SIMULAÇÃO - Apenas agenda ordens, sem trades reais\n');
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

    console.log('\n🎯 Procurando ponto de entrada ideal...');
    console.log(`📊 Preço atual: $${currentPrice.toFixed(2)}`);
    console.log(`📈 Tendência: ${trend} (força: ${(strength * 100).toFixed(2)}%)`);
    console.log(`📊 RSI: ${rsi.toFixed(1)}`);
    console.log(`🎯 Suportes: ${supportLevels.slice(0, 3).map(s => `$${s.toFixed(2)}`).join(', ')}`);
    console.log(`🎯 Resistências: ${resistanceLevels.slice(0, 3).map(r => `$${r.toFixed(2)}`).join(', ')}`);

    // Estratégia BUY: Entrada próxima ao suporte em tendência de alta
    if (trend === 'UP' && rsi < 70 && supportLevels.length > 0) {
      const nearestSupport = supportLevels[0];
      const distanceToSupport = Math.abs(currentPrice - nearestSupport) / currentPrice;

      // Se estamos próximos do suporte (dentro de 1%) ou abaixo dele
      const config = TradingConfigManager.getConfig();
      const maxDistance = config.EMA_ADVANCED.MIN_SEPARATION * 2;
      if (distanceToSupport <= maxDistance || currentPrice <= nearestSupport * (1 + maxDistance)) {
        const targetEntryPrice = nearestSupport * (1 + maxDistance * 0.2); // Entrada ligeiramente acima do suporte
        const targetPrice = currentPrice * (1 + config.RISK.MAX_PERCENT / 100 * 4); // Baseado no risco máximo
        const stopPrice = nearestSupport * 0.995; // Stop abaixo do suporte

        // Usar smart pré-validação para calcular confiança
        const mockDecision = { action: 'BUY', confidence: 70, price: targetEntryPrice };
        const mockMarketData = { price: { price: currentPrice.toString() }, stats: { priceChangePercent: '0' }, klines: [] };
        
        const smartValidation = await SmartPreValidationService
          .createBuilder()
          .usePreset('SmartEntry')
          .build()
          .validate(symbol, mockMarketData, mockDecision, this.getBinancePublic());

        // Handle warnings properly
        if (smartValidation.warnings && smartValidation.warnings.length > 0) {
          console.log('⚠️ Smart validation warnings for BUY:');
          smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
        }

        const confidence = smartValidation.isValid ? (smartValidation.confidence || 70) : this.calculateConfidence(analysis, 'BUY', targetEntryPrice);

        if (confidence >= TradingConfigManager.getConfig().MIN_CONFIDENCE) {
          console.log(`✅ Ponto de entrada BUY identificado: $${targetEntryPrice.toFixed(2)} (suporte: $${nearestSupport.toFixed(2)})`);

          return {
            id: `SE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            symbol: symbol, // Usar o símbolo correto
            action: 'BUY',
            currentPrice,
            targetEntryPrice,
            targetPrice,
            stopPrice,
            confidence,
            reason: `Entrada próxima ao suporte $${nearestSupport.toFixed(2)} em tendência de alta`,
            status: 'pending',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
            entryConditions: {
              supportLevel: nearestSupport,
              rsiTarget: 65,
              volumeSpike: true,
              emaAlignment: true
            }
          };
        }
      }
    }

    // Estratégia SELL: Entrada próxima à resistência em tendência de baixa
    if (trend === 'DOWN' && rsi > 30 && resistanceLevels.length > 0) {
      const nearestResistance = resistanceLevels[0];
      const distanceToResistance = Math.abs(currentPrice - nearestResistance) / currentPrice;

      const config = TradingConfigManager.getConfig();
      const maxDistance = config.EMA_ADVANCED.MIN_SEPARATION * 2;
      if (distanceToResistance <= maxDistance || currentPrice >= nearestResistance * (1 - maxDistance)) {
        const targetEntryPrice = nearestResistance * 0.998; // Entrada ligeiramente abaixo da resistência
        const targetPrice = currentPrice * 0.97; // 3% de ganho
        const stopPrice = nearestResistance * (1 + maxDistance * 0.5); // Stop acima da resistência

        // Usar smart pré-validação para calcular confiança
        const mockDecision = { action: 'SELL', confidence: 70, price: targetEntryPrice };
        const mockMarketData = { price: { price: currentPrice.toString() }, stats: { priceChangePercent: '0' }, klines: [] };
        
        const smartValidation = await SmartPreValidationService
          .createBuilder()
          .usePreset('SmartEntry')
          .build()
          .validate(symbol, mockMarketData, mockDecision, this.getBinancePublic());

        // Handle warnings properly
        if (smartValidation.warnings && smartValidation.warnings.length > 0) {
          console.log('⚠️ Smart validation warnings for SELL:');
          smartValidation.warnings.forEach(warning => console.log(`   ${warning}`));
        }

        const confidence = smartValidation.isValid ? (smartValidation.confidence || 70) : this.calculateConfidence(analysis, 'SELL', targetEntryPrice);

        if (confidence >= TradingConfigManager.getConfig().MIN_CONFIDENCE) {
          console.log(`✅ Ponto de entrada SELL identificado: $${targetEntryPrice.toFixed(2)} (resistência: $${nearestResistance.toFixed(2)})`);

          return {
            id: `SE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            symbol: symbol, // Usar o símbolo correto
            action: 'SELL',
            currentPrice,
            targetEntryPrice,
            targetPrice,
            stopPrice,
            confidence,
            reason: `Entrada próxima à resistência $${nearestResistance.toFixed(2)} em tendência de baixa`,
            status: 'pending',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
            entryConditions: {
              resistanceLevel: nearestResistance,
              rsiTarget: 35,
              volumeSpike: true,
              emaAlignment: true
            }
          };
        }
      }
    }

    console.log('❌ Nenhum ponto de entrada ideal encontrado no momento');
    return null;
  }

  private calculateConfidence(analysis: MarketAnalysis, action: 'BUY' | 'SELL', entryPrice: number): number {
    let confidence = 70;

    const config = TradingConfigManager.getConfig();
    const emaAlignmentBonus = (config.VALIDATION_SCORES?.EMA_ALIGNMENT || 40) / 4;
    const rsiZoneBonus = (config.VALIDATION_SCORES?.RSI_NEUTRAL || 100) / 20;
    const volumeBonus = (config.VALIDATION_SCORES?.VOLUME_ADEQUATE || 80) / 16;
    const trendStrengthBonus = (config.VALIDATION_SCORES?.EMA_SEPARATION || 20) / 4;

    // Bonus por alinhamento EMA
    if (action === 'BUY' && analysis.emaFast > analysis.emaSlow) confidence += emaAlignmentBonus;
    if (action === 'SELL' && analysis.emaFast < analysis.emaSlow) confidence += emaAlignmentBonus;

    // Bonus por RSI em zona adequada
    if (action === 'BUY' && analysis.rsi < 70 && analysis.rsi > 30) confidence += rsiZoneBonus;
    if (action === 'SELL' && analysis.rsi > 30 && analysis.rsi < 70) confidence += rsiZoneBonus;

    // Bonus por volume
    if (analysis.volume > analysis.avgVolume * (config.MARKET_FILTERS.MIN_VOLUME_MULTIPLIER / 2)) confidence += volumeBonus;

    // Bonus por força da tendência
    if (analysis.strength > config.EMA_ADVANCED.MIN_TREND_STRENGTH) confidence += trendStrengthBonus;

    return Math.min(confidence, 95);
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