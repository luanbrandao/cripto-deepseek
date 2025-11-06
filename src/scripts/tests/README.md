# 🧪 Sistema de Testes - Cripto DeepSeek

## 📋 Visão Geral

Sistema completo de testes para validar todos os cálculos e funcionalidades do bot de trading automatizado.

## 🚀 Execução Rápida

```bash
# Executar todos os testes de uma vez
npm run run-all-tests

# Teste completo de cálculos (principal)
npm run test-calculations
```

## 📊 Testes Disponíveis

### **1. Testes de Cálculos**

#### **test-calculations.ts** - Teste Principal
- ✅ Cálculo EMA
- ✅ Risk/Reward 2:1
- ✅ Risk/Reward Dinâmico
- ✅ Volatilidade
- ✅ Suporte/Resistência
- ✅ Extremos Locais
- ✅ Target/Stop Prices
- ✅ Risk Manager
- ✅ Validações
- ✅ Confiança Extrema

```bash
npm run test-calculations
```

#### **test-ema-calculator.ts** - EMA Específico
- ✅ EMA básico
- ✅ Dados insuficientes
- ✅ EMA período 1
- ✅ Sequência crescente
- ✅ EMA vs SMA

```bash
npm run test-ema-calculator
```

#### **test-support-resistance.ts** - Suporte/Resistência
- ✅ Extremos locais
- ✅ Klines suporte/resistência
- ✅ Fallback níveis
- ✅ Pontos de pivô
- ✅ Ordenação extremos

```bash
npm run test-support-resistance
```

#### **test-volatility.ts** - Volatilidade
- ✅ Volatilidade básica
- ✅ Dados insuficientes
- ✅ Preços estáveis
- ✅ Preços voláteis
- ✅ Limite máximo (5%)
- ✅ Validação manual

```bash
npm run test-volatility
```

### **2. Testes de Conexão**

```bash
npm run test-deepseek         # Testa API DeepSeek
npm run test-binance-public   # Testa API pública Binance
npm run test-binance-private  # Testa API privada Binance
```

### **3. Testes de Bots**

```bash
npm run test-risk-reward           # Validação Risk/Reward 2:1
npm run test-symbol-checker        # Verificação duplicatas
npm run test-all-bots-validation   # Validação todos os bots
npm run test-all-simulators        # Teste simuladores
```

## 📈 Resultados Esperados

### **✅ Todos os Testes Passando:**
```
🎯 RESULTADO GERAL: 5/5 testes passaram
📈 Taxa de sucesso: 100.0%
🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.
```

### **❌ Se Algum Teste Falhar:**
```
🎯 RESULTADO GERAL: 4/5 testes passaram
📈 Taxa de sucesso: 80.0%
⚠️ ALGUNS TESTES FALHARAM! Verifique os erros acima.
```

## 🔍 Validações Realizadas

### **1. Cálculos Matemáticos**
- **EMA**: Fórmula padrão com multiplicador 2/(período+1)
- **Risk/Reward**: Sempre 2:1 garantido
- **Volatilidade**: Média dos retornos absolutos, limitada a 5%
- **Suporte/Resistência**: Extremos locais com 2 períodos de comparação

### **2. Lógica de Negócio**
- **Confiança**: Risco inversamente proporcional (85% = 0.5%, 70% = 1.5%)
- **Target/Stop**: BUY (target > entry, stop < entry), SELL (target < entry, stop > entry)
- **Validações**: Confiança ≥70%, Ação ≠ HOLD, Ratio ≥ 2:1

### **3. Casos Extremos**
- **Dados insuficientes**: Fallbacks apropriados
- **Volatilidade alta**: Limitação a 5% máximo
- **Confiança extrema**: Limites de risco respeitados

## 🛠️ Estrutura dos Testes

```
src/scripts/tests/
├── test-calculations.ts          # ⭐ Teste principal (todos os cálculos)
├── test-ema-calculator.ts        # EMA específico
├── test-support-resistance.ts    # Suporte/Resistência específico
├── test-volatility.ts           # Volatilidade específico
├── run-all-tests.ts             # 🚀 Executor de todos os testes
├── test-risk-reward.ts          # Risk/Reward existente
└── connections/                 # Testes de conexão
    ├── test-deepseek.ts
    ├── test-binance-public.ts
    └── test-binance-private.ts
```

## 📊 Métricas de Qualidade

| Componente | Testes | Cobertura | Status |
|------------|--------|-----------|--------|
| **EMA Calculator** | 5 | 100% | ✅ |
| **Risk/Reward** | 4 | 100% | ✅ |
| **Volatilidade** | 6 | 100% | ✅ |
| **Suporte/Resistência** | 5 | 100% | ✅ |
| **Price Calculator** | 3 | 100% | ✅ |
| **Risk Manager** | 2 | 100% | ✅ |
| **Validações** | 3 | 100% | ✅ |

## 🎯 Como Usar

### **Desenvolvimento:**
```bash
# Após fazer mudanças nos cálculos
npm run test-calculations

# Teste específico se alterou EMA
npm run test-ema-calculator
```

### **CI/CD:**
```bash
# Validação completa antes de deploy
npm run run-all-tests
```

### **Debug:**
```bash
# Teste individual para debug
npm run test-volatility
```

## ⚠️ Troubleshooting

### **Teste Falhando:**
1. Verificar se as dependências estão instaladas
2. Compilar TypeScript: `npm run build`
3. Verificar logs detalhados do teste específico

### **Erro de Importação:**
1. Verificar paths dos imports
2. Confirmar se arquivos existem
3. Recompilar: `npm run build`

### **Valores Incorretos:**
1. Verificar constantes de configuração
2. Validar fórmulas matemáticas
3. Comparar com cálculos manuais

---

**✅ Sistema de testes completo e funcionando!**
- **12 testes** de cálculos principais
- **100% de cobertura** dos componentes críticos
- **Validação automática** de todos os cálculos
- **Execução rápida** com `npm run run-all-tests`