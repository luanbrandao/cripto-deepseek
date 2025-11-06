import { findPivotPoints } from '../bots/utils/analysis/support-resistance-calculator';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

interface SupportResistanceLevel {
  price: number;
  touches: number;
  strength: number;
  type: 'support' | 'resistance';
  isZone: boolean;
  zoneRange?: { min: number; max: number };
}

interface MarketData {
  candles: Candle[];
  currentPrice: number;
}

interface AnalysisResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  suggested_amount: number;
  levels: SupportResistanceLevel[];
}

interface SupportResistanceConfig {
  tolerance?: number;
  minTouches?: number;
  lookbackPeriods?: number;
  simulationOnly?: boolean;
}

export default class SupportResistanceAnalyzer {
  private tolerance: number;
  private minTouches: number;
  private lookbackPeriods: number;

  constructor(config: { tolerance?: number; minTouches?: number; lookbackPeriods?: number } = {}) {
    this.tolerance = config.tolerance || 0.005; // 0.5% tolerance (mais flexível)
    this.minTouches = config.minTouches || 2;
    this.lookbackPeriods = config.lookbackPeriods || 30; // Reduzido para 30
  }

  analyze(marketData: MarketData, isSimulation: boolean = true): AnalysisResult {
    const { candles, currentPrice } = marketData;
    
    console.log(`🔍 Debug: Recebidos ${candles?.length || 0} candles, preço atual: ${currentPrice}`);
    
    // APENAS SIMULAÇÃO - Bloquear trades reais
    if (!isSimulation) {
      console.log('🚫 SUPORTE/RESISTÊNCIA: Apenas simulação permitida - Trade real bloqueado');
      return {
        action: 'HOLD',
        confidence: 0,
        reason: 'Analisador configurado apenas para simulação',
        suggested_amount: 0,
        levels: []
      };
    }
    
    if (!candles || candles.length < 10) {
      return {
        action: 'HOLD',
        confidence: 0,
        reason: `Dados insuficientes: ${candles?.length || 0} candles (mínimo 10)`,
        suggested_amount: 0,
        levels: []
      };
    }
    
    // Usar todos os dados disponíveis se menor que lookbackPeriods
    const actualLookback = Math.min(this.lookbackPeriods, candles.length);
    console.log(`🔍 Debug: Usando ${actualLookback} candles para análise`);

    // Identificar níveis de suporte e resistência
    const levels = this.identifySupportResistanceLevels(candles, actualLookback);
    
    // Identificar níveis psicológicos
    const psychologicalLevels = this.identifyPsychologicalLevels(currentPrice);
    
    // Combinar todos os níveis
    const allLevels = [...levels, ...psychologicalLevels];
    
    // Log dos níveis identificados
    this.logSupportResistanceLevels(allLevels, currentPrice);
    
    // Analisar situação atual
    const analysis = this.analyzeCurrentSituation(currentPrice, allLevels, candles);
    
    return {
      action: analysis.action,
      confidence: analysis.confidence,
      reason: analysis.reason,
      suggested_amount: analysis.confidence / 100,
      levels: allLevels
    };
  }

  private identifySupportResistanceLevels(candles: Candle[], lookbackPeriods?: number): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const actualLookback = lookbackPeriods || this.lookbackPeriods;
    const recentCandles = candles.slice(-actualLookback);
    
    // Identificar máximas e mínimas locais
    const pivots = findPivotPoints(recentCandles);
    
    // Agrupar preços similares
    const priceGroups = this.groupSimilarPrices(pivots);
    
    // Criar níveis baseados nos grupos
    priceGroups.forEach(group => {
      if (group.prices.length >= this.minTouches) {
        const avgPrice = group.prices.reduce((sum, p) => sum + p.price, 0) / group.prices.length;
        const touches = group.prices.length;
        
        // Determinar se é suporte ou resistência baseado no contexto
        const isResistance = group.prices.some(p => p.type === 'high');
        const isSupport = group.prices.some(p => p.type === 'low');
        
        let type: 'support' | 'resistance';
        if (isResistance && isSupport) {
          type = avgPrice > candles[candles.length - 1].close ? 'resistance' : 'support';
        } else {
          type = isResistance ? 'resistance' : 'support';
        }
        
        // Calcular força do nível
        const strength = this.calculateLevelStrength(touches, group.prices);
        
        levels.push({
          price: avgPrice,
          touches,
          strength,
          type,
          isZone: group.prices.length > 3,
          zoneRange: group.prices.length > 3 ? {
            min: Math.min(...group.prices.map(p => p.price)),
            max: Math.max(...group.prices.map(p => p.price))
          } : undefined
        });
      }
    });
    
