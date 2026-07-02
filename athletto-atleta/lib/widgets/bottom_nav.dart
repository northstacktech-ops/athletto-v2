import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'pressable.dart';

/// Item da navegação inferior.
class NavItem {
  final String id;
  final String label;
  final IconData icon;
  const NavItem(this.id, this.label, this.icon);
}

const List<NavItem> kNavItems = [
  NavItem('home', 'Início', Icons.home),
  NavItem('agenda', 'Agenda', Icons.calendar_today),
  NavItem('financeiro', 'Financeiro', Icons.payments),
  NavItem('alertas', 'Alertas', Icons.error),
  NavItem('perfil', 'Perfil', Icons.person),
];

/// Navegação inferior do protótipo: barra #1A1A1A, cantos superiores
/// arredondados (12), item ativo em lime, inativos em #676D75, labels Poppins.
class AthlettoBottomNav extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int> onSelect;

  const AthlettoBottomNav({
    super.key,
    required this.activeIndex,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      padding: EdgeInsets.fromLTRB(12, 12, 12, 12 + bottomInset),
      child: Row(
        children: [
          for (int i = 0; i < kNavItems.length; i++)
            Expanded(
              child: Pressable(
                onTap: () => onSelect(i),
                child: _NavCell(item: kNavItems[i], active: i == activeIndex),
              ),
            ),
        ],
      ),
    );
  }
}

class _NavCell extends StatelessWidget {
  final NavItem item;
  final bool active;
  const _NavCell({required this.item, required this.active});

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.lime : AppColors.faint;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(item.icon, size: 24, color: color),
        const SizedBox(height: 6),
        Text(item.label, style: AppText.navLabel(color)),
      ],
    );
  }
}
