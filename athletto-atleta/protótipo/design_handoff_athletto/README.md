# Handoff: Athletto — App do Atleta (mobile)

## Overview
**Athletto** is a mobile app for amateur/club athletes to manage their relationship with a sports club: onboarding, club login, dashboard, training calendar, payments (mensalidades/taxes via Pix), receipts, notifications, and profile. This bundle covers the full first-run flow plus the five main tabs.

The flow currently implemented end-to-end:

```
Splash (Lottie, 3s)
  → Onboarding (2-slide carousel)
  → Buscar Clube 01 (CPF entry)
  → Buscar Clube 02 (club selection)
  → [first access] Criar Senha   OR   [returning] Login → Esqueci a senha → Reset enviado
  → Home (tabs below)

Bottom tabs: Início | Agenda | Financeiro | Alertas | Perfil
  Financeiro → Pix payment → Pagamento confirmado → Comprovante (save as PNG)
  Alertas → Aviso (detail) → contextual action (deep-link to other screens)
  Perfil → toggles, Trocar de clube, Sair (logout)
```

---

## About the Design Files
The files in `source/` are a **design reference built in HTML + React (via inline Babel)** — a working prototype that demonstrates the intended look, motion, and behavior. **They are not meant to ship as-is.**

The task is to **recreate these designs in the target codebase's environment**. The product is intended as a **native mobile app (React Native)** per the Fraktal stack, but the reference is framework-agnostic. Recreate the screens using the project's established patterns, navigation library, and component primitives. If no environment exists yet, React Native (Expo) is the recommended target for this product; a PWA/React build is also viable.

Treat the HTML/JSX as the **source of truth for layout, spacing, color, copy, and interaction** — not as code to paste.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, iconography, and interaction/animation are all specified and should be reproduced faithfully. The one liberty: the device frame (`.device`/iPhone bezel in `phone.jsx`) is a **prototype harness only** — on a real device the OS provides the status bar, dynamic island, and home indicator, so drop the simulated chrome and use safe-area insets instead.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Lime (primary/accent) | `#C7EF66` | brand accent, primary buttons, active states, highlights, headers |
| Lime tint (chip bg) | `rgba(199,239,102,0.12–0.16)` | icon chips, soft fills |
| Ink / screen bg | `#1A1A1A` | main app background, primary buttons' text |
| Card | `#242424` | all cards, list containers, tab bars |
| Black | `#000000` | onboarding photo background |
| White | `#FFFFFF` | primary text on dark |
| Text muted | `#B2B2B2` | secondary text |
| Text faint | `#676D75` | tertiary text, inactive nav labels, eyebrows |
| Text faintest | `#4A4A4A` | version string |
| Border (input/hairline) | `#737373` | input borders, card outlines on auth |
| Hairline on dark | `rgba(255,255,255,0.07–0.08)` | row dividers inside cards |
| Danger / overdue | `#FF5A5A` | overdue charges, "Sair", error icons |
| Danger (login error text) | `#FF6B6B` | login validation message |
| Warning / pending | `#F0B429` | pending charges, "vence em breve" |
| Info / club | `#4FA6FF` | club notices |
| Nav inactive | `#676D75` | bottom-nav inactive icon+label |
| Page gradient (harness) | `radial-gradient(120% 90% at 50% 0%, #20240f 0%, #0c0c0c 55%, #050505 100%)` | the area *around* the phone — not part of the app UI |

> Status colors are derived, not arbitrary — see **Financeiro logic** below. Reuse the same five (pago/lime, pendente-futuro/amber, vencido/red, isento/gray `#9AA0A6`, info/blue) across Financeiro and Alertas.

