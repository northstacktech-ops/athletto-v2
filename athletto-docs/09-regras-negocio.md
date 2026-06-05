# 09 — Regras de Negócio

## Gestão de Atletas

| # | Regra |
|---|---|
| A1 | CPF é obrigatório e único no sistema — mesmo CPF não pode estar em dois clubes diferentes |
| A2 | Atleta desativado (ativo=false) não aparece nas listagens ativas mas mantém histórico |
| A3 | Atleta com status "afastado" continua cadastrado mas não entra em cálculos de frequência |
| A4 | CPF é armazenado sem formatação (só dígitos) e validado pelo algoritmo antes de salvar |
| A5 | CPFs são exibidos mascarados na interface do gestor (`***.055.212-18`) |
| A6 | Atleta pode estar vinculado a nenhuma, uma ou várias turmas simultaneamente |
| A7 | Ao excluir atleta: soft delete (`ativo=false`) — nunca delete físico |
| A8 | Limite de atletas é verificado no backend ao adicionar (plano Básico: 40, Intermediário: 80, Pro: ∞) |

---

## Turmas

| # | Regra |
|---|---|
| T1 | Turma pode ter múltiplos dias da semana |
| T2 | Limite de turmas verificado no backend (Básico: 5, Intermediário: 20, Pro: 20) |
| T3 | Ao desativar turma: registros de frequência históricos são mantidos |
| T4 | Uma turma desativada não aparece no registro de frequência do dia atual |
| T5 | Atletas de uma turma desativada perdem o vínculo com ela mas continuam cadastrados |

---

## Frequência

| # | Regra |
|---|---|
| F1 | Só pode registrar frequência para dias que têm turma agendada (dias da semana da turma) |
| F2 | Frequência só pode ser registrada uma vez por turma por dia — edições sobrescrevem |
| F3 | Não é possível registrar frequência para datas futuras |
| F4 | Atletas afastados não aparecem na lista de registro de frequência |
| F5 | Alerta de evasão: 3 faltas consecutivas em qualquer turma (verificado por cron diário) |
| F6 | Alerta dispensado pelo gestor não reaparece até nova sequência de 3 faltas |
| F7 | % de presença = (presenças confirmadas / total de treinos registrados) × 100 |
| F8 | Treinos sem registro não entram no cálculo (apenas treinos onde a frequência foi registrada) |

---

## Planejamento

| # | Regra |
|---|---|
| P1 | Planejamento inativo pode ser editado livremente (qualquer campo) |
| P2 | Planejamento ativo só permite edição de nome e descrição — valor e atletas são imutáveis |
| P3 | Para ativar um planejamento, é obrigatório ter pelo menos 1 atleta vinculado |
| P4 | Ao ativar: sistema gera cobranças para todos os atletas vinculados via AbacatePay |
| P5 | Se a geração de cobrança falhar para algum atleta, o sistema tenta novamente e loga o erro |
| P6 | Um planejamento encerrado não gera novas cobranças — cobranças existentes são mantidas |
| P7 | Planejamento do tipo "único" gera cobranças uma única vez na ativação |
| P8 | Planejamento do tipo "recorrente" gera novas cobranças automaticamente conforme periodicidade |
| P9 | Planejamento inativo pode ser excluído (delete físico se não tiver caixinha gerada) |

---

## Caixinhas

| # | Regra |
|---|---|
| C1 | Caixinha é criada automaticamente ao ativar um planejamento (1:1) |
| C2 | Atleta pode estar em múltiplas caixinhas ativas simultaneamente |
| C3 | Cada par atleta+caixinha tem exatamente uma cobrança (UNIQUE constraint) |
| C4 | Saldo da caixinha = soma de todos os pagamentos confirmados das cobranças dela |
| C5 | Total previsto = valor × número de atletas vinculados |
| C6 | Atleta pode ser marcado como "isento" em uma caixinha específica (sem gerar cobrança) |
| C7 | Ao encerrar caixinha: cobranças pendentes restantes ficam com status "cancelado" (gestor confirma) |

