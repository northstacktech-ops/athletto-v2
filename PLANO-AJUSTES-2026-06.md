# Athletto — Plano de Ajustes (Junho/2026)

> **Escopo:** Agenda (bug), Foto única do atleta, Notificações internas + Lembretes de pagamento, Páginas LGPD (Privacidade/Segurança e Ajuda/Suporte) com link no app e no login.
> **Stack:** Web (gestor) Nuxt 3 + Supabase + Vercel · App (atleta) Flutter + REST.
> **Decisão tomada:** notificações **somente internas no app** (sem FCM/push agora). A arquitetura fica pronta para encaixar push depois.
> **Status:** aguardando aprovação para executar.

---

## Resumo das causas-raiz (já investigadas)

| Frente | Diagnóstico confirmado |
|---|---|
| Agenda | `eventos_calendario` está **vazia**. Os treinos da turma são gerados *na hora* no painel do gestor a partir de `turmas.dias_semana` + `horario_inicio/horario_fim` (função `gerarTreinos()` em `useCalendario.ts`) e **nunca viram linhas no banco**. O endpoint `/api/app/agenda` só lê `eventos_calendario` → o atleta não vê treino. Cobrança aparece porque é linha real. |
| Foto | O web já tem crop 512×512 pronto (`AvatarUploader` + `ImageCropperModal`, bucket `avatares`), mas **não está plugado no cadastro do atleta** — nem o gestor consegue setar a foto hoje. O app só exibe `foto_url`, sem upload. Não há caminho único de arquivo. |
| Notificações | Existe tabela `notificacoes` + triggers + realtime (lado gestor), mas **sem agendamento (cron)**, **sem lembrete antes do vencimento** e **sem canal para o atleta**. As preferências no app são só visuais (não persistem). |
| LGPD | `pages/privacidade.vue`, `pages/suporte.vue` e `pages/termos.vue` já existem e são públicas, mas sem link no login e com conteúdo a completar para LGPD. O app tem os botões em Perfil, porém sem ação. |

---

## Frente 1 — Corrigir a sincronização da Agenda

**Objetivo:** o atleta passar a ver, no app, os mesmos treinos que o gestor vê — incluindo os treinos recorrentes da turma — além de eventos pontuais.

**Abordagem:** replicar no endpoint `/api/app/agenda` exatamente a lógica de `gerarTreinos()` do gestor, expandindo os treinos recorrentes das turmas do atleta em ocorrências dentro de uma janela, e mesclar com os eventos reais de `eventos_calendario`.

**Mudanças:**
- `athletto-web/server/api/app/agenda.get.ts`
  - Buscar as turmas ativas do atleta **com os campos de horário**: `dias_semana`, `horario_inicio`, `horario_fim`, `local`, `nome`.
  - Gerar as ocorrências de treino numa janela (proposta: de hoje−7 dias até hoje+60 dias) usando a **mesma convenção de `dias_semana`** do gestor (vou extrair a lógica de `gerarTreinos` para um util compartilhado `server/utils/treinos.ts` para garantir paridade e evitar divergência futura).
  - Continuar trazendo os eventos pontuais de `eventos_calendario` (atleta_ids / turma_ids / turma_id / evento geral) e **corrigir o bug do `local`** (o `select` atual não inclui a coluna `local`, então hoje volta sempre `null`).
  - Mesclar treinos + eventos, ordenar por `data_inicio`, retornar com `id` estável por ocorrência (ex.: `treino-<turma_id>-<data>`), `titulo`, `tipo` (`treino`/`evento`), `data_inicio`, `data_fim`, `local`.
- App Flutter: nenhuma mudança estrutural — a Home (próximos eventos) e a Agenda (navegação por semana/dia) já consomem `/agenda`. Só validar a exibição com dados reais.

**Verificação:** com o atleta de teste que você citou (matriculado numa turma com treino agendado), conferir que os treinos da semana aparecem no app e batem com o calendário do gestor.

---

## Frente 2 — Foto única do atleta (gestor ⇄ app), crop 512×512

**Objetivo:** uma única foto por atleta, idêntica no gestor e no app; edição no app reflete no gestor e vice-versa; crop sempre 512×512.

**Princípio (fonte única):** um único arquivo no Storage em caminho determinístico e um único campo no banco.
- Caminho no bucket `avatares`: `"<clube_id>/atletas/<atleta_id>.png"` (upsert — sempre sobrescreve o mesmo arquivo).
- Campo único: `atletas.foto_url` (URL pública com cache-bust `?v=<timestamp>` para a troca aparecer na hora).
- Como gestor e app gravam **o mesmo caminho** e o **mesmo campo**, a foto é sempre única e consistente.

**Mudanças — Web (gestor):**
- Plugar o `AvatarUploader` (crop 512×512 já existente) no `components/atletas/AtletasFormModal.vue`.
- No salvar: upload para `"<clube_id>/atletas/<atleta_id>.png"` via `useImageUpload`, gravar `foto_url` com cache-bust. Para atleta novo (sem id ainda), subir após o insert (quando o id existe).

