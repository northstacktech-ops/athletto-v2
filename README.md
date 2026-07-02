# Athletto 2.0

SaaS multi-tenant de gestão de clubes esportivos (gestores, atletas, turmas, frequência, financeiro com Pix via AbacatePay).

## Estrutura do repositório

```
athletto-2.0-main/
├── athletto-web/      → Aplicação web (Nuxt 3 + Supabase + Tailwind/Preline)
│   ├── pages/         → Rotas (gestor + painel /admin)
│   ├── components/    → Componentes por domínio (atletas, financeiro, admin, ui...)
│   ├── composables/   → Lógica de dados (Supabase) — um por domínio
│   ├── server/api/    → Endpoints server-side (signup, Pix, webhooks)
│   ├── supabase/      → Migrations SQL (fonte de verdade do banco)
│   └── middleware/    → Auth, plano e admin guards
├── athletto-docs/     → Documentação do produto (visão, módulos, regras, design)
├── PLANO-MOBILE.md    → Plano da versão mobile do atleta (CPF → clube → senha)
└── DEPLOY.md          → Como fazer deploy na Vercel + variáveis de ambiente
```

## Rodando localmente

```bash
cd athletto-web
npm install
cp .env.example .env   # preencha com as chaves do Supabase
npm run dev            # http://localhost:4000
```

## Banco de dados

O schema completo está em `athletto-web/supabase/migrations/` (5 arquivos, aplicar em ordem). Detalhes em `athletto-web/supabase/README.md`.

## Documentação

- Produto e regras de negócio: `athletto-docs/`
- Padrões de design/UI (Preline): `athletto-docs/design.md`
- Deploy: `DEPLOY.md`
