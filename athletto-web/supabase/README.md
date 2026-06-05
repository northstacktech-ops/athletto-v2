# Athletto — Banco de dados (Supabase)

Schema multi-tenant (isolamento por `clube_id` via RLS) reescrito e consolidado
em 5 migrations. Aplique **em ordem**.

## Ordem de aplicação

| Arquivo | O que faz |
|---|---|
| `0001_schema.sql` | Extensão `pgcrypto`, enums, todas as tabelas, FKs com `ON DELETE`, índices (FKs + busca) e triggers de `atualizado_em`. |
| `0002_rls.sql` | Helpers `current_clube_id()` e `is_superadmin()` (**sem parâmetro** — sempre usam `auth.uid()` internamente), RLS habilitado em **todas** as tabelas e policies SELECT/INSERT/UPDATE/DELETE. |
| `0003_functions.sql` | Todas as RPCs (dashboard, financeiro, frequência, admin, onboarding, cadastro público) e triggers de negócio (trial automático, notificações, limites de plano). |
| `0004_storage.sql` | Buckets `logos` e `avatares` (leitura pública, escrita por pasta `<clube_id>/...`) + policies em `storage.objects`. |
| `0005_seeds.sql` | Apenas configuração: singleton `configuracoes_sistema` e `limites_plano`. **Nenhum dado de demonstração.** |

Todas as migrations são idempotentes (`create or replace`, `drop policy if exists`,
`on conflict do nothing/update`) — podem ser reaplicadas com segurança.

## Como aplicar

### Supabase CLI (recomendado)

```bash
cd athletto-web
npx supabase login
npx supabase link --project-ref <SEU_PROJECT_REF>
npx supabase db push
```

### SQL Editor (manual)

Cole o conteúdo de cada arquivo em ordem (0001 → 0005) e execute.

## Pós-instalação

### 1. Criar o superadmin owner

1. Faça signup pelo app com o email do owner (cria o registro em `auth.users`).
2. No SQL Editor:

   ```sql
   select public.promover_owner_por_email('email-do-owner@dominio.com', 'Nome do Owner');
   ```

### 2. Agendar as rotinas diárias (sem pg_cron)

As funções de rotina são chamáveis e **não dependem de pg_cron**. Agende por
um scheduler externo (Vercel Cron / GitHub Actions / Edge Function agendada)
chamando com a service role key:

- `select public.detectar_evasoes();` — alertas de evasão (3+ faltas seguidas)
- `select public.processar_notificacoes();` — trial vencendo + cobranças vencidas
- `select public.gerar_cobrancas_recorrentes();` — próximo ciclo de cobranças

Se preferir pg_cron (Dashboard → Database → Extensions → habilitar):

```sql
select cron.schedule('athletto_evasoes',      '0 11 * * *', $$select public.detectar_evasoes()$$);
select cron.schedule('athletto_notificacoes', '0 12 * * *', $$select public.processar_notificacoes()$$);
select cron.schedule('athletto_cobrancas',    '0 9 * * *',  $$select public.gerar_cobrancas_recorrentes()$$);
```

## RPCs expostas ao frontend

### Gestor (authenticated)

| RPC | Parâmetros | Retorno |
|---|---|---|
| `dashboard_metricas` | `p_clube_id uuid` | `jsonb` (totais, receita/despesa do mês, cobranças, saúde) |
| `grafico_financeiro` | `p_clube_id uuid, p_meses int = 6` | `table(mes text, receita numeric, despesa numeric)` |
| `ranking_frequencia` | `p_clube_id uuid, p_limite int = 20` | `table(atleta jsonb, total_treinos int, total_presencas int, percentual int)` |
| `ativar_planejamento` | `p_planejamento_id uuid, p_gestor_id uuid` | `jsonb {planejamento_id, caixinha_id, cobrancas_geradas, total_previsto}` |
| `marcar_cobranca_paga` | `p_cobranca_id uuid, p_gestor_id uuid` | `void` |
| `regenerar_link_pix` | `p_cobranca_id uuid` | `void` |
| `marcar_todas_notificacoes_lidas` | `p_clube_id uuid = null` | `integer` (linhas afetadas) |
| `limites_clube` | `p_clube_id uuid` | `jsonb {plano, atletas{atual,maximo}, turmas{...}, gestores{...}}` |
| `onboarding_criar_clube_gestor` | `p_nome_clube, p_slug, p_cnpj, p_modalidade, p_email_clube, p_nome_gestor, p_email_gestor, p_email_verificado` | `table(out_clube_id uuid, out_gestor_id uuid)` |