---

## Cobranças

| # | Regra |
|---|---|
| CB1 | Status possíveis: `pendente` → `pago` ou `cancelado` ou `isento` |
| CB2 | Cobrança paga via webhook: status atualizado automaticamente (sem ação do gestor) |
| CB3 | Cobrança paga manualmente pelo gestor: registra transação com origem='manual' |
| CB4 | Cobrança não pode voltar de "pago" para "pendente" sem estorno explícito |
| CB5 | Estorno no MVP: gestor cancela a cobrança e registra saída manual de "Reembolso" |
| CB6 | Idempotência: webhook processado duas vezes para a mesma cobrança é ignorado |
| CB7 | Link Pix expira conforme política do AbacatePay — gestor pode regenerar em caso de expiração |

---

## Dashboard Financeiro

| # | Regra |
|---|---|
| DF1 | Receita do período = soma de transações tipo 'entrada' no período selecionado |
| DF2 | Despesas do período = soma de transações tipo 'saída' no período selecionado |
| DF3 | Saldo = receita - despesas (pode ser negativo) |
| DF4 | Pendentes = cobranças com status 'pendente' de todas as caixinhas ativas |
| DF5 | Dívidas = cobranças com status 'pendente' e data_vencimento < hoje |
| DF6 | Transações geradas por webhook têm `registrado_por = null` e `origem = 'webhook'` |
| DF7 | Uma entrada manual pode ou não estar vinculada a uma cobrança |
| DF8 | Saídas não são vinculadas a caixinhas no MVP |

---

## Multi-tenancy e Segurança

| # | Regra |
|---|---|
| S1 | Todo dado tem `clube_id` — nunca fazer query sem filtrar por clube |
| S2 | JWT do gestor contém `clube_id` — middleware injeta em todas as queries |
| S3 | JWT do atleta contém `clube_id` + `atleta_id` — só acessa os próprios dados |
| S4 | Gestor adicional tem acesso limitado conforme `permissoes` configuradas |
| S5 | Limites de plano verificados no backend, não só no frontend |
| S6 | Webhook validado por HMAC-SHA256 antes de processar |
| S7 | Logs de todos os webhooks recebidos (mesmo os inválidos) |
| S8 | Refresh token rotativo — token inválido invalida toda a sessão |

---

## Limites por Plano

| Recurso | Básico | Intermediário | Profissional |
|---|---|---|---|
| Atletas | 40 | 80 | Ilimitado |
| Turmas | 5 | 20 | 20 |
| Competições (pós-MVP) | — | 30 | 20 |
| Gestores adicionais | 1 | 3 | 5 |
| Planejamentos ativos | 3 | 10 | 20 |
| Histórico financeiro | 6 meses | 12 meses | Ilimitado |

> ⚠️ **Revisar antes do lançamento:** Limite de 20 competições no Pro com atletas ilimitados pode travar clubes maiores. Considerar subir para 50+ ou ilimitar no Pro.

---

## Tratamento de Erros Críticos

| Cenário | Comportamento esperado |
|---|---|
| AbacatePay indisponível ao ativar planejamento | Erro exibido, planejamento volta para inativo, nenhuma cobrança parcial salva |
| Webhook recebido com assinatura inválida | Log do webhook, retorno 401, nenhuma ação no banco |
| Webhook duplicado (mesma cobrança) | Idempotência: verifica se já está paga, ignora se sim |
| CPF duplicado no cadastro | Erro claro: "CPF já cadastrado neste clube" |
| Atleta acima do limite do plano | Erro: "Limite de atletas atingido. Faça upgrade do plano." |
| Turma acima do limite do plano | Erro: "Limite de turmas atingido. Faça upgrade do plano." |
| Falha de rede no app Flutter | Toast de erro + botão "Tentar novamente" — sem crashar o app |
