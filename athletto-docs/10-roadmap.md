# 10 — Roadmap Pós-MVP

## Visão de Evolução

```
MVP (agora)          v2.0                  v3.0
─────────────────    ──────────────────    ──────────────────
Atletas              Competições           Analytics avançado
Turmas               Equipe técnica        Cards de evolução
Frequência           Cards de evolução     ASAAS (Pro)
Calendário           Notificações push     Marketplace clubes
Financeiro           Exportação PDF/Excel  IA preditiva
App Flutter          PWA gestor            API pública
```

---

## Fase 2 — Primeiras Expansões

### Módulo de Competições
**Por que:** gestor que usa o financeiro e a frequência vai querer registrar os resultados das competições dentro da mesma plataforma.

**Funcionalidades:**
- Cadastro de competições (nome, data, local, categoria, organização)
- Status: próximas / inscrições abertas / realizadas / canceladas
- Countdown de dias e horas até o evento
- Lista de atletas convocados (seleção do plantel)
- Registro de resultado (placar, posição final)
- Histórico de participações por atleta

---

### Módulo de Equipe Técnica
**Por que:** gestor quer registrar treinadores e preparadores dentro do sistema.

**Funcionalidades:**
- Cadastro de membros da comissão técnica (nome, cargo, contato)
- Roles: treinador, preparador físico, auxiliar, médico, coordenador
- Vinculação a turmas específicas
- Pode evoluir para acesso de gestor adicional com permissões limitadas

---

### Cards de Evolução do Atleta
**Por que:** diferencial de retenção mais forte — o pai vira dependente do card e cobra o gestor.

**Como funciona:**
1. Treinador avalia critérios por atleta (ex: Passe 7/10, Defesa 8/10, Disciplina 9/10)
2. Critérios são customizáveis por modalidade
3. Sistema gera card visual estilo "card de jogador"
4. Card aparece no app Flutter do atleta/pai
5. Botão "Compartilhar" gera imagem para Instagram/WhatsApp

**Efeito colateral positivo:** pai compartilha o card → marketing orgânico gratuito para o clube → outros pais perguntam "que app é esse?" → gestor vira evangelista do Athletto.

---

### Notificações Push (App Flutter)
**Por que:** hoje tudo depende do gestor enviar WhatsApp manualmente.

**Notificações planejadas:**
- Cobrança gerada (atleta/pai)
- Cobrança paga (confirmação)
- Lembrete D-3 e D-1 antes do vencimento
- Alerta de frequência baixa (pai)
- Novo evento no calendário

**Tech:** Firebase Cloud Messaging (FCM) — já compatível com Flutter.

---

### Exportação de Relatórios
**Por que:** feature de "baixo custo de implementação, alto impacto de percepção de valor profissional".

**Relatórios planejados:**
- Lista de atletas (PDF/Excel)
- Frequência por turma e período (PDF/Excel)
- Extrato financeiro (PDF)
- Cobranças pendentes (PDF — para impressão)
- Relatório de caixinha (PDF)

---

## Fase 3 — Inteligência e Escala

### Analytics Inteligente
**Indicadores de saúde do clube:**
- Taxa de retenção mensal (atletas que continuaram vs. que saíram)
- Previsão de receita do próximo mês (baseada em caixinhas ativas)
- Atletas em risco por múltiplos fatores (frequência + atrasos financeiros)
- Comparativo de crescimento mês a mês
- Distribuição por faixa etária e posição

---

### PWA do Gestor
**Por que:** gestor que está em quadra não quer abrir o browser — quer um ícone na tela inicial.

**Implementação:**
- Web App Manifest + Service Worker
- Instalável no celular iOS e Android sem passar pela loja
- Foco em: registro de frequência e consulta de atletas (uso em quadra)
- Cache offline para dados básicos (lista de atletas da turma)

---

### ASAAS — Plano Pro
**Por que:** clubes maiores têm pais que não usam Pix ou precisam parcelar.

**O que adiciona:**
- Boleto bancário
- Cartão de crédito (parcelamento)
- Régua de cobrança automática (e-mail + SMS + WhatsApp Business via ASAAS)
- Subcontas por clube (possibilidade de futura receita por split)

**Estratégia:** AbacatePay e ASAAS coexistem — clube escolhe no onboarding do plano Pro. Interface do gestor não muda (abstração no backend).

---

### Academia de Conhecimento
**Por que:** diferencial de retenção — gestor encontra valor além do software.

**Conteúdos:**
- Cursos gratuitos: COB/IOB, Sebrae, FIFA Training Centre, CBF Academy
- Guias: Lei de Incentivo ao Esporte, editais de captação
- Templates: contratos, comunicados para pais, relatórios de desempenho
- Filtros: nível (iniciante/intermediário/avançado), categoria (gestão/técnico/financeiro)

---

## Fase 4 — Crescimento de Plataforma

### Marketplace de Clubes
**Conceito:** com base de clubes cadastrados por modalidade e região, criar diretório público.

- Atleta busca clube por modalidade + cidade
- Clube tem página pública com informações e link de cadastro
- Atleta solicita vaga → gestor aprova
- Novo fluxo de receita: clube destaque, clube verificado

### API Pública
- Para integradores e parceiros
- Webhooks de saída (ex: notificar sistema externo quando atleta paga)
- Documentação estilo Stripe (developer experience first)

### IA Preditiva
- Previsão de evasão baseada em ML (frequência + financeiro + sazonalidade)
- Sugestão de horários de turma baseada em padrões de presença
- Análise de performance coletiva por competição

---

## Priorização Simplificada

| Feature | Impacto | Esforço | Prioridade |
|---|---|---|---|
| Notificações push | Alto | Médio | 🔴 Alta |
| Cards de evolução | Alto | Médio | 🔴 Alta |
| Exportação PDF/Excel | Alto | Baixo | 🔴 Alta |
| Competições | Médio | Médio | 🟡 Média |
| Equipe técnica | Médio | Baixo | 🟡 Média |
| PWA gestor | Médio | Baixo | 🟡 Média |
| Analytics inteligente | Alto | Alto | 🟡 Média |
| ASAAS Pro | Alto | Alto | 🟡 Média |
| Academia | Médio | Alto | 🟢 Baixa |
| Marketplace | Alto | Muito alto | 🟢 Longo prazo |
| API pública | Médio | Alto | 🟢 Longo prazo |
| IA preditiva | Alto | Muito alto | 🟢 Longo prazo |
