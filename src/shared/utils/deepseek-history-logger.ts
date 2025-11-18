import * as fs from 'fs';
import * as path from 'path';

interface DeepSeekAnalysis {
  timestamp: string;
  symbol: string;
  botType: 'realBot' | 'realBotSimulator' | 'smartBot' | 'multiSmartBot' | 'smartEntryBot';
  prompt: string;
  response: string;
  confidence?: number;
  action?: string;
  reason?: string;
  marketData?: {
    price: number;
    change24h: number;
    volume24h: number;
  };
  executionTime: number;
  technicalLevels?: {
    support?: number[];
    resistance?: number[];
    targets?: number[];
    stopLoss?: number[];
  };
  enhancedTargets?: {
    target?: number;
    stop?: number;
    riskRewardRatio?: number;
    method?: string;
  };
}

interface DeepSeekHistory {
  realBot: DeepSeekAnalysis[];
  realBotSimulator: DeepSeekAnalysis[];
  smartBot: DeepSeekAnalysis[];
  multiSmartBot: DeepSeekAnalysis[];
  smartEntryBot: DeepSeekAnalysis[];
  metadata: {
    created: string;
    lastUpdated: string;
    totalCalls: number;
    callsByBot: {
      realBot: number;
      realBotSimulator: number;
      smartBot: number;
      multiSmartBot: number;
      smartEntryBot: number;
    };
  };
}

export class DeepSeekHistoryLogger {
  private static readonly HISTORY_FILE = path.join(process.cwd(), './src/storage/deepseek/deepseek-history.json');

  private static loadHistory(): DeepSeekHistory {
    try {
      if (fs.existsSync(this.HISTORY_FILE)) {
        const data = fs.readFileSync(this.HISTORY_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar histórico DeepSeek:', error);
    }

    return {
      realBot: [],
      realBotSimulator: [],
      smartBot: [],
      multiSmartBot: [],
      smartEntryBot: [],
      metadata: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalCalls: 0,
        callsByBot: {
          realBot: 0,
          realBotSimulator: 0,
          smartBot: 0,
          multiSmartBot: 0,
          smartEntryBot: 0
        }
      }
    };
  }

  private static saveHistory(history: DeepSeekHistory): void {
    try {
      history.metadata.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar histórico DeepSeek:', error);
    }
  }

  static logAnalysis(analysis: Omit<DeepSeekAnalysis, 'timestamp'>): void {
    const history = this.loadHistory();

    const fullAnalysis: DeepSeekAnalysis = {
      ...analysis,
      timestamp: new Date().toISOString()
    };

    // Adicionar à categoria correta
    history[analysis.botType].push(fullAnalysis);

    // Atualizar metadata
    history.metadata.totalCalls++;
    history.metadata.callsByBot[analysis.botType]++;

    // Manter apenas últimas 100 análises por bot
    if (history[analysis.botType].length > 100) {
      history[analysis.botType] = history[analysis.botType].slice(-100);
    }

    this.saveHistory(history);

    // Log com informações técnicas se disponíveis
    let logMessage = `📝 DeepSeek análise salva: ${analysis.botType} | ${analysis.symbol} | ${analysis.action || 'N/A'}`;

    if (analysis.technicalLevels) {
      const levelsCount = [
        analysis.technicalLevels.support?.length || 0,
        analysis.technicalLevels.resistance?.length || 0,
        analysis.technicalLevels.targets?.length || 0,
        analysis.technicalLevels.stopLoss?.length || 0
      ].reduce((a, b) => a + b, 0);

      if (levelsCount > 0) {
        logMessage += ` | ${levelsCount} níveis técnicos`;
      }
    }

    if (analysis.enhancedTargets?.target) {
      logMessage += ` | Target: $${analysis.enhancedTargets.target.toLocaleString()}`;
    }

    console.log(logMessage);
  }

  static logAnalysisWithTechnicals(
    analysis: Omit<DeepSeekAnalysis, 'timestamp'>,
    technicalLevels?: any,
    enhancedTargets?: any
  ): void {
    const enhancedAnalysis = {
      ...analysis,
      technicalLevels,
      enhancedTargets
    };

    this.logAnalysis(enhancedAnalysis);
  }

  static getHistory(botType?: 'realBot' | 'realBotSimulator' | 'smartBot' | 'multiSmartBot' | 'smartEntryBot'): DeepSeekHistory | DeepSeekAnalysis[] {
    const history = this.loadHistory();
    return botType ? history[botType] : history;
  }

  static getStats(): { totalCalls: number; callsByBot: Record<string, number>; lastCall?: string } {
    const history = this.loadHistory();
    const allAnalyses = [...history.realBot, ...history.realBotSimulator, ...history.smartBot, ...history.multiSmartBot, ...history.smartEntryBot];
    const lastCall = allAnalyses.length > 0
      ? allAnalyses[allAnalyses.length - 1].timestamp
      : undefined;

    return {
      totalCalls: history.metadata.totalCalls,
      callsByBot: history.metadata.callsByBot,
      lastCall
    };
  }
}