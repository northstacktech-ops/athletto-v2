import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'pressable.dart';

/// Botão primário do protótipo: preenchimento lime achatado (sem sombra,
/// sem gradiente), texto ink, peso 700. Suporta ícone à esquerda e/ou à
/// direita. Altura padrão 50px (use [height] = 44 para CTAs inline de card).
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? leadingIcon;
  final IconData? trailingIcon;

  /// Alias legado para [leadingIcon].
  final IconData? icon;
  final double height;
  final double fontSize;

  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.leadingIcon,
    this.trailingIcon,
    this.icon,
    this.height = AppSpacing.buttonHeight,
    this.fontSize = 15,
  });

  @override
  Widget build(BuildContext context) {
    final lead = leadingIcon ?? icon;
    final disabled = onPressed == null || loading;
    return Pressable(
      onTap: disabled ? null : onPressed,
      child: Opacity(
        opacity: disabled ? 0.6 : 1,
        child: Container(
          height: height,
          decoration: BoxDecoration(
            color: AppColors.lime,
            borderRadius: BorderRadius.circular(AppSpacing.radiusInput),
          ),
          alignment: Alignment.center,
          child: loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2.4, color: AppColors.ink),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (lead != null) ...[
                      Icon(lead, size: 20, color: AppColors.ink),
                      const SizedBox(width: 8),
                    ],
                    Flexible(
                      child: Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.custom(
                            size: fontSize,
                            weight: FontWeight.w700,
                            color: AppColors.ink),
                      ),
                    ),
                    if (trailingIcon != null) ...[
                      const SizedBox(width: 6),
                      Icon(trailingIcon, size: 20, color: AppColors.ink),
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}

/// Botão secundário com contorno (transparente + borda). Usado em
/// "Abrir no app do banco", "Ver comprovante", etc.
class OutlineButtonA extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? leadingIcon;
  final Color borderColor;
  final Color textColor;
  final double height;
  final double fontSize;

  const OutlineButtonA({
    super.key,
    required this.label,
    required this.onPressed,
    this.leadingIcon,
    this.borderColor = AppColors.border,
    this.textColor = AppColors.white,
    this.height = AppSpacing.buttonHeight,
    this.fontSize = 15,
  });

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onPressed,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: Colors.transparent,
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(AppSpacing.radiusInput),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (leadingIcon != null) ...[
              Icon(leadingIcon, size: 20, color: textColor),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.custom(
                    size: fontSize, weight: FontWeight.w700, color: textColor),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
