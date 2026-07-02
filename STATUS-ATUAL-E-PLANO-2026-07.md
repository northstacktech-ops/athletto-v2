# Athletto — Status Atual e Plano de Ajustes (2026-07-02)

> Escopo: **apenas `athletto-web`** (Nuxt 3 + Supabase + Vercel). Mobile (`athletto-atleta`) fica pra depois, como combinado.
> Método: leitura do código atual, auditorias anteriores (`AUDITORIA-PERFORMANCE-ARQUITETURA-2026-06-13` e `PENDENCIAS-E-COMO-FAZER`, ambas já removidas — conteúdo absorvido aqui) cruzadas com o estado real via MCP do Supabase (advisors de segurança/performance, migrations aplicadas).

---

## 0. Limpeza feita agora

Removidos (com sua confirmação):
- 10 `.md` de planejamento/progresso já concluídos (AUDITORIA-BOAS-PRATICAS, AUDITORIA-PERFORMANCE-2026-06-13, PASSO-A-PASSO-MANUAL, PENDENCIAS-E-COMO-FAZER, PLANO-AGORA, PLANO-AJUSTES-2026-06, PLANO-AJUSTES-ATHLETTO-2026-06-13, PROGRESSO-AJUSTES-2026-06-13, PROXIMOS-PASSOS, REVIEW-FUNCIONALIDADES-2026-06).
- `MIGRAR-SP-0003-0019.sql` (103 KB, script único já aplicado no banco atual).
- `athletto-atleta/protótipo/` (11 MB de screenshots, uploads de teste e uma pasta "ooo" com handoff de design duplicado).

Mantidos por serem referência ainda válida: `README.md`, `DEPLOY.md`, `FUNCIONALIDADES-SISTEMA.md`, `PLANOS-E-PRECIFICACAO.md`, `PLANO-MOBILE.md`, `PLANO-ORGANIZACAO-APP-ATLETA.md`, `BUILD-APK.md`, `VALIDAPAY-INTEGRACAO.md` (esse último está **desatualizado** — ver §3).

Não encontrei nenhum `.apk`/`.aab` na pasta — já estava limpo nesse ponto.

### 🔴 Sobre o `credenciais.txt`
Ele **não estava** no `.gitignore` — adicionei uma regra (`credenciais.txt` / `credenciais*.txt`) como rede de segurança, mesmo você pretendendo apagar antes do push. Além disso, reparei que a `service_role key`/URL do Supabase nesse arquivo aponta pro projeto **antigo** (`jzijguccwdwbbngzcuxz`, "Athletto-v1"). O projeto que está ativo agora é outro — **"Athletto-v2"** (`qgbxxzmpppmsjqqxcycn`), criado em 14/06. Se você usar essas credenciais em algum script, vai bater no banco errado. Vale conferir/atualizar esse arquivo antes de usá-lo.

---

## 1. Estrutura do `athletto-web`

Nuxt 3 + `@nuxtjs/supabase` + Tailwind + ECharts, deploy na Vercel (preset `vercel`, sem cold start em `/termos` e `/privacidade` que são pré-renderizadas).

34 páginas · 76 componentes · 38 rotas de API server · 30 composables · 30 migrations SQL locais.

Dois gateways de pagamento **coexistindo no código**: **AbacatePay** (o que está em produção hoje) e **ValidaPay** (construído depois, com modelo de subconta por clube + carteira/saques — migrations `0021` a `0030`). Isso é esperado — é uma migração em andamento — mas gera manutenção dobrada enquanto os dois existem. Ver §3.

---

## 2. Banco de dados (Supabase — projeto "Athletto-v2")

Rodei os advisors oficiais do Supabase direto no projeto ativo. Resumo:

**Segurança**
- ⚠️ **36 funções `SECURITY DEFINER`** (`admin_metricas`, `suspender_clube`, `ativar_plano_clube`, `is_superadmin`, etc.) estão com `EXECUTE` liberado pros papéis `anon` **e** `authenticated` via PostgREST (`/rest/v1/rpc/...`). Isso não é necessariamente um buraco — a maioria provavelmente já se protege por dentro checando `is_superadmin()`/RLS — mas é superfície de ataque desnecessária. Vale revisar uma a uma e fazer `REVOKE EXECUTE ... FROM anon, authenticated` nas que não precisam ser públicas (fica só pro `service_role`).
- ⚠️ **Buckets públicos `avatares` e `logos` permitem listagem** (`SELECT` amplo em `storage.objects`) — dá pra listar todos os arquivos, não só acessar por URL direta. Trocar a policy de listagem por uma mais restrita.
- ℹ️ 6 tabelas com RLS habilitada e **nenhuma policy** (`app_atleta_prefs`, `app_atleta_sessoes`, `app_codigos_acesso`, `app_notificacoes`, `clube_credenciais`, `consentimentos`) — isso trava tudo por padrão, o que é seguro, mas confirma que esse acesso só deve passar pelo `service_role` no server. Se alguma dessas precisar ser lida direto do client no futuro, vai precisar de policy.
- ℹ️ Proteção contra senha vazada (HaveIBeenPwned) **desligada** no Auth — é um toggle de 1 clique no painel do Supabase, sem custo de dev.

**Performance**
- 4 foreign keys sem índice (`chamados_suporte`, `gestores`, `logs_gestao`, `saques`) — baixo custo, adicionar índice.
- 1 policy RLS em `saques` ainda reavalia `auth.uid()` por linha (não usa `(select auth.uid())`) — mesma classe de problema que já foi corrigida em outras tabelas na migration `0008`, só ficou de fora nessa tabela nova.
- ~28 índices nunca usados — normal em uma base com pouco volume/tráfego ainda; não é urgente remover, só não é sinal de nada quebrado.

