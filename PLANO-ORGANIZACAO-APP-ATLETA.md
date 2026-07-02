# Plano — Organização do App do Atleta (Flutter)

> **Objetivo:** definir a forma **correta** de organizar o app Flutter
> (`athletto-atleta/`), como **evolução do código que já existe** — não um
> template genérico. Cada decisão está ancorada no código real (`lib/services`,
> `lib/screens`), nos **17 endpoints já implementados** em
> `athletto-web/server/api/app/` e no modelo de negócio
> ([PLANOS-E-PRECIFICACAO.md](PLANOS-E-PRECIFICACAO.md), [PLANO-MOBILE.md](PLANO-MOBILE.md)).

---

## 0. Chão de fábrica — o que JÁ existe (verificado no código)

Antes de propor qualquer coisa, o estado real (não o que a doc imaginava):

**Camada de dados — já robusta:**
- `services/api.dart`: singleton `Api.instance`, cliente `http`, **tratamento de erro maduro** (`ApiException` + `mensagemErro()` traduz códigos do servidor para PT-BR), timeout, multipart de foto. Cobre **17 endpoints**.
- `services/session.dart`: singleton `SessionStore.instance`, `flutter_secure_storage`, sessão **chaveada por clube** (`sessao:<clubeId>`), `ultimoClubeId`, `ultimoCpf`, cache de atleta/clube.

**Contexto de clube — já existe (informalmente):**
- `screens/home_shell.dart`: `SessaoProvider` (InheritedWidget) injeta o `Sessao` ativo na árvore; `AppShellScope` deixa abas trocarem de aba. **Trocar de clube já funciona** via `_trocarSessao(nova)` + `setState`. Logout via callback.
- `screens/splash_screen.dart`: **restore silencioso já implementado** — lê última sessão, valida com `/me`, atualiza cache, entra na Home; falhou → Onboarding.

**Autenticação — token opaco + sessão no banco (verificado no servidor):**
- `/login` gera um **token opaco** (32 bytes), guarda o **hash SHA-256** em `app_atleta_sessoes` (validade **90 dias**, flag `revogado`, `device`) e devolve o token cru. **Não é JWT.**
- `validarSessao()` (em `server/utils/appAtleta.ts`) checa, a cada chamada autenticada: sessão existe + não revogada + não expirada → `atleta.ativo` → `clube.plano_ativo`. Qualquer falha = **401**.
- **Revogação existe** no servidor: logout, `/excluir-conta`, atleta inativo, clube sem plano. **Não há `/refresh`** — a janela de 90 dias cobre isso. Ver §8 para o que ainda falta.

**Navegação:** imperativa (`Navigator.push/pushReplacement/pushAndRemoveUntil`). Sem router declarativo.

**Estado de tela:** `StatefulWidget` + `setState`, sessão via `InheritedWidget`. **Sem** Riverpod/Provider/Bloc.

**Identidade visual desalinhada:** `config.dart` → `brandColorValue = 0xFF3D5AFE` (azul antigo); README cita tema `#3d5afe`. O web usa **brand `#11358B`** + **accent `#C7EF66`**. O ícone do app (pubspec) já usa `#C7EF66`. → inconsistência a corrigir (§9).

> **Conclusão:** o app **não é um esqueleto** — a camada de rede e o "contexto de
> clube" já funcionam bem. O problema é **organização e formalização**, não
> reconstrução. O plano abaixo preserva o que é bom e corrige o que escala mal.

---

## 1. O que realmente está fraco (problemas reais, não genéricos)

1. **`screens/` é gaveta (17 telas) e `Api` é um "god object" de 512 linhas.** Auth, abas, pagamento, LGPD, notificações, foto — tudo num arquivo só. Some a fronteira entre features.
2. **A UI passa `token` na mão em toda chamada.** Cada tela faz `SessaoProvider.of(context).token` e repassa para `Api.instance.xxx(token)`. Acoplamento e repetição; fácil esquecer/vazar.
3. **Sem camada de repositório.** As telas falam direto com o singleton `Api`. Difícil testar (não dá pra mockar), difícil evoluir, lógica de domínio espalhada em `setState`.
4. **O "ClubeContext" é implícito.** Está espalhado entre `Sessao`, `SessaoProvider` e `setState` do `HomeShell`. O conceito central do produto (isolamento por clube) não é um objeto de primeira classe — é convenção.
5. **A estrutura não comunica a lógica de negócio.** Quem abre o `lib/` não vê "isto é um app de consulta multi-tenant com poucas ações".

