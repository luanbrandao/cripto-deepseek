import { DeepSeekService } from '../../core/clients/deepseek-client';
import { UnifiedAnalysisParser } from '../parsers/unified-analysis-parser';
import { UNIFIED_TRADING_CONFIG } from '../config/unified-trading-config';
import { SmartScoringSystem } from '../../bots/services/smart-scoring-system';
import { AdvancedEmaAnalyzer } from '../../bots/services/advanced-ema-analyzer';

export interface DeepSeekAnalysisOptions {
  strategy: 'SMART_TRADE' | 'REAL_TRADE' | 'MULTI_SMART_TRADE' | 'CUSTOM';
  customPrompt?: string;
  parseMode: 'BASIC' | 'ADVANCED';
}

export class UnifiedDeepSeekAnalyzer {
  static async analyze(
    deepseek: DeepSeekService, 
    symbol: string, 
    marketData: any,
    options: DeepSeekAnalysisOptions
  ) {
    console.log(`\n🧠 Analisando ${symbol} com DeepSeek AI (${options.strategy})...`);
    
    const prompt = this.buildPrompt(symbol, options);
    const analysis = await deepseek.analyzeMarket(marketData, prompt);

    console.log(`\n📋 Análise DeepSeek ${options.strategy} (primeiros 500 chars):`);
    console.log(analysis.substring(0, 500) + '...');

    const price = parseFloat(marketData.price.price);
    
    return options.parseMode === 'ADVANCED'
      ? await UnifiedAnalysisParser.parseAdvanced(analysis, symbol, price)
      : await UnifiedAnalysisParser.parseBasic(analysis, symbol, price);
  }

  private static buildPrompt(symbol: string, options: DeepSeekAnalysisOptions): string {
    if (options.customPrompt) {
      return options.customPrompt;
    }

    const baseContext = `Analyze ${symbol} market data (${UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME} timeframe, ${UNIFIED_TRADING_CONFIG.CHART.PERIODS} periods)`;

    switch (options.strategy) {
      case 'SMART_TRADE':
        return `${baseContext} including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`;
      
      case 'MULTI_SMART_TRADE':
        return `${baseContext} including 24h klines with advanced multi-dimensional analysis. Focus on BULLISH signals with EMA confirmation, volume analysis, and momentum indicators. Provide detailed BUY recommendation with high confidence if multiple indicators align, otherwise HOLD. Consider Smart Scoring with technical confluence.`;
      
      case 'REAL_TRADE':
        return `${baseContext} and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning. Consider both bullish and bearish scenarios.`;
      
      default:
        return `${baseContext} and provide trading recommendation with detailed analysis.`;
    }
  }

  // Métodos de conveniência para compatibilidade
  static async analyzeSmartTrade(deepseek: DeepSeekService, symbol: string, marketData: any) {
    console.log(`\n🧠 Analisando ${symbol} com SMART-TRADE...`);
    
    const analysis = await deepseek.analyzeMarket(
      marketData,
      `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`
    );

    console.log(`\n📋 Análise DeepSeek SMART_TRADE (primeiros 500 chars):`);
    console.log(analysis.substring(0, 500) + '...');

    return await UnifiedAnalysisParser.parseBasic(analysis, symbol, parseFloat(marketData.price.price));
  }

  static async analyzeRealTrade(deepseek: DeepSeekService, symbol: string, marketData: any) {
    console.log(`\n🧠 Analisando ${symbol} com REAL-TRADE...`);
    
    const analysis = await deepseek.analyzeMarket(
      marketData,
      `Analyze ${symbol} market data (${UNIFIED_TRADING_CONFIG.CHART.TIMEFRAME} timeframe, ${UNIFIED_TRADING_CONFIG.CHART.PERIODS} periods) and provide a clear BUY, SELL, or HOLD recommendation with confidence level and reasoning.`
    );

    console.log(`\n📋 Análise DeepSeek REAL_TRADE (primeiros 500 chars):`);
    console.log(analysis.substring(0, 500) + '...');

    return await UnifiedAnalysisParser.parseBasic(analysis, symbol, parseFloat(marketData.price.price));
  }

  static async analyzeAdvanced(deepseek: DeepSeekService, symbol: string, marketData: any, strategy: 'SMART_TRADE' | 'REAL_TRADE' | 'MULTI_SMART_TRADE' = 'REAL_TRADE') {
    return this.analyze(deepseek, symbol, marketData, {
      strategy,
      parseMode: 'ADVANCED'
    });
  }