### Typography
- **Family:** `"Plus Jakarta Sans"` (Google Fonts, weights 400/500/600/700/800 + italics). Secondary: `"Poppins"` 400/500 used **only** for bottom-nav labels.
- **Scale (px):**
  - Hero/splash wordmark: 45, italic 800
  - Screen H1 (e.g. "Bem-vindo", "Pagamento confirmado"): 20–24, weight 700
  - Profile name: 22, weight 800
  - Big number (totals / valor): 34–36, weight 800, letter-spacing −0.5px
  - Section title (centered tab titles): 20, weight 700
  - Card title: 14–15, weight 700
  - Body: 13–15, weight 400–500, line-height 1.45–1.6
  - Eyebrow/labels (uppercase): 12, weight 700, letter-spacing 0.5px
  - Micro/timestamps: 11.5–12, weight 500
  - Nav label: 12 (Poppins)
- **Quote (Home):** 15, italic 500, line-height 21px, color lime, locked to **exactly 2 lines** (`white-space: nowrap` with an explicit `<br>`).

### Spacing & radius
- Screen horizontal padding: **24px**.
- Card padding: **16px** (compact rows 14px vertical); section cards `2px 18px`.
- Gaps: card grids 8px; list of cards 16px; section stacks 20–28px.
- Radius: small `8px`, cards `16px`, inputs/buttons `10px`, pills/toggles/tabs `999px`, sheet top corners `12px 12px 0 0`.
- Buttons (primary): height **50px** (44px for inline card CTAs), radius 10px, **flat lime fill, no gradient, no shadow**.
- Icon chips: 38–42px circle (72px on detail hero), tinted background.
- Touch targets: bottom-nav items and toggles ≥ 44px effective.

### Shadows
- **None on buttons or cards** (explicit product decision). The only shadow in the bundle is on the prototype's device bezel, which is discarded in production.
- Input focus ring: `box-shadow: 0 0 0 2px rgba(199,239,102,0.45)`.
- Overdue charge card uses an **inset border**, not a shadow: `inset 0 0 0 1px rgba(255,90,90,0.45)`.

### Motion
- Easing: `cubic-bezier(0.19, 1, 0.22, 1)` (easeOutExpo), variable `--ease`.
- Screen entrance: fade + 24px rise + slight scale (`screenIn`, ~0.5s). **Important:** base state must be the *visible* end-state and animate *from* hidden, so frozen/no-JS contexts still show content.
- Tap feedback: `transform: scale(0.96)` on `:active`.
- Onboarding: background photo slides horizontally (`translateX`, 0.7s), inactive slide scaled 1.06 inside an `overflow:hidden` cell; page indicator morphs into a 26px lime pill (width transition 0.5s).
- Pix processing → confirmed: auto-advances after ~3.6s with a spinning `autorenew` icon (`spin` keyframe, 1.1s linear).
- Toggle knob: 0.25s ease slide.
- Reduced motion: gate animations under `@media (prefers-reduced-motion: no-preference)`.

---

## Screens / Views

### 1. Splash
- **Purpose:** brand moment on launch.
- **Layout:** full lime (`#C7EF66`) background; centered Lottie animation (`assets/athletto-splash.json` — Athletto "A" mark, black + lime). Container 680×383, centered.
- **Behavior:** plays once at 2/3 speed; auto-advances to Onboarding after **exactly 3000ms**. In RN use `lottie-react-native`.

### 2. Onboarding (2-slide carousel)
- **Purpose:** value-prop intro.
- **Layout:** full-bleed B&W sports photo (`onboarding-soccer.png`, then `onboarding-volley.png`) with a bottom-up dark gradient `linear-gradient(to top, #000 20%, rgba(0,0,0,0) 56%, rgba(0,0,0,0.25) 100%)` for legibility. Foreground bottom-anchored: Athletto logo (`logo.png`, height 44), H2, body, then a control row.
- **Copy:**
  - H2: "Acompanhe seus **treinos** de forma prática" ("treinos" in lime).
  - Body: "Treinos, mensalidades, calendário, e tudo que você precisa na palma da sua mão"
  - Controls row: "Pular" (left, white) · page dots (center) · "Próximo"/"Finalizar" (right, lime 700).