---

## 2. A lógica de negócio, corrigida (a base do desenho)

A precificação resume o app como "**consulta + pagar Pix**", mas o código revela a verdade — o que importa para a arquitetura é a **superfície de comandos vs. consultas**:

**CONSULTAS (read) — a maioria:**
`consultar-cpf`, `me`, `agenda`, `cobrancas`, `frequencia`, `avisos`, `notificacoes`, `preferencias (get)`, `exportar-dados`.

**COMANDOS (write) — pequenos e bem delimitados:**
| Comando | Endpoint | Feature |
|---|---|---|
| Login / definir senha / logout | `/login`, `/definir-senha`, `/logout` | auth |
| Trocar foto de perfil | `/foto` (multipart) | perfil |
| Salvar preferências de notificação | `/preferencias` (PUT) | conta |
| Marcar notificação como lida | `/notificacoes-ler` | notificacoes |
| Registrar consentimento (LGPD) | `/consentimento` | conta |
| Excluir/anonimizar conta (LGPD) | `/excluir-conta` | conta |

> **"Pagar via Pix" NÃO é uma escrita na nossa API.** A cobrança já vem com o
> link AbacatePay em `/cobrancas`; o app só **abre o link** (`url_launcher`) e
> reconsulta — o status volta pelo webhook (PLANO-MOBILE §risco 4). Logo, a
> feature `pagamentos` é **leitura + abrir link**, não comando.

**3 invariantes que a arquitetura tem que tornar óbvias:**

| Invariante | Como a estrutura garante |
|---|---|
| **Isolamento total por clube** | `ClubeContext` formal no `core/`, **dependência obrigatória de todo repositório**. A UI nunca mais toca em `token`/`clube_id` solto. |
| **Auth própria (não consome cota Supabase)** | `auth_repository` fala só com `/api/app/*`; token por clube no `session_store`. App não importa SDK de auth do Supabase. |
| **App "fino" — comandos contados** | Só `perfil`, `conta` e `auth` têm repositórios com escrita; o resto é read-only por contrato (interfaces sem métodos de mutação). |

---

## 3. Estrutura-alvo (feature-first + camada de dados leve)

```
lib/
  main.dart                    # bootstrap (orientação, locale, runApp)
  app.dart                     # MaterialApp + tema + (router, se Fase C)

  core/                        # transversal — NÃO conhece features
    config/
      env.dart                 # apiBaseUrl, webBaseUrl, flavors  (← config.dart)
      constants.dart           # timeouts, chaves de storage
    network/
      api_client.dart          # http puro: monta Uri, injeta header, decode, erros
      api_exception.dart       # ← extraído do api.dart (já existe, só mover)
      error_messages.dart      # ← mensagemErro() (já existe, só mover)
    session/
      clube_context.dart       # ◀ NOVO: o clube ativo como objeto de 1ª classe
      session_store.dart       # ← session.dart (já existe, só mover)
      sessao.dart              # ← model Sessao (já existe, mover de dentro de session.dart)
    theme/
      app_theme.dart           # ← theme/app_theme.dart
      colors.dart              # alinhar brand #11358B + accent #C7EF66 (§9)
    utils/
      cpf.dart  currency.dart  dates.dart   # ← widgets/formatters.dart, validações
    data/
      repository.dart          # BaseRepository: injeta token do ClubeContext (§5.2)

  shared/                      # reaproveitado entre features (sem regra de negócio)
    widgets/
      app_button.dart app_text_field.dart app_avatar.dart
      pressable.dart  app_cards.dart  state_views.dart
    models/
      clube.dart               # usado em auth + perfil → cross-feature

  features/
    auth/
      data/  auth_repository.dart        # consultar-cpf, login, definir-senha, logout
      presentation/  splash_ onboarding_ cpf_ selecionar_clube_ senha_ primeiro_acesso_ reset_enviado_
    home/
      presentation/  home_shell.dart  home_tab.dart  bottom_nav.dart
    pagamentos/
      data/  cobranca.dart  pagamentos_repository.dart    # read + abrir link
      presentation/  financeiro_tab.dart  pix_screen.dart  comprovante_screen.dart
    agenda/
      data/  evento.dart  agenda_repository.dart          # read-only
      presentation/  agenda_tab.dart
    frequencia/
      data/  frequencia.dart  frequencia_repository.dart  # read-only
      presentation/  frequencia_tab.dart
    notificacoes/                                          # ← era "avisos" (ver §14)
      data/  notificacao.dart  notificacoes_repository.dart # read /notificacoes + marcar-lida
      presentation/  alertas_tab.dart   # /avisos é stub morto; consome /notificacoes
    perfil/
      data/  atleta.dart  perfil_repository.dart           # read + foto
      presentation/  perfil_tab.dart       # + "Trocar de clube" (revalida senha)
    conta/                                                  # LGPD + preferências
      data/  conta_repository.dart         # preferencias, consentimento, excluir-conta, exportar-dados
      presentation/  preferencias_screen.dart  privacidade_screen.dart

test/
  features/<feature>/...       # espelha a árvore
```

