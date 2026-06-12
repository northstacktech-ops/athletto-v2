# Review Geral de Funcionalidades — Athletto Web (Gestor)

**Data:** 11/06/2026 · **Escopo:** `athletto-web` (Nuxt 3 + Supabase + Vercel)
**Método:** varredura completa de pages/components/composables/server/migrations + verificação direta no banco de produção (Supabase MCP) + cruzamento com o manual "Performance Nuxt".

---

## 1. Resumo executivo

O sistema está **~85% funcional**. As telas do gestor e do admin estão completas e bem construídas (loading states, validações, paginação nas listagens principais, sem rotas quebradas). Porém existem **2 pendências críticas de negócio** que não aparecem na interface — justamente por isso passam despercebidas:

1. **Cobranças recorrentes nunca se renovam** (não há agendamento rodando no banco).
2. **Checkout de upgrade é um stub** ("Em breve") — nenhum trial consegue virar assinatura paga sozinho.

---

## 2. Pendências críticas (P0)

### P0.1 — Rotinas do banco nunca executam (recorrência, evasão, notificações)

As funções existem em `supabase/migrations/0003_functions.sql`, mas **o pg_cron não está habilitado no projeto Supabase** (verificado: `cron.job` não existe). O comentário no topo da migration (linhas 8–14) instrui agendar via `cron.schedule(...)`, e isso nunca foi feito:

| Função | O que deveria fazer | Efeito de não rodar |
|---|---|---|
| `gerar_cobrancas_recorrentes()` | Gerar o próximo ciclo de cobranças dos planejamentos recorrentes | Mensalidades param após o 1º ciclo — **receita não se renova** |
| `detectar_evasoes()` | Criar alertas de evasão por faltas consecutivas | Tela Frequência → Alertas fica sempre vazia |
| `processar_notificacoes()` | Disparar notificações pendentes | Sino de notificações não recebe eventos automáticos |
| `notificar_trials_vencendo()` | Avisar clubes com trial acabando | Sem aviso de expiração |
| `notificar_cobrancas_vencidas()` | Avisar gestor de cobranças vencidas | Sem aviso de inadimplência |

O único agendamento ativo é o **cron da Vercel** (`vercel.json`): `/api/cron/processar-notificacoes` às 09:00 BRT — que, apesar do nome, só chama `app_gerar_lembretes_pagamento` (lembretes do app do atleta).

**Correção sugerida (escolher uma):**
- **A (recomendada):** habilitar a extensão `pg_cron` no Supabase e agendar as 5 funções conforme o comentário da própria migration; ou
- **B:** ampliar a rota `/api/cron/processar-notificacoes` (ou criar novas rotas + entradas no `vercel.json`) para chamar também as 5 RPCs via service role — exige liberar `service_role` nessas funções, que hoje têm `revoke execute ... from public, anon, authenticated` (ok) mas validam contexto.

### P0.2 — Checkout de upgrade não implementado

`pages/upgrade.vue:166` — o botão de assinar mostra apenas `toast.info('Em breve', 'O checkout de upgrade será habilitado em breve...')`. Não há criação de cobrança/checkout no AbacatePay para assinatura do clube. Trial expirado → gestor fica bloqueado no paywall sem caminho de pagamento (só contato com suporte).

---

## 3. Pendências médias (P1)

| # | Item | Onde | Detalhe |
|---|---|---|---|
| P1.1 | RPCs com padrão frágil para service role | `marcar_cobranca_paga`, `regenerar_link_pix` (0003_functions.sql) | Validam só `current_clube_id()`/`auth.uid()`. Hoje são chamadas pelo client autenticado (funciona), mas se algum fluxo migrar para server route terão o mesmo bug do `ativar_planejamento` (corrigido na migration 0011). Padronizar o bloco de autorização. |
| P1.2 | Bundle: echarts e cropper estáticos | `plugins/echarts.client.ts`, `components/brand/ImageCropperModal.vue:111` | echarts entra no bundle principal via plugin client; `vue-advanced-cropper` importado estático. ~1MB+ evitável com `defineAsyncComponent`/import dinâmico (manual, Problema 7). |
| P1.3 | Listagens sem limite | `useFinanceiro.listarTransacoes`, alertas de evasão, e similares | Sem `.range()`/`.limit()` — ok com volume atual, degrada com crescimento (manual, Problema 3.3). Extrato já filtra por período, o que mitiga. |
| P1.4 | Sem atualização otimista | Frequência (registrar presença), Cobranças (marcar pago), Alertas (dispensar) | UI espera o servidor confirmar. Funciona, mas a percepção de velocidade melhora com update otimista + rollback (manual, Problema 5, Padrão 2). |
| P1.5 | `@nuxt/image` não configurado | fotos de atletas, logos | `<img>` simples, sem WebP/resize/lazy automático (manual, Problema 7, Correção 4). |
| P1.6 | TrialBadge navega para o lugar errado | `components/layout/TrialBadge.vue` | `goToUpgrade()` tem TODO e navega para `/configuracoes` em vez de `/upgrade`. |

