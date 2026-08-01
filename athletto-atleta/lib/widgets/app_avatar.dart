import 'package:flutter/material.dart';

/// Avatar circular: mostra a foto se houver URL válida, senão as iniciais.
class AppAvatar extends StatelessWidget {
  final String nome;
  final String? imageUrl;
  final double size;

  const AppAvatar({
    super.key,
    required this.nome,
    this.imageUrl,
    this.size = 48,
  });

  String get _iniciais {
    final partes =
        nome.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (partes.isEmpty) return '?';
    if (partes.length == 1) {
      return partes.first.substring(0, 1).toUpperCase();
    }
    return (partes.first.substring(0, 1) + partes.last.substring(0, 1))
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasImage = imageUrl != null && imageUrl!.trim().isNotEmpty;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.12),
        shape: BoxShape.circle,
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: hasImage
          ? Image.network(
              imageUrl!,
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _initialsWidget(theme),
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return _initialsWidget(theme);
              },
            )
          : _initialsWidget(theme),
    );
  }

  Widget _initialsWidget(ThemeData theme) {
    return Text(
      _iniciais,
      style: TextStyle(
        color: theme.colorScheme.primary,
        fontWeight: FontWeight.bold,
        fontSize: size * 0.38,
      ),
    );
  }
}