**Migrations:** a numeração local (`0001`–`0030`) não bate 1:1 com o que está aplicado no banco (o histórico do banco pula de `0002_rls` direto pra `0020_planos_precos`, e tem `0020`/`0021` duplicados com nomes diferentes). Isso é resquício da migração pro projeto novo via script único — funciona, mas se continuar criando migration local sem sincronizar com `supabase migration list` remoto, o risco é aplicar algo fora de ordem. Vale rodar `supabase db pull`/`migration repair` pra realinhar antes de crescer mais.

---

## 3. Integrações — o que está ligado e o que não está

| Integração | Status |
|---|---|
| Supabase (banco/auth/storage) | ✅ Ativo, projeto "Athletto-v2" |
| Vercel (deploy) | ✅ Ativo (`vercel.json`, preset Nitro `vercel`) |
| AbacatePay (Pix) | 🟡 Código pronto (`server/utils/pix.ts`, webhook, endpoint de cobrança); depende da env `ABACATEPAY_API_KEY` estar configurada na Vercel pra sair do modo manual |
| ValidaPay (Pix, subconta por clube + carteira/saques) | 🟡 Código avançou bastante além do que o `VALIDAPAY-INTEGRACAO.md` registra (tem migrations de saque e comprovante que o doc nem menciona), mas **não tem UI em Configurações → Pagamentos** pra cadastrar a subconta do clube, e nenhuma página do sistema referencia `validapay` hoje — ou seja, o backend existe, o front não expõe. Decidir: segue com os dois gateways ou migra de vez pro ValidaPay e desliga o AbacatePay? |
| Rate limiting | 🔴 Ainda em `Map()` na memória do processo (`server/api/auth/signup.post.ts`, `server/utils/appAtleta.ts`) — não sobrevive a cold start na Vercel serverless, ou seja, na prática **não protege** contra abuso/força bruta. Precisa de Upstash Redis ou Vercel KV. |
| Sentry (observabilidade de erro) | 🔴 Nunca instalado. A env `SENTRY_DSN` já é lida no `nuxt.config.ts`, mas o pacote não está no `package.json` — hoje erro em produção só aparece se alguém olhar os logs da Vercel na mão. |
| CRON (lembretes de pagamento) | 🟡 Depende de `CRON_SECRET` estar setado na Vercel — não dá pra confirmar daqui sem acesso ao painel. |

---

## 4. Performance — o que ainda está lento/pendente

Cruzei a auditoria de 13/06 com o código de hoje. Isso **ainda está aberto**:

1. **🔴 Dashboard financeiro agrega no cliente.** `components/financeiro/FinanceiroDashboard.vue` busca as transações do mês inteiro e dos últimos 6 meses **sem limite de linhas** e soma tudo no navegador (`.reduce()`). Com poucos clubes não trava, mas escala mal — cada clube novo com histórico maior aumenta o payload e o tempo de cálculo no client. Existem RPCs no banco (`dashboard_home`, `grafico_financeiro`, `dashboard_metricas`) que já agregam no Postgres — a troca é direta.
2. **🟠 Over-fetching em 4 pontos**: `useFinanceiro.ts`, `useFrequencia.ts`, `useAtletas.ts` e `useAdminClubes.ts` ainda trazem relacionamentos inteiros (`turmas(*)`, `atletas(*)`, `assinaturas(*)`, `gestores(*)`) em vez de só as colunas usadas. Estimativa de 40–60% menos banda trocando por `select` explícito.
3. **🔴 Rate-limit cosmético** (mesmo item da tabela de integrações acima — repito aqui porque é também um problema de robustez, não só de segurança).
4. **🟡 Listagem de atletas sem virtualização**: a página tem "Ver mais", mas o que já carregou fica todo no DOM. Com 200+ atletas por clube, isso pesa a renderização.
5. **✅ Já resolvido desde a última auditoria**: lazy-loading do ECharts no Financeiro (só carrega os ~800 KB quando a aba Dashboard abre).

---

## 5. Plano priorizado — o que fazer agora

**Fase A — rápido, baixo risco (faço já se você topar):**
- Ligar a proteção de senha vazada no Supabase Auth (1 clique).
- Adicionar os 4 índices de FK que faltam + corrigir a policy de `saques` pro padrão `(select auth.uid())`.
- Revisar e revogar `EXECUTE` das funções `SECURITY DEFINER` que não precisam ser chamadas por `anon`/`authenticated` direto.
- Trocar a policy de listagem dos buckets `avatares`/`logos` pra não permitir listagem pública.
- Atualizar o `credenciais.txt` com as chaves certas do projeto "Athletto-v2" (as atuais são do projeto antigo).

**Fase B — impacto direto no "não travar" (1–2 dias):**
- Trocar a agregação client-side do `FinanceiroDashboard` pelas RPCs já existentes.
- Resolver o over-fetching nos 4 composables listados.
- Decidir AbacatePay vs ValidaPay (ou os dois) e construir a UI de Configurações → Pagamentos que falta.

**Fase C — infraestrutura:**
- Rate-limit real via Upstash Redis/Vercel KV.
- Instalar e ativar o Sentry (a env já existe, falta só o pacote).
- Realinhar o histórico de migrations local vs remoto (`supabase db pull`/`migration repair`).

**Fase D — quando o volume crescer:**
- Virtualizar a lista de atletas.
- Revisar os índices nunca usados (não é urgente agora).

---

*Quer que eu comece pela Fase A agora? São mudanças pequenas e reversíveis — índice, policy e revoke de função não quebram nada que já funciona.*
