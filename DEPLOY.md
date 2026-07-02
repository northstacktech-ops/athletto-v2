# Deploy — Vercel + Supabase

## 1. Supabase

O banco do projeto **Athletto-v1** (`jzijguccwdwbbngzcuxz`) já está com o schema aplicado (migrations em `athletto-web/supabase/migrations/`).

Para recriar do zero em outro projeto: aplicar os 5 arquivos SQL em ordem no SQL Editor (0001 → 0005), conforme `athletto-web/supabase/README.md`.

## 2. Vercel — Import do projeto

1. Suba este repositório para o GitHub (a Vercel faz deploy a partir do Git).
2. Vercel → **Add New Project** → importe o repositório.
3. **Root Directory:** `athletto-web` *(essencial — é um monorepo)*
4. **Framework Preset:** Nuxt.js (detecta sozinho)
5. **Build Command / Install Command / Output Directory:** deixar todos no default (vazio). ⚠️ Nunca preencha Output Directory manualmente — causa deploy "Ready" com 404.

## 3. Variáveis de ambiente (Production + Preview)

| Variável | Valor | Escopo |
|---|---|---|
| `SUPABASE_URL` | `https://jzijguccwdwbbngzcuxz.supabase.co` | pública |
| `SUPABASE_KEY` | anon key (`eyJ...`) | pública |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **só servidor — nunca no client** |
| `ABACATEPAY_API_KEY` | chave AbacatePay (quando ativar Pix) | servidor |
| `ABACATEPAY_WEBHOOK_SECRET` | secret HMAC do webhook | servidor |
| `ABACATEPAY_ENV` | `sandbox` ou `production` | servidor |

Sem `SUPABASE_URL`/`SUPABASE_KEY` o build agora **falha de propósito** (não existe mais modo demo/mock).

## 4. Pós-deploy

1. Supabase → Authentication → URL Configuration: adicione a URL da Vercel em **Site URL** e **Redirect URLs**.
2. AbacatePay (quando ativar): configurar webhook para `https://<seu-dominio>/api/webhooks/abacatepay`.
3. Healthcheck: `https://<seu-dominio>/api/health`.

## 5. Rotinas agendadas

As funções `detectar_evasoes()`, `processar_notificacoes()` e `gerar_cobrancas_recorrentes()` não usam pg_cron por padrão. Para agendar, habilite pg_cron no Supabase (Database → Extensions) e siga o comentário no topo de `supabase/migrations/0003_functions.sql`.