**Mudanças — App (Flutter):**
- `pubspec.yaml`: adicionar `image_picker` e `image_cropper`.
- `perfil_tab.dart`: ativar o botão de editar foto → escolher (câmera/galeria) → **crop forçado 1:1, saída 512×512** → enviar.
- `services/api.dart`: novo `uploadFoto(token, arquivo) → {url}` (multipart).
- Atualizar a sessão local (`atleta.copyWith(fotoUrl: novaUrl)`) para refletir na hora.

**Mudanças — Backend (novo endpoint):**
- `athletto-web/server/api/app/foto.post.ts` (auth por sessão do app): recebe a imagem (multipart), valida mime/tamanho, faz upload no caminho determinístico via service client, atualiza `atletas.foto_url` e retorna a nova URL. O crop 512×512 é garantido no cliente (Flutter e web); o servidor valida dimensões/limite.

**Verificação:** trocar a foto no app e ver refletir na listagem/perfil do gestor; trocar no gestor e ver refletir no app após `/me`.

---

## Frente 3 — Notificações internas + Lembretes de pagamento

**Objetivo:** central de avisos real no app (já existe a tela Alertas) alimentada por uma fila de notificações do atleta, com lembretes automáticos de pagamento. Sem push externo; estrutura pronta para FCM depois.

**Banco (migration `0009_app_notificacoes.sql`):**
- Nova tabela `app_notificacoes`: `id`, `atleta_id`, `clube_id`, `tipo` (`financeiro`|`vencido`|`evento`|`clube`|`senha`), `titulo`, `mensagem`, `detalhe`, `acao_label`, `acao_destino` (ex.: `financeiro`/`agenda`), `cobranca_id` (ref. opcional p/ idempotência), `marco` (ex.: `d-3`/`d0`/`atraso-1`), `lida` (bool), `lida_em`, `criada_em`. RLS habilitada **sem policies** (igual às demais tabelas do app — acesso só via service role nos endpoints). Índices por `atleta_id, lida` e unicidade `(cobranca_id, marco)` para não duplicar lembrete.
- Nova tabela `app_atleta_prefs`: `atleta_id` (PK), `notif_avisos` bool, `notif_pagamento` bool, `atualizado_em`. (Persiste os toggles do app.)
- Função `app_gerar_lembretes_pagamento()` (SECURITY DEFINER, revogada do público): varre `cobrancas` pendentes e cria `app_notificacoes` nos marcos **3 dias antes**, **no dia do vencimento** e **em atraso (1 e 3 dias)**, respeitando `app_atleta_prefs.notif_pagamento` e a unicidade `(cobranca_id, marco)`. *(Cadência ajustável aqui.)*

**Backend (endpoints do app):**
- `GET /api/app/notificacoes` → lista as notificações do atleta no formato que a tela Alertas já espera (tipo, título, msg, detalhe, tempo, ação, lido; grupo Hoje/Anteriores derivado da data).
- `POST /api/app/notificacoes/ler` → marca uma ou todas como lidas.
- `GET/PUT /api/app/preferencias` → lê/grava `app_atleta_prefs` (toggles de avisos e lembretes).
- `server/api/cron/processar-notificacoes.post.ts` → protegido por segredo (header `CRON_SECRET`), chama `app_gerar_lembretes_pagamento()` (e, opcionalmente, as funções de notificação do gestor que já existem).

**Agendamento (Vercel Cron):**
- `vercel.json`: cron diário (ex.: `0 9 * * *`) chamando `/api/cron/processar-notificacoes`.

**App (Flutter):**
- `alertas_tab.dart`: trocar o adaptador atual (que monta avisos a partir de `List<String>`) pelo consumo real de `/api/app/notificacoes`; marcar como lida no backend; manter os deep-links (ação → aba financeiro/agenda).
- `perfil_tab.dart`: ligar os toggles "Notificações push" / "Lembretes de pagamento" ao endpoint de preferências (persistem). Como não há push externo, "Notificações push" passa a significar "mostrar avisos no app".

**Encaixe futuro para FCM (sem refazer):** a coluna `app_atleta_sessoes.device` guardará o token; haverá um ponto único de envio (a função/endpoint que cria a notificação) onde, no futuro, basta chamar o FCM além de gravar em `app_notificacoes`.

**Verificação:** rodar o cron manualmente e conferir que o atleta com cobrança a vencer/vencida recebe os lembretes certos na tela Alertas, sem duplicar.

---

## Frente 4 — Páginas LGPD (Privacidade/Segurança e Ajuda/Suporte) + links

**Objetivo:** páginas públicas, completas para LGPD e organizadas, acessíveis pela tela de login do gestor e linkadas no app.

