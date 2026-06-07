import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/cobranca.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/formatters.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import 'comprovante_screen.dart';
import 'home_shell.dart';

/// Tela de pagamento Pix — replica o `PixPagamento` do protótipo.
/// Estados: idle → processing → confirmed (auto-avança ~3.6s, como no
/// protótipo; em produção seria polling/webhook do status real).
class PixScreen extends StatefulWidget {
  final Cobranca charge;
  const PixScreen({super.key, required this.charge});

  @override
  State<PixScreen> createState() => _PixScreenState();
}

enum _Stage { idle, processing, confirmed }

class _PixScreenState extends State<PixScreen>
    with SingleTickerProviderStateMixin {
  _Stage _stage = _Stage.idle;
  bool _copied = false;
  Timer? _confirmTimer;
  Timer? _copyTimer;
  late final AnimationController _spin;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat();
  }

  @override
  void dispose() {
    _confirmTimer?.cancel();
    _copyTimer?.cancel();
    _spin.dispose();
    super.dispose();
  }

  String get _nome => widget.charge.caixinhaNome ?? 'Cobrança';

  String get _pixCode =>
      '00020126850014BR.GOV.BCB.PIX2563athletto.${widget.charge.id}'
      '.5204000053039865802BR6009BoaVista62070503***6304A1B2';

  void _copiar() {
    Clipboard.setData(ClipboardData(text: _pixCode));
    setState(() => _copied = true);
    _copyTimer?.cancel();
    _copyTimer = Timer(const Duration(milliseconds: 1800), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  Future<void> _abrirBanco() async {
    final url = widget.charge.abacatepayLink;
    if (url != null && url.trim().isNotEmpty) {
      final uri = Uri.tryParse(url);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
    _goProcessing();
  }

  void _goProcessing() {
    setState(() => _stage = _Stage.processing);
    _confirmTimer?.cancel();
    _confirmTimer = Timer(const Duration(milliseconds: 3600), () {
      if (mounted) setState(() => _stage = _Stage.confirmed);
    });
  }

  void _verComprovante() {
    final clube = SessaoProvider.of(context).clube?.nome ?? '—';
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            ComprovanteScreen(charge: widget.charge, clubeNome: clube),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _header(),
            Expanded(
              child: _stage == _Stage.confirmed
                  ? _confirmed()
                  : _idleOuProcessing(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
      child: Row(
        children: [
          Pressable(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(Icons.arrow_back, size: 24, color: AppColors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(_nome,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.custom(size: 16, weight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  // --- idle / processing ---------------------------------------------------

  Widget _idleOuProcessing() {
    final processing = _stage == _Stage.processing;
    final bottomInset = MediaQuery.of(context).viewPadding.bottom;
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(28, 16, 28, 28 + bottomInset),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text('Valor a pagar',
              style: AppText.custom(
                  size: 13, weight: FontWeight.w500, color: AppColors.muted)),
          const SizedBox(height: 4),
          Text(Fmt.moeda(widget.charge.valor), style: AppText.bigNumber36),
          const SizedBox(height: 24),
          // QR em card branco com overlay de processamento
          Container(
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
            ),
            padding: const EdgeInsets.all(16),
            child: Stack(
              children: [
                SizedBox(
                  width: 180,
                  height: 180,
                  child: CustomPaint(painter: _QrMockPainter()),
                ),
                if (processing)
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusSmall),
                      child: Container(
                        color: AppColors.ink.withOpacity(0.92),
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            RotationTransition(
                              turns: _spin,
                              child: const Icon(Icons.autorenew,
                                  size: 34, color: AppColors.lime),
                            ),
                            const SizedBox(height: 10),
                            Text('Processando…',
                                style: AppText.custom(
                                    size: 13,
                                    weight: FontWeight.w600,
                                    color: AppColors.white)),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (processing)
            Column(
              children: [
                Text('Processando pagamento…',
                    style: AppText.sectionHeading),
                const SizedBox(height: 8),
                SizedBox(
                  width: 280,
                  child: Text(
                    'Estamos confirmando com o banco. A tela atualiza '
                    'sozinha quando o pagamento cair.',
                    textAlign: TextAlign.center,
                    style: AppText.custom(
                        size: 13, height: 1.5, color: AppColors.muted),
                  ),
                ),
              ],
            )
          else ...[
            PrimaryButton(
              label: _copied ? 'Código copiado!' : 'Copiar código Pix',
              leadingIcon: _copied ? Icons.check : Icons.copy,
              onPressed: _copiar,
            ),
            const SizedBox(height: 10),
            OutlineButtonA(
              label: 'Abrir no app do banco',
              leadingIcon: Icons.account_balance,
              onPressed: _abrirBanco,
            ),
            const SizedBox(height: 18),
            AppCard(
              radius: 12,
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 1),
                    child: Icon(Icons.info, size: 18, color: AppColors.lime),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Após pagar, a confirmação aparece aqui '
                      'automaticamente — você não precisa fazer mais nada.',
                      style: AppText.custom(
                          size: 12.5, height: 1.5, color: AppColors.muted),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // --- confirmed -----------------------------------------------------------

  Widget _confirmed() {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 36),
        child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const IconChip(
            icon: Icons.check_circle,
            color: AppColors.lime,
            tint: AppColors.limeTint16,
            size: 96,
            iconSize: 56,
          ),
          const SizedBox(height: 24),
          Text('Pagamento confirmado',
              textAlign: TextAlign.center, style: AppText.h1),
          const SizedBox(height: 12),
          SizedBox(
            width: 280,
            child: Text.rich(
              TextSpan(
                style: AppText.custom(
                    size: 15, height: 1.5, color: AppColors.muted),
                children: [
                  TextSpan(text: 'Recebemos ${Fmt.moeda(widget.charge.valor)} de '),
                  TextSpan(
                    text: _nome,
                    style: AppText.custom(
                        size: 15,
                        weight: FontWeight.w600,
                        height: 1.5,
                        color: AppColors.lime),
                  ),
                  const TextSpan(text: '.'),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: PrimaryButton(
              label: 'Ver comprovante',
              leadingIcon: Icons.receipt_long,
              onPressed: _verComprovante,
            ),
          ),
          const SizedBox(height: 16),
          Pressable(
            onTap: () => Navigator.of(context).pop(true),
            child: Text('Voltar aos pagamentos',
                style: AppText.custom(size: 14, weight: FontWeight.w600)),
          ),
          ],
        ),
      ),
    );
  }
}

/// Desenha um QR mock (matriz 25×25 com finder patterns), igual ao protótipo.
/// NÃO é um QR válido — é apenas um placeholder visual.
class _QrMockPainter extends CustomPainter {
  static const int _n = 25;

  bool _finder(int x, int y) =>
      (x < 7 && y < 7) ||
      (x >= _n - 7 && y < 7) ||
      (x < 7 && y >= _n - 7);

  @override
  void paint(Canvas canvas, Size size) {
    final cell = size.width / _n;
    final paint = Paint()..color = const Color(0xFF0C0C0C);
    for (int y = 0; y < _n; y++) {
      for (int x = 0; x < _n; x++) {
        bool on;
        if (_finder(x, y)) {
          final fx = x >= _n - 7 ? x - (_n - 7) : x;
          final fy = y >= _n - 7 ? y - (_n - 7) : y;
          on = fx == 0 ||
              fx == 6 ||
              fy == 0 ||
              fy == 6 ||
              (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
        } else {
          on = (x * 13 + y * 7 + (x * y) % 5) % 3 == 0;
        }
        if (on) {
          canvas.drawRect(
            Rect.fromLTWH(x * cell, y * cell, cell, cell),
            paint,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _QrMockPainter oldDelegate) => false;
}
