# Plano — App Mobile do Atleta (Athletto)

> **Status:** plano de arquitetura e produto. Nada deste documento foi implementado ainda — exceto a preparação do banco (ver §4.1), que já foi feita na reconstrução do backend.

---

## 1. Visão

App mobile (atleta e/ou responsável) onde o usuário entra com **CPF**, escolhe o **clube** (quando tiver mais de um) e informa a **senha daquele clube**. Cada clube é um ambiente isolado: agenda, pagamentos, frequência, avisos, desafios e perfil pertencem somente ao clube ativo. A sessão fica salva no aparelho; a troca de clube acontece apenas pelo Perfil, sempre revalidando a senha do clube de destino.

**Premissa central do modelo de dados:** o atleta **não é** um usuário do Supabase Auth. Ele é um registro na tabela `atletas`, único por `(clube_id, cpf)` — o mesmo CPF pode existir em N clubes, cada um com a própria senha. Isso casa exatamente com o fluxo desejado e evita misturar o auth de gestores com o de atletas.

---

## 2. Decisões de arquitetura

| Tema | Decisão | Por quê |
|---|---|---|
| Framework | **Flutter** (iOS + Android) | Já definido na documentação do produto (`athletto-docs/07-app-flutter.md`) |
| Backend | **Mesmo Supabase do sistema web** + endpoints server (Nuxt `/server/api/app/*` na Vercel) | Zero infra nova; o banco já é multi-tenant por `clube_id` |
| Auth do atleta | **JWT customizado emitido pelo servidor**, assinado com o JWT secret do projeto Supabase | Permite usar RLS nativa do Supabase para o atleta sem criar contas no Supabase Auth |
| Senha | `bcrypt` via `pgcrypto` (`crypt()`), armazenada em `atletas.app_senha_hash` | Já existe a coluna; hash forte, validado 100% no banco |
| Sessão no device | `flutter_secure_storage` (Keychain/Keystore) com o refresh token por clube | Sessão persistente e segura; suporta múltiplos clubes em cache |
| Estado | Riverpod (ou Bloc) com um `ClubeContext` global | Todo provider de dados depende do clube ativo — troca de clube = troca de contexto |

### 2.1 Como funciona o JWT customizado (recomendado)

1. O app chama `POST /api/app/login` (endpoint Nuxt server, roda na Vercel) com `{ cpf, clube_id, senha }`.
2. O endpoint valida a senha no banco (RPC `security definer` que compara com `crypt()`).
3. Se ok, o servidor assina um JWT com o **JWT secret do Supabase** contendo claims:
   ```json
   { "role": "authenticated", "app_role": "atleta", "atleta_id": "...", "clube_id": "...", "exp": ... }
   ```
4. O app usa esse token direto no client Supabase (`Authorization: Bearer`). As policies RLS do atleta leem `auth.jwt() ->> 'atleta_id'` e `auth.jwt() ->> 'clube_id'`.
5. Token de acesso curto (1h) + refresh token opaco (tabela `app_sessoes`) para renovação silenciosa.

**Vantagem:** o app consome as tabelas do Supabase normalmente (agenda, cobranças, frequência) com isolamento garantido **no banco**, não no client. O contexto do clube está *dentro do token* — é impossível o app vazar dados de outro clube, mesmo com bug no front (atende o requisito 6 do fluxo).

**Alternativa mais simples (fase 1, se quiser acelerar):** não usar RLS para o atleta e expor tudo via RPCs `security definer` (`app_minha_agenda(token)`, `app_minhas_cobrancas(token)`...). Menos elegante, mas reduz o trabalho de policies. O plano recomenda o JWT por ser definitivo.

---

## 3. Fluxo de acesso (espelha o requisito, com comportamento técnico)

### 3.1 Primeira abertura — CPF
- Tela única com campo de CPF (máscara + validação de dígitos no client).
- `POST /api/app/consultar-cpf { cpf }` → retorna lista de clubes onde há cadastro **ativo**:
  ```json
  { "clubes": [ { "clube_id", "nome", "logo_url", "atleta_status", "senha_definida": true|false } ] }
  ```
- O endpoint **não revela nada além do necessário** e tem rate-limit por IP + por CPF (proteção contra enumeração de CPFs).

