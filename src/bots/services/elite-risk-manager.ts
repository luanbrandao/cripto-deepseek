/**
 * Elite Risk Manager - Gestão de Risco Avançada
 * Calcula preços de entrada/saída baseados em análise técnica elite
 */

export class EliteRiskManager {

  /**
   * Calcula preços elite com múltiplos take profits
   */
  calculateElitePrices(
    entryPrice: number,
    action: 'BUY' | 'SELL',
    riskReward: number,
    klines: any[]
  ) {
    // Calcular volatilidade
    const volatility = this.calculateVolatility(klines);
    
    // Calcular níveis de suporte/resistência
    const levels = this.findKeyLevels(klines, entryPrice);
    
    // Definir stop loss baseado em nível técnico
    const stopLoss = this.calculateTechnicalStopLoss(
      entryPrice, 
      action, 
      levels, 
      volatility
    );
    
    // Calcular múltiplos take profits
    const targets = this.calculateMultipleTargets(
      entryPrice,
      stopLoss,
      action,
      riskReward,
      levels
    );

    return {
      stopLoss,
      target1: targets.target1, // 4:1 mínimo
      target2: targets.target2, // 6:1 target
      target3: targets.target3, // 8:1 extensão
    };
  }

  /**
   * Calcula stop loss técnico baseado em níveis
   */
  private calculateTechnicalStopLoss(
    entryPrice: number,
    action: 'BUY' | 'SELL',
    levels: any,
    volatility: number
  ): number {
    const buffer = entryPrice * (volatility / 100) * 1.5; // Buffer baseado na volatilidade

    if (action === 'BUY') {
      // Para BUY, stop abaixo do suporte mais próximo
      const supportLevel = levels.nearestSupport || entryPrice * 0.97; // Fallback 3%
      return supportLevel - buffer;
    } else {
      // Para SELL, stop acima da resistência mais próxima
      const resistanceLevel = levels.nearestResistance || entryPrice * 1.03; // Fallback 3%
      return resistanceLevel + buffer;
    }
  }

  /**
   * Calcula múltiplos targets baseados em R/R e níveis técnicos
   */
  private calculateMultipleTargets(
    entryPrice: number,
    stopLoss: number,
    action: 'BUY' | 'SELL',
    riskReward: number,
    levels: any
  ) {
    const riskAmount = Math.abs(entryPrice - stopLoss);

    if (action === 'BUY') {
      // Targets para BUY
      const target1 = entryPrice + (riskAmount * 4); // 4:1 mínimo
      const target2 = entryPrice + (riskAmount * riskReward); // R/R configurado
      const target3 = entryPrice + (riskAmount * 8); // 8:1 extensão

      // Ajustar targets para níveis de resistência se próximos
      return {
        target1: this.adjustTargetToLevel(target1, levels.resistanceLevels, 'resistance'),
        target2: this.adjustTargetToLevel(target2, levels.resistanceLevels, 'resistance'),
        target3: this.adjustTargetToLevel(target3, levels.resistanceLevels, 'resistance')
      };
    } else {
      // Targets para SELL
      const target1 = entryPrice - (riskAmount * 4); // 4:1 mínimo
      const target2 = entryPrice - (riskAmount * riskReward); // R/R configurado
      const target3 = entryPrice - (riskAmount * 8); // 8:1 extensão

      // Ajustar targets para níveis de suporte se próximos
      return {
        target1: this.adjustTargetToLevel(target1, levels.supportLevels, 'support'),
        target2: this.adjustTargetToLevel(target2, levels.supportLevels, 'support'),
        target3: this.adjustTargetToLevel(target3, levels.supportLevels, 'support')
      };
    }
  }

  /**
   * Ajusta target para nível técnico próximo
   */
  private adjustTargetToLevel(
    calculatedTarget: number,
    levels: number[],
    type: 'support' | 'resistance'
  ): number {
    if (!levels || levels.length === 0) return calculatedTarget;

    // Encontrar nível mais próximo do target calculado
    const nearestLevel = levels.reduce((nearest, level) => {
      const distanceToLevel = Math.abs(calculatedTarget - level);
      const distanceToNearest = Math.abs(calculatedTarget - nearest);
      return distanceToLevel < distanceToNearest ? level : nearest;
    });

    // Se o nível está muito próximo (dentro de 2%), usar o nível
    const distance = Math.abs(calculatedTarget - nearestLevel) / calculatedTarget;
    if (distance < 0.02) {
      // Adicionar pequeno buffer para evitar rejeição exata no nível
      const buffer = calculatedTarget * 0.001; // 0.1% buffer
      return type === 'resistance' ? nearestLevel - buffer : nearestLevel + buffer;
    }

    return calculatedTarget;
  }

