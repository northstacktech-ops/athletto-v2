import 'package:flutter/material.dart';

import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/bottom_nav.dart';
import 'agenda_tab.dart';
import 'alertas_tab.dart';
import 'cpf_screen.dart';
import 'financeiro_tab.dart';
import 'home_tab.dart';
import 'perfil_tab.dart';

/// Disponibiliza a sessão ativa (token do clube ativo) para as telas filhas.
class SessaoProvider extends InheritedWidget {
  final Sessao sessao;

  const SessaoProvider({
    super.key,
    required this.sessao,
    required super.child,
  });

  static Sessao of(BuildContext context) {
    final provider =
        context.dependOnInheritedWidgetOfExactType<SessaoProvider>();
    assert(provider != null, 'SessaoProvider não encontrado na árvore.');
    return provider!.sessao;
  }

  @override
  bool updateShouldNotify(SessaoProvider oldWidget) =>
      oldWidget.sessao.token != sessao.token ||
      oldWidget.sessao.clubeId != sessao.clubeId;
}

/// Permite que as abas troquem a aba ativa (ex.: StatCard da Home → Financeiro).
class AppShellScope extends InheritedWidget {
  final void Function(String id) goToTab;

  const AppShellScope({
    super.key,
    required this.goToTab,
    required super.child,
  });

  static AppShellScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppShellScope>();

  @override
  bool updateShouldNotify(AppShellScope oldWidget) => false;
}

class HomeShell extends StatefulWidget {
  final Sessao sessao;
  const HomeShell({super.key, required this.sessao});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  late Sessao _sessao;

  @override
  void initState() {
    super.initState();
    _sessao = widget.sessao;
  }

  void _trocarSessao(Sessao nova) {
    setState(() {
      _sessao = nova;
      _index = 0;
    });
  }

  void _sair() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const CpfScreen()),
      (route) => false,
    );
  }

  void _goToTab(String id) {
    final i = kNavItems.indexWhere((n) => n.id == id);
    if (i >= 0) setState(() => _index = i);
  }

  @override
  Widget build(BuildContext context) {
    final tabs = <Widget>[
      const HomeTab(),
      const AgendaTab(),
      const FinanceiroTab(),
      const AlertasTab(),
      PerfilTab(onTrocarSessao: _trocarSessao, onSair: _sair),
    ];

    return SessaoProvider(
      sessao: _sessao,
      child: AppShellScope(
        goToTab: _goToTab,
        child: Scaffold(
          backgroundColor: AppColors.ink,
          body: IndexedStack(index: _index, children: tabs),
          bottomNavigationBar: AthlettoBottomNav(
            activeIndex: _index,
            onSelect: (i) => setState(() => _index = i),
          ),
        ),
      ),
    );
  }
}