**Regras de dependência (o que blinda a arquitetura):**
1. `core/` não importa `features/` nem `shared/`.
2. `features/` não importam umas às outras (compartilham via `core/`/`shared/`).
3. `presentation/` depende de `data/`, nunca o contrário.
4. Repositório recebe `ClubeContext` — **proibido** `token`/`clube_id` solto na UI.

---

## 4. Decisão de estado — honesto sobre Riverpod

A doc antiga mandava Riverpod + go_router. Mas o app **já tem** uma solução de
contexto funcionando (`InheritedWidget` + `setState`). Trocar tudo é um rewrite
grande de algo que **não está quebrado**. Avaliação honesta:

| Caminho | Esforço | Ganho | Quando vale |
|---|---|---|---|
| **A — Formalizar o que existe** (recomendado p/ já): `ClubeContext` como `ChangeNotifier` exposto por um `InheritedNotifier`; repositórios injetando o token do contexto | Baixo | Tira o `token` da UI, cria camada testável, mantém navegação atual | Agora — alto valor, baixo risco |
| **B — Riverpod + go_router** (alvo de longo prazo) | Alto | `ref.invalidate` no trocar-clube, guards declarativos, DI limpa | Quando o app crescer (push, gamificação, modo responsável) |

**Recomendação:** fazer **A agora** (Fases A–B). A reorganização de pastas + a
camada de repositório são **agnósticas de framework** — valem para os dois
caminhos. Migrar para Riverpod (B) vira a **Fase C**, decidida só se a dor
justificar. Não reescrever um app que funciona por dogma de arquitetura.

---

## 5. Contratos concretos (o coração do plano)

### 5.1 `ClubeContext` — o clube ativo como objeto de 1ª classe

```dart
// core/session/clube_context.dart
class ClubeContext extends ChangeNotifier {
  ClubeContext(this._store);
  final SessionStore _store;
  Sessao? _sessao;

  Sessao? get sessao => _sessao;
  bool get autenticado => _sessao?.token.isNotEmpty ?? false;
  String get token => _sessao?.token ?? '';
  String get clubeId => _sessao?.clubeId ?? '';
  Atleta? get atleta => _sessao?.atleta;
  Clube? get clube => _sessao?.clube;

  /// Restore silencioso (o que o splash já faz hoje, centralizado aqui).
  Future<bool> restaurar(Api api) async { /* lerUltimaSessao + /me */ }

  /// Troca de clube: valida no /login (feito pelo auth_repository), troca o
  /// contexto e NOTIFICA — todas as telas/repos rebindam ao novo clube.
  Future<void> entrar(Sessao nova) async {
    await _store.salvarSessao(nova);
    _sessao = nova;
    notifyListeners();              // ← substitui o setState espalhado
  }

  Future<void> sair() async {
    if (_sessao != null) await _store.removerSessao(_sessao!.clubeId);
    _sessao = null;
    notifyListeners();
  }
}
```
Exposto no topo da árvore por `InheritedNotifier<ClubeContext>` (evolução
natural do atual `SessaoProvider`). **Trocar de clube = `entrar(nova)`** →
`notifyListeners` → tudo rebinda. (Em Riverpod, vira `ref.invalidate`.)

