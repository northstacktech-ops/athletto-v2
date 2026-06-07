import 'package:flutter/material.dart';

import '../models/clube.dart';
import '../theme/app_theme.dart';
import '../widgets/app_avatar.dart';
import '../widgets/pressable.dart';
import 'cpf_screen.dart' show AuthScaffold;
import 'primeiro_acesso_screen.dart';
import 'senha_screen.dart';

/// Buscar Clube 02 — seleção de clube quando o CPF está em mais de um.
class SelecionarClubeScreen extends StatelessWidget {
  final String cpf;
  final List<ClubeAtleta> clubes;

  const SelecionarClubeScreen({
    super.key,
    required this.cpf,
    required this.clubes,
  });

  void _selecionar(BuildContext context, ClubeAtleta clube) {
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
      heroFraction: 0.30,
      sheet: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.directions_run, color: AppColors.lime, size: 30),
              const SizedBox(width: 8),
              Text('Atleta encontrado', style: AppText.h1),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            'Qual clube você deseja acessar?',
            textAlign: TextAlign.center,
            style: AppText.custom(size: 14, color: AppColors.white),
          ),
          const SizedBox(height: 32),
          ...clubes.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: _ClubeCard(clube: c, onTap: () => _selecionar(context, c)),
              )),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: Pressable(
              onTap: () => Navigator.of(context).maybePop(),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.arrow_back, color: AppColors.white, size: 20),
                  const SizedBox(width: 8),
                  Text('Voltar',
                      style: AppText.custom(size: 14, color: AppColors.white)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClubeCard extends StatelessWidget {
  final ClubeAtleta clube;
  final VoidCallback onTap;

  const _ClubeCard({required this.clube, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            AppAvatar(nome: clube.nome, imageUrl: clube.logoUrl, size: 47),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    clube.nome,
                    style: AppText.custom(
                        size: 14, weight: FontWeight.w700, height: 1.3),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    clube.senhaDefinida ? 'Acessar conta' : 'Primeiro acesso',
                    style: AppText.custom(size: 10, color: AppColors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.keyboard_double_arrow_right,
                color: AppColors.lime, size: 24),
          ],
        ),
      ),
    );
  }
}