### 3.2 Seleção de clube
- 0 clubes → tela "CPF não encontrado" (ver exceções).
- 1 clube → pula direto para a senha daquele clube.
- 2+ clubes → lista com logo e nome; atleta escolhe.

### 3.3 Senha por clube
- `senha_definida = false` → fluxo de **primeiro acesso** (ver 3.7).
- `senha_definida = true` → campo de senha → `POST /api/app/login { cpf, clube_id, senha }`.
- 5 tentativas erradas → bloqueio temporário de 15 min (contador em `app_sessoes`/rate-limit) com mensagem clara.

### 3.4 Sessão salva
- Tokens guardados no secure storage, **chaveados por clube**: `sessao:<clube_id>`.
- Guarda também `ultimo_clube_id`. Na reabertura: refresh silencioso da sessão do último clube → entra direto na Home.
- Refresh expirado/revogado → volta só para a tela de senha daquele clube (CPF já preenchido).
- Biometria (Face ID/digital) como **camada local opcional** na frente da sessão salva — fase 2.

### 3.5 Troca de clube (somente pelo Perfil)
- Perfil → **"Trocar de clube"** → lista os clubes do CPF (mesma consulta do 3.1).
- Escolheu outro clube → **pede a senha daquele clube** (mesmo que já exista sessão antiga em cache — revalidação obrigatória, conforme requisito).
- Login ok → app troca o `ClubeContext`, invalida caches/queries e recarrega a Home no novo ambiente.

### 3.6 Contexto do clube (requisito 6)
- Todos os repositórios de dados do app recebem o `clube_id` do contexto ativo — e o backend reforça via claims do JWT + RLS.
- Trocar de clube destrói o estado em memória (queries, caches de imagem de avisos etc.) antes de montar o novo ambiente.

### 3.7 Primeiro acesso / esqueci a senha
Sem SMTP/SMS no momento, o canal de confiança é o **gestor do clube**:
1. No painel web, o gestor gera um **código de primeiro acesso/redefinição** (6 dígitos, validade 24h) para o atleta — novo botão na ficha do atleta.
2. O atleta escolhe "Primeiro acesso" ou "Esqueci minha senha" no app → informa o código → define a nova senha (mín. 8 caracteres) → `POST /api/app/definir-senha`.
3. A senha é **por clube** (grava em `atletas.app_senha_hash` daquele registro).
- Fase futura: redefinição self-service por e-mail/WhatsApp quando houver servidor de envio.

---

## 4. Backend — o que precisa existir

### 4.1 Já preparado (feito na reconstrução do banco)
- `atletas.app_senha_hash`, `app_senha_definida_em`, `app_ultimo_acesso` — senha por clube.
- `UNIQUE (clube_id, cpf)` — mesmo CPF em vários clubes.
- Multi-tenancy com RLS em todas as tabelas.

### 4.2 A criar (migration `0006_app_atleta.sql` — quando o app começar)
| Item | Descrição |
|---|---|
| `app_sessoes` | `id, atleta_id, clube_id, refresh_token_hash, device_info, criado_em, expira_em, revogado` |
| `app_codigos_acesso` | códigos de primeiro acesso/redefinição gerados pelo gestor: `atleta_id, codigo_hash, tipo, expira_em, usado` |
| RPC `app_consultar_cpf(p_cpf)` | retorna clubes ativos do CPF (security definer, dados mínimos) |
| RPC `app_login(p_cpf, p_clube_id, p_senha)` | valida `crypt()`, registra `app_ultimo_acesso`, retorna `atleta_id` para o servidor emitir o JWT |
| RPC `app_definir_senha(p_cpf, p_clube_id, p_codigo, p_senha)` | valida código do gestor e grava o hash |
| Policies RLS "atleta" | SELECT em `eventos_calendario`, `cobrancas`, `frequencias`, `notificacoes`, `atletas` (só o próprio) usando claims do JWT |
| Endpoints Nuxt | `/api/app/consultar-cpf`, `/api/app/login`, `/api/app/refresh`, `/api/app/definir-senha`, `/api/app/logout` |
| Painel do gestor | botão "Gerar código de acesso do app" na ficha do atleta |

