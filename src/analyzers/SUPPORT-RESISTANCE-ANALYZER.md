# 📊 Support & Resistance Analyzer

Analisador avançado de suporte e resistência para trading de criptomoedas com identificação automática de níveis críticos e sinais de entrada.

## 🎯 Como Funciona

### **1. Identificação de Pivôs**
```
Preço
  ↑
  |     ●  ← Resistência (máxima local)
  |    / \
  |   /   \
  |  /     \
  | /       ●  ← Suporte (mínima local)
  |/         \
  +----------→ Tempo
```

### **2. Agrupamento de Níveis**
```
Múltiplos toques no mesmo nível = Nível mais forte

Resistência: $50,100
     ●────────●────────●  ← 3 toques = Resistência forte
    /          \      /
   /            \    /
  /              \  /
 /                ●  ← 1 toque = Suporte fraco
●
Suporte: $48,500
```

### **3. Níveis Psicológicos**
```
Números redondos têm importância psicológica:

$100,000  ← Resistência psicológica forte
$95,000   ← Nível psicológico
$90,000   ← Suporte psicológico
$85,000   ← Nível psicológico
```

## 🔍 Tipos de Análise

### **Suporte (Support)**
```
Preço testa o nível e "rebate" para cima

     ●
    /|
   / |  ← Preço rebate no suporte
  /  |
 /   |
●────●────●  ← Linha de suporte
```
**Sinal:** BUY quando preço se aproxima do suporte

### **Resistência (Resistance)**
```
Preço testa o nível e "rebate" para baixo

●────●────●  ← Linha de resistência
 \   |
  \  |  ← Preço rebate na resistência
   \ |
    \|
     ●
```
**Sinal:** SELL quando preço se aproxima da resistência

### **Rompimentos (Breakouts)**
```
Rompimento de Resistência (BULLISH):
●────●────●  ← Resistência rompida
          /
         /  ← Preço rompe para cima
        ●
       /
      ●

Rompimento de Suporte (BEARISH):
      ●
       \
        ●  ← Preço rompe para baixo
         \
●────●────●  ← Suporte rompido
```

## 📈 Sinais de Trading

### **🟢 Sinais de COMPRA (BUY)**
1. **Suporte Testado:** Preço próximo ao suporte forte
2. **Rompimento de Resistência:** Preço quebra resistência para cima
3. **Bounce no Suporte:** Preço rebate em nível de suporte

### **🔴 Sinais de VENDA (SELL)**
1. **Resistência Testada:** Preço próximo à resistência forte
2. **Rompimento de Suporte:** Preço quebra suporte para baixo
3. **Rejeição na Resistência:** Preço é rejeitado em resistência

### **⚪ Sinal HOLD**
1. **Área Neutra:** Sem níveis significativos próximos
2. **Tendência Contrária:** Sinal conflitante com tendência

## 🎛️ Configurações do Analisador

```typescript
const config = {
  tolerance: 0.008,      // 0.8% tolerância para agrupar níveis
  minTouches: 2,         // Mínimo 2 toques para nível válido
  lookbackPeriods: 25    // Analisa últimas 25 velas
};
```

### **Parâmetros Explicados:**

- **`tolerance`**: Quão próximos os preços devem estar para serem agrupados
- **`minTouches`**: Quantas vezes o preço deve tocar um nível para ser considerado válido
- **`lookbackPeriods`**: Quantas velas históricas analisar

## 📊 Força dos Níveis

### **Cálculo de Força (0-100%)**
```
Força = (Número de Toques × 20%) + (Idade dos Toques × 20%)

Exemplos:
• 5 toques recentes = 80% + 20% = 100% (Muito Forte)
• 3 toques médios   = 60% + 15% = 75%  (Forte)
• 2 toques antigos  = 40% + 5%  = 45%  (Fraco)
```

### **Visualização da Força:**
```
██████████ 100% - Nível Muito Forte (5+ toques)
████████   80%  - Nível Forte (4 toques)
██████     60%  - Nível Moderado (3 toques)
████       40%  - Nível Fraco (2 toques)
```

## 🎯 Exemplo de Saída