- **Behavior:** "Próximo" advances slide; on last slide → "Finalizar". "Pular" and finishing both go to Buscar Clube 01. Dots are tappable. See Motion for the slide animation.

### 3. Buscar Clube 01 — CPF
- **Purpose:** find the athlete's clubs by CPF.
- **Layout:** top half is a lime panel with the runner cutout photo (`hero-runner.png`); bottom is a dark sheet (radius `12px 12px 0 0`, padding `44px 35px 48px`) with: H1 "Bem-vindo(a) ao **Athletto**", subtitle, a labeled CPF input, and a primary "Buscar" button with a `double_right` icon.
- **Input:** label "CPF do atleta", placeholder "Digite seu CPF", numeric, **auto-masks** to `000.000.000-00` (max 11 digits). Border `#737373`, transparent fill, white text, height 50, radius 10.
- **Behavior:** "Buscar" → Buscar Clube 02. (No real validation in prototype; add CPF checksum + lookup in production.)

### 4. Buscar Clube 02 — Club selection
- **Layout:** same lime-hero + dark-sheet structure. Header: `directions_run` icon + "Atleta encontrado", subtitle "Qual clube você deseja acessar?". Then a vertical list of **club rows**: circular logo (47px), name (14/700) + category (10), trailing `double_right` lime icon, 1px `#737373` border, radius 8. Below: a "Voltar" text button with back arrow.
- **Data (sample):**
  - Boa Vista Berserkers — Flag Football — `club-berserkers.png` — *first access (no password)*
  - Boa Vista Nornas — Flag Football — `club-nornas.png` — *returning (has password)*
- **Behavior:** selecting a club routes to **Criar Senha** if the club has no password yet, else **Login**.

### 5. Criar Senha (first access)
- **Purpose:** set a password on first access.
- **Layout/fields:** two password inputs (nova senha + confirmar) with show/hide (`visibility`/`visibility_off`) toggles; validation message in `#FF6B6B`; primary "Criar senha" button (`double_right`).
- **Rules:** both fields required and must match (extend with strength rules in prod). On success → Home (and the club is marked as having a password).

### 6. Login (returning member)
- **Fields:** password input with show/hide; "Esqueci minha senha" link; primary "Entrar".
- **Behavior:** "Entrar" → Home. "Esqueci minha senha" → Reset enviado. Back → club selection.

### 7. Reset enviado
- **Purpose:** inform the athlete that a password reset must be approved by the club manager (gestor).
- **Content:** confirmation that the request was sent; explains the **gestor** will release the reset and the athlete will receive an in-app notice to create a new password. Single primary "Entendi" → back to Login.
- **Connects to:** the Alertas item "Senha redefinida pelo gestor" (type `senha`), whose action deep-links to **Criar Senha**.

### 8. Home (tab: Início)
- **Layout:**
  - **Lime header** (flex none): avatar (`eric.jpg`, 57px circle) + greeting "Oi, Eric" (italic 700, 20) / "Pronto para o dia de hoje?" (500, 14) + a **notification bell** (`notifications`, 30) at right → Alertas.
  - **Scroll body** (`#1A1A1A`, padding 24, gap 28):
    - **Quote card:** `#242424`, 1px lime border, 345×94, centered italic lime quote locked to 2 lines: "Menos desculpa, mais suor. A consistência / de hoje é a vitória de amanhã."
    - **Stat grid:** 2×2 of `StatCard` (icon + title + sub). Cards: Pagamento "2 pendentes" → Financeiro; Frequência "85% este mês"; Avisos "4 não lidos" → Alertas; Próx. Eventos "4 esta semana" → Agenda.
    - **Próximos Eventos:** section heading + `EventCard` list (title with `schedule` icon, bullet + date "12/05/2026 - 14:45h").
  - **BottomNav** pinned.
