# 03 — Módulos do MVP

## 1. Dashboard

### Objetivo
Visão consolidada da saúde do clube em tempo real. O gestor abre o sistema e em segundos sabe o que precisa de atenção.

### Cards de métricas (topo)
| Card | Dado | Observação |
|---|---|---|
| Atletas | Total cadastrados | Link para /atletas |
| Turmas | Total ativas | Link para /turmas |
| Receita (mês) | Soma de entradas no mês atual | Apenas entradas confirmadas |
| Despesas (mês) | Soma de saídas no mês atual | |
| Saldo | Receita - Despesas | Pode ser negativo |
| Pendentes | Total de cobranças não pagas | Destacado em âmbar se > 0 |
| Dívidas | Total em atraso (vencimento passado) | Destacado em vermelho se > 0 |

### Seções do dashboard
- **Status de saúde dos atletas:** Saudáveis / Lesionados / Em recuperação
- **Alertas de evasão:** Lista de atletas com 3+ faltas consecutivas — com botão deep link WhatsApp
- **Turmas do dia:** Lista das turmas com treino hoje
- **Atletas recentes:** Últimos cadastrados
- **Gráfico Receita e Despesas:** Últimos 6 meses
- **Gráfico Crescimento de Atletas:** Evolução do número de atletas

### Filtro de período
Selector no canto superior direito: Últimos 30 dias / 3 meses / 6 meses / 12 meses / Ano atual

---

## 2. Atletas

### Objetivo
Cadastro e gestão completa de todos os atletas do clube.

### Listagem
- Cards grid com: foto (ou avatar com iniciais), nome, apelido, número, status e saúde
- Busca por nome, apelido ou CPF
- Filtros: status (titular, novato, afastado, selecionado), saúde (saudável, lesionado, em recuperação), turma
- Métricas no topo: Total / Titulares / Lesionados / Afastados

### Cadastro de atleta
**Dados pessoais:**
- Nome completo (obrigatório)
- Apelido / nome de guerra
- CPF (obrigatório — usado como login no app)
- Data de nascimento
- Telefone (do atleta)
- Telefone do responsável (para menores)
- E-mail (opcional)
- Foto de perfil

**Dados esportivos:**
- Número da camisa
- Posição
- Status: Titular / Novato / Selecionado / Afastado
- Status de saúde: Saudável / Lesionado / Em recuperação
- Turma(s) vinculada(s)
- Data de entrada no clube

**Ficha de saúde:**
- Histórico de lesões (campo texto + data)
- Observações médicas
- Tipo sanguíneo

### Ações por atleta
- Editar cadastro
- Ver perfil completo (frequência, cobranças, histórico)
- Gerar link de acesso ao app
- Marcar como afastado / inativo
- Excluir (com confirmação)

### Link de cadastro
- Botão "Link de Cadastro" na listagem gera URL única
- Atleta preenche o próprio formulário (sem senha, sem e-mail — só dados básicos)
- Gestor revisa e confirma

---

## 3. Turmas

### Objetivo
Organizar os atletas em grupos de treinamento com horários definidos.

### Listagem
- Cards com: nome da turma, ícone, horário, dia(s) da semana, quantidade de atletas
- Barra de progresso: turmas usadas / limite do plano
- Botão "+ Nova Turma"

### Criação de turma
- Nome da turma (ex: "Sub-15 Manhã", "Treino Oficial Terça")
- Dias da semana (múltipla seleção)
- Horário de início e fim
- Descrição (opcional)
- Local / quadra (opcional)

### Gestão de atletas na turma
- Dentro da turma: lista de atletas vinculados
- Adicionar atletas: busca e seleção
- Remover atletas individualmente
- Ver frequência da turma

---

## 4. Frequência

### Objetivo
Controle de presença dos atletas por treino, com alertas automáticos de evasão.

### Vista principal
- Calendário semanal (Seg → Dom)
- Dia atual destacado
- Pontos nos dias com turmas agendadas
- Seleção de dia mostra turmas daquele dia

### Registro de presença
- Para cada turma do dia: lista de atletas com toggle presente/ausente
- Registro em massa: "Marcar todos como presentes" + desmarcar individualmente
- Botão "Registrar" confirma a frequência daquela turma naquele dia
- Botão "Baixa" marca treino como não realizado (sem registrar ausências)

### Abas
| Aba | Conteúdo |
|---|---|
| Registrar | Vista semanal + registro do dia |
| Por Turma | Histórico de frequência filtrado por turma |
| Ranking | Atletas ordenados por % de presença |
| Alertas | Atletas com risco de evasão |

### Alerta de evasão (regra de negócio)
- Critério: atleta com 3 ou mais faltas **consecutivas** em qualquer turma
- O sistema verifica diariamente via cron job
- Alerta aparece na aba "Alertas" e no Dashboard principal
- Cada alerta tem botão de deep link WhatsApp com mensagem pré-pronta:
  > "Oi [Nome do responsável], notamos que [Nome do atleta] faltou às últimas aulas. Está tudo bem? Sentimos falta dele! 💙"
- Gestor pode dispensar o alerta (flag `alerta_dispensado = true`)

---

## 5. Calendário

### Objetivo
Visão temporal de treinos e eventos do clube.

### Vista mensal
- Calendário padrão mês a mês
- Pontos nos dias com eventos/treinos
- Clique no dia abre painel lateral com os eventos daquele dia

### Tipos de evento
- **Treino** (gerado automaticamente pelas turmas cadastradas)
- **Evento manual** (criado pelo gestor — ex: reunião, festa, viagem)

### Criação de evento manual
- Título
- Data e horário
- Descrição
- Turmas envolvidas (opcional)

### Detalhe do dia
- Lista de eventos ordenados por horário
- Para treinos: nome da turma, horário, atletas vinculados
- Para eventos: título, descrição

---

## 6. Financeiro (Remodulado)

> Documentação detalhada em [06-financeiro.md](./06-financeiro.md)

### Estrutura em 3 camadas

```
PLANEJAMENTO → (ativar) → CAIXINHA ATIVA → (registrar pagamento) → DASHBOARD
```

### Resumo do módulo
- **Planejamento:** gestor cria planos de cobrança (inativo por padrão)
- **Caixinhas:** planejamento ativado — gera cobranças automáticas por atleta
- **Dashboard:** entradas (vinculadas a caixinhas) e saídas (gerais) registradas manualmente ou automaticamente via webhook

---

## 7. Configurações

### Abas
| Aba | Conteúdo |
|---|---|
| Ajustes da Equipe | Nome, modalidade, CNPJ, telefone, e-mail, logotipo |
| Ajustes do Responsável | Foto, nome, CPF, telefone, e-mail |
| Acessos | Link portal do atleta + gerenciar acessos por CPF |
| Assinatura | Plano atual + uso de recursos + botão para alterar plano |
| Gestores | Lista de gestores adicionais (até 5 no Pro) + adicionar/remover |

---

## Módulos Pós-MVP

### Competições
- Cadastro de competições (nome, data, local, categoria)
- Status: próximas / inscrições abertas / realizadas
- Countdown de dias/horas
- Registro de resultados e classificação

### Equipe (Comissão Técnica)
- Cadastro de treinadores, preparadores físicos, auxiliares
- Roles e permissões específicas por cargo
- Pode evoluir para gestor adicional com permissões limitadas

### Academia
- Hub de cursos, guias e editais de fomento
- Parceiros: COB/IOB, Sebrae, FIFA, CBF Academy
- Filtros por nível e categoria
- Diferencial de retenção — gestor encontra valor além do software
