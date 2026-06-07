import 'package:flutter/material.dart';

import '../models/notificacao.dart';
import '../services/api.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import '../widgets/state_views.dart';
import 'home_shell.dart';

/// Estilo visual de cada tipo de aviso (cor/ícone/tint) — espelha
/// `ALERT_TYPES` do protótipo (alertas.jsx).
class _AlertStyle {
  final Color color;
  final Color tint;
  final IconData icon;
  const _AlertStyle({
    required this.color,
    required this.tint,
    required this.icon,
  });
}

const Map<String, _AlertStyle> _alertTypes = {
  'financeiro': _AlertStyle(
      color: AppColors.warning,
      tint: AppColors.warningTint,
      icon: Icons.payments),
  'vencido': _AlertStyle(
      color: AppColors.danger,
      tint: AppColors.dangerTint,
      icon: Icons.warning_amber_rounded),
  'evento': _AlertStyle(
      color: AppColors.lime,
      tint: AppColors.limeTint16,
      icon: Icons.calendar_today),
  'clube': _AlertStyle(
      color: AppColors.info, tint: AppColors.infoTint, icon: Icons.info),
  'senha': _AlertStyle(
      color: AppColors.lime,
      tint: AppColors.limeTint16,
      icon: Icons.lock_reset),
};

_AlertStyle _styleFor(String tipo) => _alertTypes[tipo] ?? _alertTypes['clube']!;

/// Ícone para o botão de ação (deep-link) conforme o destino.
IconData _iconeAcao(String? destino) {
  switch (destino) {
    case 'financeiro':
      return Icons.payments;
    case 'agenda':
      return Icons.calendar_today;
    default:
      return Icons.open_in_new;
  }
}

/// Destinos de deep-link suportados pelo app shell.
bool _destinoNavegavel(String? destino) =>
    destino == 'financeiro' || destino == 'agenda';

/// "Tempo" amigável derivado de [criadaEm].
String _tempoLabel(DateTime? criadaEm) {
  if (criadaEm == null) return '';
  final agora = DateTime.now();
  final diff = agora.difference(criadaEm);
  if (diff.inMinutes < 1) return 'Agora';
  if (diff.inMinutes < 60) return 'há ${diff.inMinutes} min';
  if (diff.inHours < 24 && _mesmoDia(criadaEm, agora)) {
    return 'há ${diff.inHours} h';
  }
  if (diff.inDays < 7 && diff.inHours < 48 && diff.inHours >= 24) {
    return 'ontem';
  }
  return _formatarData(criadaEm);
}