- **StatCard:** `#242424`, radius 16, padding 16; row of lime icon(16) + title(14/700); sub in muted(12/500). Tappable when it has an action.

### 9. Agenda (tab)
- **Layout:** centered "Junho" title (calendar icon + month) acting as a **month-picker trigger** (chevron rotates; opens a scrollable month list popover `#242424`, current month lime-tinted with a check). Below: a **week strip** — `«` / 7 day cells (number + weekday, active = lime, inactive = `#666`) / `»`. Then a "Total de eventos hoje" card and a "Hoje" section of `EventCard`s.
- **Behavior:**
  - Tapping a day selects it (lime).
  - `«`/`»` page the week by ±7 days, rolling month/year over correctly (handles month lengths; non-leap Feb=28 in sample).
  - Month picker jumps to a month (resets to its first week).

### 10. Financeiro (tab) — **DO NOT RESTYLE**
> The client explicitly froze this screen's component styling. Reproduce it exactly; do not "upgrade" it to match other tabs.
- **Layout:** centered "Pagamentos" title. Then:
  - **Summary band** (`#242424`, radius 16): if pending exist → "Você tem em aberto" + big lime total + count + an alert line (`warning` icon) that is **red** when overdue exist, else **amber** when something is due within 3 days. If nothing pending → positive "Tudo certo ✓" state (lime border, check_circle chip).
  - **Tabs** (pill segmented, lime active): Pendentes (with count) / Pagas / Todas.
  - **Charge list** of `ChargeCard`.
- **ChargeCard:** status pill (dot + label) top-left, value top-right (18/700); name (15/700); status line with icon + colored relative text; conditional CTA.
- **Financeiro logic (reuse exactly):**
  - `status: "pago"` → lime, badge **PAGO**, "Pago em dd/mm", icon `check_circle`, card opacity .86, **"Ver comprovante"** outline button.
  - `status: "isento"` → gray `#9AA0A6`, badge **ISENTO**, "Isento pelo clube", icon `info`, opacity .86, no CTA.
  - `status: "pendente"` is split by due date vs. today:
    - due date in the past → red, badge **EM ATRASO**, "Venceu em dd/mm", icon `warning`, inset red border, **"Pagar via Pix"**.
    - due today/future → amber, badge **PENDENTE**, "Vence em dd/mm · {vence hoje | vence amanhã | em N dias}", icon `schedule`, **"Pagar via Pix"**.
  - `status: "cancelado"` → hidden from all lists.
- **Sample data (today = 05/06/2026):** Mensalidade Maio R$150 pendente venc 10/05 (→ overdue); Uniforme R$120 pendente venc 30/06; Mensalidade Abril R$150 pago 05/04; Mensalidade Março R$150 pago 03/03; Taxa de inscrição R$80 isento. Money format: `R$ 0,00` (comma decimal).

### 11. Pix (payment)
- **Layout:** back header with charge name; "Valor a pagar" + big value; **QR code** on white card (generate a real BR Code/EMV payload in production — prototype draws a mock matrix); two buttons: "Copiar código Pix" (lime, copies to clipboard, flips to "Código copiado!" with check for 1.8s) and "Abrir no app do banco" (outline); an info note that confirmation is automatic.
- **States:** `idle` → `processing` (tapping a pay action; spinner overlay on QR + "Processando…" text) → `confirmed` after ~3.6s. In production replace the timer with real payment-status polling/webhook.
- **Confirmed screen:** check_circle hero, "Pagamento confirmado", "Recebemos R$X de {charge}", primary **"Ver comprovante"** + text "Voltar aos pagamentos". On confirm, the charge becomes `pago` (pagamento date = today) and totals recompute.

