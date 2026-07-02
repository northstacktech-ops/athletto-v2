# Como gerar o APK — Athletto Atleta

O app do atleta está em `athletto-atleta/` (Flutter). Ele consome a API que já está
no ar (`athletto-v2.vercel.app/api/app/*`), no mesmo Supabase do sistema do gestor.

## Pré-requisitos (na sua máquina)

1. **Flutter SDK** (3.x ou superior) — https://docs.flutter.dev/get-started/install
2. **Android SDK** (vem com o Android Studio, ou via linha de comando)
3. Rodar `flutter doctor` e resolver o que aparecer em vermelho.

## Passos

```bash
cd athletto-atleta

# 1) Gera os arquivos de plataforma que faltam (gradlew, wrapper jar, etc.).
#    NÃO sobrescreve os arquivos já criados — só completa o que falta.
flutter create .

# 2) Baixa as dependências
flutter pub get

# 3) (opcional) testar num emulador/aparelho conectado
flutter run

# 4) Gera o APK de release
flutter build apk --release
```

O APK final fica em:
```
athletto-atleta/build/app/outputs/flutter-apk/app-release.apk
```
É só transferir pro celular e instalar (precisa permitir "fontes desconhecidas").

## Configuração

- **URL da API:** `athletto-atleta/lib/config.dart` → constante `apiBaseUrl`.
  Já aponta para `https://athletto-v2.vercel.app/api/app`. Troque se mudar o domínio.

## IMPORTANTE — pré-requisito no servidor

Os endpoints `/api/app/*` usam a **service_role** do Supabase no servidor. Confirme
na Vercel (Settings → Environment Variables) que existe:

- `SUPABASE_SERVICE_ROLE_KEY` = (a service_role do projeto)
- `SUPABASE_URL` = `https://jzijguccwdwbbngzcuxz.supabase.co`

Sem isso, o app recebe erro 503 ao tentar logar. Depois de adicionar, faça um redeploy.

## Como o atleta entra (primeiro acesso)

1. No painel do gestor (web), abra a ficha do atleta → **"Gerar código de acesso ao app"**.
   Sai um código de 6 dígitos (vale 24h).
2. No app, o atleta digita o **CPF** → escolhe o **clube** → como ainda não tem senha,
   informa o **código** e cria a senha (mín. 8 caracteres).
3. Nos próximos acessos: CPF → clube → senha. A sessão fica salva no aparelho.

## Observações

- Os ícones são um placeholder (bola em fundo azul). Troque pela marca oficial quando quiser.
- O release está assinado com a chave de debug para permitir build sem keystore.
  Para publicar na Play Store, configure uma keystore própria (`android/key.properties`).
- O app cobre a v1: acesso (CPF/clube/senha), Home, Agenda, Pagamentos (Pix), Frequência e Perfil
  (com "trocar de clube"). Avisos e push ficam para a próxima fase.
