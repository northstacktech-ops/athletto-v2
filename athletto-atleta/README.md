# Athletto Atleta

App mobile do atleta (Flutter) que consome a API hospedada na Vercel.

## Requisitos

- Flutter 3.x (Dart 3) instalado e no PATH
- Android SDK (para gerar APK)

## Como rodar

```bash
cd athletto-atleta
flutter pub get
flutter run            # dispositivo/emulador conectado
```

## Gerar APK de release

```bash
flutter build apk --release
# saída: build/app/outputs/flutter-apk/app-release.apk
```

> O `build.gradle` do app assina o release com a chave de **debug** para
> permitir o build sem configurar uma keystore. Para publicar na Play Store,
> configure uma keystore própria em `android/app/build.gradle`.

## Onde trocar a URL da API

Edite a constante `apiBaseUrl` em [`lib/config.dart`](lib/config.dart):

```dart
static const String apiBaseUrl = 'https://athletto-v2.vercel.app/api/app';
```

## Estrutura

```
lib/
  main.dart            # MaterialApp + tema (#3d5afe)
  config.dart          # apiBaseUrl e constantes
  models/              # atleta, clube, evento, cobranca, frequencia
  services/
    api.dart           # cliente HTTP (Authorization: Bearer)
    session.dart       # armazenamento seguro (token por clube)
  screens/             # splash, cpf, seleção de clube, senha,
                       # primeiro acesso, home + abas
  widgets/             # avatar, botão, campo, estados, formatadores
```

## Fluxo de autenticação

1. **CPF** -> `POST /consultar-cpf`
2. 0 clubes: aviso "CPF não localizado"
3. 1 clube: vai direto para Senha (ou Primeiro acesso)
4. 2+ clubes: tela de seleção
5. **Senha** -> `POST /login` (guarda token por clube)
6. **Primeiro acesso / Esqueci a senha** -> `POST /definir-senha` (código de 6 dígitos do gestor)
7. **Home** com abas: Início, Agenda, Pagamentos, Frequência, Perfil
8. **Trocar de clube** (Perfil): reabre a lista de clubes do CPF e pede a senha do novo clube
9. **Sair** -> `POST /logout` + limpa a sessão

Sessões são guardadas por clube (`sessao:<clubeId>`) com o "último clube"
lembrado. Dados de clubes diferentes nunca são misturados.

## Observações importantes antes de buildar

- Este projeto inclui apenas a configuração **Android**. Para gerar os
  arquivos de plataforma que faltam (iOS, ícones extras, wrapper jar etc.),
  rode dentro da pasta do projeto:

  ```bash
  flutter create .
  ```

  Isso preenche o que estiver faltando **sem sobrescrever** os arquivos já
  existentes (lib/, AndroidManifest, build.gradle, etc.). Em seguida,
  `flutter pub get` e `flutter build apk --release`.

- Os ícones do app são gerados a partir de um ícone simples já incluído
  (`mipmap-*/ic_launcher.png` + adaptive icon). Substitua-os para usar a
  marca oficial.
```