### 12. Comprovante (receipt) — save as image
- **Purpose:** shareable/saveable proof of payment.
- **Layout:** back header "Comprovante". A receipt card (`#101010`, radius 20): **lime header** with the black Athletto vector mark (`AthlettoMark`) + "COMPROVANTE PIX"; check_circle chip; "Valor pago" + big value; dashed divider; rows: Cobrança, Atleta, Clube, Forma de pagamento (Pix), Data do pagamento, ID da transação (deterministic `ATH-2026-XXXX-XXXX` hash), Status "Pago ✓" (lime); dashed divider; footer note. Below the card: primary **"Salvar comprovante"** (lime).
- **Behavior:** "Salvar comprovante" rasterizes the card to PNG and downloads `comprovante-athletto.png` (prototype uses html2canvas, scale 2, bg `#101010`), flips to "Comprovante salvo!" for 2.4s. In RN use `react-native-view-shot` + `CameraRoll`/share sheet.

### 13. Alertas (tab)
- **Purpose:** notification center.
- **Layout:** centered "Avisos" title (bell icon). A row: "{N} não lido(s)" (N in lime) + "Marcar todas como lidas" (lime, `done_all`) when unread > 0. Then cards grouped under **HOJE** / **ANTERIORES** eyebrows. Empty state: muted bell + "Nenhum aviso por aqui."
- **AlertCard:** colored **icon chip** (42px) by type; title (14.5/700) with trailing **lime unread dot**; message (13, muted, ~2 lines); timestamp (11.5, faint). Read cards drop to opacity .6.
- **Types → color/icon:** `financeiro` amber/`payments`; `vencido` red/`warning`; `evento` lime/`calendar_today`; `clube` blue `#4FA6FF`/`info`; `senha` lime/`lock_reset`.
- **Behavior:** tapping a card marks it read and opens **Aviso (detail)**. "Marcar todas como lidas" clears all unread.
- **Aviso detail:** back header; big type chip (72px); title; timestamp; body card with `detalhe`; optional **action button** that deep-links (e.g. "Ir para pagamentos" → Financeiro, "Ver na agenda" → Agenda, "Criar nova senha" → Criar Senha).
- **Sample alerts:** see `app.jsx` `alerts` state — 5 items spanning all types, 3 in "hoje", 2 in "antes", one pre-read.

### 14. Perfil (tab)
- **Layout:**
  - **Lime header:** small "Perfil" label (top-left), centered avatar (88px, 3px ink ring) with an edit FAB (`edit`), name "Eric Almeida" (22/800, **single line**), "Atleta · #10" with `directions_run` icon.
  - **Scroll body** of `SectionCard`s (uppercase eyebrow + `#242424` card):
    - **Clube atual:** club logo + name + category + "Trocar" (lime, `autorenew`) → club selection.
    - **Meus dados:** rows CPF `fingerprint`, E-mail `mail`, Telefone `call`.
    - **Preferências:** toggle rows — "Notificações push" / "Lembretes de pagamento" (lime when on; knob ink/​white).
    - **Conta:** action rows — "Privacidade e segurança" `shield`, "Ajuda e suporte" `help`, "Sair da conta" `logout` in **red** → logout.
    - Footer: "Athletto · versão 1.0.0".
- **Behavior:** toggles flip state; "Sair da conta" clears the selected club and returns to **Buscar Clube 01 (CPF)**; "Trocar" returns to club selection.

### Bottom navigation (shared)
- 5 items: Início `home`, Agenda `calendar_today`, Financeiro `payments`, Alertas `error`, Perfil `person`. Active = lime icon+label, inactive = `#676D75`. Bar `#1A1A1A`, top radius 12. Labels use **Poppins** 12. Sits above the home indicator.

---

## Interactions & Behavior (summary)
- **Navigation** is a single screen-state switch (see `app.jsx`); replace with the codebase's router/stack (e.g. React Navigation: an auth stack + a bottom-tab navigator + modal/detail screens for Pix, Comprovante, Aviso detail).
- **Deep-links from Alertas** must land on the correct tab/screen.
- **Clipboard** (Pix copy), **file/image export** (Comprovante), and **Lottie** are the three platform-capability touchpoints — swap the web implementations for native equivalents.
- All entrance/tap/toggle motion per **Motion** tokens above.

