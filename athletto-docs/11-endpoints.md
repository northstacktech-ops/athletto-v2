# 11 — Referência de Endpoints da API

> Base URL: `https://api.athletto.com.br/v1`
> Autenticação: `Authorization: Bearer {JWT}`

---

## Auth

```
POST   /auth/login                    Login gestor (email + senha)
POST   /auth/refresh                  Renovar JWT
POST   /auth/logout                   Invalidar sessão
POST   /auth/atleta/login             Login atleta (CPF + senha)
POST   /auth/atleta/criar-senha       Primeiro acesso — criar senha
POST   /auth/atleta/resetar-senha     Resetar senha (via gestor)
```

---

## Clubes

```
GET    /clube                         Dados do clube do gestor autenticado
PUT    /clube                         Atualizar dados do clube
POST   /clube/logo                    Upload do logotipo
```

---

## Gestores

```
GET    /gestores                      Listar gestores adicionais
POST   /gestores                      Adicionar gestor adicional
PUT    /gestores/:id                  Atualizar permissões
DELETE /gestores/:id                  Remover gestor adicional
GET    /gestores/me                   Dados do gestor autenticado
PUT    /gestores/me                   Atualizar próprio perfil
```

---

## Atletas

```
GET    /atletas                       Listar atletas (com filtros: status, saude, turma_id)
POST   /atletas                       Criar atleta
GET    /atletas/:id                   Detalhes do atleta
PUT    /atletas/:id                   Atualizar atleta
DELETE /atletas/:id                   Desativar atleta (soft delete)

GET    /atletas/:id/frequencia        Histórico de frequência do atleta
GET    /atletas/:id/cobranças         Cobranças do atleta (todas as caixinhas)
GET    /atletas/:id/turmas            Turmas do atleta

POST   /atletas/link-cadastro         Gerar/retornar link de cadastro público
POST   /atletas/cadastro-publico      Cadastro self-service (sem auth)
```

---

## Turmas

```
GET    /turmas                        Listar turmas ativas
POST   /turmas                        Criar turma
GET    /turmas/:id                    Detalhes da turma
PUT    /turmas/:id                    Atualizar turma
DELETE /turmas/:id                    Desativar turma

GET    /turmas/:id/atletas            Atletas da turma
POST   /turmas/:id/atletas            Vincular atleta à turma
DELETE /turmas/:id/atletas/:atletaId  Desvincular atleta da turma
```

---

## Frequência

```
GET    /frequencia                    Frequência por data e turma (query: data, turma_id)
POST   /frequencia                    Registrar frequência (array de {atleta_id, presente})
PUT    /frequencia/:turmaId/:data     Atualizar frequência de uma turma em uma data

GET    /frequencia/alertas            Listar alertas de evasão ativos
PUT    /frequencia/alertas/:id/dispensar  Dispensar alerta
GET    /frequencia/ranking            Ranking de presença (query: periodo, turma_id)
GET    /frequencia/resumo             Resumo semanal/mensal (query: periodo, turma_id)
```

---

## Calendário

```
GET    /calendario                    Eventos do período (query: inicio, fim)
POST   /calendario/eventos            Criar evento manual
PUT    /calendario/eventos/:id        Atualizar evento
DELETE /calendario/eventos/:id        Excluir evento
```

---

## Planejamentos

```
GET    /planejamentos                 Listar planejamentos (query: status)
POST   /planejamentos                 Criar planejamento
GET    /planejamentos/:id             Detalhes do planejamento
PUT    /planejamentos/:id             Atualizar planejamento (restrito se ativo)
DELETE /planejamentos/:id             Excluir planejamento inativo
POST   /planejamentos/:id/ativar      Ativar planejamento → gera caixinha
POST   /planejamentos/:id/encerrar    Encerrar caixinha

GET    /planejamentos/:id/atletas     Atletas vinculados
POST   /planejamentos/:id/atletas     Vincular atletas (array de atleta_ids ou turma_ids)
DELETE /planejamentos/:id/atletas/:atletaId  Desvincular atleta
```

---

## Caixinhas

```
GET    /caixinhas                     Listar caixinhas ativas
GET    /caixinhas/:id                 Detalhes + saldo da caixinha
GET    /caixinhas/:id/cobranças       Cobranças da caixinha (query: status)
GET    /caixinhas/:id/pendentes       Lista de pendentes com links WhatsApp
```

---

## Cobranças

```
GET    /cobranças                     Listar cobranças (query: status, caixinha_id, atleta_id)
GET    /cobranças/:id                 Detalhes da cobrança
POST   /cobranças/:id/marcar-pago     Marcar como pago manualmente
POST   /cobranças/:id/isentar         Isentar atleta desta cobrança
POST   /cobranças/:id/cancelar        Cancelar cobrança
POST   /cobranças/:id/regenerar-link  Regenerar link Pix (se expirado)
GET    /cobranças/:id/whatsapp        Gerar deep link WhatsApp para cobrança
```

---

## Financeiro (Dashboard)

```
GET    /financeiro/resumo             Resumo financeiro (query: periodo)
GET    /financeiro/transacoes         Extrato de transações (query: tipo, periodo, caixinha_id)
POST   /financeiro/transacoes         Registrar entrada ou saída manual
PUT    /financeiro/transacoes/:id     Editar transação manual
DELETE /financeiro/transacoes/:id     Excluir transação manual
GET    /financeiro/graficos           Dados para gráficos (query: tipo, periodo)
```

---

## Webhooks

```
POST   /webhooks/abacatepay           Receber notificações do AbacatePay (sem auth JWT)
```

---

## App Flutter — Endpoints do Atleta

> Auth: JWT com role='atleta'

```
GET    /atleta/me                     Perfil do atleta autenticado
GET    /atleta/cobranças              Cobranças do atleta (pendentes e pagas)
GET    /atleta/cobranças/:id          Detalhes + link Pix da cobrança
GET    /atleta/frequencia             Frequência do atleta
GET    /atleta/clube                  Dados básicos do clube (nome, logo)
```

---

## Padrões da API

### Paginação
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "pagina": 1,
    "porPagina": 20,
    "totalPaginas": 5
  }
}
```

### Erros
```json
{
  "erro": "LIMITE_ATLETAS_ATINGIDO",
  "mensagem": "Limite de 40 atletas atingido. Faça upgrade do plano.",
  "statusCode": 422
}
```

### Códigos de erro comuns
| Código | HTTP | Descrição |
|---|---|---|
| `NAO_AUTENTICADO` | 401 | JWT ausente ou inválido |
| `SEM_PERMISSAO` | 403 | Gestor adicional sem acesso ao módulo |
| `NAO_ENCONTRADO` | 404 | Recurso não existe ou não pertence ao clube |
| `LIMITE_ATLETAS_ATINGIDO` | 422 | Plano não permite mais atletas |
| `LIMITE_TURMAS_ATINGIDO` | 422 | Plano não permite mais turmas |
| `CPF_JA_CADASTRADO` | 422 | CPF já existe no sistema |
| `PLANEJAMENTO_JA_ATIVO` | 422 | Tentativa de ativar planejamento já ativo |
| `WEBHOOK_INVALIDO` | 401 | Assinatura do webhook não confere |
| `ERRO_ABACATEPAY` | 502 | Falha ao comunicar com AbacatePay |
