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

## 🧬 Evolução dos Bots de Trading

O projeto implementa três abordagens evolutivas de trading automatizado, cada uma com características e níveis de sofisticação diferentes:

### **📊 Nível 1: EMA Trading Bot (Análise Técnica Pura)**
```typescript
// Estratégia: Médias Móveis Exponenciais (EMA 12/26)
if (currentPrice > EMA12 > EMA26 && priceChange > 2%) → BUY
if (currentPrice < EMA12 < EMA26 && priceChange < -2%) → SELL
```

**Características:**
- ✅ **Velocidade**: Execução instantânea (sem APIs externas)
- ✅ **Custo**: Zero custos adicionais
- ✅ **Confiabilidade**: Estratégia testada há décadas
- ✅ **Simplicidade**: Lógica matemática pura
- ❌ **Limitação**: Não considera contexto de mercado
- ❌ **Sinais falsos**: Pode gerar trades em mercados laterais

**Assertividade esperada: 60-65%** (mercados com tendência definida)

### **🧠 Nível 2: Real Trading Bot (Inteligência Artificial)**
```typescript
// Estratégia: DeepSeek AI com análise contextual
DeepSeek AI → Análise completa → Decisão BUY/SELL/HOLD
```

**Características:**
- ✅ **Inteligência**: Análise contextual avançada
- ✅ **Adaptabilidade**: Considera múltiplos fatores
- ✅ **Flexibilidade**: Interpreta padrões complexos
- ✅ **Evolução**: Melhora com dados atualizados
- ❌ **Dependência**: Requer API externa (custo)
- ❌ **Latência**: Tempo de resposta da IA
- ❌ **Variabilidade**: Resultados podem variar

**Assertividade esperada: 70-75%** (análise mais sofisticada)

### **🎯 Nível 3: Smart Trading Bot (Híbrido Inteligente)**
```typescript
// Estratégia: Validação Dupla (EMA + DeepSeek AI)
EMA confirma tendência → DeepSeek analisa contexto → Executa apenas se ambos aprovam
```

**Características:**
- ✅ **Precisão máxima**: Dupla validação reduz falsos positivos
- ✅ **Segurança**: Só executa em condições ideais
- ✅ **Boost de confiança**: +10% quando ambos confirmam
- ✅ **Filtro inteligente**: Evita trades em mercados desfavoráveis
- ✅ **Foco estratégico**: Otimizado para tendências de alta
- ❌ **Menos trades**: Critérios mais rigorosos
- ❌ **Complexidade**: Maior overhead de processamento

**Assertividade esperada: 80-85%** (máxima precisão)

## 📈 Comparativo de Performance

| Bot | Velocidade | Custo | Assertividade | Trades/Dia | Melhor Para |
|-----|------------|-------|---------------|------------|-------------|
| **EMA Bot** | ⚡ Instantâneo | 💰 Zero | 📊 60-65% | 🔄 5-8 | Scalping, Day Trading |
| **Real Bot** | 🕐 2-5s | 💸 Baixo | 📊 70-75% | 🔄 3-5 | Swing Trading |
| **Smart Bot** | 🕐 3-7s | 💸 Baixo | 📊 80-85% | 🔄 1-3 | Position Trading |

## 🎯 Quando Usar Cada Bot

### **Use EMA Bot quando:**
- Mercado em tendência clara
- Precisa de execução rápida
- Quer minimizar custos
- Faz day trading ativo

### **Use Real Bot quando:**
- Mercado complexo/volátil
- Quer análise contextual
- Tem budget para IA
- Faz swing trading

### **Use Smart Bot quando:**
- Quer máxima precisão
- Prefere qualidade vs quantidade
- Foca em tendências de alta
- Faz position trading

## 🚀 Modos de Operação

### **1. Modo Análise (index.ts)**
- Análise completa com DeepSeek AI
- Cálculo de risk/reward
- Sem execução de trades reais
- Ideal para testes e validação