    return levels.sort((a, b) => b.strength - a.strength);
  }



  private groupSimilarPrices(pivots: Array<{price: number, type: 'high' | 'low', timestamp: number}>): Array<{prices: Array<{price: number, type: 'high' | 'low', timestamp: number}>}> {
    const groups: Array<{prices: Array<{price: number, type: 'high' | 'low', timestamp: number}>}> = [];
    
    pivots.forEach(pivot => {
      let addedToGroup = false;
      
      for (const group of groups) {
        const avgPrice = group.prices.reduce((sum, p) => sum + p.price, 0) / group.prices.length;
        const tolerance = avgPrice * this.tolerance;
        
        if (Math.abs(pivot.price - avgPrice) <= tolerance) {
          group.prices.push(pivot);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push({ prices: [pivot] });
      }
    });
    
    return groups;
  }

  private identifyPsychologicalLevels(currentPrice: number): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const range = currentPrice * 0.1; // 10% range around current price
    
    // Identificar números redondos próximos
    const roundNumbers = [];
    
    // Números redondos baseados na magnitude do preço
    if (currentPrice >= 1000) {
      // Para preços altos, usar centenas
      const base = Math.floor(currentPrice / 100) * 100;
      for (let i = -5; i <= 5; i++) {
        roundNumbers.push(base + (i * 100));
      }
    } else if (currentPrice >= 100) {
      // Para preços médios, usar dezenas
      const base = Math.floor(currentPrice / 10) * 10;
      for (let i = -5; i <= 5; i++) {
        roundNumbers.push(base + (i * 10));
      }
    } else if (currentPrice >= 1) {
      // Para preços baixos, usar unidades
      const base = Math.floor(currentPrice);
      for (let i = -5; i <= 5; i++) {
        roundNumbers.push(base + i);
      }
    } else {
      // Para preços muito baixos, usar décimos
      const base = Math.floor(currentPrice * 10) / 10;
      for (let i = -5; i <= 5; i++) {
        roundNumbers.push(base + (i * 0.1));
      }
    }
    
    roundNumbers.forEach(price => {
      if (price > 0 && Math.abs(price - currentPrice) <= range) {
        levels.push({
          price,
          touches: 1, // Níveis psicológicos têm força inerente
          strength: 0.6, // Força moderada
          type: price > currentPrice ? 'resistance' : 'support',
          isZone: false
        });
      }
    });
    
    return levels;
  }

  private calculateLevelStrength(touches: number, prices: Array<{price: number, type: 'high' | 'low', timestamp: number}>): number {
    let strength = 0;
    
    // Força baseada no número de toques
    strength += Math.min(touches * 0.2, 0.8);
    
    // Força baseada na idade dos toques (mais recente = mais forte)
    const now = Date.now();
    const avgAge = prices.reduce((sum, p) => sum + (now - p.timestamp), 0) / prices.length;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    const ageScore = Math.max(0, 1 - (avgAge / maxAge));
    strength += ageScore * 0.2;
    
    return Math.min(strength, 1);
  }

  private analyzeCurrentSituation(currentPrice: number, levels: SupportResistanceLevel[], candles: Candle[]): {action: 'BUY' | 'SELL' | 'HOLD', confidence: number, reason: string} {
    const tolerance = currentPrice * 0.005; // 0.5% tolerance
    
    // Encontrar níveis próximos
    const nearbyLevels = levels.filter(level => 
      Math.abs(level.price - currentPrice) <= tolerance * 2
    );
    
    if (nearbyLevels.length === 0) {
      return {
        action: 'HOLD',
        confidence: 30,
        reason: 'Preço em área neutra, sem níveis significativos próximos'
      };
    }
    
    // Analisar tendência recente
    const recentCandles = candles.slice(-10);
    const trend = this.analyzeTrend(recentCandles);
    
    // Encontrar o nível mais próximo e forte
    const strongestLevel = nearbyLevels.reduce((prev, current) => 
      current.strength > prev.strength ? current : prev
    );
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    let reason = '';
    
    if (strongestLevel.type === 'support' && currentPrice <= strongestLevel.price + tolerance) {
      if (trend === 'down' || trend === 'sideways') {
        action = 'BUY';
        confidence = Math.min(70 + (strongestLevel.strength * 20), 90);
        reason = `Preço próximo ao suporte forte em $${strongestLevel.price.toFixed(4)} (${strongestLevel.touches} toques)`;
      }
    } else if (strongestLevel.type === 'resistance' && currentPrice >= strongestLevel.price - tolerance) {
      if (trend === 'up' || trend === 'sideways') {
        action = 'SELL';
        confidence = Math.min(70 + (strongestLevel.strength * 20), 90);
        reason = `Preço próximo à resistência forte em $${strongestLevel.price.toFixed(4)} (${strongestLevel.touches} toques)`;
      }
    }
    
    // Verificar rompimentos
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    
    for (const level of levels.slice(0, 3)) { // Top 3 strongest levels
      if (level.type === 'resistance' && 
          prevCandle.close <= level.price && 
          lastCandle.close > level.price) {
        action = 'BUY';
        confidence = Math.min(75 + (level.strength * 15), 85);
        reason = `Rompimento de resistência em $${level.price.toFixed(4)} - sinal de alta`;
        break;
      } else if (level.type === 'support' && 
                 prevCandle.close >= level.price && 
                 lastCandle.close < level.price) {
        action = 'SELL';
        confidence = Math.min(75 + (level.strength * 15), 85);
        reason = `Rompimento de suporte em $${level.price.toFixed(4)} - sinal de baixa`;
        break;
      }
    }
    
    return { action, confidence, reason };
  }

  private analyzeTrend(candles: Candle[]): 'up' | 'down' | 'sideways' {
    if (candles.length < 3) return 'sideways';
    
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const change = (last - first) / first;
    
    if (change > 0.02) return 'up';
    if (change < -0.02) return 'down';
    return 'sideways';
  }

  private logSupportResistanceLevels(levels: SupportResistanceLevel[], currentPrice: number): void {
    if (levels.length === 0) {
      console.log('📊 Nenhum nível de suporte/resistência identificado');
      return;
    }

    console.log('\n📊 NÍVEIS DE SUPORTE E RESISTÊNCIA:');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`💰 Preço Atual: $${currentPrice.toFixed(4)}`);
    console.log('────────────────────────────────────────────────────────────');
    
    // Separar suportes e resistências
    const supports = levels.filter(l => l.type === 'support').sort((a, b) => b.price - a.price);
    const resistances = levels.filter(l => l.type === 'resistance').sort((a, b) => a.price - b.price);
    
    // Mostrar resistências (acima do preço atual)
    if (resistances.length > 0) {
      console.log('🔴 RESISTÊNCIAS:');
      resistances.slice(0, 3).forEach((level, index) => {
        const distance = ((level.price - currentPrice) / currentPrice * 100).toFixed(2);
        const strengthBar = '█'.repeat(Math.round(level.strength * 10));
        const zoneInfo = level.isZone ? ` [Zona: $${level.zoneRange?.min.toFixed(4)}-$${level.zoneRange?.max.toFixed(4)}]` : '';
        console.log(`   ${index + 1}. $${level.price.toFixed(4)} (+${distance}%) | ${level.touches} toques | ${strengthBar} ${(level.strength * 100).toFixed(0)}%${zoneInfo}`);
      });
    }
    
    console.log('────────────────────────────────────────────────────────────');
    
    // Mostrar suportes (abaixo do preço atual)
    if (supports.length > 0) {
      console.log('🟢 SUPORTES:');
      supports.slice(0, 3).forEach((level, index) => {
        const distance = ((currentPrice - level.price) / currentPrice * 100).toFixed(2);
        const strengthBar = '█'.repeat(Math.round(level.strength * 10));
        const zoneInfo = level.isZone ? ` [Zona: $${level.zoneRange?.min.toFixed(4)}-$${level.zoneRange?.max.toFixed(4)}]` : '';
        console.log(`   ${index + 1}. $${level.price.toFixed(4)} (-${distance}%) | ${level.touches} toques | ${strengthBar} ${(level.strength * 100).toFixed(0)}%${zoneInfo}`);
      });
    }
    
    console.log('════════════════════════════════════════════════════════════\n');
  }
}