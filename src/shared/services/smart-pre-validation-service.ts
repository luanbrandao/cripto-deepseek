interface ValidationLayer {
  name: string;
  weight: number;
  validator: (data: any) => { isValid: boolean; score: number; reason: string };
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  maxScore: number;
  totalScore: number;
  reasons: string[];
  warnings: string[];
  confidence?: number;
  riskLevel?: string;
  activeLayers: string[];
  layerScores: { [key: string]: number };
}

export class SmartPreValidationBuilder {
  private layers: ValidationLayer[] = [];
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  withEma(fastPeriod: number = 12, slowPeriod: number = 26, weight: number = 20): SmartPreValidationBuilder {
    this.layers.push({
      name: 'EMA',
      weight,
      validator: (data) => this.validateEMA(data, fastPeriod, slowPeriod)
    });
    return this;
  }

  withRSI(period: number = 14, weight: number = 15): SmartPreValidationBuilder {
    this.layers.push({
      name: 'RSI',
      weight,
      validator: (data) => this.validateRSI(data, period)
    });
    return this;
  }

  withVolume(multiplier: number = 1.2, weight: number = 15): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Volume',
      weight,
      validator: (data) => this.validateVolume(data, multiplier)
    });
    return this;
  }

  withSupportResistance(tolerance: number = 0.01, weight: number = 20): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Support/Resistance',
      weight,
      validator: (data) => this.validateSupportResistance(data, tolerance)
    });
    return this;
  }

  withMomentum(minMomentum: number = 0.01, weight: number = 10): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Momentum',
      weight,
      validator: (data) => this.validateMomentum(data, minMomentum)
    });
    return this;
  }

  withVolatility(minVol: number = 0.5, maxVol: number = 5.0, weight: number = 10): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Volatility',
      weight,
      validator: (data) => this.validateVolatility(data, minVol, maxVol)
    });
    return this;
  }

  withConfidence(minConfidence: number = 70, weight: number = 10): SmartPreValidationBuilder {
    this.layers.push({
      name: 'Confidence',
      weight,
      validator: (data) => this.validateConfidence(data, minConfidence)
    });
    return this;
  }

  validate(): ValidationResult {
    if (this.layers.length === 0) {
      return {
        isValid: false,
        score: 0,
        maxScore: 0,
        totalScore: 0,
        reasons: [],
        warnings: ['Nenhuma camada de validação configurada'],
        activeLayers: [],
        layerScores: {}
      };
    }

    let totalScore = 0;
    let maxScore = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    const activeLayers: string[] = [];
    const layerScores: { [key: string]: number } = {};

    console.log(`🔍 Executando ${this.layers.length} camadas de validação...`);

    for (const layer of this.layers) {
      try {
        const result = layer.validator(this.data);
        const layerScore = (result.score / 100) * layer.weight;
        
        totalScore += layerScore;
        maxScore += layer.weight;
        layerScores[layer.name.toLowerCase().replace(/[^a-z]/g, '')] = layerScore;

        if (result.isValid) {
          reasons.push(`✅ ${layer.name}: ${result.reason} (${layerScore.toFixed(1)}/${layer.weight})`);
          activeLayers.push(layer.name);
        } else {
          warnings.push(`❌ ${layer.name}: ${result.reason} (${layerScore.toFixed(1)}/${layer.weight})`);
        }

        console.log(`   ${layer.name}: ${layerScore.toFixed(1)}/${layer.weight} - ${result.reason}`);
      } catch (error) {
        warnings.push(`⚠️ ${layer.name}: Erro na validação - ${error}`);
        console.log(`   ❌ ${layer.name}: Erro - ${error}`);
      }
    }

    const scorePercentage = (totalScore / maxScore) * 100;
    const isValid = scorePercentage >= 60; // 60% mínimo para aprovação

    // Calcular confiança e nível de risco baseado no score
    const confidence = Math.min(95, Math.max(50, scorePercentage));
    let riskLevel = 'HIGH';
    if (scorePercentage >= 80) riskLevel = 'LOW';
    else if (scorePercentage >= 65) riskLevel = 'MEDIUM';

    return {
      isValid,
      score: Math.round(totalScore),
      maxScore,
      totalScore: Math.round(totalScore),
      reasons,
      warnings,
      confidence: Math.round(confidence),
      riskLevel,
      activeLayers,
      layerScores
    };
  }

  // Validadores específicos
  private validateEMA(data: any, fastPeriod: number, slowPeriod: number) {
    const { marketData } = data;
    
    if (!marketData?.price24h || marketData.price24h.length < slowPeriod) {
      return { isValid: false, score: 0, reason: 'Dados insuficientes para EMA' };
    }

    const prices = marketData.price24h;
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    const currentPrice = marketData.currentPrice || prices[prices.length - 1];

    let score = 0;
    const details = [];

    // Alinhamento bullish
    if (emaFast > emaSlow) {
      score += 40;
      details.push('EMA rápida > lenta');
    }

    // Preço acima das EMAs
    if (currentPrice > emaFast && currentPrice > emaSlow) {
      score += 40;
      details.push('Preço > EMAs');
    }

    // Separação adequada
    const separation = Math.abs(emaFast - emaSlow) / emaSlow;
    if (separation > 0.005) {
      score += 20;
      details.push('Separação adequada');
    }

    return {
      isValid: score >= 60,
      score,
      reason: details.join(', ') || 'Condições EMA desfavoráveis'
    };
  }

  private validateRSI(data: any, period: number) {
    const { marketData } = data;
    
    if (!marketData?.price24h || marketData.price24h.length < period + 1) {
      return { isValid: false, score: 0, reason: 'Dados insuficientes para RSI' };
    }

    const rsi = this.calculateRSI(marketData.price24h, period);
    let score = 0;
    let reason = '';

    if (rsi >= 25 && rsi <= 75) {
      score = 100;
      reason = `RSI em zona neutra (${rsi.toFixed(1)})`;
    } else if (rsi < 25) {
      score = 80;
      reason = `RSI oversold (${rsi.toFixed(1)}) - oportunidade`;
    } else {
      score = 20;
      reason = `RSI overbought (${rsi.toFixed(1)}) - risco alto`;
    }

    return {
      isValid: score >= 60,
      score,
      reason
    };
  }

  private validateVolume(data: any, multiplier: number) {
    const { marketData } = data;
    
    if (!marketData?.volumes || marketData.volumes.length < 20) {
      return { isValid: false, score: 0, reason: 'Dados de volume insuficientes' };
    }

    const volumes = marketData.volumes;
    const recentVolume = volumes.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
    const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
    const volumeRatio = recentVolume / avgVolume;

    let score = 0;
    let reason = '';

    if (volumeRatio >= multiplier * 1.5) {
      score = 100;
      reason = `Volume muito alto (${volumeRatio.toFixed(1)}x)`;
    } else if (volumeRatio >= multiplier) {
      score = 80;
      reason = `Volume adequado (${volumeRatio.toFixed(1)}x)`;
    } else {
      score = 40;
      reason = `Volume baixo (${volumeRatio.toFixed(1)}x)`;
    }

    return {
      isValid: score >= 60,
      score,
      reason
    };
  }

  private validateSupportResistance(data: any, tolerance: number) {
    const { marketData, levels } = data;
    
    if (!levels || levels.length === 0) {
      return { isValid: false, score: 50, reason: 'Nenhum nível S/R detectado' };
    }

    const currentPrice = marketData?.currentPrice || marketData?.price?.price;
    if (!currentPrice) {
      return { isValid: false, score: 0, reason: 'Preço atual não disponível' };
    }

    let score = 0;
    let bestLevel = null;
    let minDistance = Infinity;

    for (const level of levels) {
      const distance = Math.abs(currentPrice - level.price) / currentPrice;
      if (distance < minDistance) {
        minDistance = distance;
        bestLevel = level;
      }
    }

    if (bestLevel) {
      const distancePercent = (minDistance * 100).toFixed(2);
      
      if (minDistance <= tolerance / 2) {
        score = 100;
      } else if (minDistance <= tolerance) {
        score = 80;
      } else if (minDistance <= tolerance * 2) {
        score = 60;
      } else {
        score = 30;
      }

      const reason = `Nível ${bestLevel.type} a ${distancePercent}% (${bestLevel.touches} toques)`;
      return { isValid: score >= 60, score, reason };
    }

    return { isValid: false, score: 0, reason: 'Nenhum nível S/R próximo' };
  }

  private validateMomentum(data: any, minMomentum: number) {
    const { marketData } = data;
    
    if (!marketData?.stats?.priceChangePercent) {
      return { isValid: false, score: 50, reason: 'Dados de momentum indisponíveis' };
    }

    const priceChange = Math.abs(parseFloat(marketData.stats.priceChangePercent)) / 100;
    let score = 0;
    let reason = '';

    if (priceChange >= minMomentum * 2) {
      score = 100;
      reason = `Momentum forte (${(priceChange * 100).toFixed(2)}%)`;
    } else if (priceChange >= minMomentum) {
      score = 80;
      reason = `Momentum adequado (${(priceChange * 100).toFixed(2)}%)`;
    } else {
      score = 40;
      reason = `Momentum baixo (${(priceChange * 100).toFixed(2)}%)`;
    }

    return {
      isValid: score >= 60,
      score,
      reason
    };
  }

  private validateVolatility(data: any, minVol: number, maxVol: number) {
    const { marketData } = data;
    
    if (!marketData?.price24h || marketData.price24h.length < 20) {
      return { isValid: false, score: 50, reason: 'Dados insuficientes para volatilidade' };
    }

    const volatility = this.calculateVolatility(marketData.price24h);
    let score = 0;
    let reason = '';

    if (volatility >= minVol && volatility <= maxVol) {
      score = 100;
      reason = `Volatilidade ideal (${volatility.toFixed(1)}%)`;
    } else if (volatility < minVol) {
      score = 60;
      reason = `Volatilidade baixa (${volatility.toFixed(1)}%)`;
    } else {
      score = 40;
      reason = `Volatilidade alta (${volatility.toFixed(1)}%)`;
    }

    return {
      isValid: score >= 60,
      score,
      reason
    };
  }

  private validateConfidence(data: any, minConfidence: number) {
    const { decision } = data;
    
    if (!decision?.confidence) {
      return { isValid: false, score: 0, reason: 'Confiança não disponível' };
    }

    const confidence = decision.confidence;
    let score = 0;
    let reason = '';

    if (confidence >= minConfidence + 20) {
      score = 100;
      reason = `Confiança muito alta (${confidence}%)`;
    } else if (confidence >= minConfidence + 10) {
      score = 80;
      reason = `Confiança alta (${confidence}%)`;
    } else if (confidence >= minConfidence) {
      score = 60;
      reason = `Confiança adequada (${confidence}%)`;
    } else {
      score = 20;
      reason = `Confiança baixa (${confidence}%)`;
    }

    return {
      isValid: score >= 60,
      score,
      reason
    };
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

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const returnRate = (prices[i] - prices[i - 1]) / prices[i - 1];
      if (!isNaN(returnRate) && isFinite(returnRate)) {
        returns.push(returnRate);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * 100;
  }
}