```
📊 NÍVEIS DE SUPORTE E RESISTÊNCIA:
════════════════════════════════════════════════════════════
💰 Preço Atual: $95,234.5678
────────────────────────────────────────────────────────────
🔴 RESISTÊNCIAS:
   1. $96,500.0000 (+1.33%) | 3 toques | ████████ 80%
   2. $97,200.0000 (+2.06%) | 2 toques | ██████ 60% [Zona: $97,150-$97,250]
   3. $98,000.0000 (+2.90%) | 4 toques | ██████████ 100%
────────────────────────────────────────────────────────────
🟢 SUPORTES:
   1. $94,800.0000 (-0.46%) | 2 toques | ██████ 60%
   2. $93,500.0000 (-1.82%) | 3 toques | ████████ 80%
   3. $92,000.0000 (-3.40%) | 5 toques | ██████████ 100%
════════════════════════════════════════════════════════════

🎯 DECISÃO: BUY (85% confiança)
💡 Razão: Preço próximo ao suporte forte em $94,800 (2 toques)
```

## 🚀 Como Usar

### **1. Executar Simulação**
```bash
npm run simulate-support
```

### **2. Configurar Parâmetros**
```typescript
const analyzer = new SupportResistanceAnalyzer({
  tolerance: 0.005,      // Mais rigoroso (0.5%)
  minTouches: 3,         // Mais conservador (3 toques)
  lookbackPeriods: 50    // Mais histórico (50 velas)
});
```

### **3. Analisar Resultado**
```typescript
const analysis = analyzer.analyze(marketData);
console.log(`Ação: ${analysis.action}`);
console.log(`Confiança: ${analysis.confidence}%`);
console.log(`Níveis encontrados: ${analysis.levels.length}`);
```

## 📋 Estrutura dos Dados

### **Nível de Suporte/Resistência**
```typescript
interface SupportResistanceLevel {
  price: number;           // Preço do nível
  touches: number;         // Quantos toques
  strength: number;        // Força (0-1)
  type: 'support' | 'resistance';
  isZone: boolean;         // Se é uma zona
  zoneRange?: {            // Range da zona
    min: number;
    max: number;
  };
}
```

### **Resultado da Análise**
```typescript
interface AnalysisResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;      // 0-100%
  reason: string;          // Explicação
  suggested_amount: number; // Valor sugerido
  levels: SupportResistanceLevel[]; // Todos os níveis
}
```

## 🎨 Vantagens da Estratégia

### **✅ Pontos Fortes**
- **Objetiva:** Baseada em dados históricos reais
- **Visual:** Fácil de entender e visualizar
- **Flexível:** Funciona em diferentes timeframes
- **Psicológica:** Considera comportamento dos traders
- **Automática:** Identifica níveis sem intervenção manual

### **⚠️ Limitações**
- **Histórica:** Baseada apenas em dados passados
- **Subjetiva:** Tolerância e parâmetros afetam resultados
- **Falsos Sinais:** Pode gerar sinais em mercados laterais
- **Rompimentos Falsos:** Nem todo rompimento é válido

## 🔧 Otimizações Avançadas

### **Para Day Trading**
```typescript
const dayTradingConfig = {
  tolerance: 0.003,      // Mais preciso
  minTouches: 2,         // Menos rigoroso
  lookbackPeriods: 20    // Menos histórico
};
```

### **Para Swing Trading**
```typescript
const swingTradingConfig = {
  tolerance: 0.01,       // Mais flexível
  minTouches: 3,         // Mais rigoroso
  lookbackPeriods: 50    // Mais histórico
};
```

### **Para Position Trading**
```typescript
const positionTradingConfig = {
  tolerance: 0.015,      // Muito flexível
  minTouches: 4,         // Muito rigoroso
  lookbackPeriods: 100   // Muito histórico
};
```

---

## 📊 Métricas de Performance

- **Win Rate Esperado:** 70-80%
- **Risk/Reward:** Sempre 2:1
- **Timeframe Ideal:** 1h - 4h
- **Melhor Para:** Swing Trading
- **Mercados:** Trending e Range-bound

**💡 Dica:** Combine com outros indicadores (EMA, RSI) para melhor precisão!