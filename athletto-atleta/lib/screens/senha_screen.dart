import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../services/api.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/app_avatar.dart';
import '../widgets/app_text_field.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import 'cpf_screen.dart' show AuthScaffold, AuthErrorBox;
import 'home_shell.dart';
import 'primeiro_acesso_screen.dart';
import 'reset_enviado_screen.dart';

/// Login do atleta que já tem senha definida.
class SenhaScreen extends StatefulWidget {
  final String cpf;
  final String clubeId;
  final String clubeNome;
  final String? clubeLogoUrl;

  const SenhaScreen({
    super.key,
    required this.cpf,
    required this.clubeId,
    required this.clubeNome,
    this.clubeLogoUrl,
  });

  @override
  State<SenhaScreen> createState() => _SenhaScreenState();
}

class _SenhaScreenState extends State<SenhaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _senhaController = TextEditingController();
  bool _loading = false;
  String? _erro;

  @override
  void dispose() {
    _senhaController.dispose();
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

  Future<void> _entrar() async {
    setState(() => _erro = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
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

      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => HomeShell(sessao: sessao)),
        (route) => false,
      );
    } on ApiException catch (e) {
      // Se a senha ainda não foi definida, oferece o primeiro acesso.
      if (e.codigo == 'senha_nao_definida') {
        if (!mounted) return;
        Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => PrimeiroAcessoScreen(
            cpf: widget.cpf,
            clubeId: widget.clubeId,
            clubeNome: widget.clubeNome,
            clubeLogoUrl: widget.clubeLogoUrl,
          ),
        ));
        return;
      }
      setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _esqueciSenha() {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ResetEnviadoScreen(clubeNome: widget.clubeNome),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final nome = widget.clubeNome.isEmpty ? 'seu clube' : widget.clubeNome;
    return AuthScaffold(
      heroFraction: 0.30,
      sheet: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: AppAvatar(
                nome: widget.clubeNome,
                imageUrl: widget.clubeLogoUrl,
                size: 56,
              ),
            ),
            const SizedBox(height: 14),
            Text('Bem-vindo de volta',
                textAlign: TextAlign.center,
                style: AppText.custom(size: 22, weight: FontWeight.w700)),
            const SizedBox(height: 10),
            Text.rich(
              TextSpan(
                style: AppText.custom(
                    size: 14, color: AppColors.white, height: 1.43),
                children: [
                  const TextSpan(text: 'Digite sua senha para acessar o '),
                  TextSpan(
                      text: nome,
                      style: const TextStyle(
                          color: AppColors.lime, fontWeight: FontWeight.w600)),
                ],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 26),
            PasswordField(
              controller: _senhaController,
              label: 'Senha',
              hint: 'Sua senha',
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _entrar(),
              validator: (v) {
                if ((v ?? '').isEmpty) return 'Informe sua senha.';
                return null;
              },
            ),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: Pressable(
                onTap: _esqueciSenha,
                child: Text('Esqueci minha senha',
                    style: AppText.custom(
                        size: 13,
                        weight: FontWeight.w600,
                        color: AppColors.lime)),
              ),
            ),
            if (_erro != null) ...[
              const SizedBox(height: 12),
              AuthErrorBox(mensagem: _erro!),
            ],
            const SizedBox(height: 18),
            PrimaryButton(
              label: 'Entrar',
              loading: _loading,
              trailingIcon: Icons.keyboard_double_arrow_right,
              onPressed: _entrar,
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
                    Text('Trocar de clube',
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
