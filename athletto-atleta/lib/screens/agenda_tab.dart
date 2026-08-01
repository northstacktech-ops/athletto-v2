import 'package:flutter/material.dart';

import '../models/evento.dart';
import '../services/api.dart';
import '../theme/app_theme.dart';
import '../widgets/app_cards.dart';
import '../widgets/formatters.dart';
import '../widgets/pressable.dart';
import '../widgets/state_views.dart';
import 'home_shell.dart';

const _meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/// Abreviações começando no domingo (índice = weekday % 7).
const _diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/// Agenda (aba) — replica o protótipo: seletor de mês, faixa de semana
/// navegável e lista de eventos do dia selecionado.
class AgendaTab extends StatefulWidget {
  const AgendaTab({super.key});

  @override
  State<AgendaTab> createState() => _AgendaTabState();
}

class _AgendaTabState extends State<AgendaTab> {
  bool _loading = true;
  String? _erro;
  List<Evento> _eventos = [];

  late DateTime _weekStart; // domingo da semana exibida
  int _activeIndex = 0; // célula selecionada (0-6)
  bool _pickerOpen = false;

  @override
  void initState() {
    super.initState();
    final hoje = _dateOnly(DateTime.now());
    final offset = hoje.weekday % 7; // domingo = 0
    _weekStart = hoje.subtract(Duration(days: offset));
    _activeIndex = offset;
    WidgetsBinding.instance.addPostFrameCallback((_) => _carregar());
  }

  Future<void> _carregar() async {
    final token = SessaoProvider.of(context).token;
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      final eventos = await Api.instance.agenda(token);
      if (!mounted) return;
      setState(() {
        _eventos = eventos;
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

  static DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

  DateTime get _selected => _weekStart.add(Duration(days: _activeIndex));

  bool get _selectedIsToday {
    final hoje = _dateOnly(DateTime.now());
    return _selected == hoje;
  }

  void _shiftWeek(int dir) {
    setState(() {
      _weekStart = _weekStart.add(Duration(days: 7 * dir));
      _pickerOpen = false;
    });
  }

  void _pickMonth(int mes) {
    final ano = _selected.year;
    final primeiro = DateTime(ano, mes + 1, 1);
    final offset = primeiro.weekday % 7;
    setState(() {
      _weekStart = primeiro.subtract(Duration(days: offset));
      _activeIndex = offset;
      _pickerOpen = false;
    });
  }

  List<Evento> get _eventosDoDia {
    final dia = _selected;
    final lista = _eventos
        .where((e) =>
            e.dataInicio != null && _dateOnly(e.dataInicio!) == dia)
        .toList()
      ..sort((a, b) => a.dataInicio!.compareTo(b.dataInicio!));
    return lista;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              children: [
                _cabecalhoMes(),
                _faixaSemana(),
                Expanded(child: _corpo()),
              ],
            ),
            if (_pickerOpen) _popoverMes(),
          ],
        ),
      ),
    );
  }

  // --- Título do mês -------------------------------------------------------

  Widget _cabecalhoMes() {
    final mes = _meses[_selected.month - 1];
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Center(
        child: Pressable(
          onTap: () => setState(() => _pickerOpen = !_pickerOpen),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.calendar_today, size: 20, color: AppColors.lime),
              const SizedBox(width: 6),
              Text(mes,
                  style: AppText.custom(
                      size: 20,
                      weight: FontWeight.w700,
                      color: AppColors.white)),
              const SizedBox(width: 6),
              Icon(
                _pickerOpen
                    ? Icons.keyboard_arrow_up
                    : Icons.keyboard_arrow_down,
                size: 20,
                color: AppColors.lime,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _popoverMes() {
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() => _pickerOpen = false),
        behavior: HitTestBehavior.opaque,
        child: Stack(
          children: [
            Positioned(
              top: 56,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 210,
                  constraints: const BoxConstraints(maxHeight: 256),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  padding: const EdgeInsets.all(6),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        for (int i = 0; i < _meses.length; i++)
                          _itemMes(i),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _itemMes(int i) {
    final atual = i == _selected.month - 1;
    return Pressable(
      onTap: () => _pickMonth(i),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: atual ? AppColors.limeTint : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                _meses[i],
                style: AppText.custom(
                  size: 14,
                  weight: atual ? FontWeight.w700 : FontWeight.w500,
                  color: atual ? AppColors.lime : AppColors.white,
                ),
              ),
            ),
            if (atual)
              const Icon(Icons.check, size: 18, color: AppColors.lime),
          ],
        ),
      ),
    );
  }

  // --- Faixa de semana -----------------------------------------------------

  Widget _faixaSemana() {
    final dias = List.generate(7, (i) => _weekStart.add(Duration(days: i)));
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
      child: Row(
        children: [
          Pressable(
            onTap: () => _shiftWeek(-1),
            child: const Icon(Icons.keyboard_double_arrow_left,
                size: 24, color: AppColors.lime),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (int i = 0; i < 7; i++) _celulaDia(dias[i], i),
                ],
              ),
            ),
          ),
          Pressable(
            onTap: () => _shiftWeek(1),
            child: const Icon(Icons.keyboard_double_arrow_right,
                size: 24, color: AppColors.lime),
          ),
        ],
      ),
    );
  }

  Widget _celulaDia(DateTime dia, int i) {
    final ativo = i == _activeIndex;
    final cor = ativo ? AppColors.lime : AppColors.gray;
    return Pressable(
      onTap: () => setState(() => _activeIndex = i),
      child: SizedBox(
        width: 28,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${dia.day}',
              style: AppText.custom(
                  size: 18,
                  weight: FontWeight.w700,
                  color: cor,
                  letterSpacing: 0.3),
            ),
            const SizedBox(height: 2),
            Text(
              _diasSemana[dia.weekday % 7],
              style: AppText.custom(
                  size: 10, color: cor, letterSpacing: 0.3),
            ),
          ],
        ),
      ),
    );
  }

  // --- Corpo (total + lista) ----------------------------------------------

  Widget _corpo() {
    if (_loading) return const LoadingView();
    if (_erro != null) return ErrorView(mensagem: _erro!, onRetry: _carregar);

    final eventos = _eventosDoDia;
    final rotulo = _selectedIsToday ? 'hoje' : Fmt.dataCompleta(_selected);
    final tituloSecao = _selectedIsToday ? 'Hoje' : Fmt.dataCompleta(_selected);

    return RefreshIndicator(
      onRefresh: _carregar,
      color: AppColors.lime,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.screenH, 28, AppSpacing.screenH, 32),
        children: [
          // Card de total
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_today,
                        size: 16, color: AppColors.lime),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text('Total de eventos $rotulo',
                          style: AppText.cardTitle14),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${eventos.length.toString().padLeft(2, '0')} '
                  '${eventos.length == 1 ? 'evento' : 'eventos'}',
                  style: AppText.custom(
                      size: 12,
                      weight: FontWeight.w500,
                      color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          SectionHeading(icon: Icons.calendar_today, title: tituloSecao),
          const SizedBox(height: 20),
          if (eventos.isEmpty)
            const EmptyView(
              icon: Icons.event_busy_outlined,
              titulo: 'Nenhum evento',
              subtitulo: 'Não há treinos ou eventos neste dia.',
            )
          else
            ...eventos.map((e) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: EventCard(
                    title: e.titulo,
                    date: '${Fmt.dataCompleta(e.dataInicio)} - '
                        '${Fmt.hora(e.dataInicio)}h',
                  ),
                )),
        ],
      ),
    );
  }
}
