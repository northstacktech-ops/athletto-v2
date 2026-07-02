# Integração ValidaPay — guia (2026-06-13)

Modelo escolhido: **cada clube = uma subconta** ValidaPay (o clube recebe direto, sem split/taxa). A Athletto (conta Master) cria a subconta e gera as cobranças via API.

## O que já está no código (isolado, ligado por env — não afeta o AbacatePay)

- `server/utils/validapay.ts` — cliente da API: OAuth2 (token em cache), criar subconta PF/PJ, status, listar, saldo, **criar cobrança Pix na subconta**, status de cobrança, simular pagamento (sandbox).
- `server/api/clube/validapay-subconta.post.ts` — gestor **principal** cria a subconta do clube (`POST /v1/proposals`). Salva `form_id` (status `pendente`).
- `server/api/webhooks/validapay.post.ts` — recebe `account_approved` (marca subconta **aprovada** + nº da conta) e `payment.success` (baixa a cobrança + cria a transação de entrada). Idempotente.
- `server/api/cobrancas/[id]/validapay-pix.post.ts` — gera o Pix **na subconta do clube** e salva `validapay_charge_id` + EMV (copia-e-cola).
- `supabase/migrations/0021_validapay_subcontas.sql` — tabela `clube_validapay` (vínculo clube↔subconta + status) e colunas `cobrancas.validapay_charge_id`/`validapay_emv`.

## Endpoints da ValidaPay usados
- Auth: `POST https://oauth2(-sandbox).validapay.com.br/auth/token` (client_credentials).
- Cobrança: `POST /v1/charges/pix` (header `accountId` = subconta do clube).
- Subconta: `POST /v1/proposals` (PF/PJ) · `GET /v1/proposals/:formId` · `GET /v1/accounts/subaccounts`.
- Saldo/extrato/saque/devolução: `/v1/wallet/*`.
- Base: prod `https://api.validapay.com.br` · sandbox `https://sandbox.validapay.com.br`.

## O que VOCÊ precisa fazer (quando decidir migrar)

1. **Criar a conta Master** (KYC/CNPJ) em `app.validapay.com.br` — isso é manual, eu não consigo.
2. **Gerar credenciais** em `app.validapay.com.br/integracao/api` (sandbox primeiro).
3. **Env na Vercel:**
   | Variável | Valor |
   |---|---|
   | `VALIDAPAY_CLIENT_ID` | client id |
   | `VALIDAPAY_CLIENT_SECRET` | client secret |
   | `VALIDAPAY_ENV` | `sandbox` (depois `production`) |
   | `VALIDAPAY_WEBHOOK_SECRET` | uma string aleatória (opcional, mas recomendo) |
4. **Webhook no painel** (`app.validapay.com.br/integracao/webhooks`): `https://SEU-DOMINIO/api/webhooks/validapay?s=<VALIDAPAY_WEBHOOK_SECRET>`.
5. **Aplicar a migration `0021`** (SQL Editor do Supabase, como a `0020`).
6. `npm run build` + deploy.

## O que falta eu fazer (quando você confirmar a migração)

- **UI em Configurações → Pagamentos**: formulário para criar a subconta do clube (dados PF/PJ + `financialDetails`). Preciso buscar o **apêndice de Campos Financeiros** da doc (códigos de renda/ocupação/patrimônio) para montar os selects corretos.
- **Trocar o gerador de Pix**: hoje a ativação de planejamento chama o AbacatePay; quando migrar, chamo `validapay-pix` no lugar (atrás da mesma interface — troca por env, sem retrabalho).
- **Teste ponta-a-ponta no sandbox**: criar subconta → aprovar (webhook) → gerar cobrança → `simularPagamento` → confirmar baixa.

## Importante (segurança)
- As credenciais ValidaPay ficam **só em env** (server). Nunca no client nem no chat.
- Para eu **construir**, não preciso de credencial nenhuma. Para **testar**, eu não chamo a API daqui (restrição de rede) — o teste roda no app publicado/sandbox.

> Decisão pendente sua: confirmar a migração AbacatePay → ValidaPay. Enquanto não confirma, o código fica dormente (sem env, nada muda).
