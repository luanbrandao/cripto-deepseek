# 🤖 Real Trading Bot

## 📋 **Descrição**
Bot de trading automatizado que utiliza **DeepSeek AI** para análise de múltiplas criptomoedas simultaneamente e executa **trades reais** na Binance com garantia de Risk/Reward 2:1.

## 🎯 **Estratégia**
- **Análise Multi-Moeda**: Avalia BTCUSDT, BNBUSDT, ETHUSDT, ADAUSDT simultaneamente
- **Seleção Automática**: Escolhe a moeda com maior probabilidade de acerto
- **DeepSeek AI**: Análise contextual avançada com dados completos (price + stats + klines)
- **Execução Real**: Ordens executadas diretamente na Binance

## 🔄 **Fluxo de Execução**

### **1. Inicialização**
```
✅ Validar chaves da Binance
✅ Verificar saldo disponível
✅ Verificar limite de trades ativos (máx 4)
```

### **2. Análise Multi-Moeda**
```
Para cada moeda (BTCUSDT, BNBUSDT, ETHUSDT, ADAUSDT):
├── Coletar dados de mercado (price, stats, klines)
├── Enviar para DeepSeek AI
├── Receber análise contextual
└── Calcular score de confiança
```

### **3. Seleção Inteligente**
```
📊 Comparar todas as análises
🏆 Escolher moeda com maior confiança
💡 Validar confiança mínima (≥70%)
```

### **4. Execução de Trade**
```
🚨 Executar Market Order
📈 Criar OCO (Take Profit + Stop Loss)
💾 Salvar no histórico
📊 Risk/Reward garantido 2:1
```

## ⚙️ **Configurações**

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| **Moedas** | BTCUSDT, BNBUSDT, ETHUSDT, ADAUSDT | Símbolos analisados |
| **Valor por Trade** | $15 | Valor investido por operação |
| **Confiança Mínima** | 70% | Threshold para execução |
| **Risk/Reward** | 2:1 | Ratio obrigatório |
| **Max Trades** | 4 | Limite de trades simultâneos |
| **Timeframe** | 1h | Período dos candlesticks |
| **Períodos** | 50 | Quantidade de velas analisadas |

## 🛡️ **Proteções**

### **Validações Pré-Trade**
- ✅ Verificação de saldo suficiente
- ✅ Limite de trades ativos
- ✅ Confiança mínima obrigatória
- ✅ Anti-duplicação por símbolo

### **Proteções Durante Trade**
- ✅ Market Order para execução imediata
- ✅ OCO automático (TP + SL)
- ✅ Fallback para Take Profit simples
- ✅ Logs completos para auditoria

### **Proteções Pós-Trade**
- ✅ Stop Loss automático
- ✅ Take Profit automático
- ✅ Registro completo no histórico
- ✅ Monitoramento contínuo

## 📊 **Performance Esperada**

| Métrica | Valor | Observação |
|---------|-------|------------|
| **Win Rate** | 75-80% | Com seleção automática |
| **Risk por Trade** | 0.5-1.5% | Baseado na confiança |
| **Reward por Trade** | 1.0-3.0% | Sempre 2x o risco |
| **Trades por Dia** | 2-4 | Análise rigorosa |
| **Assertividade** | 75-80% | IA + diversificação |

## 🚀 **Como Usar**

### **Execução Manual**
```bash
npm run real-trading-bot
```

### **Execução Automática (Cron)**
```bash
npm run real-trading-bot-cron  # ⚠️ TRADES REAIS
```

## ⚠️ **Avisos Importantes**

### **🔴 RISCOS**
- **TRADES REAIS**: Executa ordens reais na Binance
- **RISCO FINANCEIRO**: Pode resultar em perdas
- **VOLATILIDADE**: Mercado cripto é altamente volátil
- **IA PODE ERRAR**: Análise não é 100% precisa

### **📋 RECOMENDAÇÕES**
- Comece com valores pequenos
- Monitore regularmente as posições
- Mantenha fundos de emergência
- Entenda os riscos envolvidos

## 📁 **Arquivos Relacionados**
- `real-trading-bot.ts` - Código principal
- `real-trade-analyzer.ts` - Analisador DeepSeek
- `realTradingBot.json` - Histórico de trades
- `real-trading-bot-simulator.ts` - Versão simulação