import 'package:flutter/material.dart';

import '../models/cobranca.dart';
import '../services/api.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/formatters.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import '../widgets/state_views.dart';
import 'comprovante_screen.dart';
import 'home_shell.dart';
import 'pix_screen.dart';

/// Financeiro (aba) — replica EXATAMENTE a tela Pagamentos do protótipo
/// (estilo congelado pelo cliente). Faixa-resumo, tabs segmentadas e lista
/// de [ChargeCard] com lógica de status derivada de status + vencimento.
class FinanceiroTab extends StatefulWidget {
  const FinanceiroTab({super.key});

  @override
  State<FinanceiroTab> createState() => _FinanceiroTabState();
}

class _FinanceiroTabState extends State<FinanceiroTab> {
  bool _loading = true;
  String? _erro;
  List<Cobranca> _cobrancas = [];
  String _tab = 'pendentes'; // pendentes | pagas | todas

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
      final cobrancas = await Api.instance.cobrancas(token);
      cobrancas.sort((a, b) {
        // pendentes/atraso primeiro, depois por vencimento
        if (a.isPago != b.isPago) return a.isPago ? 1 : -1;
        final av = a.dataVencimento ?? DateTime(2100);
        final bv = b.dataVencimento ?? DateTime(2100);
        return av.compareTo(bv);
      });
      if (!mounted) return;
      setState(() {
        _cobrancas = cobrancas;
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

  Future<void> _pagar(Cobranca c) async {
    final mudou = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => PixScreen(charge: c)),
    );
    if (mudou == true) _carregar();
  }