export class SmartPreValidationService {
  static createBuilder(): SmartPreValidationServiceBuilder {
    return new SmartPreValidationServiceBuilder();
  }

  static create(data: any): SmartPreValidationBuilder {
    return new SmartPreValidationBuilder(data);
  }

  // Presets comuns
  static forEmaBot(data: any): ValidationResult {
    return this.create(data)
      .withEma(12, 26, 25)
      .withRSI(14, 20)
      .withVolume(1.2, 20)
      .withMomentum(15)
      .withVolatility(1, 5, 10)
      .withConfidence(70, 10)
      .validate();
  }

  static forSmartBot(data: any): ValidationResult {
    return this.create(data)
      .withEma(12, 26, 20)
      .withRSI(14, 15)
      .withVolume(1.5, 15)
      .withSupportResistance(0.01, 20)
      .withMomentum(15)
      .withConfidence(75, 15)
      .validate();
  }

  static forUltraConservative(data: any): ValidationResult {
    return this.create(data)
      .withEma(12, 26, 20)
      .withRSI(14, 15)
      .withVolume(1.8, 15)
      .withSupportResistance(0.005, 20)
      .withMomentum(10)
      .withVolatility(0.5, 3, 10)
      .withConfidence(85, 10)
      .validate();
  }

  static forSimulation(data: any): ValidationResult {
    return this.create(data)
      .withEma(12, 26, 20)
      .withRSI(14, 15)
      .withVolume(1.2, 15)
      .withMomentum(15)
      .withConfidence(70, 15)
      .withVolatility(1, 4, 20)
      .validate();
  }
}

