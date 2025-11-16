/**
 * 🏭 CORE ANALYZERS - Barrel Export
 * Unified export for all technical analysis components
 */

// === TECHNICAL ANALYZERS ===
export { default as Analyzer123 } from './technical/pattern-123';
export { default as EmaAnalyzer } from './technical/ema-analyzer';
export { MomentumAnalyzer } from './technical/momentum-analyzer';
export { VolumeAnalyzer } from './technical/volume-analyzer';
export { default as SupportResistanceAnalyzer } from './technical/support-resistance-analyzer';

// === FACTORIES ===
export { TechnicalAnalyzerFactory } from './factories/technical-analyzer-factory';
// Note: DeepSeekAnalysisFactory temporarily disabled due to import issues

// === UNIFIED SERVICES ===
// Note: UnifiedDeepSeekAnalyzer and UltraConservativeAnalyzer temporarily disabled due to import issues

// === TYPES ===
export type { AnalyzerType, TechnicalAnalysisResult, MarketDataInput } from './factories/technical-analyzer-factory';