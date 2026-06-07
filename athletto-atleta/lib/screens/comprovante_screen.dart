import 'package:flutter/material.dart';

import '../models/cobranca.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/formatters.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import 'home_shell.dart';

/// Comprovante (recibo) — replica o `Comprovante` do protótipo.
/// Recibo #101010 com header lime, dados do pagamento e ID determinístico.
class ComprovanteScreen extends StatefulWidget {
  final Cobranca charge;
  final String clubeNome;

  const ComprovanteScreen({
    super.key,
    required this.charge,
    required this.clubeNome,
  });

  @override
  State<ComprovanteScreen> createState() => _ComprovanteScreenState();
}

class _ComprovanteScreenState extends State<ComprovanteScreen> {
  bool _saved = false;

  /// ID determinístico ATH-2026-XXXX-XXXX (mesmo hash do protótipo).
  String get _txnId {
    final base = '${widget.charge.id}athletto';
    int h = 0;
    for (final code in base.codeUnits) {
      h = (h * 31 + code) & 0xFFFFFFFF;
    }
    final hex = h.toRadixString(16).toUpperCase().padLeft(8, '0');
    final s = hex.substring(0, 8);
    return 'ATH-2026-${s.substring(0, 4)}-${s.substring(4)}';
  }

  void _salvar() {
    // TODO: exportar o card como imagem (ex.: RepaintBoundary + ui.Image,
    // ou um package como `screenshot`/`share_plus`) quando for permitido
    // adicionar dependências. Por ora damos apenas o feedback visual.
    setState(() => _saved = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Comprovante salvo!')),
    );
    Future.delayed(const Duration(milliseconds: 2400), () {
      if (mounted) setState(() => _saved = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final atleta = SessaoProvider.of(context).atleta?.nome ?? '—';
    final dataPg = Fmt.dataCompleta(widget.charge.dataPagamento ?? DateTime.now());

    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
              child: Row(
                children: [
                  Pressable(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Icon(Icons.arrow_back,
                        size: 24, color: AppColors.white),
                  ),
                  const SizedBox(width: 12),
                  Text('Comprovante',
                      style:
                          AppText.custom(size: 16, weight: FontWeight.w700)),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(
                    24, 12, 24, 24 + MediaQuery.of(context).viewPadding.bottom),
                child: Column(
                  children: [
                    _recibo(atleta, dataPg),
                    const SizedBox(height: 22),
                    PrimaryButton(
                      label:
                          _saved ? 'Comprovante salvo!' : 'Salvar comprovante',
                      leadingIcon: _saved ? Icons.check : Icons.download,
                      onPressed: _salvar,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _recibo(String atleta, String dataPg) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.receipt,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        children: [
          // header lime
          Container(
            color: AppColors.lime,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('athletto',
                    style: AppText.custom(
                        size: 16,
                        weight: FontWeight.w800,
                        fontStyle: FontStyle.italic,
                        color: AppColors.ink)),
                Text('COMPROVANTE PIX',
                    style: AppText.custom(
                        size: 12,
                        weight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: AppColors.ink)),
              ],
            ),
          ),
          // corpo
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 26, 24, 24),
            child: Column(
              children: [
                const IconChip(
                  icon: Icons.check_circle,
                  color: AppColors.lime,
                  tint: AppColors.limeTint16,
                  size: 60,
                  iconSize: 36,
                ),
                const SizedBox(height: 16),
                Text('Valor pago',
                    style: AppText.custom(
                        size: 13,
                        weight: FontWeight.w500,
                        color: AppColors.isento)),
                const SizedBox(height: 2),
                Text(Fmt.moeda(widget.charge.valor),
                    style: AppText.bigNumber),
                const Padding(
                  padding: EdgeInsets.only(top: 22, bottom: 18),
                  child: _DashedLine(),
                ),
                Column(
                  children: [
                    _ReceiptRow(
                        label: 'Cobrança',
                        value: widget.charge.caixinhaNome ?? '—'),
                    const SizedBox(height: 13),
                    _ReceiptRow(label: 'Atleta', value: atleta),
                    const SizedBox(height: 13),
                    _ReceiptRow(label: 'Clube', value: widget.clubeNome),
                    const SizedBox(height: 13),
                    const _ReceiptRow(
                        label: 'Forma de pagamento', value: 'Pix'),
                    const SizedBox(height: 13),
                    _ReceiptRow(label: 'Data do pagamento', value: dataPg),
                    const SizedBox(height: 13),
                    _ReceiptRow(label: 'ID da transação', value: _txnId),
                    const SizedBox(height: 13),
                    const _ReceiptRow(
                        label: 'Status', value: 'Pago ✓', accent: true),
                  ],
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 18, bottom: 16),
                  child: _DashedLine(),
                ),
                Text(
                  'Athletto · documento gerado pelo app\n'
                  'Guarde este comprovante como recibo do pagamento.',
                  textAlign: TextAlign.center,
                  style: AppText.custom(
                      size: 11, height: 1.5, color: AppColors.faint),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;
  final bool accent;

  const _ReceiptRow({
    required this.label,
    required this.value,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: AppText.custom(
                size: 12.5, weight: FontWeight.w500, color: AppColors.isento)),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: AppText.custom(
                size: 13,
                weight: FontWeight.w600,
                color: accent ? AppColors.lime : AppColors.white),
          ),
        ),
      ],
    );
  }
}

/// Divisória tracejada (white .18) do recibo.
class _DashedLine extends StatelessWidget {
  const _DashedLine();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 1,
      width: double.infinity,
      child: CustomPaint(painter: _DashedPainter()),
    );
  }
}

class _DashedPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.white.withOpacity(0.18)
      ..strokeWidth = 1;
    const dash = 4.0;
    const gap = 4.0;
    double x = 0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, 0), Offset(x + dash, 0), paint);
      x += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedPainter oldDelegate) => false;
}
