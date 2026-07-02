# 06 — Financeiro: Detalhamento Completo

## Visão Geral da Remodulação

O módulo financeiro anterior era simples demais: entradas e saídas manuais sem estrutura. O novo modelo tem 3 camadas bem definidas:

```
┌─────────────────────────────────────────┐
│           PLANEJAMENTO                  │
│  (rascunho / inativo)                   │
│  Gestor define: nome, valor, atletas,   │
│  tipo, vencimento                       │
└──────────────────┬──────────────────────┘
                   │ ativar
                   ▼
┌─────────────────────────────────────────┐
│           CAIXINHA ATIVA                │
│  Cobrança gerada automaticamente        │
│  Link Pix por atleta (AbacatePay)       │
│  Saldo isolado e rastreável             │
└──────────────────┬──────────────────────┘
                   │ pagamento confirmado
                   ▼
┌─────────────────────────────────────────┐
│         DASHBOARD FINANCEIRO            │
│  Entradas (auto via webhook + manuais)  │
│  Saídas (manuais)                       │
│  Saldo geral + saldo por caixinha       │
└─────────────────────────────────────────┘
```

---

## Tela: Planejamento

### URL: `/financeiro/planejamento`

### Layout
```
[← Voltar ao Financeiro]

PLANEJAMENTOS
Crie e gerencie seus planos de cobrança

[+ Novo Planejamento]

Filtros: [Todos] [Inativos] [Ativos] [Encerrados]

┌─────────────────────────────────────────────────────────┐
│ Mensalidade Junho 2026            [INATIVO]             │
│ Recorrente · Mensal · R$ 150,00                         │
│ 32 atletas · Vence dia 10                               │
│                          [Ativar] [Editar] [Excluir]    │
├─────────────────────────────────────────────────────────┤
│ Uniforme 2026                     [ATIVO]               │
│ Cobrança única · R$ 120,00                              │
│ 28 atletas · Vencimento: 30/06/2026                     │
│                          [Encerrar] [Ver Caixinha]      │
└─────────────────────────────────────────────────────────┘
```

### Formulário: Novo Planejamento

**Seção 1 — Identificação**
- Nome do planejamento* (ex: "Mensalidade Junho", "Uniforme 2026", "Torneio Regional")
- Descrição (opcional)

**Seção 2 — Cobrança**
- Tipo*: `[○ Recorrente]  [○ Cobrança única]`
- Valor*: R$ ___
- Se recorrente:
  - Periodicidade*: `[Mensal ▼]` (mensal / bimestral / trimestral / semestral / anual)
  - Dia de vencimento*: `[10 ▼]` (1 a 28 — evitar 29/30/31 por meses variáveis)
- Se único:
  - Data de vencimento*: `[📅 __/__/____]`

**Seção 3 — Atletas**
```
Selecionar atletas para este planejamento

[Por turma]  [Individual]

─── Por turma ───────────────────────────────
[☐] Treino Oficial (32 atletas)
[☐] Treino Sub-15 (18 atletas)
[☐] Treino Avançado (12 atletas)

[Marcar todos]

─── Preview ─────────────────────────────────
32 atletas selecionados
Total previsto: R$ 4.800,00
```

**Ações**
- `[Salvar rascunho]` — salva inativo
- `[Salvar e ativar]` — salva e já gera cobranças (com confirmação)

---

## Tela: Dashboard Financeiro

### URL: `/financeiro`

### Cards de resumo (topo)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Entradas    │ │   Saídas     │ │    Saldo     │ │  Pendentes   │
│  R$ 3.200    │ │   R$ 800     │ │  R$ 2.400    │ │      28      │
│  este mês    │ │  este mês    │ │              │ │  cobranças   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Botões de ação
```
[+ Entrada]  [- Saída]
```

### Tabs
```
[Dashboard] [Extrato] [Caixinhas] [Pendentes]
```

### Tab: Dashboard
- Gráfico: Receitas e Despesas (barras, últimos 6 meses)
- Gráfico: Fluxo de Caixa (linha, últimos 6 meses)
- Gráfico: Distribuição por categoria (pie das saídas)

