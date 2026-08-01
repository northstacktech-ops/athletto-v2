import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'primary_button.dart';

/// Indicador de carregamento centralizado (lime sobre ink).
class LoadingView extends StatelessWidget {
  final String? mensagem;
  const LoadingView({super.key, this.mensagem});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.lime),
          if (mensagem != null) ...[
            const SizedBox(height: 16),
            Text(mensagem!, style: AppText.bodyMuted),
          ],
        ],
      ),
    );
  }
}

/// Estado vazio com ícone e mensagem.
class EmptyView extends StatelessWidget {
  final IconData icon;
  final String titulo;
  final String? subtitulo;
  final Widget? action;

  const EmptyView({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.titulo,
    this.subtitulo,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: const Color(0xFF3A3A3A)),
            const SizedBox(height: 14),
            Text(titulo,
                textAlign: TextAlign.center,
                style: AppText.custom(
                    size: 14,
                    weight: FontWeight.w600,
                    color: AppColors.muted)),
            if (subtitulo != null) ...[
              const SizedBox(height: 8),
              Text(subtitulo!,
                  textAlign: TextAlign.center,
                  style: AppText.custom(size: 13, color: AppColors.faint)),
            ],
            if (action != null) ...[
              const SizedBox(height: 20),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Estado de erro com botão de tentar novamente.
class ErrorView extends StatelessWidget {
  final String mensagem;
  final VoidCallback? onRetry;

  const ErrorView({super.key, required this.mensagem, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: 16),
            Text(mensagem,
                textAlign: TextAlign.center, style: AppText.body),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: 200,
                child: PrimaryButton(
                  label: 'Tentar novamente',
                  leadingIcon: Icons.refresh,
                  onPressed: onRetry,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
