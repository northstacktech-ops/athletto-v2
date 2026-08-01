import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/clube.dart';
import '../services/api.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/app_text_field.dart';
import '../widgets/formatters.dart';
import '../widgets/primary_button.dart';
import 'primeiro_acesso_screen.dart';
import 'selecionar_clube_screen.dart';
import 'senha_screen.dart';

/// Buscar Clube 01 — entrada do CPF.
/// Painel lime no topo (com a foto do corredor) + sheet escuro embaixo.
class CpfScreen extends StatefulWidget {
  const CpfScreen({super.key});

  @override
  State<CpfScreen> createState() => _CpfScreenState();
}

class _CpfScreenState extends State<CpfScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cpfController = TextEditingController();
  bool _loading = false;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _preencherCpfSalvo();
  }

  Future<void> _preencherCpfSalvo() async {
    final cpf = await SessionStore.instance.lerCpf();
    if (cpf != null && cpf.length == 11 && mounted) {
      _cpfController.value = const CpfInputFormatter().formatEditUpdate(
        TextEditingValue.empty,
        TextEditingValue(text: cpf),
      );
    }
  }

  @override
  void dispose() {
    _cpfController.dispose();
    super.dispose();
  }

  Future<void> _continuar() async {
    setState(() => _erro = null);
    if (!_formKey.currentState!.validate()) return;

    final cpf = Fmt.somenteDigitos(_cpfController.text);
    setState(() => _loading = true);
    try {
      final clubes = await Api.instance.consultarCpf(cpf);
      await SessionStore.instance.salvarCpf(cpf);
      if (!mounted) return;

      if (clubes.isEmpty) {
        setState(() => _erro = 'CPF não localizado. Fale com o seu clube.');
        return;
      }

      if (clubes.length == 1) {
        _irParaClube(cpf, clubes.first);
      } else {
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => SelecionarClubeScreen(cpf: cpf, clubes: clubes),
        ));
      }
    } on ApiException catch (e) {
      setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _irParaClube(String cpf, ClubeAtleta clube) {
    if (!clube.senhaDefinida) {
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => PrimeiroAcessoScreen(
          cpf: cpf,
          clubeId: clube.clubeId,
          clubeNome: clube.nome,
          clubeLogoUrl: clube.logoUrl,
        ),
      ));
    } else {
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => SenhaScreen(
          cpf: cpf,
          clubeId: clube.clubeId,
          clubeNome: clube.nome,
          clubeLogoUrl: clube.logoUrl,
        ),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      heroFraction: 0.50,
      sheet: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text.rich(
              TextSpan(
                style: AppText.h1Small,
                children: const [
                  TextSpan(text: 'Bem-vindo(a) ao '),
                  TextSpan(
                      text: 'Athletto',
                      style: TextStyle(color: AppColors.lime)),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Digite seu CPF para que possamos buscar seus clubes',
              textAlign: TextAlign.center,
              style: AppText.custom(
                  size: 14, color: AppColors.white, height: 1.43),
            ),
            const SizedBox(height: 34),
            AppTextField(
              controller: _cpfController,
              label: 'CPF do atleta',
              hint: 'Digite seu CPF',
              keyboardType: TextInputType.number,
              inputFormatters: const [CpfInputFormatter()],
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _continuar(),
              validator: (v) {
                final digits = Fmt.somenteDigitos(v ?? '');
                if (digits.length != 11) {
                  return 'Digite os 11 dígitos do CPF.';
                }
                return null;
              },
            ),
            if (_erro != null) ...[
              const SizedBox(height: 16),
              AuthErrorBox(mensagem: _erro!),
            ],
            const SizedBox(height: 22),
            PrimaryButton(
              label: 'Buscar',
              loading: _loading,
              trailingIcon: Icons.keyboard_double_arrow_right,
              onPressed: _continuar,
            ),
          ],
        ),
      ),
    );
  }
}

/// Estrutura compartilhada das telas de autenticação: painel lime com a foto
/// do corredor no topo e uma "sheet" escura com cantos superiores
/// arredondados (12) embaixo. A sheet rola quando o teclado abre.
class AuthScaffold extends StatelessWidget {
  final Widget sheet;
  final double heroFraction;

  const AuthScaffold({
    super.key,
    required this.sheet,
    this.heroFraction = 0.36,
  });

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: AppColors.lime,
        body: LayoutBuilder(
          builder: (context, constraints) {
            final heroH = constraints.maxHeight * heroFraction;
            final sheetMin = constraints.maxHeight - heroH;
            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: heroH,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        const ColoredBox(color: AppColors.lime),
                        Padding(
                          padding: EdgeInsets.only(top: topInset + 8),
                          child: Image.asset(
                            'assets/img/hero-runner.png',
                            fit: BoxFit.cover,
                            alignment: Alignment.topCenter,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ConstrainedBox(
                    constraints: BoxConstraints(minHeight: sheetMin),
                    child: Container(
                      decoration: const BoxDecoration(
                        color: AppColors.ink,
                        borderRadius:
                            BorderRadius.vertical(top: Radius.circular(12)),
                      ),
                      padding: EdgeInsets.fromLTRB(35, 44, 35, 48 + bottomInset),
                      child: sheet,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Caixa de erro em vermelho usada nas telas de autenticação.
class AuthErrorBox extends StatelessWidget {
  final String mensagem;
  const AuthErrorBox({super.key, required this.mensagem});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.dangerTint,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.dangerText.withOpacity(0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error, color: AppColors.dangerText, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              mensagem,
              style: AppText.custom(
                  size: 13, color: AppColors.dangerText, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
