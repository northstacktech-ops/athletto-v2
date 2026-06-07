import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/api.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/app_text_field.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import 'cpf_screen.dart' show AuthScaffold, AuthErrorBox;
import 'home_shell.dart';

/// Criar senha (primeiro acesso) / redefinir senha.
/// O backend exige um código de 6 dígitos além da senha.
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
  final _senhaController = TextEditingController();
  final _confirmarController = TextEditingController();
  bool _loading = false;
  bool _aceitoTermos = false;
  String? _erro;

  @override
  void dispose() {
    _codigoController.dispose();
    _senhaController.dispose();
    _confirmarController.dispose();
    super.dispose();
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
      await Api.instance.definirSenha(
        cpf: widget.cpf,
        clubeId: widget.clubeId,
        codigo: _codigoController.text.trim(),
        senha: _senhaController.text,
      );

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
                  const TextSpan(text: '. Use o código enviado pelo gestor.'),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
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
