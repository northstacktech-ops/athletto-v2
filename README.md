# Athletto v1.0

SaaS multi-tenant de gestão de clubes esportivos (gestores, atletas, turmas, frequência, financeiro com Pix via ValidaPay).

## Estrutura do repositório

```text
athletto-v1/
├── pages/         → Rotas (gestor + painel /admin)
├── components/    → Componentes por domínio (atletas, financeiro, admin, ui...)
├── composables/   → Lógica de dados (Supabase) — um por domínio
├── server/api/    → Endpoints server-side (signup, Pix, webhooks)
├── supabase/      → Migrations SQL (fonte de verdade do banco)
└── middleware/    → Auth, plano e admin guards
```

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com as chaves do Supabase
npm run dev            # http://localhost:4000
```

## Banco de dados

O schema completo está em `supabase/migrations/` (aplicar em ordem). Detalhes em `supabase/README.md`.