## 4. Pendências menores (P2)

- 2FA/TOTP para gestores: previsto na UI de Configurações → Acessos como futuro, não implementado.
- `select('*')` em pontos não críticos (ex.: `listarPlanejamentos`, `atletas(*)` no vínculo de planejamento) — tabelas estreitas, impacto baixo; padronizar quando tocar nesses arquivos.
- RPCs/índices órfãos no banco (advisors acusam índices nunca usados — esperado em base nova; reavaliar com tráfego real).

---

## 5. Mapa funcional (estado por módulo)

| Módulo | Telas/recursos | Estado |
|---|---|---|
| Painel | Dashboard com KPIs, gráficos (echarts), insights | ✅ Completo |
| Atletas | Listagem com filtros/busca, cadastro/edição (modal), detalhe com financeiro/frequência/histórico, desativação | ✅ Completo |
| Turmas | CRUD, vínculo de atletas (drawer), busca com debounce | ✅ Completo |
| Frequência | Registro por turma/data, histórico, ranking, alertas de evasão | ⚠️ Telas prontas, mas alertas dependem de `detectar_evasoes()` que nunca roda (P0.1) |
| Calendário | CRUD de eventos, vínculo a turmas/atletas | ✅ Completo |
| Financeiro | Dashboard, extrato (filtros + export CSV), caixinhas, pendentes, entrada/saída manual, transferência entre caixinhas, planejamento (wizard 3 passos), Pix AbacatePay, webhook com HMAC e idempotência | ⚠️ 1º ciclo completo; **renovação recorrente não roda** (P0.1) |
| Cobranças → Pix | Geração em batch na ativação, regenerar link, marcar pago manual | ✅ Completo |
| Configurações | Clube, equipe, gestores, acessos, responsável, assinatura | ✅ Completo (2FA = P2) |
| Convide e Ganhe | Indicação por formulário + link único, histórico, recompensas | ✅ Completo |
| Upgrade/Assinatura | Paywall com planos | 🔴 Checkout stub (P0.2) |
| Suporte | Página de contato/ajuda | ✅ Completo |
| Auth | Login, cadastro multi-etapas, recuperar/nova senha, verificação por código, onboarding, convite de gestor | ✅ Completo |
| Admin (superadmin) | Dashboard, clubes (suspender/reativar/trocar plano), financeiro do sistema, vouchers, indicações, configurações do sistema, auditoria | ✅ Completo |
| App do atleta (API) | 17 endpoints (`server/api/app/*`): login por código, agenda, cobranças, frequência, notificações, LGPD (exportar/excluir) | ✅ Completo + cron de lembretes ativo |

---

## 6. Manual de performance — reanálise item a item

O arquivo reenviado é idêntico ao analisado anteriormente. Estado atual após as correções desta sessão:

### Aplicado ✅
- **Waterfalls (Prob. 1):** dashboard, atletas, calendário, frequência e CommandPalette já usavam `Promise.all`; `FinanceiroExtrato` e `convite.vue` corrigidos nesta sessão.
- **Debounce (Prob. 2):** turmas usa `useDebouncedRef(400)`; demais buscas filtram **em memória** (não disparam query por tecla) — ok.
- **Queries (Prob. 3):** listagens principais com campos específicos e paginação (`listarCobranças` com range, atletas/admin paginados); badge de pendentes agora usa `count head` (sem transferir linhas).
- **Índices (Prob. 4):** advisors zerados de FKs sem índice (migrations 0008/0010); índice de `criado_por` criado (0009).
- **Escrita (Prob. 5):** botões com loading/disabled e proteção de duplo submit nos modais e auth.
- **Cold start (Prob. 6):** `/api/health` existe; `/termos` e `/privacidade` com `prerender: true` (routeRules, nesta sessão). Falta: monitor de uptime pingando o health (config externa, ver §7).
- **RLS (Prob. 8):** policies com `(select auth.uid())` (0008) e policies permissivas duplicadas consolidadas (0010).
- **Cache (Prob. 9):** `useState` em auth/trial/tema; chaves invalidadas na troca de clube.
- **Tarefas pesadas (Prob. 10):** Pix em batch (5 por vez, 250ms entre batches) dentro da rota de ativação — aceitável no volume atual; webhook idempotente.

