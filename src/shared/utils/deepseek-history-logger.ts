import * as fs from 'fs';
import * as path from 'path';

interface DeepSeekAnalysis {
  timestamp: string;
  symbol: string;
  botType: 'realBot' | 'smartBot' | 'multiSmartBot';
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
}

interface DeepSeekHistory {
  realBot: DeepSeekAnalysis[];
  smartBot: DeepSeekAnalysis[];
  multiSmartBot: DeepSeekAnalysis[];
  metadata: {
    created: string;
    lastUpdated: string;
    totalCalls: number;
    callsByBot: {
      realBot: number;
      smartBot: number;
      multiSmartBot: number;
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
      smartBot: [],
      multiSmartBot: [],
      metadata: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalCalls: 0,
        callsByBot: {
          realBot: 0,
          smartBot: 0,
          multiSmartBot: 0
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

    console.log(`📝 DeepSeek análise salva: ${analysis.botType} | ${analysis.symbol} | ${analysis.action || 'N/A'}`);
  }

  static getHistory(botType?: 'realBot' | 'smartBot' | 'multiSmartBot'): DeepSeekHistory | DeepSeekAnalysis[] {
    const history = this.loadHistory();
    return botType ? history[botType] : history;
  }

  static getStats(): { totalCalls: number; callsByBot: Record<string, number>; lastCall?: string } {
    const history = this.loadHistory();
    const allAnalyses = [...history.realBot, ...history.smartBot, ...history.multiSmartBot];
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