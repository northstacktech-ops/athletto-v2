# 07 — App Flutter: Portal do Atleta/Pai

## Visão Geral

App mobile nativo desenvolvido em Flutter para iOS e Android. É a interface do atleta (ou do seu responsável) com o clube.

**Repositório separado** do web app do gestor. Consome a mesma API REST.

---

## Autenticação

### Identificação por clube + CPF
O app não é genérico — o atleta acessa o clube pelo slug:
- **Opção A:** Atleta informa o slug do clube na tela inicial
- **Opção B:** O gestor compartilha um deep link: `athletto://clube/{slug}` que abre o app já configurado para aquele clube

### Primeiro acesso
```
1. Tela: "Qual é o seu CPF?"
2. Sistema verifica: CPF cadastrado naquele clube?
   ├── Sim, nunca acessou: pede criação de senha (mín. 6 dígitos)
   └── Não encontrado: "CPF não encontrado. Fale com seu treinador."
3. Senha salva com bcrypt
4. JWT gerado com role = 'atleta' + clube_id + atleta_id
```

### Acessos seguintes
```
1. CPF + senha
2. Opção "Esqueci minha senha" → envia link por e-mail (se cadastrado)
   ou → gestor redefine pelo painel web
```

---

## Telas do MVP

### 1. Home / Dashboard do Atleta
```
┌─────────────────────────────────────┐
│  Athletto                    🔔  👤 │
├─────────────────────────────────────┤
│                                     │
│  Olá, João! 👋                      │
│  Berserkers — Flag Football         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔴 2 cobranças pendentes    │    │
│  │    Total: R$ 270,00         │    │
│  │              [Ver e pagar →]│    │
│  └─────────────────────────────┘    │
│                                     │
│  Frequência (último mês)            │
│  ████████████░░ 80%                 │
│  16 de 20 treinos                   │
│                                     │
│  Próximo treino                     │
│  ┌─────────────────────────────┐    │
│  │ 🗓 Quinta-feira             │    │
│  │   Treino Oficial            │    │
│  │   20:00 — 22:00             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
│  🏠 Home   💰 Cobranças  📅 Frequência │
```

### 2. Cobranças
```
┌─────────────────────────────────────┐
│  ← Cobranças                        │
├─────────────────────────────────────┤
│  [Pendentes]  [Pagas]  [Todas]      │
├─────────────────────────────────────┤
│                                     │
│  🔴 PENDENTE                        │
│  Mensalidade Junho 2026             │
│  R$ 150,00                          │
│  Vence em 10/06/2026                │
│  ┌─────────────────────────────┐    │
│  │        [Pagar via Pix]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  🔴 PENDENTE                        │
│  Uniforme 2026                      │
│  R$ 120,00                          │
│  Vence em 30/06/2026                │
│  ┌─────────────────────────────┐    │
│  │        [Pagar via Pix]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ✅ PAGO — 05/05/2026               │
│  Mensalidade Maio 2026              │
│  R$ 150,00                          │
│                                     │
└─────────────────────────────────────┘
```

**Ação "Pagar via Pix":**
1. Abre tela com QR code + chave Pix (link AbacatePay)
2. Botão "Abrir no app do banco" → `url_launcher` abre o link
3. Após retornar ao app: mostra mensagem "Processando pagamento..."
4. Quando webhook confirmar: status muda para Pago automaticamente

### 3. Frequência
```
┌─────────────────────────────────────┐
│  ← Frequência                       │
├─────────────────────────────────────┤
│                                     │
│  Maio 2026                          │
│  Presença geral: 80% (16/20)        │
│  ██████████████░░░░░                │
│                                     │
│  Por turma:                         │
│  ┌─────────────────────────────┐    │
│  │ Treino Oficial     82%      │    │
│  │ ████████████████░░░         │    │
│  │ 14 de 17 treinos            │    │
│  └─────────────────────────────┘    │
│                                     │
│  Histórico (últimas presenças)      │
│  ✅ 13/05 — Treino Oficial          │
│  ❌ 11/05 — Treino Oficial          │
│  ✅ 08/05 — Treino Oficial          │
│  ✅ 06/05 — Treino Oficial          │
│  ✅ 04/05 — Treino Oficial          │
│                                     │
└─────────────────────────────────────┘
```

