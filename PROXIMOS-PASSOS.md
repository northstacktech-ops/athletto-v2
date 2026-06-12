# Próximos passos — checklist de 5 minutos

Tudo que dependia de código/banco já foi feito. Falta só o que exige seus acessos (GitHub/Vercel).

---

## 1. Subir o código (deploy)

A pasta local não é um clone git — copie os arquivos alterados para o seu clone do repositório (`northstacktech-ops/athletto-v2`) ou substitua o conteúdo e rode:

```bash
git add -A
git commit -m "fix: planejamento (valor etapa 1, erro de ativação), hydration, favicon + perf (nuxt/image, bundle echarts, limites, updates otimistas) + migrations 0009-0013"
git push
```

A Vercel builda sozinha. A dependência nova (`@nuxt/image`) instala no build — nada a fazer.

## 2. Variável CRON_SECRET na Vercel

Vercel → projeto **athletto-v2** → Settings → Environment Variables → Add:

| Name | Value | Environments |
|---|---|---|
| `CRON_SECRET` | `8a273c82789eb39270955f052358adb22af2c9b05e2ad709661024abe51b9b3a` | Production |

(Valor já gerado com `openssl rand -hex 32`. Sem essa env, a rota `/api/cron/processar-notificacoes` aceita chamadas sem autenticação.)

Depois de salvar, faça **Redeploy** para a env valer.

## 3. Teste pós-deploy (2 min)

- [ ] `+ Planejamento` com valor **diferente** da mensalidade da turma → a revisão (etapa 3) deve mostrar o valor da etapa 1
- [ ] "Criar e Ativar cobranças" → caixinha aparece na aba Caixinhas com as cobranças
- [ ] Console (F12) limpo: sem hydration mismatch, sem favicon 404, sem 400/406
- [ ] Badge "23d trial" no topo → leva para a página de upgrade (não mais para Configurações)

## 4. Opcional (quando quiser)

- **Uptime/keep-alive:** criar monitor gratuito no [uptimerobot.com](https://uptimerobot.com) → HTTP(s) → `https://athletto-v2.vercel.app/api/health` → intervalo 5 min. Evita cold start e avisa se o site cair.
- **Sentry:** o `SENTRY_DSN` já é lido pelo runtimeConfig, mas o módulo não está instalado — decidir se ativa.
- **Checkout de upgrade (P0.2):** adiado por decisão sua; quando for implementar, o caminho sugerido está no `REVIEW-FUNCIONALIDADES-2026-06.md`.

## Já feito (não precisa de ação)

- Banco em produção: coluna `criado_por`, índices, policies consolidadas, RPCs corrigidos/endurecidos e **pg_cron com as 3 rotinas agendadas** (cobranças recorrentes 06h, evasões 08h, notificações 09h BRT) — migrations `0009` a `0013`, todas versionadas em `athletto-web/supabase/migrations/`.
- Rascunhos de teste (TESTE 01, Viagem 2026) excluídos.