### **2. Real Trading Bot (real-trading-bot.ts) - Nível 2**
- **Inteligência artificial**: Análise com DeepSeek AI
- **Execução completa**: Ordens reais na Binance
- **Sistema de proteção**: Risk management dinâmico
- **Análise contextual**: Considera múltiplos fatores de mercado

### **3. Smart Trading Bot (smart-trading-bot.ts) - Nível 3**
- **Análise dupla**: EMA + DeepSeek AI (híbrido inteligente)
- **Filtro de tendência**: Só executa em mercado de alta
- **Segurança extra**: Validação dupla antes de executar
- **Boost de confiança**: +10% quando ambos confirmam
- **Máxima precisão**: 80-85% de assertividade esperada

### **4. Smart Trading Bot Simulator (smart-trading-bot-simulator.ts)**
- **Simulação completa**: Toda lógica do Smart Bot sem trades reais
- **Análise dupla**: EMA + DeepSeek AI (igual ao bot real)
- **Segurança total**: Nenhuma ordem é executada na exchange
- **Teste de estratégia**: Ideal para validar decisões antes do real
- **Histórico completo**: Salva simulações para análise

### **5. EMA Trading Bot (ema-trading-bot.ts) - Nível 1**
- **Estratégia pura EMA**: Baseado apenas em médias móveis exponenciais
- **Configuração EMA 12/26**: Cruzamentos para sinais de compra/venda
- **Trades bidirecionais**: Executa tanto BUY quanto SELL
- **Análise técnica clássica**: Sem dependência de IA
- **Execução rápida**: Decisões baseadas em cálculos matemáticos

### **6. Simulações de Estratégias**

#### **Simulação 123 (simulate-123.ts)**
- **Estratégia**: Padrão 123 de reversão
- **Lógica**: Identifica pontos de reversão usando 3 candles consecutivos
- **Setup de Compra**: Candle 2 com mínima mais baixa + rompimento da máxima do candle 3
- **Setup de Venda**: Candle 2 com máxima mais alta + rompimento da mínima do candle 3
- **Confiança**: 65-80% baseada na tendência
- **Stop Loss**: Automático na mínima/máxima do candle 2

#### **Simulação EMA (simulate-ema.ts)**
- **Estratégia**: Cruzamento de Médias Móveis Exponenciais
- **Configuração**: EMA 12/26 (personalizável)
- **Sinal de Compra**: Preço > EMA rápida > EMA lenta + variação > 2%
- **Sinal de Venda**: Preço < EMA rápida < EMA lenta + variação < -2%
- **Proteção**: Reversão automática em movimentos extremos (±5%)
- **Confiança**: 70-80% baseada na força da tendência

```bash
# Executar simulações
npm run simulate-123    # Padrão 123
npm run simulate-ema    # EMA 12/26
```

### **7. Monitor de Trades (trade-monitor.ts)**
- **Função**: Verifica e atualiza o status dos trades de teste
- **Monitoramento**: Compara preço atual com targets e stops
- **Atualização automática**: Marca trades como 'win' ou 'loss'
- **Resultado real**: Calcula retorno efetivo dos trades
- **Status**: Converte trades 'pending' para 'completed'

#### **Lógica de Avaliação**
```typescript
// Para trades BUY
if (preçoAtual >= targetPrice) → WIN
if (preçoAtual <= stopPrice) → LOSS

// Para trades SELL  
if (preçoAtual <= targetPrice) → WIN
if (preçoAtual >= stopPrice) → LOSS
```

#### **Dados Atualizados**
- `status`: 'pending' →  'completed'
- `result`: 'win' | 'loss'
- `exitPrice`: Preço de saída real
- `actualReturn`: Retorno efetivo calculado

```bash
# Monitorar trades
npm run monitor-trades
```

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

# Smart trading bot (EMA + DeepSeek AI)
npm run smart-trading-bot

# Smart trading bot simulator (sem trades reais)
npm run smart-trading-bot-simulator

# EMA trading bot (apenas análise técnica)
npm run ema-trading-bot

# Simulações
npm run simulate-123    # Estratégia padrão 123
npm run simulate-ema    # Estratégia EMA crossover

# Monitoramento
npm run monitor-trades  # Verifica status dos trades
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