# 🤖 Crypto Trading Bot com DeepSeek AI

Bot de trading automatizado para criptomoedas que utiliza inteligência artificial DeepSeek para análise de mercado e execução de trades na Binance.

## 🎯 Estratégias Implementadas

### 1. **Análise de Mercado com IA**
- **DeepSeek AI**: Análise avançada de dados de mercado usando LLM
- **Dados analisados**: Preço atual, estatísticas 24h, candlesticks (klines)
- **Prompt otimizado**: Solicita recomendações específicas (BUY/SELL/HOLD) com nível de confiança

### 2. **Sistema de Risk Management Dinâmico**
```typescript
// Risk/Reward baseado na confiança da IA
Alta confiança (>80%): Risk 1.5% | Reward 3.0% (2:1)
Média confiança (60-80%): Risk 2.0% | Reward 3.0% (1.5:1)
Baixa confiança (<60%): Risk 2.5% | Reward 3.0% (1.2:1)
```

### 3. **Filtros de Segurança**
- **Confiança mínima**: 70% para executar trades
- **Risk/Reward mínimo**: 1.2:1 para aprovação
- **Cooldown**: 30 minutos entre trades
- **Validação de saldo**: Verifica fundos antes da execução

### 4. **Execução de Ordens Inteligente**
- **Market Orders**: Execução imediata ao preço de mercado
- **OCO Orders**: Stop Loss + Take Profit automáticos
- **Fallback**: Take Profit simples se OCO falhar
- **Proteção**: Validação de tipos e estados

## 🏗️ Arquitetura do Sistema

### **Clientes de API**
```
BinancePublicClient  → Dados de mercado (preços, stats, klines)
BinancePrivateClient → Execução de ordens, saldos
DeepSeekService      → Análise de IA
```

### **Serviços de Trading**
```
AnalysisParser  → Extrai decisões estruturadas da análise IA
RiskManager     → Calcula risk/reward dinâmico
TradeExecutor   → Executa trades com validações
```

### **Configurações**
```typescript
TRADE_AMOUNT_USD: 50           // Valor por trade
MIN_CONFIDENCE: 70             // Confiança mínima (%)
MIN_RISK_REWARD_RATIO: 1.2     // R/R mínimo
TRADE_COOLDOWN_MINUTES: 30     // Tempo entre trades
```

## 🔄 Fluxo de Execução

### **1. Coleta de Dados**
```
Preço atual → Stats 24h → Klines 1h (24 períodos)
```

### **2. Análise IA**
```
DeepSeek AI → Análise completa → Recomendação estruturada
```

### **3. Validações**
```
Confiança ≥ 70% → R/R ≥ 1.2:1 → Sem cooldown → Saldo OK
```

### **4. Execução**
```
Market Order → OCO (TP + SL) → Log resultado → Salvar histórico
```

## 📊 Tipos de Análise

### **Análise Técnica**
- Candlesticks de 1 hora (24 períodos)
- Volume e variação de preço 24h
- Padrões de preço identificados pela IA

### **Análise Fundamental**
- Contexto de mercado atual
- Sentimento baseado em dados
- Recomendações contextualizadas

### **Análise de Risco**
- Cálculo dinâmico baseado na confiança
- Validação de risk/reward antes da execução
- Proteção automática com stop loss

## 🛡️ Sistemas de Proteção

### **Validações Pré-Trade**
- ✅ Estado de trading (não executar trades simultâneos)
- ✅ Cooldown entre operações
- ✅ Nível de confiança mínimo
- ✅ Risk/reward ratio aceitável
- ✅ Saldo suficiente na conta

### **Proteções Durante Trade**
- ✅ Verificação de tipos de ação (BUY/SELL)
- ✅ Validação de resposta da API
- ✅ Tratamento de erros com fallback
- ✅ Logs detalhados para auditoria

### **Proteções Pós-Trade**
- ✅ Stop Loss automático
- ✅ Take Profit automático
- ✅ Registro completo no histórico
- ✅ Estado de trading resetado

## 📁 Estrutura do Projeto

```
src/
├── clients/                 # Clientes de API
│   ├── binance-public-client.ts
│   ├── binance-private-client.ts
│   └── deepseek-client.ts
├── bots/                    # Lógica de trading
│   ├── config/
│   │   └── trading-config.ts
│   ├── services/
│   │   ├── analysis-parser.ts
│   │   ├── risk-manager.ts
│   │   └── trade-executor.ts
│   ├── types/
│   │   └── trading.ts
│   └── real-trading-bot.ts
├── storage/                 # Persistência de dados
│   └── trade-storage.ts
└── index.ts                # Análise sem execução
```

## 🚀 Modos de Operação

### **1. Modo Análise (index.ts)**
- Análise completa com DeepSeek AI
- Cálculo de risk/reward
- Sem execução de trades reais
- Ideal para testes e validação

### **2. Modo Trading Real (real-trading-bot.ts)**
- Execução completa de trades
- Ordens reais na Binance
- Sistema completo de proteção
- Monitoramento em tempo real

## 📈 Métricas e Logging

### **Logs de Decisão**
```
🤖 Decisão AI: BUY BTCUSDT
📊 Confiança: 85%
💭 Razão: Strong bullish momentum with high volume
📊 Risk/Reward: 3.0%/1.5% (2.0:1)
```

### **Logs de Execução**
```
🚨 EXECUTANDO ORDEM: BUY BTCUSDT - $50
✅ Ordem executada!
🆔 ID: 12345678
💱 Qtd: 0.00123
💰 Preço: $40,650.00
🎯 OCO criada: 87654321
📈 TP: $41,869.50 | 🛑 SL: $40,040.25
```

### **Histórico de Trades**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "symbol": "BTCUSDT",
  "action": "BUY",
  "confidence": 85,
  "riskReturn": {
    "potentialGain": 1219.50,
    "potentialLoss": 609.75,
    "riskRewardRatio": 2.0
  }
}
```

## ⚙️ Configuração

### **1. Variáveis de Ambiente**
```env
DEEPSEEK_API_KEY=your_deepseek_key
BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret
```

### **2. Instalação**
```bash
npm install
npm run build
```

### **3. Execução**
```bash
# Modo análise
npm start

# Modo trading real
npm run trading-bot
```

## ⚠️ Avisos Importantes

### **Riscos**
- Trading automatizado envolve riscos financeiros
- Mercado de criptomoedas é altamente volátil
- IA pode tomar decisões incorretas
- Sempre monitore as posições abertas

### **Recomendações**
- Comece com valores pequenos
- Teste em modo análise primeiro
- Configure stop loss adequados
- Monitore regularmente o bot
- Mantenha fundos de emergência

### **Limitações**
- Depende da qualidade da análise IA
- Sujeito a falhas de API
- Não considera eventos fundamentais
- Baseado apenas em análise técnica

## 📊 Performance Esperada

### **Configuração Conservadora**
- Risk: 1.5-2.5% por trade
- Reward: 3.0% por trade
- Win Rate esperado: 60-70%
- Trades por dia: 1-3 (com cooldown)

### **Fatores de Sucesso**
- Qualidade da análise DeepSeek
- Condições de mercado favoráveis
- Configuração adequada de risk/reward
- Monitoramento ativo do usuário

---

**⚡ Este projeto é para fins educacionais. Trading automatizado envolve riscos. Use por sua conta e risco.**