export class SmartPreValidationServiceBuilder {
  private layers: ValidationLayer[] = [];

  withEma(fastPeriod: number = 12, slowPeriod: number = 26, weight: number = 20): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'EMA',
      weight,
      validator: (data) => this.validateEMA(data, fastPeriod, slowPeriod)
    });
    return this;
  }

  withRSI(period: number = 14, weight: number = 15): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'RSI',
      weight,
      validator: (data) => this.validateRSI(data, period)
    });
    return this;
  }

  withVolume(multiplier: number = 1.2, weight: number = 15): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Volume',
      weight,
      validator: (data) => this.validateVolume(data, multiplier)
    });
    return this;
  }

  withSupportResistance(tolerance: number = 0.01, weight: number = 20): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Support/Resistance',
      weight,
      validator: (data) => this.validateSupportResistance(data, tolerance)
    });
    return this;
  }

  withMomentum(minMomentum: number = 0.01, weight: number = 10): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Momentum',
      weight,
      validator: (data) => this.validateMomentum(data, minMomentum)
    });
    return this;
  }

  withVolatility(minVol: number = 0.5, maxVol: number = 5.0, weight: number = 10): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Volatility',
      weight,
      validator: (data) => this.validateVolatility(data, minVol, maxVol)
    });
    return this;
  }

  withConfidence(minConfidence: number = 70, weight: number = 10): SmartPreValidationServiceBuilder {
    this.layers.push({
      name: 'Confidence',
      weight,
      validator: (data) => this.validateConfidence(data, minConfidence)
    });
    return this;
  }

  usePreset(preset: string): SmartPreValidationServiceBuilder {
    switch (preset) {
      case 'EmaBot':
        return this.withEma(12, 26, 25).withRSI(14, 20).withVolume(1.2, 20).withMomentum(0.01, 15).withVolatility(1, 5, 10).withConfidence(70, 10);
      case 'SmartBot':
        return this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.5, 15).withSupportResistance(0.01, 20).withMomentum(0.01, 15).withConfidence(75, 15);
      case 'RealBot':
        return this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.3, 15).withMomentum(0.01, 15).withConfidence(70, 15).withVolatility(1, 4, 20);
      case 'UltraConservative':
        return this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.8, 15).withSupportResistance(0.005, 20).withMomentum(0.02, 10).withVolatility(0.5, 3, 10).withConfidence(85, 10);
      case 'Simulation':
        return this.withEma(12, 26, 20).withRSI(14, 15).withVolume(1.2, 15).withMomentum(0.01, 15).withConfidence(70, 15).withVolatility(1, 4, 20);
      case 'SmartEntry':
        return this.withEma(21, 50, 25).withRSI(14, 20).withVolume(1.5, 20).withSupportResistance(0.01, 25).withConfidence(70, 10);
      default:
        return this;
    }
  }

  build(): SmartPreValidationValidator {
    return new SmartPreValidationValidator(this.layers);
  }

  // Validadores (copiados da classe anterior)
  private validateEMA(data: any, fastPeriod: number, slowPeriod: number) {
    const { marketData } = data;
    
    if (!marketData?.klines || marketData.klines.length < slowPeriod) {
      return { isValid: false, score: 0, reason: 'Dados insuficientes para EMA' };
    }

    const prices = marketData.klines.map((k: any) => parseFloat(k[4]));
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    const currentPrice = parseFloat(marketData.price?.price || prices[prices.length - 1]);

    let score = 0;
    const details = [];

    if (emaFast > emaSlow) {
      score += 40;
      details.push('EMA rápida > lenta');
    }

    if (currentPrice > emaFast && currentPrice > emaSlow) {
      score += 40;
      details.push('Preço > EMAs');
    }

    const separation = Math.abs(emaFast - emaSlow) / emaSlow;
    if (separation > 0.005) {
      score += 20;
      details.push('Separação adequada');
    }

    return {
      isValid: score >= 60,
      score,
      reason: details.join(', ') || 'Condições EMA desfavoráveis'
    };
  }

  private validateRSI(data: any, period: number) {
    const { marketData } = data;
    
    if (!marketData?.klines || marketData.klines.length < period + 1) {
      return { isValid: false, score: 0, reason: 'Dados insuficientes para RSI' };
    }

    const prices = marketData.klines.map((k: any) => parseFloat(k[4]));
    const rsi = this.calculateRSI(prices, period);
    let score = 0;
    let reason = '';

    if (rsi >= 25 && rsi <= 75) {
      score = 100;
      reason = `RSI em zona neutra (${rsi.toFixed(1)})`;
    } else if (rsi < 25) {
      score = 80;
      reason = `RSI oversold (${rsi.toFixed(1)}) - oportunidade`;
    } else {
      score = 20;
      reason = `RSI overbought (${rsi.toFixed(1)}) - risco alto`;
    }

    return { isValid: score >= 60, score, reason };
  }

  private validateVolume(data: any, multiplier: number) {
    const { marketData } = data;
    
    if (!marketData?.klines || marketData.klines.length < 20) {
      return { isValid: false, score: 0, reason: 'Dados de volume insuficientes' };
    }

    const volumes = marketData.klines.map((k: any) => parseFloat(k[5]));
    const recentVolume = volumes.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
    const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
    const volumeRatio = recentVolume / avgVolume;

    let score = 0;
    let reason = '';

    if (volumeRatio >= multiplier * 1.5) {
      score = 100;
      reason = `Volume muito alto (${volumeRatio.toFixed(1)}x)`;
    } else if (volumeRatio >= multiplier) {
      score = 80;
      reason = `Volume adequado (${volumeRatio.toFixed(1)}x)`;
    } else {
      score = 40;
      reason = `Volume baixo (${volumeRatio.toFixed(1)}x)`;
    }

    return { isValid: score >= 60, score, reason };
  }

  private validateSupportResistance(data: any, tolerance: number) {
    // Implementação simplificada - pode ser expandida
    return { isValid: true, score: 70, reason: 'S/R análise básica' };
  }

  private validateMomentum(data: any, minMomentum: number) {
    const { marketData } = data;
    
    if (!marketData?.stats?.priceChangePercent) {
      return { isValid: false, score: 50, reason: 'Dados de momentum indisponíveis' };
    }

    const priceChange = Math.abs(parseFloat(marketData.stats.priceChangePercent)) / 100;
    let score = 0;
    let reason = '';

    if (priceChange >= minMomentum * 2) {
      score = 100;
      reason = `Momentum forte (${(priceChange * 100).toFixed(2)}%)`;
    } else if (priceChange >= minMomentum) {
      score = 80;
      reason = `Momentum adequado (${(priceChange * 100).toFixed(2)}%)`;
    } else {
      score = 40;
      reason = `Momentum baixo (${(priceChange * 100).toFixed(2)}%)`;
    }

    return { isValid: score >= 60, score, reason };
  }

  private validateVolatility(data: any, minVol: number, maxVol: number) {
    const { marketData } = data;
    
    if (!marketData?.klines || marketData.klines.length < 20) {
      return { isValid: false, score: 50, reason: 'Dados insuficientes para volatilidade' };
    }

    const prices = marketData.klines.map((k: any) => parseFloat(k[4]));
    const volatility = this.calculateVolatility(prices);
    let score = 0;
    let reason = '';

    if (volatility >= minVol && volatility <= maxVol) {
      score = 100;
      reason = `Volatilidade ideal (${volatility.toFixed(1)}%)`;
    } else if (volatility < minVol) {
      score = 60;
      reason = `Volatilidade baixa (${volatility.toFixed(1)}%)`;
    } else {
      score = 40;
      reason = `Volatilidade alta (${volatility.toFixed(1)}%)`;
    }

    return { isValid: score >= 60, score, reason };
  }

  private validateConfidence(data: any, minConfidence: number) {
    const { decision } = data;
    
    if (!decision?.confidence) {
      return { isValid: false, score: 0, reason: 'Confiança não disponível' };
    }

    const confidence = decision.confidence;
    let score = 0;
    let reason = '';

    if (confidence >= minConfidence + 20) {
      score = 100;
      reason = `Confiança muito alta (${confidence}%)`;
    } else if (confidence >= minConfidence + 10) {
      score = 80;
      reason = `Confiança alta (${confidence}%)`;
    } else if (confidence >= minConfidence) {
      score = 60;
      reason = `Confiança adequada (${confidence}%)`;
    } else {
      score = 20;
      reason = `Confiança baixa (${confidence}%)`;
    }

    return { isValid: score >= 60, score, reason };
  }

  // Métodos auxiliares
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

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const returnRate = (prices[i] - prices[i - 1]) / prices[i - 1];
      if (!isNaN(returnRate) && isFinite(returnRate)) {
        returns.push(returnRate);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * 100;
  }
}