bool _mesmoDia(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

bool _ehHoje(DateTime? d) => d != null && _mesmoDia(d, DateTime.now());

String _doisDigitos(int n) => n.toString().padLeft(2, '0');

String _formatarData(DateTime d) =>
    '${_doisDigitos(d.day)}/${_doisDigitos(d.month)}';

/// Central de avisos do atleta — replica a tela "Alertas" do protótipo,
/// agora consumindo as notificações reais de `Api.instance.listarNotificacoes`.
class AlertasTab extends StatefulWidget {
  const AlertasTab({super.key});

  @override
  State<AlertasTab> createState() => _AlertasTabState();
}

class _AlertasTabState extends State<AlertasTab> {
  bool _loading = true;
  String? _erro;
  List<NotificacaoApp> _notificacoes = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _carregar());
  }

  Future<void> _carregar() async {
    final token = SessaoProvider.of(context).token;
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      final lista = await Api.instance.listarNotificacoes(token);
      if (!mounted) return;
      setState(() {
        _notificacoes = lista;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.mensagem;
        _loading = false;
      });
    }
  }

  Future<void> _marcarTodas() async {
    final token = SessaoProvider.of(context).token;
    final anterior = _notificacoes;
    // Otimista.
    setState(() {
      _notificacoes = _notificacoes.map(_comoLida).toList();
    });
    try {
      await Api.instance.marcarNotificacaoLida(token, todas: true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _notificacoes = anterior);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.mensagem)));
    }
  }

  NotificacaoApp _comoLida(NotificacaoApp n) => NotificacaoApp(
        id: n.id,
        tipo: n.tipo,
        titulo: n.titulo,
        mensagem: n.mensagem,
        detalhe: n.detalhe,
        acaoLabel: n.acaoLabel,
        acaoDestino: n.acaoDestino,
        lida: true,
        criadaEm: n.criadaEm,
      );

  Future<void> _abrir(NotificacaoApp n) async {
    final token = SessaoProvider.of(context).token;
    final goToTab = AppShellScope.maybeOf(context)?.goToTab;

    if (!n.lida) {
      setState(() {
        _notificacoes = _notificacoes
            .map((item) => item.id == n.id ? _comoLida(item) : item)
            .toList();
      });
      // Não bloqueia a navegação; falha silenciosa (estado já atualizado).
      Api.instance.marcarNotificacaoLida(token, id: n.id).catchError((_) {});
    }

    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AlertaDetalheScreen(notificacao: n, onNavigate: goToTab),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        bottom: false,
        child: _corpo(),
      ),
    );
  }

  Widget _corpo() {
    if (_loading) return const LoadingView();
    if (_erro != null) return ErrorView(mensagem: _erro!, onRetry: _carregar);

    final naoLidos = _notificacoes.where((a) => !a.lida).length;
    final hoje = _notificacoes.where((a) => _ehHoje(a.criadaEm)).toList();
    final antes = _notificacoes.where((a) => !_ehHoje(a.criadaEm)).toList();

    return RefreshIndicator(
      onRefresh: _carregar,
      color: AppColors.lime,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
        children: [
          // Título "Avisos"
          Padding(
            padding: const EdgeInsets.only(top: 20, bottom: 4),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.notifications,
                      size: 20, color: AppColors.lime),
                  const SizedBox(width: 6),
                  Text('Avisos',
                      style: AppText.custom(
                          size: 20,
                          weight: FontWeight.w700,
                          color: AppColors.white)),
                ],
              ),
            ),
          ),

          // Sub + "Marcar todas como lidas"
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(child: _subContador(naoLidos)),
                if (naoLidos > 0)
                  Pressable(
                    onTap: _marcarTodas,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.done_all,
                            size: 18, color: AppColors.lime),
                        const SizedBox(width: 6),
                        Text('Marcar todas como lidas',
                            style: AppText.custom(
                                size: 13,
                                weight: FontWeight.w700,
                                color: AppColors.lime)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          if (_notificacoes.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyView(
                icon: Icons.notifications_none,
                titulo: 'Nenhum aviso por aqui.',
              ),
            )
          else ...[
            _grupo('Hoje', hoje),
            if (hoje.isNotEmpty && antes.isNotEmpty)
              const SizedBox(height: 20),
            _grupo('Anteriores', antes),
          ],
        ],
      ),
    );
  }

  Widget _subContador(int naoLidos) {
    if (naoLidos <= 0) {
      return Text('Tudo em dia', style: AppText.bodyMuted.copyWith(fontSize: 13));
    }
    final plural = naoLidos > 1 ? 'não lidos' : 'não lido';
    return RichText(
      text: TextSpan(
        style: AppText.custom(size: 13, color: AppColors.muted),
        children: [
          TextSpan(
            text: '$naoLidos ',
            style: AppText.custom(
                size: 13, weight: FontWeight.w700, color: AppColors.lime),
          ),
          TextSpan(text: plural),
        ],
      ),
    );
  }

  Widget _grupo(String label, List<NotificacaoApp> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Eyebrow(label),
        const SizedBox(height: 12),
        for (var i = 0; i < items.length; i++) ...[
          _AlertCard(notificacao: items[i], onOpen: () => _abrir(items[i])),
          if (i != items.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }
}

/// Card de uma notificação na lista.
class _AlertCard extends StatelessWidget {
  final NotificacaoApp notificacao;
  final VoidCallback onOpen;

  const _AlertCard({required this.notificacao, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final s = _styleFor(notificacao.tipo);
    final tempo = _tempoLabel(notificacao.criadaEm);
    return AppCard(
      onTap: onOpen,
      opacity: notificacao.lida ? 0.6 : 1,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconChip(icon: s.icon, color: s.color, tint: s.tint),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        notificacao.titulo,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.custom(
                            size: 14.5,
                            weight: FontWeight.w700,
                            color: AppColors.white),
                      ),
                    ),
                    if (!notificacao.lida) ...[
                      const SizedBox(width: 8),
                      Container(
                        margin: const EdgeInsets.only(top: 6),
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                            color: AppColors.lime, shape: BoxShape.circle),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  notificacao.mensagem,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.custom(
                      size: 13, height: 1.45, color: AppColors.muted),
                ),
                if (tempo.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(tempo, style: AppText.micro),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Detalhe da notificação (abre ao tocar um card).
class AlertaDetalheScreen extends StatelessWidget {
  final NotificacaoApp notificacao;
  final void Function(String tabId)? onNavigate;

  const AlertaDetalheScreen({
    super.key,
    required this.notificacao,
    this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final s = _styleFor(notificacao.tipo);
    final tempo = _tempoLabel(notificacao.criadaEm);
    final temAcao = _destinoNavegavel(notificacao.acaoDestino);
    final acaoLabel = (notificacao.acaoLabel != null &&
            notificacao.acaoLabel!.trim().isNotEmpty)
        ? notificacao.acaoLabel!
        : 'Abrir';

    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header: voltar + "Aviso"
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
              child: Row(
                children: [
                  Pressable(
                    onTap: () => Navigator.of(context).maybePop(),
                    child: const Icon(Icons.arrow_back,
                        size: 24, color: AppColors.white),
                  ),
                  const SizedBox(width: 12),
                  Text('Aviso',
                      style: AppText.custom(
                          size: 16,
                          weight: FontWeight.w700,
                          color: AppColors.white)),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                children: [
                  Center(
                    child: IconChip(
                      icon: s.icon,
                      color: s.color,
                      tint: s.tint,
                      size: 72,
                      iconSize: 38,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    notificacao.titulo,
                    textAlign: TextAlign.center,
                    style: AppText.custom(
                        size: 22,
                        weight: FontWeight.w700,
                        color: AppColors.white,
                        height: 1.25),
                  ),
                  if (tempo.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      tempo,
                      textAlign: TextAlign.center,
                      style: AppText.custom(
                          size: 12.5,
                          weight: FontWeight.w500,
                          color: AppColors.faint),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusCard),
                    ),
                    padding: const EdgeInsets.all(18),
                    child: Text(
                      notificacao.detalhe ?? notificacao.mensagem,
                      style: AppText.custom(
                          size: 14.5, height: 1.6, color: AppColors.muted2),
                    ),
                  ),
                  if (temAcao) ...[
                    const SizedBox(height: 22),
                    PrimaryButton(
                      label: acaoLabel,
                      leadingIcon: _iconeAcao(notificacao.acaoDestino),
                      onPressed: () {
                        Navigator.of(context).maybePop();
                        onNavigate?.call(notificacao.acaoDestino!);
                      },
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