### 4.3 Variável de ambiente nova
- `SUPABASE_JWT_SECRET` (Settings → API → JWT Secret) — usada **apenas** nos endpoints server para assinar o token do atleta.

---

## 5. Telas do app (MVP)

| # | Tela | Conteúdo |
|---|---|---|
| 1 | Splash | logo + tentativa de refresh silencioso |
| 2 | CPF | campo único, máscara, validação |
| 3 | Seleção de clube | lista com logo/nome (pulada se só 1) |
| 4 | Senha | senha do clube + "esqueci minha senha" |
| 5 | Primeiro acesso | código do gestor → criar senha |
| 6 | **Home** | próximo treino/evento, resumo de pendências, avisos recentes |
| 7 | Agenda | eventos e treinos do clube ativo (lista + calendário) |
| 8 | Pagamentos | cobranças (pendente/pago/atraso) + link Pix da cobrança |
| 9 | Frequência | histórico de presenças, % por mês |
| 10 | Avisos | notificações do clube (`notificacoes` com `audience` atleta) |
| 11 | Perfil | dados do atleta no clube, **Trocar de clube**, sair |

Navegação: bottom bar com Home, Agenda, Pagamentos, Frequência, Perfil.

---

## 6. Casos de exceção (requisito 7 → comportamento)

| Cenário | Comportamento |
|---|---|
| CPF não encontrado | "CPF não localizado. Fale com o seu clube para confirmar seu cadastro." (mesma resposta com delay constante para não permitir enumeração) |
| CPF sem clube ativo | Mesma mensagem do item acima (não revelar que o CPF existe) |
| Clube inativo/bloqueado (`plano_ativo=false` ou assinatura suspensa) | Clube não aparece na lista; se a sessão salva apontar para ele → tela "Clube temporariamente indisponível" |
| Senha incorreta | Erro genérico "CPF ou senha inválidos" + contador; 5 erros → bloqueio 15 min |
| Atleta inativo no clube (`ativo=false`) | Não aparece na lista de clubes; sessão existente é revogada no próximo refresh |
| Primeiro acesso sem senha | Fluxo do código do gestor (§3.7) |
| Esqueci a senha | Mesmo fluxo do código, tipo "redefinição" |
| Token expirado | Refresh silencioso; falhou → tela de senha do clube com CPF preenchido |

---

## 7. Fases de execução

**Fase 0 — Backend (1 sprint)**
Migration `0006_app_atleta.sql` + endpoints `/api/app/*` + botão de código no painel do gestor + testes de RLS do papel atleta.

**Fase 1 — Fluxo de acesso (1–2 sprints)**
Projeto Flutter, design system (mesma identidade do web), telas 1–5, sessão segura por clube, troca de clube via Perfil. *Critério de pronto: todos os casos da §6 passando.*

**Fase 2 — Conteúdo (2 sprints)**
Home, Agenda, Pagamentos (com link Pix), Frequência, Avisos, Perfil. Pull-to-refresh + estados vazio/erro/carregando em toda tela.

**Fase 3 — Polimento e lojas (1 sprint)**
Biometria, push notifications (FCM — gatilhos já existem na tabela `notificacoes`), onboarding visual, publicação App Store/Play Store.

**Fase futura**
Desafios/gamificação, chat com o gestor, redefinição de senha self-service por e-mail/WhatsApp, modo responsável (pai vê N filhos por CPF do responsável).

---

## 8. Riscos e pontos de atenção

1. **Enumeração de CPF** — endpoint `consultar-cpf` é público por natureza; mitigar com rate-limit agressivo, resposta de tempo constante e mensagens idênticas para "não existe" e "sem clube ativo".
2. **Senha fraca / reuso** — exigir mínimo 8 caracteres; nunca permitir CPF como senha.
3. **Revogação** — desativar atleta ou bloquear clube deve revogar sessões: checagem de `ativo`/`plano_ativo` no refresh (a cada 1h no máximo).
4. **Cobrança Pix no app** — o link AbacatePay abre via webview/browser externo; o status volta pelo webhook já existente, então o app só precisa rebuscar a cobrança.
5. **LGPD** — CPF é dado pessoal: armazenar no device apenas o necessário, mascarar na UI (`***.***.***-00`), TLS sempre, e política de privacidade já existente (`/privacidade`) referenciada nas lojas.
