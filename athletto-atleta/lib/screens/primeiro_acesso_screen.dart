import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/api.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/app_text_field.dart';
import '../widgets/formatters.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import 'cpf_screen.dart' show AuthScaffold, AuthErrorBox;
import 'home_shell.dart';

/// Criar senha (primeiro acesso) / redefinir senha.
///
/// Primeiro acesso: CPF + data de nascimento provam quem é o atleta (ambos
/// já cadastrados pelo gestor) — sem depender de um código gerado por ele.
/// Reset de senha continua exigindo o código de 6 dígitos do gestor.
class PrimeiroAcessoScreen extends StatefulWidget {
  final String cpf;
  final String clubeId;
  final String clubeNome;
  final String? clubeLogoUrl;
  final bool modoReset;

  const PrimeiroAcessoScreen({
    super.key,
    required this.cpf,
    required this.clubeId,
    required this.clubeNome,
    this.clubeLogoUrl,
    this.modoReset = false,
  });

  @override
  State<PrimeiroAcessoScreen> createState() => _PrimeiroAcessoScreenState();
}

class _PrimeiroAcessoScreenState extends State<PrimeiroAcessoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codigoController = TextEditingController();
  final _dataNascimentoController = TextEditingController();
  final _senhaController = TextEditingController();
  final _confirmarController = TextEditingController();
  bool _loading = false;
  bool _aceitoTermos = false;
  String? _erro;

  @override
  void dispose() {
    _codigoController.dispose();
    _dataNascimentoController.dispose();
    _senhaController.dispose();
    _confirmarController.dispose();
    super.dispose();
  }

  /// Converte "DD/MM/AAAA" pro formato que a API espera ("AAAA-MM-DD").
  /// Retorna null se a data não for válida (formato ou data inexistente).
  String? _dataNascimentoIso() {
    final texto = _dataNascimentoController.text.trim();
    final match = RegExp(r'^(\d{2})/(\d{2})/(\d{4})$').firstMatch(texto);
    if (match == null) return null;
    final dia = int.parse(match.group(1)!);
    final mes = int.parse(match.group(2)!);
    final ano = int.parse(match.group(3)!);
    final data = DateTime(ano, mes, dia);
    // DateTime "normaliza" datas inválidas (ex.: 31/02 vira 03/03) — se não
    // bater com o que foi digitado, a data não existe de verdade.
    if (data.year != ano || data.month != mes || data.day != dia) return null;
    if (data.isAfter(DateTime.now())) return null;
    final mm = mes.toString().padLeft(2, '0');
    final dd = dia.toString().padLeft(2, '0');
    return '$ano-$mm-$dd';
  }

  String _device() {
    try {
      if (kIsWeb) return 'web';
      return Platform.operatingSystem;
    } catch (_) {
      return 'mobile';
    }
  }

  Future<void> _confirmar() async {
    setState(() => _erro = null);
    if (!_formKey.currentState!.validate()) return;
    if (!_aceitoTermos) {
      setState(() => _erro =
          'Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    setState(() => _loading = true);
    try {
      if (widget.modoReset) {
        await Api.instance.definirSenha(
          cpf: widget.cpf,
          clubeId: widget.clubeId,
          codigo: _codigoController.text.trim(),
          senha: _senhaController.text,
        );
      } else {
        await Api.instance.primeiroAcesso(
          cpf: widget.cpf,
          clubeId: widget.clubeId,
          dataNascimento: _dataNascimentoIso()!,
          senha: _senhaController.text,
        );
      }

      // Tenta logar direto com a nova senha.
      try {
        final result = await Api.instance.login(
          cpf: widget.cpf,
          clubeId: widget.clubeId,
          senha: _senhaController.text,
          device: _device(),
        );
        final sessao = Sessao(
          clubeId: widget.clubeId,
          token: result.token,
          atleta: result.atleta,
          clube: result.clube,
        );
        await SessionStore.instance.salvarSessao(sessao);
        await SessionStore.instance.salvarCpf(widget.cpf);
        // Registra o consentimento (LGPD) — best-effort, não bloqueia o acesso.
        try {
          await Api.instance.registrarConsentimento(result.token);
        } catch (_) {/* ignora falha de registro de consentimento */}
        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => HomeShell(sessao: sessao)),
          (route) => false,
        );
        return;
      } on ApiException {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Senha definida! Faça login para entrar.'),
          ),
        );
        Navigator.of(context).pop();
        return;
      }
    } on ApiException catch (e) {
      setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final titulo = widget.modoReset ? 'Redefinir senha' : 'Crie sua senha';
    final acao = widget.modoReset ? 'Redefinir senha' : 'Criar senha';
    final nome = widget.clubeNome.isEmpty ? 'seu clube' : widget.clubeNome;

    return AuthScaffold(
      heroFraction: 0.24,
      sheet: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock, color: AppColors.lime, size: 26),
                const SizedBox(width: 8),
                Text(titulo,
                    style: AppText.custom(size: 22, weight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 12),
            Text.rich(
              TextSpan(
                style: AppText.custom(
                    size: 14, color: AppColors.white, height: 1.43),
                children: [
                  TextSpan(
                      text: widget.modoReset
                          ? 'Defina uma nova senha para o '
                          : 'Primeiro acesso ao '),
                  TextSpan(
                      text: nome,
                      style: const TextStyle(
                          color: AppColors.lime, fontWeight: FontWeight.w600)),
                  TextSpan(
                      text: widget.modoReset
                          ? '. Use o código enviado pelo gestor.'
                          : '. Confirme sua data de nascimento pra continuar.'),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            if (widget.modoReset)
              AppTextField(
                controller: _codigoController,
                label: 'Código de acesso (6 dígitos)',
                hint: '000000',
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                validator: (v) {
                  if ((v ?? '').trim().length != 6) {
                    return 'O código tem 6 dígitos.';
                  }
                  return null;
                },
              )
            else
              AppTextField(
                controller: _dataNascimentoController,
                label: 'Data de nascimento',
                hint: 'DD/MM/AAAA',
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(8),
                  const DataInputFormatter(),
                ],
                validator: (v) {
                  if ((v ?? '').trim().length != 10) {
                    return 'Informe o dia, mês e ano.';
                  }
                  if (_dataNascimentoIso() == null) {
                    return 'Data inválida.';
                  }
                  return null;
                },
              ),
            const SizedBox(height: 16),
            PasswordField(
              controller: _senhaController,
              label: 'Nova senha',
              hint: 'Mínimo de 8 caracteres',
              validator: (v) {
                if ((v ?? '').length < 8) {
                  return 'A senha deve ter no mínimo 8 caracteres.';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            PasswordField(
              controller: _confirmarController,
              label: 'Confirmar senha',
              hint: 'Repita a senha',
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _confirmar(),
              validator: (v) {
                if (v != _senhaController.text) {
                  return 'As senhas não conferem.';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: _aceitoTermos,
                    onChanged: (v) =>
                        setState(() => _aceitoTermos = v ?? false),
                    activeColor: AppColors.lime,
                    checkColor: AppColors.ink,
                    side: const BorderSide(color: AppColors.border),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Li e aceito os Termos de Uso e a Política de Privacidade.',
                    style: AppText.custom(
                        size: 13, color: AppColors.white, height: 1.4),
                  ),
                ),
              ],
            ),
            if (_erro != null) ...[
              const SizedBox(height: 16),
              AuthErrorBox(mensagem: _erro!),
            ],
            const SizedBox(height: 24),
            PrimaryButton(
              label: acao,
              loading: _loading,
              trailingIcon: Icons.keyboard_double_arrow_right,
              onPressed: _confirmar,
            ),
            const SizedBox(height: 22),
            Center(
              child: Pressable(
                onTap: () => Navigator.of(context).maybePop(),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.arrow_back,
                        color: AppColors.white, size: 20),
                    const SizedBox(width: 8),
                    Text('Voltar',
                        style:
                            AppText.custom(size: 14, color: AppColors.white)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
