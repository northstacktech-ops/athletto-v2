# Athletto — Planos, Precificação e Plano de Lucro

> Documento de apoio para apresentação aos sócios.
> Base: análise real da infraestrutura (Vercel + Supabase), arquitetura do produto e mercado de escolinhas/clubes esportivos no Brasil.
> Câmbio de referência: US$ 1 ≈ R$ 5,50. Valores de gateway (Pix) a confirmar com a operadora.

---

## 1. Resumo executivo

O Athletto é um **SaaS multi-tenant** (todos os clubes rodam na mesma infraestrutura, separados por `clube_id`). Isso tem uma consequência decisiva para o negócio:

- **O custo de infraestrutura é praticamente FIXO** (~R$ 280/mês) e atende **centenas de clubes** antes de precisar escalar.
- **O custo marginal por novo cliente é ~R$ 0.**
- Com o modelo de pagamento escolhido (cada clube usa a própria conta de recebimento), **não há custódia de dinheiro de terceiros** — somos software puro, sem risco regulatório sobre as mensalidades.

Resultado: a partir de **~4 clientes** a operação se paga, e cada cliente adicional é **~90%+ de margem**. É o perfil clássico de SaaS: baixo custo fixo, margem altíssima na escala.

---

## 2. Os 3 planos

| | 🟢 **Base** | 🔵 **Pro** *(Popular)* | 🟣 **Elite** |
|---|---|---|---|
| **Preço/mês** | **R$ 79** | **R$ 199** | **R$ 449** |
| Atletas | até 30 | até 100 | ilimitado |
| Turmas | 3 | 10 | ilimitado |
| Gestores | 1 | 3 | ilimitado |
| App do atleta (consulta + pagamento Pix) | ✅ | ✅ | ✅ |
| Frequência, financeiro, calendário, relatórios | ✅ | ✅ | ✅ |
| **Público-alvo** | Escolinha iniciante / professor autônomo | Escola estruturada, múltiplas turmas | Clube grande / vários núcleos |

**Âncora de valor:** com mensalidade média de R$ 80–150 por atleta, o plano representa **~1 a 2% do faturamento do clube** — trivial de justificar:

| Plano | Atletas | Faturamento estimado do clube/mês | Custo do Athletto | % do faturamento |
|---|---|---|---|---|
| Base | 30 × R$115 | ~R$ 3.450 | R$ 79 | ~2,3% |
| Pro | 100 × R$115 | ~R$ 11.500 | R$ 199 | ~1,7% |
| Elite | 200 × R$115 | ~R$ 23.000 | R$ 449 | ~2,0% |

> Os limites já são **aplicados automaticamente pelo sistema** (banco de dados bloqueia criar atleta/turma/gestor acima do plano, com aviso de upgrade). Testado e validado em todas as combinações.

---

## 3. Como está organizado no sistema

- **Diferenciação por capacidade** (nº de atletas/turmas/gestores) — o que é, ao mesmo tempo, o **driver de valor** (clube maior paga mais) e o **driver de uso** (mais dados/pagamentos).
- **Trial gratuito** (14–30 dias) como porta de entrada — **não há plano gratuito permanente** (evita custo sem receita e filtra curiosos).
- **Avisos proativos de limite**: ao se aproximar do teto ("Restam 2 vagas"), e ao atingir ("Você atingiu o limite do plano Base — faça upgrade"), com o botão de criação bloqueado e atalho para upgrade. Isso transforma o limite em **gatilho natural de upsell**.
- **App do atleta**: cada atleta tem acesso **somente de consulta**; a única ação é **pagar a mensalidade via Pix** (gera o código e confirma o pagamento). Detalhe técnico que **reduz custo**: o app do atleta usa autenticação própria — **não consome cota de usuários de autenticação**, então ter milhares de atletas não gera custo extra de login.

---

## 4. Estrutura de custos (real)

### 4.1. Custo FIXO — independe do nº de clubes
| Item | US$/mês | ~R$/mês |
|---|---|---|
| Vercel (Pro) | 20 | ~110 |
| Supabase (Pro: base + compute) | 25–35 | ~140–190 |
| Domínio | — | ~3 |
| **Total** | **~45–55** | **~R$ 250–300** |

Esse valor serve **todos** os clubes simultaneamente. Só sobe (de forma modesta) em escala alta (centenas de clubes / milhares de atletas), quando se aumenta o "compute" do banco.

### 4.2. Custo VARIÁVEL — quem paga é o clube
A única coisa que cresce com o uso é a **taxa por transação Pix** (mensalidade do atleta). **No nosso modelo, essa taxa é do clube, não nossa** (ver seção 5). Para nós, o custo marginal por cliente é **~R$ 0**.

---

## 5. Modelo de pagamento — sem vínculo financeiro (recomendado)