### 5.2 `BaseRepository` — tira o `token` da UI

```dart
// core/data/repository.dart
abstract class BaseRepository {
  BaseRepository(this._ctx, this._api);
  final ClubeContext _ctx;
  final Api _api;

  /// Garante o clube ativo e injeta o token. Comandos/consultas usam isto.
  Future<T> guarded<T>(Future<T> Function(Api api, String token) call) {
    if (!_ctx.autenticado) throw ApiException('Sessão expirada.', statusCode: 401);
    return call(_api, _ctx.token);
  }
}

// features/pagamentos/data/pagamentos_repository.dart
class PagamentosRepository extends BaseRepository {
  PagamentosRepository(super.ctx, super.api);
  Future<List<Cobranca>> listar() => guarded((api, t) => api.cobrancas(t));
  // "pagar" não existe: a UI abre cobranca.linkPix via url_launcher.
}
```
A tela passa a chamar `repo.listar()` — **sem token, sem clube_id**. Impossível
vazar contexto por engano (invariante 1 da §2).

### 5.3 Guard de sessão (quando for Fase C / go_router)

```dart
redirect: (ctx, state) {
  final logado = clubeContext.autenticado;
  final emAuth = state.matchedLocation.startsWith('/auth');
  if (!logado && !emAuth) return '/auth/cpf';
  if (logado && emAuth)   return '/home';
  return null;
}
```
Até lá, a navegação imperativa atual continua válida.

---

## 6. Mapa Api → feature/repositório (rastreabilidade total)

| Método em `api.dart` | Tipo | Vai para |
|---|---|---|
| `consultarCpf`, `login`, `definirSenha`, `logout` | cmd/qry | `features/auth/data/auth_repository.dart` |
| `me` | qry | `core/session/clube_context.dart` (restore/refresh de cache) |
| `agenda` | qry | `features/agenda/data/agenda_repository.dart` |
| `cobrancas` | qry | `features/pagamentos/data/pagamentos_repository.dart` |
| `frequencia` | qry | `features/frequencia/data/frequencia_repository.dart` |
| `listarNotificacoes`, `marcarNotificacaoLida` | qry/cmd | `features/notificacoes/data/notificacoes_repository.dart` |
| `avisos` | qry | **stub morto** — sempre `[]`. Remover do app ou apontar para `/notificacoes` (§14) |
| `uploadFoto` | cmd | `features/perfil/data/perfil_repository.dart` |
| `getPreferencias`, `setPreferencias`, `registrarConsentimento`, `exportarDados`, `excluirConta` | qry/cmd | `features/conta/data/conta_repository.dart` |

> O `api.dart` atual continua existindo como **transport** (`core/network`); os
> repositórios são a fachada de domínio por cima dele. Migração incremental: dá
> pra criar um repo por vez sem quebrar os outros.

---

## 7. Matriz de erros e exceções → onde é tratado

Cada código de `mensagemErro()` e cada caso da §6 do PLANO-MOBILE precisa ter dono:

| Situação (código/cenário) | Camada que trata | Comportamento |
|---|---|---|
| `nao_encontrado` / CPF sem clube ativo | auth_repository → cpf_screen | Mensagem neutra (anti-enumeração), tempo constante |
| `credenciais` / 5 erros | auth_repository → senha_screen | Erro genérico + contador → bloqueio 15 min |
| `senha_nao_definida` | auth_repository → senha_screen | Roteia para primeiro_acesso |
| `codigo_invalido` / `senha_curta` | auth_repository → primeiro_acesso | Mensagem do `mensagemErro()` |
| `401` "Clube inativo." (hoje sem código) | clube_context / `BaseRepository` | **Hoje:** vira "Sessão expirada". **Alvo:** com `erro:clube_inativo` (§8) → tela "Clube indisponível" |
| `401` genérico em chamada autenticada | `BaseRepository.guarded` / api | Limpa sessão → volta para senha do clube (CPF preenchido) |
| Timeout / offline | api_client (`ApiException`) | `state_views` de erro com "tentar novamente" |
| Token expirado no splash | clube_context.restaurar | Onboarding/senha (já é o comportamento atual) |