  static async analyzeMultiSmartTrade(deepseek: DeepSeekService, symbol: string, marketData: any) {
    console.log(`\n🧠 Analisando ${symbol} com MULTI-ENHANCED SMART-TRADE...`);
    
    const prompt = `Analyze ${symbol} comprehensively using the following data:
    - Current price and 24h statistics
    - Candlestick patterns from klines data
    - Volume analysis and momentum indicators
    
    Focus on BULLISH signals and provide detailed analysis including:
    1. Technical breakout patterns
    2. Support/resistance levels
    3. Volume confirmation
    4. Momentum strength
    5. Risk factors
    
    Be specific about confidence level and provide clear reasoning for BUY or HOLD recommendation.`;

    const analysis = await deepseek.analyzeMarket(marketData, prompt);
    
    console.log(`\n📋 Análise DeepSeek MULTI_SMART_TRADE (primeiros 500 chars):`);
    console.log(analysis.substring(0, 500) + '...');

    const price = parseFloat(marketData.price.price);
    const decision = await UnifiedAnalysisParser.parseAdvanced(analysis, symbol, price);

    // Apply smart scoring system for final validation
    const scoringSystem = new SmartScoringSystem();
    const emaAnalyzer = new AdvancedEmaAnalyzer();

    // Extract technical data from klines
    const prices = marketData.klines ? marketData.klines.map((k: any) => parseFloat(k[4])) : [];
    const volumes = marketData.klines ? marketData.klines.map((k: any) => parseFloat(k[5])) : undefined;

    if (prices.length > 0) {
      const technicalData = {
        prices,
        volumes,
        currentPrice: price
      };

      const aiAnalysis = {
        confidence: decision.confidence,
        action: decision.action,
        sentiment: decision.action === 'BUY' ? 70 : decision.action === 'SELL' ? -70 : 0,
        technicalSignals: 75 // Base score, could be enhanced with more analysis
      };

      const smartScore = scoringSystem.calculateSmartScore(technicalData, aiAnalysis);

      // Update decision with smart score insights
      decision.confidence = smartScore.confidence;
      decision.reason = `${decision.reason} | Smart Score: ${smartScore.finalScore.toFixed(1)} (EMA:${smartScore.emaScore.toFixed(0)} AI:${smartScore.aiScore.toFixed(0)} Vol:${smartScore.volumeScore.toFixed(0)} Mom:${smartScore.momentumScore.toFixed(0)})`;

      // Override action based on smart score recommendation
      if (smartScore.recommendation === 'STRONG_BUY' || smartScore.recommendation === 'BUY') {
        decision.action = 'BUY';
      } else if (smartScore.finalScore < 60) {
        decision.action = 'HOLD';
      }
    }

    return decision;
  }

