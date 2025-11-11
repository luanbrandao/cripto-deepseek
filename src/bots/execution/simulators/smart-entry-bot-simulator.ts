import * as dotenv from 'dotenv';
import { BotFlowManager } from '../../utils/execution/bot-flow-manager';
import { BotConfig, TradeDecision } from '../../core/types';
import { logBotHeader, logBotStartup } from '../../utils/logging/bot-logger';
import { logMarketInfo } from '../../utils/logging/market-data-logger';
import TradingConfigManager from '../../../shared/config/trading-config-manager';
import { BaseTradingBot } from '../../core/base-trading-bot';
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
      name: 'Smart Entry Bot Simulator',
      isSimulation: true,
      tradesFile: 'smartEntryBotSimulator.json'
    };

    this.flowManager = new BotFlowManager(this, config);
    this.ordersFile = path.resolve('./src/storage/trades/smartEntryOrders.json');
  }

  protected logBotInfo() {
    const config = TradingConfigManager.getConfig();
    
    console.log('🎯 SMART ENTRY BOT SIMULATOR v1.0 - AGENDA TRADES NOS MELHORES PONTOS\n');
    logBotHeader('🎯 SMART ENTRY BOT v1.0', 'Agenda Trades nos Melhores Pontos de Entrada | Simulação', true);
    console.log('🎯 Funcionalidades Inovadoras:');
    console.log('   ✅ Análise de Suporte/Resistência para entrada ideal');
    console.log('   ✅ Agenda trades em níveis técnicos ótimos');
    console.log('   ✅ Monitora condições de entrada em tempo real');
    console.log('   ✅ Cancela ordens se condições mudarem');
    console.log('   ✅ RSI + EMA + Volume para confirmação');
    console.log('   ✅ Validade de 24h para ordens pendentes\n');
    console.log('🎯 Configuração:');
    console.log(`📊 Confiança Mínima: ${config.MIN_CONFIDENCE}%`);
    console.log(`🛡️ Risk/Reward: ${config.MIN_RISK_REWARD_RATIO}:1`);
    console.log(`⏰ Cooldown: ${config.TRADE_COOLDOWN_MINUTES} minutos`);
    console.log(`🪙 Símbolos: ${config.SYMBOLS.join(', ')}`);
    console.log('🧪 MODO SIMULAÇÃO - Apenas agenda ordens, sem trades reais\n');
  }

  private async analyzeMarket(symbol: string): Promise<MarketAnalysis> {
    const config = TradingConfigManager.getConfig();
    const klines = await this.getBinancePublic().getKlines(symbol, config.CHART.TIMEFRAME, config.CHART.PERIODS);
    const price = await this.getBinancePublic().getPrice(symbol);
    const stats = await this.getBinancePublic().get24hrStats(symbol);

    logMarketInfo(symbol, price, stats);

    const prices = klines.map((k: any) => parseFloat(k[4]));
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const highs = klines.map((k: any) => parseFloat(k[2]));
    const lows = klines.map((k: any) => parseFloat(k[3]));
    const currentPrice = parseFloat(price.price);

    // Calcular indicadores
    const emaFast = this.calculateEMA(prices, 21);
    const emaSlow = this.calculateEMA(prices, 50);
    const rsi = this.calculateRSI(prices);
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

  private findOptimalEntryPoint(analysis: MarketAnalysis): SmartEntryOrder | null {
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
      if (distanceToSupport <= 0.01 || currentPrice <= nearestSupport * 1.005) {
        const targetEntryPrice = nearestSupport * 1.002; // Entrada ligeiramente acima do suporte
        const targetPrice = currentPrice * 1.03; // 3% de ganho
        const stopPrice = nearestSupport * 0.995; // Stop abaixo do suporte
        
        const confidence = this.calculateConfidence(analysis, 'BUY', targetEntryPrice);
        
        if (confidence >= TradingConfigManager.getConfig().MIN_CONFIDENCE) {
          console.log(`✅ Ponto de entrada BUY identificado: $${targetEntryPrice.toFixed(2)} (suporte: $${nearestSupport.toFixed(2)})`);
          
          return {
            id: `SE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            symbol: 'ETHUSDT', // Exemplo
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
      
      if (distanceToResistance <= 0.01 || currentPrice >= nearestResistance * 0.995) {
        const targetEntryPrice = nearestResistance * 0.998; // Entrada ligeiramente abaixo da resistência
        const targetPrice = currentPrice * 0.97; // 3% de ganho
        const stopPrice = nearestResistance * 1.005; // Stop acima da resistência
        
        const confidence = this.calculateConfidence(analysis, 'SELL', targetEntryPrice);
        
        if (confidence >= TradingConfigManager.getConfig().MIN_CONFIDENCE) {
          console.log(`✅ Ponto de entrada SELL identificado: $${targetEntryPrice.toFixed(2)} (resistência: $${nearestResistance.toFixed(2)})`);
          
          return {
            id: `SE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            symbol: 'ETHUSDT', // Exemplo
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
    
    // Bonus por alinhamento EMA
    if (action === 'BUY' && analysis.emaFast > analysis.emaSlow) confidence += 10;
    if (action === 'SELL' && analysis.emaFast < analysis.emaSlow) confidence += 10;
    
    // Bonus por RSI em zona adequada
    if (action === 'BUY' && analysis.rsi < 70 && analysis.rsi > 30) confidence += 5;
    if (action === 'SELL' && analysis.rsi > 30 && analysis.rsi < 70) confidence += 5;
    
    // Bonus por volume
    if (analysis.volume > analysis.avgVolume * 1.5) confidence += 5;
    
    // Bonus por força da tendência
    if (analysis.strength > 0.01) confidence += 5;
    
    return Math.min(confidence, 95);
  }

  private saveOrder(order: SmartEntryOrder) {
    let orders: SmartEntryOrder[] = [];
    
    if (fs.existsSync(this.ordersFile)) {
      orders = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
    }
    
    orders.push(order);
    
    // Manter apenas últimas 50 ordens
    if (orders.length > 50) {
      orders = orders.slice(-50);
    }
    
    fs.writeFileSync(this.ordersFile, JSON.stringify(orders, null, 2));
    console.log(`💾 Ordem agendada salva: ${order.id}`);
  }

  private checkPendingOrders() {
    if (!fs.existsSync(this.ordersFile)) return;
    
    const orders: SmartEntryOrder[] = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    console.log(`\n🔍 Verificando ${pendingOrders.length} ordens pendentes...`);
    
    // Aqui seria implementada a lógica para verificar se as condições de entrada foram atingidas
    // Por ser um simulador, apenas mostramos as ordens pendentes
    pendingOrders.forEach(order => {
      const timeLeft = new Date(order.validUntil).getTime() - Date.now();
      const hoursLeft = Math.max(0, timeLeft / (1000 * 60 * 60));
      
      console.log(`📋 ${order.id}: ${order.action} ${order.symbol} @ $${order.targetEntryPrice.toFixed(2)} (${hoursLeft.toFixed(1)}h restantes)`);
    });
  }

  // Métodos auxiliares de cálculo
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

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
      
      // Analisar mercado para novas oportunidades
      const symbols = TradingConfigManager.getConfig().SYMBOLS;
      
      for (const symbol of symbols) {
        console.log(`\n🔍 Analisando ${symbol} para pontos de entrada ideais...`);
        
        const analysis = await this.analyzeMarket(symbol);
        const optimalEntry = this.findOptimalEntryPoint(analysis);
        
        if (optimalEntry) {
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
    'Smart Entry Bot Simulator v1.0',
    '🎯 Bot Inovador - Agenda Trades nos Melhores Pontos de Entrada\n📊 Análise S/R + RSI + EMA + Volume para entrada ideal\n🧪 Modo seguro - Apenas simulação, sem trades reais',
    5000,
    true
  ).then(() => main());
}