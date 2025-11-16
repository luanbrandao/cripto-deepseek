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
import { PriceCalculator, type PriceTargets, type EnhancedPriceTargets } from './price-calculator';
import { TechnicalIndicators, type EMAResult, type RSIResult, type MomentumResult, type VolumeResult } from './technical-indicators';

export { 
  EMACalculator, 
  RSICalculator, 
  VolumeCalculator, 
  MomentumCalculator, 
  VolatilityCalculator, 
  SupportResistanceCalculator,
  PriceCalculator,
  TechnicalIndicators
};

export type { 
  SupportResistanceLevel, 
  PivotPoint, 
  PriceTargets, 
  EnhancedPriceTargets,
  EMAResult,
  RSIResult,
  MomentumResult,
  VolumeResult
};

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

  // Momentum Methods
  static calculateMomentum = MomentumCalculator.calculateMomentum;
  static calculateMultiPeriodMomentum = MomentumCalculator.calculateMultiPeriodMomentum;
  static calculateMomentumAcceleration = MomentumCalculator.calculateMomentumAcceleration;
  static calculateMomentumRSI = MomentumCalculator.calculateMomentumRSI;
  static calculateROC = MomentumCalculator.calculateROC;
  static calculateMomentumDivergence = MomentumCalculator.calculateMomentumDivergence;

  // Volatility Methods
  static calculateVolatility = VolatilityCalculator.calculateVolatility;
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

  // Price Calculation Methods
  static calculatePricesForAction = PriceCalculator.calculatePricesForAction;
  static calculateWithVolatility = PriceCalculator.calculateWithVolatility;
  static calculateWithLevels = PriceCalculator.calculateWithLevels;
  static calculateEnhancedTargets = PriceCalculator.calculateEnhancedTargets;

  // Technical Indicators Methods (Unified Interface)
  static calculateEMAAnalysis = TechnicalIndicators.calculateEMAAnalysis;
  static calculateRSIAnalysis = TechnicalIndicators.calculateRSI;
  static calculateMomentumAnalysis = TechnicalIndicators.calculateMomentum;
  static calculateVolumeAnalysis = TechnicalIndicators.calculateVolumeAnalysis;
  static calculateOBVIndicator = TechnicalIndicators.calculateOBV;
  static calculateBollingerBandsIndicator = TechnicalIndicators.calculateBollingerBands;
  static calculateMACD = TechnicalIndicators.calculateMACD;
  static calculateATRIndicator = TechnicalIndicators.calculateATR;

  // Legacy Volume/Volatility Methods (for backward compatibility)
  static calculateOBV = VolumeCalculator.calculateOBV;
  static calculateATR = VolatilityCalculator.calculateATR;
  static calculateBollingerBands = VolatilityCalculator.calculateBollingerBands;

  /**
   * 📊 COMPREHENSIVE MARKET ANALYSIS
   * All-in-one analysis method
   */
  static analyzeMarket(prices: number[], volumes?: number[], klines?: any[]) {
    const currentPrice = prices[prices.length - 1];
    
    // EMA Analysis (12/26 default)
    const ema = this.calculateEMAAnalysis(prices);
    
    // RSI Analysis
    const rsi = this.calculateRSIAnalysis(prices);
    
    // Volume Analysis (if available)
    const volume = volumes ? this.calculateVolumeAnalysis(volumes) : undefined;
    
    // Momentum Analysis
    const momentum = this.calculateMomentumAnalysis(prices);
    
    // Volatility Analysis
    const volatility = this.calculateVolatility(prices);
    
    // Support/Resistance Analysis (if klines available)
    const supportResistance = klines ? this.findBasicSRLevels(klines, currentPrice) : undefined;
    
    // Bollinger Bands
    const bollingerBands = this.calculateBollingerBands(prices);
    
    // MACD
    const macd = this.calculateMACD(prices);
    
    // ATR (if klines available)
    const atr = klines ? this.calculateATRIndicator(klines) : undefined;
    
    return {
      ema,
      rsi,
      volume,
      momentum,
      volatility,
      supportResistance,
      bollingerBands,
      macd,
      atr
    };
  }
}