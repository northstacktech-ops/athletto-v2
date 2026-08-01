import 'package:flutter/material.dart';

import '../models/frequencia.dart';
import '../services/api.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/formatters.dart';
import '../widgets/state_views.dart';

/// Tela de Frequência — acessada a partir do StatCard da Home (não é mais
/// uma aba). Scaffold próprio com AppBar escura e botão de voltar.
class FrequenciaScreen extends StatefulWidget {
  final String token;
  const FrequenciaScreen({super.key, required this.token});

  @override
  State<FrequenciaScreen> createState() => _FrequenciaScreenState();
}

class _FrequenciaScreenState extends State<FrequenciaScreen> {
  bool _loading = true;
  String? _erro;
  Frequencia? _frequencia;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _carregar());
  }

  Future<void> _carregar() async {
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      final f = await Api.instance.frequencia(widget.token);
      if (!mounted) return;
      setState(() {
        _frequencia = f;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      appBar: AppBar(
        backgroundColor: AppColors.ink,
        elevation: 0,
        title: const Text('Frequência'),
        leading: const BackButton(color: AppColors.white),
      ),
      body: _build(),
    );
  }

  Widget _build() {
    if (_loading) return const LoadingView();
    if (_erro != null) return ErrorView(mensagem: _erro!, onRetry: _carregar);

    final f = _frequencia!;
    return RefreshIndicator(
      onRefresh: _carregar,
      color: AppColors.lime,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
            AppSpacing.screenH,
            AppSpacing.screenH,
            AppSpacing.screenH,
            32 + MediaQuery.of(context).viewPadding.bottom),
        children: [
          _ResumoCard(frequencia: f),
          const SizedBox(height: 28),
          const SectionHeading(icon: Icons.fact_check, title: 'Histórico'),
          const SizedBox(height: 20),
          if (f.historico.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: EmptyView(
                icon: Icons.history,
                titulo: 'Sem registros',
                subtitulo: 'Ainda não há histórico de presença.',
              ),
            )
          else
            ...f.historico.map((r) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _RegistroCard(registro: r),
                )),
        ],
      ),
    );
  }
}

/// Card de resumo: indicador circular de % + treinos/presenças/faltas.
class _ResumoCard extends StatelessWidget {
  final Frequencia frequencia;
  const _ResumoCard({required this.frequencia});

  @override
  Widget build(BuildContext context) {
    final pct = frequencia.percentual.clamp(0, 100).toDouble();
    final cor = pct >= 75
        ? AppColors.lime
        : pct >= 50
            ? AppColors.warning
            : AppColors.danger;
    final faltas =
        (frequencia.totalTreinos - frequencia.totalPresencas).clamp(0, 1 << 31);

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          SizedBox(
            width: 92,
            height: 92,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 92,
                  height: 92,
                  child: CircularProgressIndicator(
                    value: pct / 100,
                    strokeWidth: 9,
                    backgroundColor: cor.withOpacity(0.15),
                    valueColor: AlwaysStoppedAnimation<Color>(cor),
                  ),
                ),
                Text(
                  '${pct.toStringAsFixed(0)}%',
                  style: AppText.custom(
                      size: 22, weight: FontWeight.w800, color: cor),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Presença', style: AppText.sectionHeading),
                const SizedBox(height: 10),
                _linha('Treinos', '${frequencia.totalTreinos}'),
                _linha('Presenças', '${frequencia.totalPresencas}'),
                _linha('Faltas', '$faltas'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _linha(String label, String valor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text('$label: ',
              style: AppText.custom(
                  size: 14, weight: FontWeight.w500, color: AppColors.muted)),
          Text(valor,
              style: AppText.custom(
                  size: 14, weight: FontWeight.w700, color: AppColors.white)),
        ],
      ),
    );
  }
}

/// Card de registro do histórico: ícone check/close, turma, data e status.
class _RegistroCard extends StatelessWidget {
  final RegistroFrequencia registro;
  const _RegistroCard({required this.registro});

  @override
  Widget build(BuildContext context) {
    final presente = registro.presente;
    final cor = presente ? AppColors.lime : AppColors.danger;
    final tint = presente ? AppColors.limeTint16 : AppColors.dangerTint;

    return AppCard(
      child: Row(
        children: [
          IconChip(
            icon: presente ? Icons.check : Icons.close,
            color: cor,
            tint: tint,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  registro.turmaNome ?? (presente ? 'Presença' : 'Falta'),
                  style: AppText.cardTitle14,
                ),
                const SizedBox(height: 4),
                Text(
                  Fmt.dataCompleta(registro.data),
                  style: AppText.custom(
                      size: 12,
                      weight: FontWeight.w500,
                      color: AppColors.muted),
                ),
              ],
            ),
          ),
          Text(
            presente ? 'Presente' : 'Faltou',
            style: AppText.custom(
                size: 13, weight: FontWeight.w700, color: cor),
          ),
        ],
      ),
    );
  }
}