  void _comprovante(Cobranca c) {
    final clube = SessaoProvider.of(context).clube?.nome ?? '—';
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ComprovanteScreen(charge: c, clubeNome: clube),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(bottom: false, child: _build()),
    );
  }

  Widget _build() {
    if (_loading) return const LoadingView();
    if (_erro != null) return ErrorView(mensagem: _erro!, onRetry: _carregar);

    final visiveis =
        _cobrancas.where((c) => c.status != 'cancelado').toList();
    final pendentes =
        visiveis.where((c) => ChargeView.of(c).payable).toList();
    final pagas = visiveis.where((c) => c.isPago).toList();

    final totalAberto =
        pendentes.fold<double>(0, (s, c) => s + c.valor);
    final overdue = pendentes
        .where((c) => ChargeView.of(c).kind == ChargeKind.vencido)
        .length;
    final soon = pendentes.where((c) {
      final v = ChargeView.of(c);
      return v.kind == ChargeKind.futuro &&
          v.dias != null &&
          v.dias! >= 0 &&
          v.dias! <= 3;
    }).length;

    final list =
        _tab == 'pendentes' ? pendentes : _tab == 'pagas' ? pagas : visiveis;

    return RefreshIndicator(
      onRefresh: _carregar,
      color: AppColors.lime,
      child: ListView(
        padding: EdgeInsets.zero,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          // título central
          Padding(
            padding: const EdgeInsets.only(top: 20, bottom: 18),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.payments, size: 20, color: AppColors.lime),
                  const SizedBox(width: 6),
                  Text('Pagamentos', style: AppText.h1Small),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.screenH, 0, AppSpacing.screenH, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _resumo(
                  pendentes.length,
                  totalAberto,
                  overdue,
                  soon,
                ),
                const SizedBox(height: 20),
                _tabs(pendentes.length),
                const SizedBox(height: 20),
                if (list.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Center(
                      child: Text(
                        _tab == 'pagas'
                            ? 'Nenhum pagamento ainda.'
                            : 'Nada por aqui.',
                        style: AppText.custom(
                            size: 14, color: AppColors.muted),
                      ),
                    ),
                  )
                else
                  ...list.map((c) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: ChargeCard(
                          charge: c,
                          onPay: _pagar,
                          onReceipt: _comprovante,
                        ),
                      )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- Faixa-resumo --------------------------------------------------------

  Widget _resumo(int qtdPendentes, double total, int overdue, int soon) {
    if (qtdPendentes == 0) {
      // estado positivo "Tudo certo"
      return AppCard(
        borderColor: AppColors.lime,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
        child: Row(
          children: [
            const IconChip(
              icon: Icons.check_circle,
              color: AppColors.lime,
              tint: AppColors.limeTint16,
              size: 44,
              iconSize: 26,
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Tudo certo', style: AppText.sectionHeading),
                const SizedBox(height: 2),
                Text('Nenhuma cobrança em aberto',
                    style: AppText.custom(size: 13, color: AppColors.muted)),
              ],
            ),
          ],
        ),
      );
    }

    // alerta vermelho (vencidas) ou âmbar (vence em breve)
    Color? alertColor;
    String? alertText;
    if (overdue > 0) {
      alertColor = AppColors.danger;
      alertText = overdue > 1
          ? '$overdue cobranças em atraso'
          : '$overdue cobrança em atraso';
    } else if (soon > 0) {
      alertColor = AppColors.warning;
      alertText =
          soon > 1 ? '$soon vencem em breve' : '1 vence em até 3 dias';
    }

    return AppCard(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Você tem em aberto',
              style: AppText.custom(
                  size: 13, weight: FontWeight.w500, color: AppColors.muted)),
          const SizedBox(height: 4),
          Text(Fmt.moeda(total),
              style: AppText.bigNumber.copyWith(color: AppColors.lime)),
          const SizedBox(height: 4),
          Text(
            qtdPendentes > 1
                ? '$qtdPendentes cobranças pendentes'
                : '$qtdPendentes cobrança pendente',
            style: AppText.custom(size: 13, color: AppColors.white),
          ),
          if (alertText != null)
            Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.only(top: 12),
              decoration: const BoxDecoration(
                border:
                    Border(top: BorderSide(color: AppColors.hairline)),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded,
                      size: 16, color: alertColor!),
                  const SizedBox(width: 7),
                  Text(alertText,
                      style: AppText.custom(
                          size: 13,
                          weight: FontWeight.w600,
                          color: alertColor)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // --- Tabs segmentadas ----------------------------------------------------

  Widget _tabs(int pendentesCount) {
    final tabs = <List<String>>[
      ['pendentes', 'Pendentes'],
      ['pagas', 'Pagas'],
      ['todas', 'Todas'],
    ];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Row(
        children: [
          for (int i = 0; i < tabs.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(
              child: _tabButton(
                id: tabs[i][0],
                label: tabs[i][1],
                count: tabs[i][0] == 'pendentes' ? pendentesCount : null,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _tabButton({required String id, required String label, int? count}) {
    final on = id == _tab;
    return Pressable(
      onTap: () => setState(() => _tab = id),
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: on ? AppColors.lime : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: AppText.custom(
                    size: 13,
                    weight: FontWeight.w700,
                    color: on ? AppColors.ink : AppColors.muted)),
            if (count != null && count > 0) ...[
              const SizedBox(width: 5),
              Opacity(
                opacity: on ? 0.7 : 1,
                child: Text('($count)',
                    style: AppText.custom(
                        size: 11,
                        weight: FontWeight.w700,
                        color: on ? AppColors.ink : AppColors.muted)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// Lógica de status (derivada do protótipo `chargeView`)
// ===========================================================================

enum ChargeKind { pago, isento, vencido, futuro }

/// Estado visual derivado de uma [Cobranca] (cor, badge, ícone, texto).
class ChargeView {
  final ChargeKind kind;
  final Color color;
  final Color tint;
  final String badge;
  final String dateText;
  final IconData icon;
  final int? dias; // dias até o vencimento (null se sem data)

  const ChargeView({
    required this.kind,
    required this.color,
    required this.tint,
    required this.badge,
    required this.dateText,
    required this.icon,
    this.dias,
  });

  bool get payable =>
      kind == ChargeKind.vencido || kind == ChargeKind.futuro;
  bool get faded => kind == ChargeKind.pago || kind == ChargeKind.isento;

  static DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

  factory ChargeView.of(Cobranca c) {
    if (c.isPago) {
      return ChargeView(
        kind: ChargeKind.pago,
        color: AppColors.lime,
        tint: AppColors.limeTint,
        badge: 'PAGO',
        dateText: 'Pago em ${Fmt.dataCurta(c.dataPagamento)}',
        icon: Icons.check_circle,
      );
    }
    if (c.status == 'isento') {
      return const ChargeView(
        kind: ChargeKind.isento,
        color: AppColors.isento,
        tint: AppColors.isentoTint,
        badge: 'ISENTO',
        dateText: 'Isento pelo clube',
        icon: Icons.info,
      );
    }

    // pendente / atraso → deriva vencido vs futuro pela data
    final hoje = _dateOnly(DateTime.now());
    final venc =
        c.dataVencimento != null ? _dateOnly(c.dataVencimento!) : null;
    final dias = venc?.difference(hoje).inDays;
    final vencido = c.isAtraso || (dias != null && dias < 0);

    if (vencido) {
      return ChargeView(
        kind: ChargeKind.vencido,
        color: AppColors.danger,
        tint: AppColors.dangerTint,
        badge: 'EM ATRASO',
        dateText: 'Venceu em ${Fmt.dataCurta(c.dataVencimento)}',
        icon: Icons.warning_amber_rounded,
        dias: dias,
      );
    }

    final rel = dias == null
        ? ''
        : dias == 0
            ? 'vence hoje'
            : dias == 1
                ? 'vence amanhã'
                : 'em $dias dias';
    final dateText = 'Vence em ${Fmt.dataCurta(c.dataVencimento)}'
        '${rel.isNotEmpty ? ' · $rel' : ''}';
    return ChargeView(
      kind: ChargeKind.futuro,
      color: AppColors.warning,
      tint: AppColors.warningTint,
      badge: 'PENDENTE',
      dateText: dateText,
      icon: Icons.schedule,
      dias: dias,
    );
  }
}

// ===========================================================================
// ChargeCard
// ===========================================================================

class ChargeCard extends StatelessWidget {
  final Cobranca charge;
  final void Function(Cobranca) onPay;
  final void Function(Cobranca) onReceipt;

  const ChargeCard({
    super.key,
    required this.charge,
    required this.onPay,
    required this.onReceipt,
  });

  @override
  Widget build(BuildContext context) {
    final v = ChargeView.of(charge);

    return AppCard(
      opacity: v.faded ? 0.86 : 1,
      borderColor: v.kind == ChargeKind.vencido ? AppColors.danger : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatusPill(view: v),
              Text(Fmt.moeda(charge.valor),
                  style: AppText.custom(
                      size: 18,
                      weight: FontWeight.w700,
                      color: AppColors.white)),
            ],
          ),
          const SizedBox(height: 12),
          Text(charge.caixinhaNome ?? 'Cobrança',
              style: AppText.cardTitle),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(v.icon, size: 14, color: v.color),
              const SizedBox(width: 6),
              Flexible(
                child: Text(v.dateText,
                    style: AppText.custom(
                        size: 12, weight: FontWeight.w500, color: v.color)),
              ),
            ],
          ),
          if (v.payable) ...[
            const SizedBox(height: 14),
            PrimaryButton(
              label: 'Pagar via Pix',
              leadingIcon: Icons.pix,
              height: AppSpacing.buttonHeightInline,
              fontSize: 14,
              onPressed: () => onPay(charge),
            ),
          ],
          if (v.kind == ChargeKind.pago) ...[
            const SizedBox(height: 14),
            OutlineButtonA(
              label: 'Ver comprovante',
              leadingIcon: Icons.receipt_long,
              height: 40,
              fontSize: 13,
              borderColor: AppColors.limeDim,
              textColor: AppColors.lime,
              onPressed: () => onReceipt(charge),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final ChargeView view;
  const _StatusPill({required this.view});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: view.tint,
        borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration:
                BoxDecoration(color: view.color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(view.badge,
              style: AppText.custom(
                  size: 11,
                  weight: FontWeight.w700,
                  letterSpacing: 0.3,
                  color: view.color)),
        ],
      ),
    );
  }
}
