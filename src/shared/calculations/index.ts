/**
 * 🧮 TECHNICAL CALCULATIONS INDEX
 * Centralized export for all calculation modules
 */

import { EMACalculator } from './ema-calculator';
import { RSICalculator } from './rsi-calculator';
import { VolumeCalculator } from './volume-calculator';
import { MomentumCalculator } from './momentum-calculator';
import { VolatilityCalculator } from './volatility-calculator';
import { SupportResistanceCalculator, type SupportResistanceLevel, type PivotPoint } from './support-resistance-calculator';

export { EMACalculator, RSICalculator, VolumeCalculator, MomentumCalculator, VolatilityCalculator, SupportResistanceCalculator };
export type { SupportResistanceLevel, PivotPoint };

/**
 * 🎯 UNIFIED TECHNICAL CALCULATOR
 * Single entry point for all calculations
 */
export class TechnicalCalculator {
  // EMA Methods
  static calculateEMA = EMACalculator.calculate;
  static calculateEMAMultiple = EMACalculator.calculateMultiple;
  static calculateEMACrossover = EMACalculator.calculateCrossover;
  static calculateEMATrendStrength = EMACalculator.calculateTrendStrength;

  // RSI Methods
  static calculateRSI = RSICalculator.calculate;
  static calculateRSISmoothed = RSICalculator.calculateSmoothed;
  static getRSISignal = RSICalculator.getSignal;
  static calculateRSIDivergence = RSICalculator.calculateDivergence;

  // Volume Methods
  static calculateVolumeRatio = VolumeCalculator.calculateVolumeRatio;
  static calculateVolumeTrend = VolumeCalculator.calculateVolumeTrend;
  static calculateVolumeVolatility = VolumeCalculator.calculateVolumeVolatility;
  static calculateVolumePriceCorrelation = VolumeCalculator.calculateVolumePriceCorrelation;
  static calculateOBV = VolumeCalculator.calculateOBV;

  // Momentum Methods
  static calculateMomentum = MomentumCalculator.calculateMomentum;
  static calculateMultiPeriodMomentum = MomentumCalculator.calculateMultiPeriodMomentum;
  static calculateMomentumAcceleration = MomentumCalculator.calculateMomentumAcceleration;
  static calculateMomentumRSI = MomentumCalculator.calculateMomentumRSI;
  static calculateROC = MomentumCalculator.calculateROC;
  static calculateMomentumDivergence = MomentumCalculator.calculateMomentumDivergence;

  // Volatility Methods
  static calculateVolatility = VolatilityCalculator.calculateVolatility;
  static calculateATR = VolatilityCalculator.calculateATR;
  static calculateBollingerBands = VolatilityCalculator.calculateBollingerBands;
  static calculateFromKlines = VolatilityCalculator.calculateFromKlines;
  static calculateGarmanKlass = VolatilityCalculator.calculateGarmanKlass;
  static calculateVolatilityCone = VolatilityCalculator.calculateVolatilityCone;

  // Support/Resistance Methods
  static findBasicSRLevels = SupportResistanceCalculator.findBasicLevels;
  static findAdvancedSRLevels = SupportResistanceCalculator.findAdvancedLevels;
  static findPivotPoints = SupportResistanceCalculator.findPivotPoints;
  static findLocalExtrema = SupportResistanceCalculator.findLocalExtrema;
  static calculateFibonacciLevels = SupportResistanceCalculator.calculateFibonacciLevels;
  static calculateSRStrength = SupportResistanceCalculator.calculateLevelStrength;
  static findDynamicSRLevels = SupportResistanceCalculator.findDynamicLevels;

  /**
   * 📊 COMPREHENSIVE MARKET ANALYSIS
   * All-in-one analysis method
   */
  static analyzeMarket(prices: number[], volumes?: number[], klines?: any[]) {
    const currentPrice = prices[prices.length - 1];
    
    // EMA Analysis (12/26 default)
    const ema = this.calculateEMACrossover(prices, 12, 26);
    
    // RSI Analysis
    const rsiValue = this.calculateRSI(prices);
    const rsi = { value: rsiValue, signal: this.getRSISignal(rsiValue) };
    
    // Volume Analysis (if available)
    const volume = volumes ? this.calculateVolumeRatio(volumes) : undefined;
    
    // Momentum Analysis
    const momentum = this.calculateMomentum(prices);
    
    // Volatility Analysis
    const volatility = this.calculateVolatility(prices);
    
    // Support/Resistance Analysis (if klines available)
    const supportResistance = klines ? this.findBasicSRLevels(klines, currentPrice) : undefined;
    
    return {
      ema,
      rsi,
      volume,
      momentum,
      volatility,
      supportResistance
    };
  }
}