**Web:**
- Revisar/completar `pages/privacidade.vue` cobrindo: identificação do controlador (razão social/CNPJ), dados coletados e finalidade, base legal, compartilhamento (ex.: Supabase, AbacatePay, Vercel), retenção, **direitos do titular** (acesso, correção, exclusão, portabilidade, revogação de consentimento), segurança, dados de menores, canal do **Encarregado/DPO**, cookies e histórico de versões.
- Revisar/completar `pages/suporte.vue`: FAQ organizado, canais de contato e **como exercer os direitos LGPD**.
- Garantir layout público (sem auth) e adicionar **links no rodapé do `pages/login.vue`**: "Privacidade e Segurança" → `/privacidade`, "Ajuda e Suporte" → `/suporte". (Conferir também `termos.vue`.)

**App (Flutter):**
- `config.dart`: adicionar `webBaseUrl` (ex.: `https://athletto-v2.vercel.app`).
- `perfil_tab.dart`: os `ActionRow` "Privacidade e segurança" e "Ajuda e suporte" passam a abrir `webBaseUrl/privacidade` e `webBaseUrl/suporte` via `url_launcher` (browser externo).

**Preciso de você (para o conteúdo LGPD):** razão social + CNPJ, e-mail/canal do Encarregado (DPO) e e-mail de suporte. Enquanto não vierem, deixo *placeholders* claramente marcados para você preencher.

---

## Frente 5 — Responsividade e *safe areas* (status bar + barra de navegação)

**Objetivo:** o app se comportar bem em aparelhos variados — recorte/notch e relógio no topo, e a barra de navegação do sistema (botões/gesto) na base.

**O que está bom (auditado):** sem larguras fixas de aparelho; grids com `Expanded`; tudo rolável; cabeçalhos lime usam `Container(lime) > SafeArea(top)` corretamente; a barra inferior do app (`AthlettoBottomNav`) já soma `MediaQuery.padding.bottom`; splash/onboarding/auth já controlam os ícones da status bar.

**Problemas encontrados e correções:**

1. **Ícones da status bar somem no cabeçalho lime (Home e Perfil)** — *alta.* O app define ícones claros globalmente; sobre o cabeçalho lime eles ficam brancos no claro = invisíveis (relógio/bateria/sinal). As demais abas (fundo escuro) estão certas.
   - **Correção:** envolver Home e Perfil em `AnnotatedRegion<SystemUiOverlayStyle>` com ícones **escuros** (`statusBarIconBrightness: dark` / `statusBarBrightness: light`); e, ao trocar de aba no `home_shell`, ajustar o estilo conforme a aba ativa (lime → escuro, demais → claro).

2. **Conteúdo/botões na base podem ficar sob a barra do sistema (Pix, Comprovante, Frequência)** — *média.* Essas telas usam `SafeArea(bottom: false)` com padding fixo, sem somar o inset da barra de gestos/botões. Em aparelhos com navegação na tela, os CTAs de baixo encostam/ficam sob os botões do sistema.
   - **Correção:** somar `MediaQuery.viewPadding.bottom` ao padding inferior dos scrolls/CTAs dessas telas (ou `SafeArea(bottom: true)` na região do botão).

3. **Altura fixa do card de citação (Home, `height: 94`) e escalas de fonte grandes** — *baixa.* Com fonte do sistema muito grande, textos de altura fixa podem estourar.
   - **Correção:** trocar altura fixa por padding/min-height e clampar o `textScaler` do app (ex.: 0.85–1.2) no `MaterialApp` para evitar overflow em acessibilidade.

4. **Orientação** — *baixa.* Recomendo travar em retrato (`SystemChrome.setPreferredOrientations`), padrão para esse tipo de app, evitando layouts quebrados em paisagem.

**Verificação:** rodar em emuladores de telas pequenas (≈5"), grandes e com notch/gesture bar; conferir contraste da status bar nas duas famílias de tela e os CTAs de baixo acima da barra do sistema.

---

## Ordem de execução proposta

1. **Agenda** (isolado, rápido, alto impacto).
2. **Foto única** (web + endpoint + app).
3. **Notificações internas + lembretes** (migration + endpoints + cron + app).
4. **Páginas LGPD + links** (web + app).
5. **Responsividade / safe areas** (ajustes finos no app — rápido).

## Migrations novas
- `0009_app_notificacoes.sql` (tabelas `app_notificacoes`, `app_atleta_prefs`, função de lembretes).

## Novas dependências
- App Flutter: `image_picker`, `image_cropper`.

## O que NÃO está incluído (decisões já tomadas / fora de escopo)
- Push externo (FCM/APNs) — adiado por decisão; arquitetura preparada para encaixe.
- Persistir treinos recorrentes como linhas em `eventos_calendario` ou permitir editar/cancelar ocorrência específica — não necessário para corrigir o bug; pode ser uma evolução futura.

---

### Verificação final (todas as frentes)
`flutter pub get` + `flutter analyze` no app; typecheck no web; teste do fluxo com o atleta real (agenda + foto + lembrete); conferir advisors do Supabase após a migration.