> **Decisão:** centralizar o tratamento de `401` no `BaseRepository`/`api_client`
> (hoje só `me` trata 401 explicitamente; as demais caem no genérico).

---

## 8. Autenticação — o que existe e o que falta (verificado)

**Realidade (não o que a doc imaginava):** token **opaco** + hash em
`app_atleta_sessoes`, **90 dias**, revogável. O JWT/refresh do PLANO-MOBILE §2.1
**não** foi usado — e o modelo atual é legítimo (revogação server-side existe).

**O que ainda falta / pontos de atenção reais:**
1. **401 sem código.** Endpoints autenticados retornam `401` só com `statusMessage`
   ("Atleta inativo." / "Clube inativo." / "Sessão inválida ou expirada.") — **sem
   campo `erro`**. O app não distingue os três; pior, `me()` mascara tudo como
   "Sessão expirada". → **Recomendação:** o servidor anexar `data:{ erro:
   'clube_inativo' | 'atleta_inativo' | 'sessao_invalida' }` no 401, e o app rotear
   (clube inativo → tela "Clube indisponível"; sessão → senha do clube).
2. **Sem rotação de token.** 90 dias fixos; token vazado vale até expirar/ser
   revogado. Opcional: rotacionar no `/me` (emitir novo, revogar o antigo).
3. **Rate-limit em memória** (`rlBuckets`) é **por instância serverless** na Vercel
   → fraco sob escala. Migrar para um store compartilhado se enumeração virar risco.

A organização proposta **não depende** dessas decisões — `clube_context` e
`BaseRepository` encapsulam a sessão; mudar a política de token não toca as features.

---

## 9. Identidade visual — alinhar com o web (e a logo)

- `config.dart` usa `#3D5AFE` (azul antigo). Padronizar `core/theme/colors.dart`
  com **brand `#11358B`** e **accent `#C7EF66`** (iguais ao
  `athletto-web/tailwind.config.ts`).
- O ícone do app já é lime (`#C7EF66`) — manter.
- **Amarra com a tarefa pendente da logo:** quando o SVG novo chegar, gerar o
  `assets/img/logo.png` (usado no splash) e o ícone adaptativo a partir dele,
  nas duas cores oficiais (preto + `#C7EF66`).

---

## 10. Migração ordenada por risco (mantém o app compilando)

Ordem que **nunca deixa o projeto quebrado** entre passos:

1. **`core/` sem mover lógica:** criar `core/network` (mover `api_exception`,
   `error_messages` extraídos do `api.dart`), `core/session` (mover `session.dart`,
   extrair `sessao.dart`), `core/theme`, `core/config` (← `config.dart`),
   `core/utils` (← `formatters`). Corrigir imports. → `flutter analyze` limpo.
2. **`shared/`:** mover `widgets/*` e `models/clube.dart`. → analyze limpo.
3. **`features/<x>/presentation`:** mover telas por feature (uma feature por
   commit). Imports passam a `package:athletto_atleta/...`. → analyze limpo.
4. **`features/<x>/data`:** mover os models restantes e **criar os repositórios**
   um a um, fazendo a tela correspondente passar a usar o repo. → analyze limpo.
5. **`core/session/clube_context.dart` + `InheritedNotifier`:** trocar o
   `SessaoProvider` atual; `HomeShell._trocarSessao` vira `context.entrar()`.

Cada passo é commitável e reversível.

---

## 11. Fases e Definition of Done

**Fase A — Reestrutura física (passos 1–3 da §10).**
DoD: `flutter analyze` sem warnings; `flutter run` idêntico ao de hoje; árvore = §3 (sem `data/` ainda).