## State Management
Prototype keeps everything in React state at the app root (`app.jsx`). For production, model:
- `session`: selected `club`, auth status, per-club password-set flag (sample: Berserkers=unset, Nornas=set).
- `charges[]`: `{ id, nome, valor, status: pago|pendente|isento|cancelado, vencimento, pagamento? }`. Derive view state (overdue/soon) from `vencimento` vs. today — don't store it. Paying a charge sets `status=pago` + `pagamento=today` and recomputes the summary.
- `alerts[]`: `{ id, tipo, grupo: hoje|antes, lido, titulo, msg, detalhe, tempo, acao?: { label, icon, go } }`. Opening marks read; "marcar todas" bulk-updates.
- `prefs`: `{ push, pgto }` booleans.
- `paymentFlow`: current charge + stage `idle|processing|confirmed`.
Wire these to real APIs (club lookup by CPF, charges, payment status, notifications, profile).

## Assets
All under `source/assets/` (originals supplied by the client / extracted from the Figma + provided uploads):
- `athletto-splash.json` — Lottie logo animation (white full-frame bg layer was removed; transparent).
- `logo.png` — Athletto wordmark/"A" (lime). `AthlettoMark` in `icons.jsx` is a **black vector** version for the lime receipt header.
- `eric.jpg` — sample athlete avatar.
- `hero-runner.png` — runner cutout (transparent) for the auth hero.
- `onboarding-soccer.png`, `onboarding-volley.png` — B&W onboarding photos.
- `club-berserkers.png`, `club-nornas.png` — sample club crests.
- **Icons:** an inline Material-style SVG set in `icons.jsx` (`Icon name="…"`). Map these to the codebase's icon library (Material Symbols / Lucide) by name; `percent` is drawn inline. Keep stroke/fill consistent with the lime-on-dark treatment.
- **Fonts:** Plus Jakarta Sans + Poppins (Google Fonts) — bundle them in the app.

> Replace sample athlete/club/photo content with real data. Confirm rights for the onboarding photography before shipping.

## Files (in `source/`)
- `Athletto.html` — entry; loads fonts, React/Babel, Lottie, html2canvas, and all `.jsx`.
- `styles.css` — tokens, device harness, status bar, screen shell, transitions, `.tap`. **Note:** `.device`/`.device-screen`/`.island`/`.statusbar`/`.home-indicator` are prototype-only chrome.
- `app.jsx` — root state + screen routing + all sample data (charges, alerts, prefs, passwords).
- `phone.jsx` — `Device`, `StatusBar`, `BottomNav` (BottomNav is real product UI; Device/StatusBar are harness).
- `icons.jsx` — `Icon`, `AthlettoMark`.
- `onboarding.jsx` — `Splash`, `Onboarding`.
- `auth.jsx` — `BuscarClube01`, `BuscarClube02`, `CriarSenha`, `Login`, `ResetEnviado`, `primaryBtn` style.
- `home.jsx` — `Home`, `Agenda`, `StatCard`, `EventCard`, `SectionHeading`.
- `financeiro.jsx` — `Financeiro`, `ChargeCard`, `StatusPill`, `PixPagamento`, `Comprovante`, money/status helpers. **(Frozen styling.)**
- `alertas.jsx` — `Alertas`, `AlertaDetalhe`, `AlertCard`.
- `perfil.jsx` — `Perfil`, `InfoRow`, `PrefRow`, `ActionRow`, `Toggle`, `SectionCard`.

## How to run the reference
Open `source/Athletto.html` in a browser (it pulls React, Babel, Lottie and html2canvas from CDNs, so it needs internet on first load). Everything is client-side; no build step.