### Falta ⚠️ (vira backlog)
1. **Bundle (Prob. 7):** echarts e cropper para import dinâmico (P1.2) — maior ganho restante de bundle.
2. **`@nuxt/image` (Prob. 7):** instalar/configurar para fotos e logos (P1.5).
3. **Limites (Prob. 3.3):** `.range()` em `listarTransacoes` e alertas (P1.3).
4. **Atualização otimista (Prob. 5):** frequência/cobranças/alertas (P1.4).
5. **Keep-alive (Prob. 6):** configurar UptimeRobot/Better Stack apontando para `/api/health` a cada 5 min.
6. **Monitoramento (Seç. 13):** Sentry está parametrizado (`sentryDsn` no runtimeConfig) mas o módulo `@sentry/nuxt` não está instalado — decidir se ativa.

---

## 7. Itens fora do código (configuração/infra)

- Habilitar `pg_cron` no Supabase **ou** criar crons na Vercel para as 5 rotinas (P0.1).
- Definir `CRON_SECRET` na Vercel (a rota de cron aceita requisições sem auth quando a env não existe).
- Monitor de uptime no `/api/health`.
- Decidir gateway do checkout de assinatura (AbacatePay billing?) para P0.2.

## 8. Correções já aplicadas nesta sessão (referência)

| Item | Tipo | Migration/arquivo |
|---|---|---|
| Coluna `criado_por` em planejamentos (erro 400 ao salvar) | Banco | `0009` |
| Índices FK + policies duplicadas | Banco | `0010` |
| `ativar_planejamento` negava service role (caixinha nunca era criada) | Banco | `0011` |
| 406 em `configuracoes_sistema` (`.single()` → `.maybeSingle()`) | Código | `useConfiguracaoSistema.ts` |
| Hydration mismatch (aba via hash + origin do link de indicação) | Código | `pages/financeiro/index.vue`, `pages/convite.vue` |
| favicon 404 | Código | `public/favicon.svg` |
| Valor da etapa 1 ignorado na revisão do planejamento (+ `valor_customizado` com baseline errada) | Código | `FinanceiroPlanejamentoModal.vue` |
| Waterfalls, badge com count head, prerender termos/privacidade | Código | extrato, convite, financeiro, `nuxt.config.ts` |

> Itens de **código** dependem de deploy na Vercel; itens de **banco** já estão ativos em produção.

## 9. Status da execução (atualizado em 11/06/2026, mesma data)

| Item | Status | Como |
|---|---|---|
| P0.1 Rotinas do banco | ✅ Resolvido | pg_cron habilitado + 3 jobs ativos (migration `0012`) — cobranças 06h, evasões 08h, notificações 09h BRT |
| P0.2 Checkout de upgrade | ⏸ Adiado | Decisão: pagamento não será implementado agora |
| P1.1 RPCs service role | ✅ Resolvido | `marcar_cobranca_paga` e `regenerar_link_pix` endurecidos (migration `0013`) |
| P1.2 Bundle echarts/cropper | ✅ Resolvido | Plugin global redundante removido (echarts agora só no chunk do Financeiro, ~608K fora do entry); cropper com `defineAsyncComponent` |
| P1.3 Limites | ✅ Resolvido | `listarTransacoes` com `limite` (extrato usa 500); alertas com `.limit(100)` + select enxuto |
| P1.4 Updates otimistas | ✅ Resolvido | Marcar pago (individual e em massa, agora paralelo) e dispensar alerta — com rollback em erro |
| P1.5 @nuxt/image | ✅ Resolvido | Módulo configurado (Supabase Storage + Pexels); Avatar, logos e foto do gestor com WebP/resize; foto do login comprimida via CDN (antes vinha o original com vários MB) |
| P1.6 TrialBadge | ✅ Resolvido | Navega para `/upgrade?motivo=upgrade` (página ganhou o caso "upgrade") |
| Extra | ✅ | +2 fontes de hydration mismatch corrigidas no Topbar (localStorage e detecção de Mac em computed); modal de planejamento agora propaga erro de ativação (antes mostrava "sucesso" mesmo falhando) |

**Pendências que sobram:** P0.2 (checkout), 2FA (P2), e itens de infra fora do código: `CRON_SECRET` na Vercel, monitor de uptime no `/api/health`, decisão sobre Sentry.

> Itens de banco já estão ativos em produção; itens de código entram no próximo deploy (lembrar do `npm install` — nova dependência `@nuxt/image`).
