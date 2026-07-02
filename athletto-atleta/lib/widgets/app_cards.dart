import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'pressable.dart';

/// Container base de card: #242424, radius configurável (16 por padrão),
/// padding 16. Pode receber borda lime, sombra inset vermelha (cobrança
/// vencida) e opacidade.
class AppCard extends StatelessWidget {
  final Widget child;
  final double radius;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;
  final double opacity;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.child,
    this.radius = AppSpacing.radiusCard,
    this.padding = const EdgeInsets.all(AppSpacing.card),
    this.borderColor,
    this.opacity = 1,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(radius),
        border: borderColor != null ? Border.all(color: borderColor!) : null,
      ),
      child: child,
    );
    if (opacity < 1) content = Opacity(opacity: opacity, child: content);
    if (onTap != null) {
      content = Pressable(onTap: onTap, child: content);
    }
    return content;
  }
}

/// Cabeçalho de seção: ícone lime + título branco 16/700.
class SectionHeading extends StatelessWidget {
  final IconData icon;
  final String title;
  const SectionHeading({super.key, required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.lime),
        const SizedBox(width: 6),
        Text(title, style: AppText.sectionHeading),
      ],
    );
  }
}

/// Eyebrow (rótulo maiúsculo) usado nos SectionCard do Perfil/Alertas.
class Eyebrow extends StatelessWidget {
  final String text;
  const Eyebrow(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(),
        style: AppText.eyebrow.copyWith(letterSpacing: 0.5));
  }
}

/// Card de estatística 2×2 da Home (ícone + título + sub).
class StatCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.icon,
    required this.title,
    required this.sub,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.lime),
              const SizedBox(width: 6),
              Flexible(
                child: Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.cardTitle14),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(sub,
              style: AppText.custom(
                  size: 12, weight: FontWeight.w500, color: AppColors.muted)),
        ],
      ),
    );
  }
}

/// Card de evento (Home/Agenda): ícone schedule lime + título + bullet/data.
class EventCard extends StatelessWidget {
  final String title;
  final String date;
  final IconData icon;

  const EventCard({
    super.key,
    required this.title,
    required this.date,
    this.icon = Icons.schedule,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      radius: AppSpacing.radiusSmall,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.lime),
              const SizedBox(width: 6),
              Expanded(child: Text(title, style: AppText.cardTitle14)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const SizedBox(width: 4),
              Container(
                width: 4,
                height: 4,
                decoration: const BoxDecoration(
                    color: AppColors.white, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(date,
                  style: AppText.custom(size: 12, color: AppColors.white)),
            ],
          ),
        ],
      ),
    );
  }
}

/// Bloco de seção do Perfil: eyebrow + card com padding "2px 18px".
class SectionCard extends StatelessWidget {
  final String? title;
  final Widget child;
  const SectionCard({super.key, this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Padding(
            padding: const EdgeInsets.only(left: 2, bottom: 8),
            child: Eyebrow(title!),
          ),
        ],
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 2),
          child: child,
        ),
      ],
    );
  }
}

/// Chip de ícone circular tingido (usado em Alertas, Perfil, resumo Financeiro).
class IconChip extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color tint;
  final double size;
  final double iconSize;

  const IconChip({
    super.key,
    required this.icon,
    required this.color,
    required this.tint,
    this.size = 42,
    this.iconSize = 22,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: tint, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Icon(icon, size: iconSize, color: color),
    );
  }
}
