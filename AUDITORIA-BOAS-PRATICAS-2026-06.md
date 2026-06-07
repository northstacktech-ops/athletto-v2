# Auditoria de Boas Práticas — Supabase + Vercel
> Conformidade dos dois ambientes (Web/gestor Nuxt e App/atleta Flutter) com o guia *Boas Práticas — Segurança e Performance*.
> Data: 06/06/2026 · Legenda: ✅ ok · ⚠️ parcial/melhorável · ❌ gap · 🔒 depende de infra/conta · N/A não se aplica.

## Resumo
O **web já é bastante aderente** (RLS em tudo, `service_role` só no servidor, rate-limit, webhook com HMAC, índices, health check). Nesta rodada eu **fechei os gaps seguros** (versionei as migrations no repo e adicionei o kit de LGPD). O que resta é majoritariamente **infra/contas** (Sentry, staging, alertas/billing) e alguns **refactors opcionais**.

---

## 1–2. Segurança (Críticos e Altos)

| Item | Web | Mobile | Observação |
|---|---|---|---|
| 1.1 Chaves de API (service_role server-only) | ✅ | N/A | `runtimeConfig.supabaseServiceRoleKey` (sem `NUXT_PUBLIC_`); grep não achou vazamento. App só usa a URL pública da API REST. |
| 1.2 RLS habilitado + policies | ✅ | N/A | Todas as tabelas com RLS (migs 0002/0007/0009/0010). Tabelas do app são service-role-only (RLS sem policy, intencional). |
| 1.3 Validação no servidor | ⚠️ | — | Validação manual existe (CPF, campos obrigatórios). **Recomendado:** adotar Zod nos endpoints `/api/app/*` e `/api/*`. |
| 1.4 Secrets hardcoded | ✅ | ✅ | Tudo via env/runtimeConfig; `.gitignore` cobre `.env*` (mantém `.env.example`). App sem secrets. |
| 1.5 SQL injection | ✅ | N/A | supabase-js parametrizado + RPCs com parâmetros. |
| 1.6 Auth em rotas protegidas | ✅ | ✅ | `validarSessao()` em todos os endpoints do app; gestor via `@nuxtjs/supabase` + `middleware/auth.global`. |
| 2.1 Rate limiting | ⚠️ | N/A | `rateLimited()` já aplicado em login/consultar-cpf/definir-senha/signup. É **em memória (por instância serverless)**. **Recomendado (🔒):** Upstash/Redis para limite distribuído. |
| 2.2 CORS | ⚠️ | N/A | `Access-Control-Allow-Origin: *` **sem** credentials — aceitável para API mobile com Bearer (sem cookies). Pode-se restringir a origens conhecidas se um dia houver web cross-origin. |
| 2.3 Upload com validação tipo/tamanho | ✅ | ✅ | `/api/app/foto` valida mime+2MB; gestor faz crop 512. App envia já cropado. |
| 2.4 Ownership check | ✅ | — | App escopa por `atleta_id`/`clube_id` da sessão; gestor por RLS de clube. |
| 2.5 JWT verificado | ✅ | — | App usa **token opaco** (hash em `app_atleta_sessoes`), não JWT decodificado — adequado. |
| 2.6 Webhook com assinatura | ✅ | N/A | `webhooks/abacatepay` valida HMAC (`x-abacatepay-signature`) → 401 se inválido. |

---

## 3–4. Performance (Banco e Frontend/API)

| Item | Status | Observação |
|---|---|---|
| 3.1 N+1 | ✅ | Embeds usados; agenda agora gera treinos sem N+1. |
| 3.2 `select` específico | ⚠️ | Maioria seleciona campos; restam `select('*')` pontuais (ex.: `turmasAtivas`). Melhorável. |
| 3.3 Índices | ✅ | Migration **0008** (versionada agora) cobriu FKs + compostos. |
| 3.4 Paginação | ⚠️ | Lista de atletas paginada; **turmas/cobranças/outras ainda sem `.range()`**. Recomendado paginar as demais listas grandes. |
| 3.5 Filtro multi-tenant `clube_id` | ✅ | Filtros por clube + RLS. |
| 3.6 Connection pooling | N/A | Acesso via supabase-js (PostgREST/HTTP), sem conexão Postgres direta — pooling não se aplica. |
| 3.7 Transações | ✅ | Operações compostas via RPC `SECURITY DEFINER`. |
| 4.1 Cache invalidado pós-mutation | ✅ | Drawer recarrega; páginas chamam `carregar()` após mutações. |
| 4.2 Queries em paralelo | ✅ | `Promise.all` em vários lugares. |
| 4.3 Loading por seção | ⚠️ | Parcial; algumas telas ainda com loading global. |
| 4.4 Debounce em busca | ⚠️ | Recomendado adicionar debounce (~400ms) nos campos de busca. |
| 4.5 Tarefas pesadas fora do request | ⚠️ | Cron/webhook são síncronos; sem fila (Inngest). Aceitável no volume atual. |

---

## 5. Deploy e Infraestrutura

| Item | Status | Observação |
|---|---|---|
| 5.1 Ambientes separados (dev/staging/prod) | ❌ 🔒 | Hoje **um único projeto Supabase**. Recomendado criar **staging** separado. |
| 5.2 Migrations versionadas | ✅ (corrigido) | **0008/0009/0010 agora versionadas** em `supabase/migrations` (antes só estavam no banco). |
| 5.3 Envs por ambiente no Vercel | ⚠️ 🔒 | Conferir separação Development/Preview/Production no painel da Vercel. Definir `CRON_SECRET`. |
| 5.4 Backups | ⚠️ 🔒 | Conferir backups automáticos no dashboard Supabase; backup manual antes de migrations em prod. |