**Modelo escolhido: cada clube conecta a própria conta de recebimento (Pix/AbacatePay).**

- A mensalidade do atleta vai **direto para a conta do clube**. Não passa pela nossa conta.
- A taxa do Pix é **do clube**.
- **Não seguramos dinheiro de terceiros** → sem responsabilidade regulatória sobre os pagamentos. Somos só o software que gera e confirma a cobrança.

| Pagamento | Passa por nós? | Risco/vínculo financeiro |
|---|---|---|
| Atleta → clube (mensalidade) | ❌ (conta do clube) | **Nenhum** |
| Clube → Athletto (assinatura) | ✅ | Sim — é a nossa receita (precisa de meio de cobrança próprio) |

> **Alternativa futura (Modelo B):** atuar como agregador e cobrar um *markup* por transação (receita extra), ao custo de segurar/repassar dinheiro e mais complexidade regulatória. Fica como opção de monetização adicional, não no lançamento.

---

## 6. Plano de lucro — projeções

Premissas: custo fixo ~R$ 280/mês; custo marginal por cliente ~R$ 0 (Modelo A); mix de planos realista.

| Clientes (mix) | Receita/mês | Custo/mês | **Lucro/mês** | Margem | Lucro/ano |
|---|---|---|---|---|---|
| **Equilíbrio** | ~R$ 280 | R$ 280 | R$ 0 | — | — |
| 5 (3 Base · 2 Pro) | ~R$ 635 | R$ 280 | **~R$ 355** | ~56% | ~R$ 4,3 mil |
| 10 (6 Base · 3 Pro · 1 Elite) | ~R$ 1.520 | R$ 280 | **~R$ 1.240** | ~82% | ~R$ 14,9 mil |
| 25 (14 · 8 · 3) | ~R$ 4.045 | R$ 300 | **~R$ 3.745** | ~93% | ~R$ 44,9 mil |
| 50 (28 · 16 · 6) | ~R$ 8.090 | R$ 400 | **~R$ 7.690** | ~95% | ~R$ 92 mil |
| 100 (60 · 30 · 10) | ~R$ 15.200 | R$ 600 | **~R$ 14.600** | ~96% | ~R$ 175 mil |

**Ponto de equilíbrio: ~4 clientes Base (ou ~2 Pro).** Tudo acima disso é margem quase pura.

> O salto de margem (56% → 95%) acontece porque o custo é fixo: os primeiros clientes pagam a infraestrutura, e os seguintes são lucro direto.

---

## 7. Dicas e recomendações

1. **Trial, não grátis.** Mantenha 14–30 dias de teste e depois cobre. Plano gratuito permanente só gera custo e suporte sem receita.
2. **Cobrança anual com desconto** (ex.: "12 meses pelo preço de 10"). Melhora o caixa, reduz inadimplência e aumenta a retenção.
3. **Ancore no faturamento do cliente**, não no custo. "R$ 199 para gerir R$ 11 mil/mês" vende sozinho.
4. **Pro como plano "Popular"** (âncora psicológica): a maioria escolhe o do meio. Mantenha a distância de valor entre Base→Pro→Elite atraente.
5. **Upsell automático pelo limite.** O sistema já avisa e bloqueia ao atingir o teto — é o melhor momento para oferecer upgrade. Considere e-mail automático "seu clube está crescendo".
6. **Reduza atrito do pagamento da SUA assinatura.** Defina já como o clube paga o Athletto (Pix recorrente / cartão) — hoje o sistema cobra o atleta, mas falta o fluxo de cobrar o clube. É o que efetivamente coloca dinheiro no caixa.
7. **Custo está sob controle por muito tempo.** A infra fixa aguenta o crescimento inicial inteiro; não há "susto de conta" no caminho.
8. **Reforço de margem (futuro):** se um dia quiser, o Modelo B (markup em pagamentos) vira uma 2ª fonte de receita recorrente sobre o volume transacionado.

---

## 8. Próximos passos para faturar de verdade

| Prioridade | Item | Status |
|---|---|---|
| 🔴 Alta | **Cobrança da assinatura do clube** (Pix recorrente/cartão para os R$ 79/199/449) | A implementar |
| 🟠 Média | **Conta Pix por clube** (Modelo A) — hoje o código usa uma chave única; precisa suportar a chave de cada clube | A implementar |
| 🟢 Baixa | Confirmar tabela de taxas do gateway (para orientar os clubes) | A confirmar |

> **Observações finais:** valores de infraestrutura são reais (planos Pro de Vercel e Supabase já contratados). Os números de lucro são projeções com mix ilustrativo — ajuste o mix conforme a estratégia comercial. A taxa do Pix não impacta nossa margem no Modelo A (é custo do clube).

---

*Gerado em 2026-06-14 a partir da análise técnica e de custos do Athletto.*