  /**
   * Encontra níveis chave de suporte e resistência
   */
  private findKeyLevels(klines: any[], currentPrice: number) {
    const highs = klines.map(k => parseFloat(k[2]));
    const lows = klines.map(k => parseFloat(k[3]));

    // Encontrar suportes e resistências
    const supportLevels = this.findLevels(lows, 'support');
    const resistanceLevels = this.findLevels(highs, 'resistance');

    // Encontrar níveis mais próximos
    const nearestSupport = this.findNearestLevel(supportLevels, currentPrice, 'below');
    const nearestResistance = this.findNearestLevel(resistanceLevels, currentPrice, 'above');

    return {
      supportLevels,
      resistanceLevels,
      nearestSupport,
      nearestResistance
    };
  }

  /**
   * Identifica níveis de suporte ou resistência
   */
  private findLevels(prices: number[], type: 'support' | 'resistance'): number[] {
    const levels = [];
    const isSupport = type === 'support';

    for (let i = 2; i < prices.length - 2; i++) {
      const current = prices[i];
      const prev2 = prices[i-2];
      const prev1 = prices[i-1];
      const next1 = prices[i+1];
      const next2 = prices[i+2];

      // Verificar se é um extremo local
      const isExtreme = isSupport
        ? (current <= prev2 && current <= prev1 && current <= next1 && current <= next2)
        : (current >= prev2 && current >= prev1 && current >= next1 && current >= next2);

      if (isExtreme) {
        levels.push(current);
      }
    }

    // Remover níveis muito próximos (consolidar)
    return this.consolidateLevels(levels);
  }

  /**
   * Consolida níveis muito próximos
   */
  private consolidateLevels(levels: number[]): number[] {
    if (levels.length === 0) return [];

    const consolidated = [levels[0]];
    const tolerance = 0.02; // 2% tolerance

    for (let i = 1; i < levels.length; i++) {
      const current = levels[i];
      const isClose = consolidated.some(level => 
        Math.abs(current - level) / level < tolerance
      );

      if (!isClose) {
        consolidated.push(current);
      }
    }

    return consolidated.sort((a, b) => a - b);
  }

  /**
   * Encontra nível mais próximo acima ou abaixo do preço atual
   */
  private findNearestLevel(
    levels: number[], 
    currentPrice: number, 
    direction: 'above' | 'below'
  ): number | null {
    const filteredLevels = direction === 'above'
      ? levels.filter(level => level > currentPrice)
      : levels.filter(level => level < currentPrice);

    if (filteredLevels.length === 0) return null;

    return filteredLevels.reduce((nearest, level) => {
      const distanceToLevel = Math.abs(currentPrice - level);
      const distanceToNearest = Math.abs(currentPrice - nearest);
      return distanceToLevel < distanceToNearest ? level : nearest;
    });
  }

  /**
   * Calcula volatilidade baseada nos últimos candles
   */
  private calculateVolatility(klines: any[]): number {
    if (klines.length < 20) return 2.0; // Default 2%

    const closes = klines.slice(-20).map(k => parseFloat(k[4]));
    const returns = [];

    for (let i = 1; i < closes.length; i++) {
      const returnRate = (closes[i] - closes[i-1]) / closes[i-1];
      returns.push(returnRate);
    }

    // Calcular desvio padrão
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Converter para porcentagem e ajustar
    return Math.max(1.0, Math.min(5.0, stdDev * 100 * Math.sqrt(24))); // Anualizado para 24h
  }

  /**
   * Valida se o risk/reward atende aos critérios elite
   */
  validateEliteRiskReward(
    entryPrice: number,
    stopLoss: number,
    target: number,
    minRR: number = 4.0
  ): boolean {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(target - entryPrice);
    const actualRR = reward / risk;

    return actualRR >= minRR;
  }
}