**Fase B — Camada de dados + ClubeContext (passos 4–5).**
DoD: nenhuma tela importa `Api`/`SessionStore` direto; UI não manipula `token`/`clube_id`; trocar de clube via `clube_context.entrar`; 401 tratado no `BaseRepository`.

**Fase C — (opcional) Riverpod + go_router.**
DoD: providers por feature; guard de rota; deep link `athletto://clube/{slug}`; trocar-clube via `ref.invalidate`.

**Fase D — Qualidade.**
DoD: `state_views` (loading/vazio/erro) em toda tela com dados; `test/features/*` com testes de repositório (Api mockado) e do guard; identidade visual alinhada (§9).

---

## 12. Log de decisões

| # | Decisão | Alternativa descartada | Por quê |
|---|---|---|---|
| D1 | Feature-first + `data/`/`presentation` | Flat-by-type (atual) | Fronteiras claras; `screens/`/`api.dart` não escalam |
| D2 | Evoluir `InheritedWidget`→`ClubeContext` agora; Riverpod depois | Riverpod já | Não reescrever o que funciona; reorg+repos são agnósticos |
| D3 | Manter `http` encapsulado | Migrar p/ `dio` | Sem ganho real hoje; `api_client` isola a troca futura |
| D4 | `BaseRepository` injeta token do contexto | UI passar token (atual) | Tira acoplamento e risco de vazar clube |
| D5 | Registrar gap do refresh, não bloquear nele | Implementar refresh já | Organização não depende disso; é decisão de segurança à parte |

---

## 13. Fora de escopo (é web/backend)

Cobrança da assinatura do clube (Base/Pro/Elite), aplicação de limites de plano
(RLS/checks no banco), conta Pix por clube (Modelo A). O app do atleta permanece
**fino**: consulta isolada por clube + um punhado de comandos (§2).

---

## 14. Validação contra o backend — contratos verificados

> Lido endpoint por endpoint em `athletto-web/server/api/app/*` +
> `server/utils/appAtleta.ts`. **Esta seção é a fonte de verdade** dos contratos;
> onde conflitar com texto anterior, vale o que está aqui.

### 14.1 Padrões transversais (todos os endpoints)
- **Auth:** header `Authorization: Bearer <token opaco>`; servidor valida via
  `validarSessao` (sessão + atleta ativo + clube com plano).
- **CORS:** `Allow-Origin: *`, métodos `GET,POST,OPTIONS` (responde `''` ao OPTIONS).
- **Rate-limit:** só nos 3 públicos (`consultar-cpf`, `login`, `definir-senha`),
  **10/min por IP**, `429` ao estourar. Em memória (por instância — §8.3).
- **Validação:** zod (`lerBodyValidado`); CPF normalizado p/ 11 dígitos no servidor.
- **Erro:** públicos → `{ erro: <codigo> }` (no body ou em `data`); autenticados →
  `401`/`400`/`500` com `statusMessage` **sem** `erro` (§8.1).

### 14.2 Contratos (request → response) confirmados