  static async analyzeMultiSmartTradeSell(deepseek: DeepSeekService, symbol: string, marketData: any) {
    console.log(`\n🧠 Analisando ${symbol} com MULTI-ENHANCED SMART-TRADE SELL...`);
    
    const { price, stats, klines } = marketData;
    
    const prompt = `
Você é um especialista em análise técnica AVANÇADA focado EXCLUSIVAMENTE em identificar oportunidades de VENDA (SHORT) com análise multi-dimensional.

DADOS DO MERCADO ${symbol}:
- Preço atual: $${price.price}
- Variação 24h: ${stats.priceChangePercent}%
- Volume 24h: ${stats.volume}
- Máxima 24h: $${stats.highPrice}
- Mínima 24h: $${stats.lowPrice}
- Candlesticks: ${klines.length} velas de 1h

ANÁLISE MULTI-DIMENSIONAL BEARISH:

1. ANÁLISE EMA MULTI-TIMEFRAME:
   - EMA 12/26/50/100/200 em tendência de baixa
   - Death Cross confirmado (EMA rápida < EMA lenta)
   - Preço abaixo das EMAs principais

2. ANÁLISE DE VOLUME E MOMENTUM:
   - Volume de distribuição (altos volumes em quedas)
   - Momentum bearish confirmado
   - Divergência bearish em indicadores

3. PADRÕES BEARISH AVANÇADOS:
   - Ombro-Cabeça-Ombro invertido
   - Duplo topo ou triplo topo
   - Bandeiras e flâmulas de continuação bearish
   - Rompimento de suportes críticos

4. ANÁLISE DE SENTIMENTO:
   - Exaustão de compradores
   - Sinais de distribuição institucional
   - Resistências psicológicas testadas

5. CONDIÇÕES DE MERCADO:
   - Bear Market: Threshold mais baixo (mais oportunidades)
   - Bull Market: Threshold mais alto (mais seletivo)
   - Sideways: Threshold médio

CRITÉRIOS ULTRA-RIGOROSOS PARA VENDA:
- Múltiplas confirmações bearish
- Volume significativo em quedas
- Rompimento de suportes importantes
- Divergências bearish confirmadas
- Padrões de reversão completos

IMPORTANTE: 
- Seja EXTREMAMENTE seletivo - só recomende VENDA com altíssima confiança (85%+)
- NUNCA recomende BUY - este é um bot SHORT-ONLY
- Caso não haja sinais claros, recomende HOLD
- Considere múltiplos timeframes para confirmação

Responda em JSON:
{
  "action": "SELL" ou "HOLD",
  "confidence": número de 0-100 (mínimo ${UNIFIED_TRADING_CONFIG.MIN_CONFIDENCE} para SELL),
  "reason": "explicação detalhada da análise multi-dimensional bearish",
  "price": ${parseFloat(price.price)},
  "symbol": "${symbol}",
  "smartScore": número de 0-100 (score combinado de todos os fatores),
  "bearishSignals": ["lista", "de", "sinais", "bearish", "identificados"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

    try {
      const rawResponse = await deepseek.analyzeMarket(marketData, prompt);
      
      console.log(`\n📋 Análise DeepSeek MULTI_SMART_TRADE_SELL (primeiros 500 chars):`);
      console.log(rawResponse.substring(0, 500) + '...');
      
      // Parse da resposta JSON
      let analysis;
      try {
        // Tentar extrair JSON da resposta
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON não encontrado na resposta');
        }
      } catch (parseError) {
        console.warn(`⚠️ Erro ao parsear JSON para ${symbol}, usando fallback`);
        analysis = {
          action: 'HOLD',
          confidence: 0,
          reason: 'Erro no parsing da análise - aguardando',
          price: parseFloat(price.price),
          symbol: symbol,
          smartScore: 0,
          bearishSignals: [],
          riskLevel: 'HIGH'
        };
      }

      // Validações de segurança
      if (!analysis.action || !['SELL', 'HOLD'].includes(analysis.action)) {
        analysis.action = 'HOLD';
      }
      
      if (analysis.action === 'SELL' && analysis.confidence < UNIFIED_TRADING_CONFIG.MIN_CONFIDENCE) {
        console.log(`⚠️ ${symbol}: Confiança ${analysis.confidence}% < ${UNIFIED_TRADING_CONFIG.MIN_CONFIDENCE}% - Convertendo para HOLD`);
        analysis.action = 'HOLD';
        analysis.confidence = Math.max(50, analysis.confidence - 20);
      }

      console.log(`📉 Análise MULTI-SELL para ${symbol}:`);
      console.log(`   Ação: ${analysis.action} (${analysis.confidence}%)`);
      console.log(`   Smart Score: ${analysis.smartScore || 'N/A'}`);
      console.log(`   Sinais Bearish: ${analysis.bearishSignals?.length || 0}`);
      
      return analysis;
    } catch (error) {
      console.error(`❌ Erro na análise MULTI-SELL para ${symbol}:`, error);
      return {
        action: 'HOLD',
        confidence: 0,
        reason: 'Erro na análise - aguardando condições favoráveis',
        price: parseFloat(price.price),
        symbol: symbol,
        smartScore: 0,
        bearishSignals: [],
        riskLevel: 'HIGH'
      };
    }
  }

  static async analyzeSmartTradeSell(deepseek: DeepSeekService, symbol: string, marketData: any) {
    console.log(`\n🧠 Analisando ${symbol} com SMART-TRADE SELL...`);
    
    const analysis = await deepseek.analyzeMarket(
      marketData,
      `Analyze ${symbol} market data including 24h klines. Focus on BEARISH signals only. Provide a CLEAR SELL recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for downward momentum. Look for resistance levels, bearish patterns, and distribution signals.`
    );

    console.log(`\n📋 Análise DeepSeek SMART_TRADE_SELL (primeiros 500 chars):`);
    console.log(analysis.substring(0, 500) + '...');

    return await UnifiedAnalysisParser.parseBasic(analysis, symbol, parseFloat(marketData.price.price));
  }

  static async analyzeSmartTradeBuy(deepseek: DeepSeekService, symbol: string, marketData: any) {
    console.log(`\n🧠 Analisando ${symbol} com SMART-TRADE BUY...`);
    
    const analysis = await deepseek.analyzeMarket(
      marketData,
      `Analyze ${symbol} market data including 24h klines. Focus on BULLISH signals only. Provide a CLEAR BUY recommendation if conditions are favorable, otherwise HOLD. Be specific about confidence level and reasoning. Consider current price action, volume, and technical indicators for upward momentum.`
    );

    console.log(`\n📋 Análise DeepSeek SMART_TRADE_BUY (primeiros 500 chars):`);
    console.log(analysis.substring(0, 500) + '...');

    return await UnifiedAnalysisParser.parseBasic(analysis, symbol, parseFloat(marketData.price.price));
  }
}