### 4. Perfil
```
┌─────────────────────────────────────┐
│  ← Perfil                           │
├─────────────────────────────────────┤
│                                     │
│       [foto]                        │
│    João Silva                       │
│    #11 · Wide Receiver              │
│    Titular · Saudável               │
│                                     │
│  Clube: Berserkers                  │
│  Modalidade: Flag Football          │
│  Membro desde: Jan 2025             │
│                                     │
│  ─────────────────────────────      │
│  [Alterar senha]                    │
│  [Sair]                             │
│                                     │
└─────────────────────────────────────┘
```

---

## Estrutura de Pastas (Flutter)

```
lib/
├── main.dart
├── app.dart
│
├── core/
│   ├── api/
│   │   ├── api_client.dart          # Dio/http setup, interceptors
│   │   ├── auth_interceptor.dart    # JWT injection
│   │   └── endpoints.dart           # Constantes de endpoints
│   ├── auth/
│   │   ├── auth_service.dart
│   │   └── token_storage.dart       # flutter_secure_storage
│   ├── models/
│   │   ├── atleta.dart
│   │   ├── cobranca.dart
│   │   ├── frequencia.dart
│   │   └── clube.dart
│   └── utils/
│       ├── cpf_formatter.dart
│       ├── currency_formatter.dart
│       └── date_formatter.dart
│
├── features/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── create_password_screen.dart
│   │   └── club_selection_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── cobranças/
│   │   ├── cobranças_screen.dart
│   │   ├── cobrança_detail_screen.dart
│   │   └── pix_payment_screen.dart
│   ├── frequencia/
│   │   └── frequencia_screen.dart
│   └── perfil/
│       └── perfil_screen.dart
│
└── shared/
    ├── widgets/
    │   ├── loading_widget.dart
    │   ├── error_widget.dart
    │   ├── cobranca_card.dart
    │   └── frequencia_bar.dart
    └── theme/
        ├── app_theme.dart
        └── colors.dart
```

---

## Dependências Recomendadas (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter

  # HTTP
  dio: ^5.x                    # Client HTTP com interceptors
  
  # Estado
  flutter_riverpod: ^2.x       # Gerenciamento de estado
  
  # Storage seguro
  flutter_secure_storage: ^9.x # Armazenar JWT
  
  # Navegação
  go_router: ^13.x             # Navegação declarativa
  
  # URLs e deep links
  url_launcher: ^6.x           # Abrir links Pix e WhatsApp
  app_links: ^6.x              # Deep links para clube
  
  # UI
  cached_network_image: ^3.x   # Cache de imagens
  fl_chart: ^0.68.x            # Gráficos de frequência
  
  # Utilitários
  intl: ^0.19.x                # Formatação de datas e moeda
  mask_text_input_formatter: ^2.x  # Máscara de CPF
  shared_preferences: ^2.x     # Preferências locais simples

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.x
```

---

## Deep Link para Clube

O gestor compartilha um link que abre o app já configurado:

**Web fallback:** `athletto.com.br/atleta/{slug}` → detecta mobile → abre store / abre app

**App scheme:** `athletto://clube/{slug}`

**Implementação:**
```dart
// No club_selection_screen.dart
// Se app aberto via deep link, pré-preenche o slug
final slug = ref.watch(deepLinkProvider);
if (slug != null) {
  // Vai direto para tela de CPF do clube
}
```

---

## Notificações Push (Pós-MVP)

Para a fase seguinte, adicionar:
- `firebase_messaging` para push notifications
- Notificar atleta quando cobrança gerada
- Notificar quando pagamento confirmado
- Lembrete de vencimento (D-3, D-1)