| Endpoint | Auth | Entrada | Saída (campos reais) |
|---|---|---|---|
| `POST /consultar-cpf` | — | `{cpf}` | `{ok, clubes:[{clube_id, atleta_id, nome, logo_url, senha_definida}]}` |
| `POST /login` | — | `{cpf, clube_id, senha, device?}` | `{token, atleta:{id,nome,apelido,foto_url,posicao,numero_camisa,status}, clube:{id,nome,logo_url}}` · falha → `401 {erro}` |
| `POST /definir-senha` | — | `{cpf, clube_id, codigo, senha}` | `{ok}` · falha → `400 {erro}` |
| `GET /me` | ✅ | — | `{atleta:{…}, clube:{id,nome,logo_url}}` |
| `POST /logout` | ✅ | — | `{ok:true}` (marca `revogado`) |
| `GET /agenda` | ✅ | — | `[{id,titulo,descricao,tipo,data_inicio,data_fim,local}]` (treinos recorrentes + eventos; janela −30/+120 dias) |
| `GET /cobrancas` | ✅ | — | `[{id,valor,status,data_vencimento,data_pagamento,abacatepay_link,caixinha_nome}]` |
| `GET /frequencia` | ✅ | — | `{percentual,total_treinos,total_presencas,historico:[{data,presente,turma_nome}]}` (últimos 60) |
| `GET /avisos` | ✅ | — | **`{avisos:[]}` sempre** — stub, sem tabela |
| `GET /notificacoes` | ✅ | — | `[{id,tipo,titulo,mensagem,detalhe,acao_label,acao_destino,lida,criada_em}]` · `tipo ∈ financeiro\|vencido\|evento\|clube\|senha` (limite 100) |
| `POST /notificacoes-ler` | ✅ | `{id?}` ou `{todas:true}` | `{ok:true}` |
| `GET /preferencias` | ✅ | — | `{notif_avisos, notif_pagamento}` (default `true`) |
| `PUT /preferencias` | ✅ | `{notif_avisos?, notif_pagamento?}` | `{notif_avisos, notif_pagamento}` (estado final) |
| `POST /foto` | ✅ | multipart `foto` (png/jpeg/webp, ≤2 MB) | `{ok:true, url}` (caminho fixo `{clube_id}/atletas/{atleta_id}.png`) |
| `GET /exportar-dados` | ✅ | — | JSON LGPD (RPC `app_exportar_dados_atleta`) |
| `POST /excluir-conta` | ✅ | `{confirmacao:"EXCLUIR"}` | `{ok:true}` · anonimiza + revoga sessões (irreversível) |
| `POST /consentimento` | ✅ | `{termos_uso?, politica_privacidade?, marketing?, versao?}` | `{ok:true}` (versão vigente `2026-06-06`) |

### 14.3 Tabelas/RPCs que o app depende (Supabase)
`app_atleta_sessoes`, `app_notificacoes`, `app_atleta_prefs`, `consentimentos`,
`atletas`(+`ativo`), `clubes`(+`plano_ativo`), `cobrancas`(+`caixinhas`),
`frequencias`(+`turmas`), `atleta_turma`, `eventos_calendario`.
RPCs: `app_consultar_cpf`, `app_login`, `app_definir_senha`,
`app_exportar_dados_atleta`, `app_anonimizar_atleta`.

### 14.4 Discrepâncias encontradas → ações
| # | Achado | Impacto | Ação |
|---|---|---|---|
| V1 | **`/avisos` é stub** (`[]` fixo); a feature real é `/notificacoes` | `alertas_tab` mostra vazio se usa `/avisos` | Renomear feature p/ `notificacoes`; consumir `/notificacoes`; remover `Api.avisos` ou apontar p/ a tabela quando existir |
| V2 | **401 autenticado sem `erro`** | App não distingue clube-inativo de expirado | Backend anexar `data:{erro}`; app rotear (§7, §8.1) |
| V3 | **Cor `#3D5AFE` no app** ≠ brand web `#11358B`/`#C7EF66` | Identidade inconsistente | Alinhar em `core/theme/colors.dart` (§9) |
| V4 | **Sem paginação** (agenda/frequência/notificações têm janelas/limites fixos) | OK p/ MVP; não há scroll infinito | Modelar repositórios como "lista única" (sem cursor) |
| V5 | **`Atleta` do app deve casar** com `{id,nome,apelido,foto_url,posicao,numero_camisa,status}` | Parsing pode divergir | Conferir `models/atleta.dart` contra esses campos na Fase B |

> **Conclusão da validação:** o backend está coerente e o plano bate com ele,
> com **5 ajustes** (V1–V5). Nenhum exige reescrever a arquitetura proposta —
> são correções pontuais que entram nas Fases A/B e numa pequena mudança no
> servidor (V2).

---

*Plano gerado em 2026-06-15 a partir da leitura de `athletto-atleta/lib/{services,screens}`, dos **17 endpoints + `appAtleta.ts`** em `athletto-web/server/api/app/` e do modelo de negócio vigente. Contratos da §14 verificados linha a linha no código do servidor.*
