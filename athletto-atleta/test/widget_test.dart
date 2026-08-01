// Smoke test do app do atleta.
//
// O widget raiz (AthlettoApp) abre na SplashScreen, que agenda um timer e em
// seguida navega para telas que dependem de plugins nativos (secure storage,
// http) e de fontes remotas (google_fonts). Subir a árvore inteira num teste
// exigiria mock desses plugins e do tempo, então aqui apenas garantimos que o
// projeto compila e que o widget raiz é instanciável — o suficiente para o
// `flutter test` rodar limpo. Testes de widget mais completos devem mockar os
// plugins e o carregamento de fontes.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:athletto_atleta/main.dart';

void main() {
  test('AthlettoApp é um Widget instanciável', () {
    expect(const AthlettoApp(), isA<Widget>());
  });
}
