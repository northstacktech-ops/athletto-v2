# 05 — Fluxos Principais

## 1. Onboarding do Gestor

```
1. Gestor acessa athletto.com.br/cadastro
2. Preenche: nome, e-mail, senha, nome do clube, modalidade
3. Sistema cria: clube + gestor (role: principal)
4. Redireciona para o dashboard (trial de 30 dias)
5. Primeiro uso: wizard de configuração
   ├── Passo 1: Logo e dados do clube
   ├── Passo 2: Criar primeira turma
   └── Passo 3: Adicionar primeiros atletas (ou compartilhar link)
```

---

## 2. Cadastro de Atleta

### Via gestor (manual)
```
1. Gestor acessa /atletas → "+ Adicionar"
2. Preenche formulário completo
3. Sistema cria atleta com status de acesso "pendente"
4. Gestor vincula o atleta a uma ou mais turmas
5. Atleta aparece na listagem
```

### Via link de cadastro (self-service)
```
1. Gestor copia link: athletto.com.br/cadastro/{slug-do-clube}
2. Compartilha no WhatsApp/grupo
3. Atleta/pai acessa o link e preenche formulário simplificado
4. Dado fica pendente de revisão
5. Gestor revisa e confirma na listagem
6. Atleta é vinculado às turmas pelo gestor
```

---

## 3. Registro de Frequência

```
1. Gestor acessa /frequencia
2. Sistema mostra semana atual, dia hoje destacado
3. Gestor seleciona o dia desejado
4. Sistema lista turmas com treino naquele dia
5. Para cada turma:
   ├── Clica em "Registrar"
   ├── Lista de atletas com toggle presente/ausente
   ├── Por padrão: todos presentes
   ├── Gestor ajusta os ausentes
   └── Clica "Confirmar frequência"
6. Sistema salva e recalcula média de presença
7. Cron job noturno verifica alertas de evasão
```

---

## 4. Fluxo Financeiro Completo

### 4a. Criar Planejamento
```
1. Gestor acessa /financeiro → aba "Planejamento"
2. Clica "+ Novo Planejamento"
3. Preenche:
   ├── Nome (ex: "Mensalidade Junho 2026")
   ├── Tipo: Recorrente ou Único
   ├── Valor: R$ ___
   ├── Se recorrente: periodicidade + dia de vencimento
   ├── Se único: data de vencimento
4. Seleciona atletas:
   ├── Por turma (seleciona turma inteira)
   ├── Ou individualmente (busca e marca atletas de qualquer turma)
   └── "Marcar todos" disponível
5. Revisa e salva como "Inativo"
```

### 4b. Ativar Planejamento → Gerar Caixinha
```
1. Gestor vê planejamento na lista com status "Inativo"
2. Clica "Ativar"
3. Sistema exibe confirmação:
   "Isso irá gerar cobranças de R$[valor] para [N] atletas. Confirmar?"
4. Gestor confirma
5. Sistema:
   ├── Cria registro na tabela `caixinhas`
   ├── Para cada atleta vinculado:
   │    ├── Chama API AbacatePay → gera link Pix individual
   │    └── Cria registro em `cobranças` (status: pendente)
   ├── Atualiza planejamento.status = 'ativo'
   └── Atualiza caixinha.total_previsto
6. Caixinha aparece no Dashboard Financeiro como ativa
```

### 4c. Enviar cobrança por WhatsApp
```
1. No Dashboard Financeiro → lista de pendentes
2. Cada atleta pendente tem ícone do WhatsApp
3. Gestor clica → sistema gera deep link:
   wa.me/55[DDD][numero]?text=[mensagem+codificada]
4. Mensagem pré-pronta:
   "Oi [Nome do responsável]! 👋
    A cobrança de [Nome da Caixinha] no valor de R$[valor]
    vence em [data]. Segue o link para pagamento via Pix:
    [link AbacatePay]
    Qualquer dúvida, estou à disposição!"
5. WhatsApp do gestor abre com mensagem pronta
6. Gestor aperta Enviar (ação humana — sem risco de ban)
```

### 4d. Confirmação de pagamento (automática)
```
1. Atleta/pai paga o Pix (pelo link ou pelo app)
2. AbacatePay processa o pagamento
3. AbacatePay envia webhook para:
   POST /webhooks/abacatepay
4. Sistema valida assinatura HMAC do webhook
5. Localiza cobrança pelo payment_id
6. Atualiza cobranças:
   ├── status = 'pago'
   └── data_pagamento = now()
7. Atualiza caixinha:
   ├── total_pago += valor
   ├── total_pendente -= valor
   └── saldo_arrecadado += valor
8. Cria transação automática em `transacoes`:
   ├── tipo = 'entrada'
   ├── origem = 'webhook'
   ├── cobranca_id = [id]
   └── atleta_id = [id]
9. Atleta some da lista de pendentes
```

### 4e. Registrar entrada manual
```
1. Gestor clica "+ Nova Entrada" no dashboard financeiro
2. Preenche:
   ├── Valor
   ├── Data
   ├── Caixinha (select das caixinhas ativas) — opcional
   ├── Atleta (select dos atletas) — opcional
   └── Descrição
3. Se vinculado a uma cobrança pendente: marca como paga
4. Transação registrada com origem = 'manual'
```

### 4f. Registrar saída manual
```
1. Gestor clica "- Nova Saída"
2. Preenche:
   ├── Valor
   ├── Data
   ├── Categoria (aluguel, material, árbitro, viagem, outros)
   └── Descrição
3. Saída vai para o fluxo de caixa geral
4. Não vinculada a caixinha (MVP)
```

---

## 5. Acesso do Atleta ao App Flutter

### Primeiro acesso
```
1. Gestor compartilha link/slug do clube
2. Atleta baixa o app Athletto
3. Na tela inicial: informa CPF
4. Sistema verifica: atleta cadastrado e ativo naquele clube
5. Se sim: pede criação de senha
6. Senha salva com hash
7. Acesso liberado
```

### Acessos seguintes
```
1. Atleta abre o app
2. Informa CPF + senha
3. Dashboard do atleta:
   ├── Cobranças pendentes (com botão Pagar → abre app do banco)
   ├── Histórico de pagamentos
   └── Frequência (% presença, últimas presenças)
```

---

## 6. Alerta de Evasão (Cron Job)

```
Roda: todo dia às 08:00

Para cada clube ativo:
  Para cada atleta ativo:
    Para cada turma do atleta:
      1. Busca últimas N frequências do atleta naquela turma
      2. Verifica se as últimas 3 foram todas ausente = false
      3. Se sim:
         ├── Verifica se já existe alerta ativo para esse atleta+turma
         ├── Se não existe: cria alerta em `alertas_evasao`
         └── Se existe e foi dispensado: ignora
```

---

## 7. Cobranças Recorrentes (Cron Job)

```
Roda: todo dia às 06:00

Para cada caixinha ativa com planejamento do tipo 'recorrente':
  1. Verifica se hoje é o dia de vencimento do próximo ciclo
  2. Se sim:
     ├── Verifica se já existe cobrança pendente para esse ciclo
     ├── Se não: gera novas cobranças para todos os atletas vinculados
     └── Chama AbacatePay para gerar novos links Pix
```