---

## 6. Modelagem de Dados

| Item | Status | Observação |
|---|---|---|
| 6.1 created/updated + trigger | ✅ | `criado_em`/`atualizado_em` + triggers. |
| Soft delete (`deleted_at`) | ⚠️ | Usa `ativo boolean` (+ agora `anonimizado_em`). Migrar para `deleted_at` é refactor — opcional. |
| 6.2 Anti-padrões (UUID, dinheiro, JSONB) | ✅ | UUIDs; valores em `numeric` (não float); entidades separadas; JSONB pontual (histórico_lesoes). |

---

## 7. RLS
✅ Padrões aplicados (multi-tenant por clube, app por sessão). ⚠️ Otimização initplan (`(select auth.uid())`) já corrigida na **0008**. As tabelas service-role-only aparecem como `rls_enabled_no_policy` nos advisors — **intencional** (acesso só via service_role).

---

## 8. Observabilidade

| Item | Status | Observação |
|---|---|---|
| 8.1 Logs estruturados (JSON) | ⚠️ | Hoje `console.error` simples. Recomendado padrão JSON com `evento/ids/timestamp` em login/pagamento/foto. |
| 8.2 Sentry | ❌ 🔒 | `sentryDsn` já cabeado no `runtimeConfig.public`, mas pacote `@sentry/nuxt` não instalado. Instalar + `beforeSend` removendo headers sensíveis (precisa de DSN/conta). |
| 8.3 audit_logs | ⚠️ | Tabela `logs_auditoria` + composable `useAuditoria` existem; cobertura parcial. Considerar escrita server-side em operações destrutivas. |
| 8.4 Health check | ✅ | `/api/health` existe. |
| 8.5 Alertas (5xx, latência) | ❌ 🔒 | Configurar no Vercel/Sentry/Uptime. |

---

## 9. IA como ferramenta (governança)
Processo/organizacional. Recomendado: `.claude/settings.json` com allowlist de comandos (sem `rm`/`push` automáticos), aprovação humana para migrations/pagamentos, e **nunca colar CPF/dados reais em prompts**. (Checklist para o time — não é código.)

---

## 10. Compliance e LGPD

| Item | Status | Observação |
|---|---|---|
| 10.1 Mapeamento de dados pessoais | ⚠️ | Documentar finalidade/base legal/retenção (a Política de Privacidade já cobre boa parte). |
| 10.2 PII fora de logs | ⚠️ | Revisar para nunca logar CPF/telefone; mascarar quando necessário. |
| 10.3 Exportação (direito de acesso) | ✅ (novo) | Função **`app_exportar_dados_atleta(uuid)`** criada (mig 0010). Falta só plugar a um endpoint/botão. |
| 10.4 Anonimização (direito ao esquecimento) | ✅ (novo) | Função **`app_anonimizar_atleta(uuid)`** criada (mig 0010): zera PII (inclui dados de saúde), desativa e revoga sessões. |
| Consentimento registrado | ✅ (novo) | Tabela **`consentimentos`** criada (versão do documento, IP, user agent). Falta gravar no aceite (app/login). |

---

## 11. Custo de IA e Cloud
Em grande parte **N/A** — o produto não tem features de LLM. Aplicável: configurar **billing alerts** (Vercel/Supabase) e manter tarefas longas fora do request (🔒/processo).

---

## 12. Manutenibilidade
⚠️ Arquitetura atual = composables + `server/api` direto (sem camada Service/Repository formal). Funciona bem; o refactor para Controller→Service→Repository é **opcional** e grande — recomendado só se a base crescer.

---

## App Flutter (atleta) — específico
- ✅ Sem secrets (só URL pública da API). ✅ Estados loading/erro/vazio. ✅ Upload validado (crop 512 + validação no servidor). ✅ Não fala com Supabase direto (sem chaves/RLS no app). ✅ Orientação travada + escala de fonte clampada.
- ⚠️ Recomendado: não logar PII; tratar 401 global (logout) de forma consistente.

---

## O que foi aplicado nesta rodada
1. **Migrations versionadas no repo:** `0008_performance_indices_e_rls.sql`, `0009_app_notificacoes.sql`, `0010_lgpd_kit.sql`.
2. **Kit LGPD (mig 0010):** tabela `consentimentos`, função de **exportação** e função de **anonimização** do atleta (+ coluna `anonimizado_em`). Advisors de segurança: **sem nenhum ERROR**.

## Pendências priorizadas (recomendação)
**Rápidas / sem infra (posso fazer):**
- Paginar as demais listas grandes (turmas, cobranças) + debounce na busca.
- Logs estruturados (JSON) nas operações críticas.
- Plugar as funções LGPD a endpoints (ex.: "exportar meus dados" / "excluir minha conta") e registrar consentimento no aceite.
- Adotar Zod nos endpoints do servidor.

**Precisam de você (infra/conta) 🔒:**
- Criar projeto **staging** no Supabase e separar envs no Vercel; definir `CRON_SECRET`.
- Instalar/configurar **Sentry** (DSN) + alertas de erro/latência.
- Conferir **backups** automáticos e **billing alerts**.

**Opcionais (refactor maior):**
- Soft delete (`deleted_at`) padronizado; camada Service/Repository; fila para tarefas pesadas.
