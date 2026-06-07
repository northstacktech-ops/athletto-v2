import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';

/// Informa que a solicitação de redefinição de senha foi enviada e que o
/// gestor do clube precisa liberar. "Entendi" volta para a tela de login.
class ResetEnviadoScreen extends StatelessWidget {
  final String clubeNome;

  const ResetEnviadoScreen({super.key, required this.clubeNome});

  @override
  Widget build(BuildContext context) {
    final nome = clubeNome.isEmpty ? 'seu clube' : clubeNome;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.ink,
        body: SafeArea(
          child: Stack(
            children: [
              Positioned(
                top: 8,
                left: 8,
                child: Pressable(
                  onTap: () => Navigator.of(context).pop(),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.arrow_back, color: AppColors.white),
                  ),
                ),
              ),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 36),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Container(
                          width: 92,
                          height: 92,
                          decoration: const BoxDecoration(
                            color: AppColors.limeTint,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: const Icon(Icons.lock_reset,
                              color: AppColors.lime, size: 48),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text('Solicitação enviada',
                          textAlign: TextAlign.center,
                          style: AppText.custom(
                              size: 24, weight: FontWeight.w700)),
                      const SizedBox(height: 16),
                      Text.rich(
                        TextSpan(
                          style: AppText.custom(
                              size: 15,
                              color: AppColors.muted,
                              height: 1.55),
                          children: [
                            const TextSpan(
                                text:
                                    'Avisamos o gestor do '),
                            TextSpan(
                                text: nome,
                                style: const TextStyle(
                                    color: AppColors.lime,
                                    fontWeight: FontWeight.w600)),
                            const TextSpan(
                                text: ' para redefinir sua senha.'),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          border: Border.all(color: AppColors.lime),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.error,
                                color: AppColors.lime, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Assim que o gestor liberar, você receberá um '
                                'aviso no app para criar uma nova senha e acessar.',
                                style: AppText.custom(
                                    size: 13,
                                    color: AppColors.white,
                                    height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      PrimaryButton(
                        label: 'Entendi',
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
