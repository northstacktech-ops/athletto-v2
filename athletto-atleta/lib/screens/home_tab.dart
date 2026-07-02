import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/cobranca.dart';
import '../models/evento.dart';
import '../models/frequencia.dart';
import '../services/api.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/formatters.dart';
import '../widgets/pressable.dart';
import '../widgets/state_views.dart';
import 'frequencia_tab.dart';
import 'home_shell.dart';

/// Home (aba Início) — replica o protótipo: header lime + corpo escuro com
/// citação, grid 2×2 de StatCards e lista de próximos eventos.
class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  bool _loading = true;
  String? _erro;

  List<Evento> _agenda = [];
  List<Cobranca> _cobrancas = [];
  List<String> _avisos = [];
  Frequencia? _frequencia;

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
      final results = await Future.wait([
        Api.instance.agenda(token),
        Api.instance.cobrancas(token),
        Api.instance.frequencia(token),
        Api.instance.avisos(token),
      ]);
      if (!mounted) return;
      setState(() {
        _agenda = results[0] as List<Evento>;
        _cobrancas = results[1] as List<Cobranca>;
        _frequencia = results[2] as Frequencia;
        _avisos = results[3] as List<String>;
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

  // --- Derivações para os StatCards ----------------------------------------

  int get _qtdPendentes => _cobrancas.where((c) => !c.isPago).length;

  int get _percFrequencia =>
      (_frequencia?.percentual ?? 0).clamp(0, 100).round();

  int get _qtdAvisos => _avisos.length;

  /// Eventos com início entre o começo de hoje e os próximos 7 dias.
  int get _eventosSemana {
    final agora = DateTime.now();
    final inicio = DateTime(agora.year, agora.month, agora.day);
    final fim = inicio.add(const Duration(days: 7));
    return _agenda
        .where((e) =>
            e.dataInicio != null &&
            !e.dataInicio!.isBefore(inicio) &&
            e.dataInicio!.isBefore(fim))
        .length;
  }

  /// Próximos eventos (futuros, ordenados).
  List<Evento> get _proximos {
    final agora = DateTime.now();
    final futuros = _agenda
        .where((e) => e.dataInicio != null && e.dataInicio!.isAfter(agora))
        .toList()
      ..sort((a, b) => a.dataInicio!.compareTo(b.dataInicio!));
    return futuros.take(5).toList();
  }

  void _go(String tab) => AppShellScope.maybeOf(context)?.goToTab(tab);

  void _abrirFrequencia() {
    final token = SessaoProvider.of(context).token;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => FrequenciaScreen(token: token)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final atleta = SessaoProvider.of(context).atleta;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      child: RefreshIndicator(
        onRefresh: _carregar,
        color: AppColors.lime,
        child: ListView(
          padding: EdgeInsets.zero,
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            _LimeHeader(
              nome: atleta?.primeiroNome ?? 'Atleta',
              fotoUrl: atleta?.fotoUrl,
              onBell: () => _go('alertas'),
            ),
            _corpoConteudo(),
          ],
        ),
      ),
    );
  }

  Widget _corpoConteudo() {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.only(top: 140),
        child: LoadingView(),
      );
    }
    if (_erro != null) {
      return Padding(
        padding: const EdgeInsets.only(top: 100),
        child: ErrorView(mensagem: _erro!, onRetry: _carregar),
      );
    }

    final proximos = _proximos;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screenH, AppSpacing.screenH, AppSpacing.screenH, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Citação
          const _QuoteCard(),
        const SizedBox(height: 28),

        // Grid 2×2 de StatCards
        Row(
          children: [
            Expanded(
              child: StatCard(
                icon: Icons.payments,
                title: 'Pagamento',
                sub: '$_qtdPendentes pendentes',
                onTap: () => _go('financeiro'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                icon: Icons.percent,
                title: 'Frequência',
                sub: '$_percFrequencia% este mês',
                onTap: _abrirFrequencia,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: StatCard(
                icon: Icons.error,
                title: 'Avisos',
                sub: '$_qtdAvisos não lidos',
                onTap: () => _go('alertas'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: StatCard(
                icon: Icons.calendar_today,
                title: 'Próx. Eventos',
                sub: '$_eventosSemana esta semana',
                onTap: () => _go('agenda'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 28),

        // Próximos eventos
        const SectionHeading(
            icon: Icons.calendar_today, title: 'Próximos Eventos'),
        const SizedBox(height: 20),
        if (proximos.isEmpty)
          const EmptyView(
            icon: Icons.event_busy_outlined,
            titulo: 'Nenhum evento próximo',
            subtitulo: 'Você não tem treinos ou eventos agendados.',
          )
        else
          ...proximos.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: EventCard(
                  title: e.titulo,
                  date: _fmtData(e.dataInicio),
                ),
              )),
        ],
      ),
    );
  }

  String _fmtData(DateTime? d) =>
      '${Fmt.dataCompleta(d)} - ${Fmt.hora(d)}h';
}

/// Cabeçalho lime: avatar 57px + saudação + botão de sino.
class _LimeHeader extends StatelessWidget {
  final String nome;
  final String? fotoUrl;
  final VoidCallback onBell;

  const _LimeHeader({
    required this.nome,
    required this.fotoUrl,
    required this.onBell,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.lime,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(8)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 8,
              AppSpacing.screenH, 16),
          child: Row(
            children: [
              _HeaderAvatar(fotoUrl: fotoUrl),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Oi, $nome',
                      style: AppText.custom(
                        size: 20,
                        weight: FontWeight.w700,
                        color: AppColors.black,
                        fontStyle: FontStyle.italic,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Pronto para o dia de hoje?',
                      style: AppText.custom(
                        size: 14,
                        weight: FontWeight.w500,
                        color: AppColors.black,
                      ),
                    ),
                  ],
                ),
              ),
              Pressable(
                onTap: onBell,
                child: const Icon(Icons.notifications,
                    size: 30, color: AppColors.ink),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Avatar circular 57px: foto da rede com fallback para o asset eric.jpg.
class _HeaderAvatar extends StatelessWidget {
  final String? fotoUrl;
  const _HeaderAvatar({required this.fotoUrl});

  @override
  Widget build(BuildContext context) {
    const double size = 57;
    final hasUrl = fotoUrl != null && fotoUrl!.trim().isNotEmpty;
    return ClipOval(
      child: SizedBox(
        width: size,
        height: size,
        child: hasUrl
            ? Image.network(
                fotoUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                errorBuilder: (_, __, ___) => _asset(size),
              )
            : _asset(size),
      ),
    );
  }

  Widget _asset(double size) => Image.asset(
        'assets/img/eric.jpg',
        width: size,
        height: size,
        fit: BoxFit.cover,
        alignment: Alignment.topCenter,
        errorBuilder: (_, __, ___) => Container(
          width: size,
          height: size,
          color: AppColors.ink,
          alignment: Alignment.center,
          child: const Icon(Icons.person, color: AppColors.lime, size: 28),
        ),
      );
}

/// Card de citação: #242424, borda lime, radius 8, texto italic lime em 2 linhas.
class _QuoteCard extends StatelessWidget {
  const _QuoteCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      radius: AppSpacing.radiusSmall,
      borderColor: AppColors.lime,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 94),
        child: Center(
          child: Text(
            '“Menos desculpa, mais suor. A consistência\nde hoje é a vitória de amanhã.”',
            textAlign: TextAlign.center,
            style: AppText.custom(
              size: 15,
              weight: FontWeight.w500,
              color: AppColors.lime,
              fontStyle: FontStyle.italic,
              height: 1.4,
            ),
          ),
        ),
      ),
    );
  }
}
