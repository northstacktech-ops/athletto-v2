import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/api.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import 'home_shell.dart';
import 'onboarding_screen.dart';

/// Splash de marca: fundo lime, animação Lottie central, duração exata de 3s.
///
/// Decisão de rota após o splash:
/// - há sessão salva e /me responde -> HomeShell;
/// - caso contrário -> Onboarding.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Fundo escuro: ícones claros na status bar.
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
    ));
    WidgetsBinding.instance.addPostFrameCallback((_) => _decidir());
  }

  Future<void> _decidir() async {
    // O splash dura exatamente 3000ms; a resolução de rota corre em paralelo.
    final resultados = await Future.wait<Object?>([
      _resolverDestino(),
      Future<void>.delayed(const Duration(milliseconds: 3000)),
    ]);
    if (!mounted) return;
    _go(resultados.first as Widget);
  }

  Future<Widget> _resolverDestino() async {
    final sessao = await SessionStore.instance.lerUltimaSessao();
    if (sessao == null || sessao.token.isEmpty) {
      return const OnboardingScreen();
    }
    try {
      final me = await Api.instance.me(sessao.token);
      await SessionStore.instance
          .atualizarCache(sessao.clubeId, atleta: me.atleta, clube: me.clube);
      final atual = sessao.copyWith(atleta: me.atleta, clube: me.clube);
      return HomeShell(sessao: atual);
    } catch (_) {
      // Token inválido/expirado ou offline: recomeça pelo onboarding.
      return const OnboardingScreen();
    }
  }

  void _go(Widget destino) {
    // Ao sair da splash, volta os ícones da status bar para o claro (telas escuras).
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
    ));
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => destino),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.ink,
        body: Center(
          child: Image.asset(
            'assets/img/logo.png',
            width: MediaQuery.of(context).size.width * 0.42,
            fit: BoxFit.contain,
          ),
        ),
      ),
    );
  }
}