### Público (anon)

| RPC | Parâmetros | Retorno |
|---|---|---|
| `cadastro_publico_atleta` | `p_slug text, p_dados jsonb` | `json {ok:true, atleta_id}` ou `{ok:false, erro}` |

`p_dados` aceita: `nome` (obrigatório), `cpf` (obrigatório, 11 dígitos),
`telefone_responsavel` (obrigatório), `apelido`, `posicao`, `data_nascimento`,
`turma_id` (opcional — vincula à turma se ela for ativa e do clube).

### Admin (superadmin — checagem interna via `is_superadmin()`)

| RPC | Parâmetros | Retorno |
|---|---|---|
| `admin_metricas` | — | `jsonb` (KPIs completos: clubes por status, MRR/ARR, churn, vouchers...) |
| `admin_crescimento` | `p_meses int = 6` | `table(mes text, novos_clubes int, cancelamentos int, mrr numeric)` |
| `admin_dashboard_metricas` | — | `json {total_clubes, clubes_ativos, clubes_trial, clubes_inadimplentes, clubes_cancelados, mrr, total_atletas, novos_clubes_30d}` |
| `admin_grafico_crescimento` | `p_meses int = 6` | `json [{mes, novos_clubes, mrr}]` |
| `suspender_clube` | `p_clube_id uuid, p_motivo text` | `jsonb {sucesso, clube_id}` |
| `reativar_clube` | `p_clube_id uuid` | `jsonb {sucesso, clube_id}` |
| `alterar_plano_clube` | `p_clube_id uuid, p_novo_plano text` | `jsonb {sucesso, plano_anterior, plano_novo}` |
| `ativar_plano_clube` | `p_clube_id uuid, p_plano text` | `jsonb {sucesso}` |

### Internas (service_role / SQL Editor — `revoke` para client)

`promover_owner_por_email(p_email, p_nome)`, `detectar_evasoes()`,
`processar_notificacoes()`, `notificar_trials_vencendo()`,
`notificar_cobrancas_vencidas()`, `gerar_cobrancas_recorrentes()`,
`criar_notificacao(...)`, `recalcular_caixinha(uuid)`,
`verificar_limite_plano(uuid, text)`.

## Decisões de segurança

- **`is_superadmin()` sem parâmetro** — corrigido o bug da migration antiga
  (0010 chamava `is_superadmin(auth.uid())`, assinatura inexistente). A função
  usa `auth.uid()` internamente, é `security definer` e `stable`.
- **Valores financeiros** em `numeric(19,4)` — nunca float.
- **`webhook_logs`**: índice único parcial `(origem, payment_id, evento)
  where status = 'processado'` — garante idempotência de processamento sem
  bloquear o registro de re-entregas do gateway.
- **Leitura pública de `clubes`/`turmas`** limitada a clubes/turmas ativos
  (necessária para a página `/cadastro/[slug]` e checagem de slug no
  onboarding). Criação de clube acontece só via RPC
  `onboarding_criar_clube_gestor` (security definer, valida slug e duplicidade).
- **Triggers de limite de plano** (`before insert` em atletas/turmas/gestores)
  bloqueiam inserções acima do limite do plano (tabela `limites_plano`).
- **Trigger `tg_clube_trial`** cria a assinatura trial automaticamente ao
  inserir um clube, usando `configuracoes_sistema.trial_dias_padrao`.
- **App mobile do atleta**: `atletas.app_senha_hash`, `app_senha_definida_em`,
  `app_ultimo_acesso` — senha é por clube (`unique(clube_id, cpf)` permite o
  mesmo CPF em clubes diferentes com senhas distintas).

## Fluxo de onboarding

```
1. /cadastro    → signup no Supabase Auth com user_metadata
                  {nome, nome_clube, modalidade, plano}
2. /verificar   → confirma email
3. /onboarding  → rpc onboarding_criar_clube_gestor(...)
                  • valida slug e unicidade
                  • cria clube (plano do user_metadata, default 'basico')
                  • cria gestor role='principal' (id = auth.uid())
                  • trigger tg_clube_trial cria assinatura trial
                  • trigger tg_notif_clube_novo avisa os superadmins
4. upload da logo no bucket logos/<clube_id>/logo.png
```