export class SmartPreValidationValidator {
  constructor(private layers: ValidationLayer[]) {}

  async validate(symbol: string, marketData: any, decision: any, binanceClient?: any): Promise<ValidationResult> {
    const data = { symbol, marketData, decision, binanceClient };
    
    if (this.layers.length === 0) {
      return {
        isValid: false,
        score: 0,
        maxScore: 0,
        totalScore: 0,
        reasons: [],
        warnings: ['Nenhuma camada de validação configurada'],
        activeLayers: [],
        layerScores: {}
      };
    }

    let totalScore = 0;
    let maxScore = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    const activeLayers: string[] = [];
    const layerScores: { [key: string]: number } = {};

    console.log(`🔍 Executando ${this.layers.length} camadas de validação...`);

    for (const layer of this.layers) {
      try {
        const result = layer.validator(data);
        const layerScore = (result.score / 100) * layer.weight;
        
        totalScore += layerScore;
        maxScore += layer.weight;
        layerScores[layer.name.toLowerCase().replace(/[^a-z]/g, '')] = layerScore;

        if (result.isValid) {
          reasons.push(`✅ ${layer.name}: ${result.reason} (${layerScore.toFixed(1)}/${layer.weight})`);
          activeLayers.push(layer.name);
        } else {
          warnings.push(`❌ ${layer.name}: ${result.reason} (${layerScore.toFixed(1)}/${layer.weight})`);
        }

        console.log(`   ${layer.name}: ${layerScore.toFixed(1)}/${layer.weight} - ${result.reason}`);
      } catch (error) {
        warnings.push(`⚠️ ${layer.name}: Erro na validação - ${error}`);
        console.log(`   ❌ ${layer.name}: Erro - ${error}`);
      }
    }

    const scorePercentage = (totalScore / maxScore) * 100;
    const isValid = scorePercentage >= 60;

    const confidence = Math.min(95, Math.max(50, scorePercentage));
    let riskLevel = 'HIGH';
    if (scorePercentage >= 80) riskLevel = 'LOW';
    else if (scorePercentage >= 65) riskLevel = 'MEDIUM';

    return {
      isValid,
      score: Math.round(totalScore),
      maxScore,
      totalScore: Math.round(totalScore),
      reasons,
      warnings,
      confidence: Math.round(confidence),
      riskLevel,
      activeLayers,
      layerScores
    };
  }
}