### Tab: Extrato
```
Filtros: [Período ▼] [Tipo: Todos ▼] [Caixinha ▼]

Data        Descrição              Caixinha         Atleta      Valor
─────────────────────────────────────────────────────────────────────
13/05/2026  Pagamento recebido     Mensalidade Jun  João Silva  +R$150
13/05/2026  Aluguel da quadra      —                —           -R$500
12/05/2026  Pagamento recebido     Mensalidade Jun  Pedro Lima  +R$150
```

### Tab: Caixinhas
```
┌────────────────────────────────────────────────────────────┐
│ Mensalidade Junho 2026              [ATIVA]                │
│ Recorrente · Mensal · R$150/atleta                         │
│                                                            │
│ Previsto: R$4.800   Arrecadado: R$1.500   Pendente: R$3.300│
│ ████████░░░░░░░░░░░░░░░ 31%                                │
│ 10 pagos · 22 pendentes · 0 isentos                        │
│                              [Ver pendentes] [Encerrar]    │
├────────────────────────────────────────────────────────────┤
│ Uniforme 2026                       [ATIVA]                │
│ Cobrança única · R$120              Vence: 30/06/2026      │
│                                                            │
│ Previsto: R$3.360   Arrecadado: R$2.400   Pendente: R$960  │
│ ████████████████░░░░░░░ 71%                                │
│ 20 pagos · 8 pendentes · 0 isentos                         │
│                              [Ver pendentes] [Encerrar]    │
└────────────────────────────────────────────────────────────┘
```

### Tab: Pendentes
```
Filtros: [Todas as caixinhas ▼] [Vencimento ▼]

Buscar atleta...

Nome               Caixinha            Valor    Vencimento   Ação
──────────────────────────────────────────────────────────────────
João Silva         Mensalidade Jun     R$150    10/06/2026   [💬] [✓]
Maria Santos       Mensalidade Jun     R$150    10/06/2026   [💬] [✓]
Pedro Alves        Uniforme 2026       R$120    30/06/2026   [💬] [✓]
Carlos Mendes      Mensalidade Jun     R$150    10/06/2026   [💬] [✓]
                              [💬] = deep link WhatsApp
                              [✓] = marcar como pago manualmente
```

---

## Modal: Nova Entrada

```
Nova Entrada

Valor*               R$ [_________]
Data*                [📅 13/05/2026]
Caixinha             [Selecionar caixinha ▼]  (opcional)
Atleta               [Buscar atleta...   ▼]   (opcional)
Descrição            [_________________________]

                              [Cancelar] [Salvar entrada]
```

**Lógica:**
- Se caixinha + atleta selecionados: verifica se há cobrança pendente para esse par
- Se houver: pergunta "Marcar cobrança como paga?" e atualiza status
- Se não houver: registra só a transação (entrada avulsa)

---

## Modal: Nova Saída

```
Nova Saída

Valor*               R$ [_________]
Data*                [📅 13/05/2026]
Categoria*           [Selecionar categoria ▼]
                     ├── Aluguel / Quadra
                     ├── Material esportivo
                     ├── Árbitro / Juiz
                     ├── Transporte / Viagem
                     ├── Alimentação
                     ├── Inscrição em competição
                     └── Outros
Descrição            [_________________________]

                              [Cancelar] [Salvar saída]
```

---

## Regras de Negócio Financeiras

1. **Ativar planejamento:** só pode ativar se tiver pelo menos 1 atleta selecionado
2. **Gerar cobrança:** AbacatePay chamado na ativação — se falhar, planejamento volta para inativo e erro exibido
3. **Encerrar caixinha:** cobranças pendentes podem ser canceladas ou mantidas como históricas (gestor escolhe)
4. **Isenção:** gestor pode marcar atleta como isento em uma caixinha específica (sem gerar cobrança)
5. **Editar planejamento inativo:** qualquer campo editável
6. **Editar planejamento ativo:** somente nome e descrição — valor e atletas não podem ser alterados (afetaria cobranças já geradas)
7. **Reembolso:** sem suporte no MVP — gestor registra saída manual com categoria "Reembolso"
8. **Múltiplas caixinhas por atleta:** totalmente suportado — o atleta pode ter cobranças abertas em N caixinhas simultâneas
