import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/atleta.dart';
import '../models/clube.dart';
import '../services/api.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/app_avatar.dart';
import '../widgets/app_cards.dart';
import '../widgets/app_text_field.dart';
import '../widgets/pressable.dart';
import '../widgets/primary_button.dart';
import 'home_shell.dart';

/// Perfil do atleta — replica a tela "Perfil" do protótipo: header lime
/// sangrando até o topo, avatar com anel ink, e seções (clube, dados,
/// preferências, conta). A lógica de TROCAR CLUBE e SAIR é preservada.
class PerfilTab extends StatefulWidget {
  final void Function(Sessao) onTrocarSessao;
  final VoidCallback onSair;

  const PerfilTab({
    super.key,
    required this.onTrocarSessao,
    required this.onSair,
  });

  @override
  State<PerfilTab> createState() => _PerfilTabState();
}

class _PerfilTabState extends State<PerfilTab> {
  // Preferências (carregadas de /preferencias; default true).
  bool _push = true;
  bool _lembretes = true;

  String? _cpf;

  // Foto: URL nova após upload (sobrepõe atleta.fotoUrl, que é imutável aqui).
  String? _fotoOverride;
  bool _uploadingFoto = false;

  bool _prefsCarregadas = false;

  @override
  void initState() {
    super.initState();
    _carregarCpf();
    WidgetsBinding.instance.addPostFrameCallback((_) => _carregarPreferencias());
  }

  Future<void> _carregarCpf() async {
    final cpf = await SessionStore.instance.lerCpf();
    if (!mounted) return;
    setState(() => _cpf = cpf);
  }

  Future<void> _carregarPreferencias() async {
    if (_prefsCarregadas) return;
    _prefsCarregadas = true;
    final token = SessaoProvider.of(context).token;
    try {
      final prefs = await Api.instance.getPreferencias(token);
      if (!mounted) return;
      setState(() {
        _push = prefs['notif_avisos'] ?? true;
        _lembretes = prefs['notif_pagamento'] ?? true;
      });
    } on ApiException {
      // Mantém os defaults (true) silenciosamente.
    }
  }

  // --------------------------------------------------------------------------
  // Preferências (otimista, com rollback em erro)
  // --------------------------------------------------------------------------
  Future<void> _alternarPush(bool valor) async {
    final anterior = _push;
    setState(() => _push = valor);
    final token = SessaoProvider.of(context).token;
    try {
      await Api.instance.setPreferencias(token, notifAvisos: valor);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _push = anterior);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.mensagem)));
    }
  }

  Future<void> _alternarLembretes(bool valor) async {
    final anterior = _lembretes;
    setState(() => _lembretes = valor);
    final token = SessaoProvider.of(context).token;
    try {
      await Api.instance.setPreferencias(token, notifPagamento: valor);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _lembretes = anterior);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.mensagem)));
    }
  }

  // --------------------------------------------------------------------------
  // Foto do perfil: escolher origem → crop 512×512 → upload
  // --------------------------------------------------------------------------
  Future<void> _editarFoto(BuildContext context) async {
    if (_uploadingFoto) return;

    final origem = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.card,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Alterar foto',
                    style: AppText.custom(
                        size: 16,
                        weight: FontWeight.w700,
                        color: AppColors.white)),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera, color: AppColors.lime),
              title: const Text('Tirar foto',
                  style: TextStyle(color: AppColors.white)),
              onTap: () => Navigator.of(ctx).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: AppColors.lime),
              title: const Text('Escolher da galeria',
                  style: TextStyle(color: AppColors.white)),
              onTap: () => Navigator.of(ctx).pop(ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (origem == null || !context.mounted) return;

    try {
      final picker = ImagePicker();
      final XFile? escolhida = await picker.pickImage(source: origem);
      if (escolhida == null) return;

      final cropped = await ImageCropper().cropImage(
        sourcePath: escolhida.path,
        aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
        maxWidth: 512,
        maxHeight: 512,
        compressFormat: ImageCompressFormat.png,
      );
      if (cropped == null) return;

      if (!context.mounted) return;
      setState(() => _uploadingFoto = true);

      final token = SessaoProvider.of(context).token;
      final url = await Api.instance.uploadFoto(token, File(cropped.path));

      if (!context.mounted) return;
      setState(() {
        _fotoOverride = url;
        _uploadingFoto = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto atualizada com sucesso!')),
      );
    } on ApiException catch (e) {
      if (!context.mounted) return;
      setState(() => _uploadingFoto = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.mensagem)));
    } catch (_) {
      if (!context.mounted) return;
      setState(() => _uploadingFoto = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível atualizar a foto.')),
      );
    }
  }

  // --------------------------------------------------------------------------
  // Abrir páginas públicas (LGPD / suporte)
  // --------------------------------------------------------------------------
  Future<void> _abrirUrl(BuildContext context, String caminho) async {
    final uri = Uri.parse('${Config.webBaseUrl}$caminho');
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível abrir o link.')),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível abrir o link.')),
        );
      }
    }
  }

  // --------------------------------------------------------------------------
  // Lógica preservada: trocar clube
  // --------------------------------------------------------------------------
  Future<void> _trocarClube(BuildContext context) async {
    final cpf = await SessionStore.instance.lerCpf();
    if (cpf == null || cpf.isEmpty) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível identificar seu CPF.')),
        );
      }
      return;
    }

    List<ClubeAtleta> clubes;
    try {
      clubes = await Api.instance.consultarCpf(cpf);
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.mensagem)));
      }
      return;
    }
    if (!context.mounted) return;

    final atualId = SessaoProvider.of(context).clubeId;
    final outros = clubes.where((c) => c.clubeId != atualId).toList();
    if (outros.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Você não está vinculado a outros clubes.')),
      );
      return;
    }

    final escolhido = await showModalBottomSheet<ClubeAtleta>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Trocar de clube',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            ...outros.map((c) => ListTile(
                  leading: AppAvatar(nome: c.nome, imageUrl: c.logoUrl, size: 40),
                  title: Text(c.nome),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(ctx).pop(c),
                )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );

    if (escolhido == null || !context.mounted) return;

    final sessaoExistente =
        await SessionStore.instance.lerSessao(escolhido.clubeId);

    Sessao? nova;
    if (sessaoExistente != null && sessaoExistente.token.isNotEmpty) {
      // Já tem sessão salva: tenta validar com /me.
      try {
        final me = await Api.instance.me(sessaoExistente.token);
        nova = sessaoExistente.copyWith(atleta: me.atleta, clube: me.clube);
        await SessionStore.instance.salvarSessao(nova);
        await SessionStore.instance
            .atualizarCache(nova.clubeId, atleta: me.atleta, clube: me.clube);
      } catch (_) {
        nova = null;
      }
    }

    if (nova == null) {
      // Precisa logar no novo clube: pede a senha.
      if (!context.mounted) return;
      nova = await _pedirSenhaELogar(context, cpf, escolhido);
    }

    if (nova != null) {
      await SessionStore.instance.setUltimoClubeId(nova.clubeId);
      widget.onTrocarSessao(nova);
    }
  }

  Future<Sessao?> _pedirSenhaELogar(
    BuildContext context,
    String cpf,
    ClubeAtleta clube,
  ) async {
    return showDialog<Sessao>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _LoginClubeDialog(cpf: cpf, clube: clube),
    );
  }

  // --------------------------------------------------------------------------
  // Lógica preservada: sair
  // --------------------------------------------------------------------------
  Future<void> _sair(BuildContext context) async {
    final confirma = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sair da conta'),
        content: const Text('Tem certeza que deseja sair?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancelar')),
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Sair')),
        ],
      ),
    );
    if (confirma != true || !context.mounted) return;

    final sessao = SessaoProvider.of(context);
    await Api.instance.logout(sessao.token);
    await SessionStore.instance.removerSessao(sessao.clubeId);
    widget.onSair();
  }

  // --------------------------------------------------------------------------
  // LGPD: exportar dados / excluir conta
  // --------------------------------------------------------------------------
  Future<void> _exportarDados(BuildContext context) async {
    final sessao = SessaoProvider.of(context);
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    try {
      final dados = await Api.instance.exportarDados(sessao.token);
      if (!context.mounted) return;
      Navigator.of(context).pop(); // fecha o loading
      final texto = const JsonEncoder.withIndent('  ').convert(dados);
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Meus dados'),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: SelectableText(
                texto,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Fechar')),
          ],
        ),
      );
    } on ApiException catch (e) {
      if (!context.mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.mensagem)));
    } catch (_) {
      if (!context.mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível exportar seus dados.')),
      );
    }
  }

  Future<void> _excluirConta(BuildContext context) async {
    // 1ª confirmação — aviso de irreversibilidade.
    final passo1 = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir minha conta'),
        content: const Text(
          'Esta ação é irreversível. Seus dados pessoais serão anonimizados e '
          'você perderá o acesso ao app. Deseja continuar?',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancelar')),
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Continuar',
                  style: TextStyle(color: AppColors.danger))),
        ],
      ),
    );
    if (passo1 != true || !context.mounted) return;

    // 2ª confirmação — exige digitar EXCLUIR.
    final controller = TextEditingController();
    final passo2 = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) {
          final habilitado =
              controller.text.trim().toUpperCase() == 'EXCLUIR';
          return AlertDialog(
            title: const Text('Confirme a exclusão'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Para confirmar, digite EXCLUIR abaixo.'),
                const SizedBox(height: 12),
                TextField(
                  controller: controller,
                  autofocus: true,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(hintText: 'EXCLUIR'),
                  onChanged: (_) => setLocal(() {}),
                ),
              ],
            ),
            actions: [
              TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const Text('Cancelar')),
              TextButton(
                  onPressed:
                      habilitado ? () => Navigator.of(ctx).pop(true) : null,
                  child: const Text('Excluir',
                      style: TextStyle(color: AppColors.danger))),
            ],
          );
        },
      ),
    );
    controller.dispose();
    if (passo2 != true || !context.mounted) return;

    final sessao = SessaoProvider.of(context);
    try {
      await Api.instance.excluirConta(sessao.token);
      await SessionStore.instance.removerSessao(sessao.clubeId);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conta excluída. Até logo.')),
      );
      widget.onSair();
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.mensagem)));
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível excluir a conta.')),
      );
    }
  }

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final sessao = SessaoProvider.of(context);
    final atleta = sessao.atleta;
    final clube = sessao.clube;

    return Scaffold(
      backgroundColor: AppColors.ink,
      body: Column(
        children: [
          _header(atleta),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(24, 22, 24, 8),
              children: [
                _clubeAtual(context, atleta, clube),
                const SizedBox(height: 22),
                _meusDados(),
                const SizedBox(height: 22),
                _preferencias(),
                const SizedBox(height: 22),
                _conta(context),
                const SizedBox(height: 6),
                Center(
                  child: Text('Athletto · versão 1.0.0',
                      style: AppText.custom(
                          size: 11.5, color: AppColors.faintest)),
                ),
                const SizedBox(height: 4),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- Header lime ----------------------------------------------------------

  Widget _header(Atleta? atleta) {
    final nome = atleta?.nome ?? 'Atleta';
    final numero = atleta?.numeroCamisa;
    final subtitulo = numero != null ? 'Atleta · #$numero' : 'Atleta';

    return Container(
      color: AppColors.lime,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 10, 24, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text('Perfil',
                    style: AppText.custom(
                        size: 17,
                        weight: FontWeight.w700,
                        color: AppColors.ink)),
              ),
              const SizedBox(height: 14),
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.ink, width: 3),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        AppAvatar(
                          nome: nome,
                          imageUrl: _fotoOverride ?? atleta?.fotoUrl,
                          size: 88,
                        ),
                        if (_uploadingFoto)
                          Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.ink.withOpacity(0.5),
                            ),
                            alignment: Alignment.center,
                            child: const SizedBox(
                              width: 26,
                              height: 26,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: AppColors.lime,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: Pressable(
                      onTap:
                          _uploadingFoto ? null : () => _editarFoto(context),
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: AppColors.ink,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.lime, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.edit,
                            size: 15, color: AppColors.lime),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                nome,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppText.profileName.copyWith(color: AppColors.ink),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.directions_run,
                      size: 16, color: AppColors.ink),
                  const SizedBox(width: 6),
                  Text(subtitulo,
                      style: AppText.custom(
                          size: 13.5,
                          weight: FontWeight.w600,
                          color: AppColors.ink)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- Clube atual ----------------------------------------------------------

  Widget _clubeAtual(BuildContext context, Atleta? atleta, Clube? clube) {
    final nomeClube = clube?.nome ?? '—';
    final posicao = atleta?.posicao;
    final categoria = (posicao != null && posicao.isNotEmpty) ? posicao : '—';

    return SectionCard(
      title: 'Clube atual',
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),
        child: Row(
          children: [
            AppAvatar(nome: nomeClube, imageUrl: clube?.logoUrl, size: 46),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(nomeClube,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.custom(
                          size: 15,
                          weight: FontWeight.w700,
                          color: AppColors.white,
                          height: 1.3)),
                  const SizedBox(height: 2),
                  Text(categoria,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.custom(size: 12, color: AppColors.faint)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Pressable(
              onTap: () => _trocarClube(context),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.autorenew, size: 16, color: AppColors.lime),
                  const SizedBox(width: 5),
                  Text('Trocar',
                      style: AppText.custom(
                          size: 13,
                          weight: FontWeight.w700,
                          color: AppColors.lime)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- Meus dados -----------------------------------------------------------

  Widget _meusDados() {
    return SectionCard(
      title: 'Meus dados',
      child: Column(
        children: [
          _InfoRow(
              icon: Icons.fingerprint,
              label: 'CPF',
              value: (_cpf != null && _cpf!.isNotEmpty) ? _cpf! : '—'),
          const _InfoRow(icon: Icons.mail, label: 'E-mail', value: '—'),
          const _InfoRow(
              icon: Icons.call, label: 'Telefone', value: '—', last: true),
        ],
      ),
    );
  }

  // --- Preferências ---------------------------------------------------------

  Widget _preferencias() {
    return SectionCard(
      title: 'Preferências',
      child: Column(
        children: [
          _PrefRow(
            icon: Icons.notifications,
            label: 'Notificações push',
            sub: 'Avisos, eventos e cobranças',
            on: _push,
            onChanged: _alternarPush,
          ),
          _PrefRow(
            icon: Icons.payments,
            label: 'Lembretes de pagamento',
            sub: 'Avisar antes do vencimento',
            on: _lembretes,
            onChanged: _alternarLembretes,
            last: true,
          ),
        ],
      ),
    );
  }

  // --- Conta ----------------------------------------------------------------

  Widget _conta(BuildContext context) {
    return SectionCard(
      title: 'Conta',
      child: Column(
        children: [
          _ActionRow(
            icon: Icons.shield,
            label: 'Privacidade e segurança',
            onTap: () => _abrirUrl(context, '/privacidade'),
          ),
          _ActionRow(
            icon: Icons.help,
            label: 'Ajuda e suporte',
            onTap: () => _abrirUrl(context, '/suporte'),
          ),
          _ActionRow(
            icon: Icons.download_rounded,
            label: 'Exportar meus dados',
            onTap: () => _exportarDados(context),
          ),
          _ActionRow(
            icon: Icons.delete_forever,
            label: 'Excluir minha conta',
            danger: true,
            onTap: () => _excluirConta(context),
          ),
          _ActionRow(
            icon: Icons.logout,
            label: 'Sair da conta',
            danger: true,
            last: true,
            onTap: () => _sair(context),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Widgets privados (linhas das seções e toggle) — só usados neste arquivo.
// ---------------------------------------------------------------------------

/// Linha de dado: chip lime + label + valor.
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool last;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: AppColors.hairline)),
      ),
      child: Row(
        children: [
          IconChip(
            icon: icon,
            color: AppColors.lime,
            tint: AppColors.limeTint12,
            size: 38,
            iconSize: 19,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: AppText.custom(
                        size: 12,
                        weight: FontWeight.w500,
                        color: AppColors.faint)),
                const SizedBox(height: 2),
                Text(value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.custom(
                        size: 14.5,
                        weight: FontWeight.w600,
                        color: AppColors.white)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Linha de preferência: chip + label/sub + toggle.
class _PrefRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? sub;
  final bool on;
  final ValueChanged<bool> onChanged;
  final bool last;

  const _PrefRow({
    required this.icon,
    required this.label,
    this.sub,
    required this.on,
    required this.onChanged,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: AppColors.hairline)),
      ),
      child: Row(
        children: [
          IconChip(
            icon: icon,
            color: AppColors.lime,
            tint: AppColors.limeTint12,
            size: 38,
            iconSize: 19,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: AppText.custom(
                        size: 14,
                        weight: FontWeight.w600,
                        color: AppColors.white)),
                if (sub != null) ...[
                  const SizedBox(height: 2),
                  Text(sub!,
                      style:
                          AppText.custom(size: 12, color: AppColors.faint)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          _Toggle(on: on, onChanged: onChanged),
        ],
      ),
    );
  }
}

/// Linha de ação: chip + label + chevron. `danger` deixa em vermelho.
class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  final bool last;

  const _ActionRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    final cor = danger ? AppColors.danger : AppColors.white;
    final tint = danger ? AppColors.dangerTint : AppColors.limeTint12;
    final iconColor = danger ? AppColors.danger : AppColors.lime;

    return Pressable(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.transparent,
          border: last
              ? null
              : const Border(bottom: BorderSide(color: AppColors.hairline)),
        ),
        child: Row(
          children: [
            IconChip(
              icon: icon,
              color: iconColor,
              tint: tint,
              size: 38,
              iconSize: 19,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(label,
                  style: AppText.custom(
                      size: 14.5, weight: FontWeight.w600, color: cor)),
            ),
            const Icon(Icons.chevron_right, size: 22, color: AppColors.faint),
          ],
        ),
      ),
    );
  }
}

/// Toggle do protótipo: trilho 46×28 (lime quando on), knob 22 (ink/branco).
class _Toggle extends StatelessWidget {
  final bool on;
  final ValueChanged<bool> onChanged;

  const _Toggle({required this.on, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!on),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: kAthlettoEase,
        width: 46,
        height: 28,
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: on ? AppColors.lime : const Color(0xFF3A3A3A),
          borderRadius: BorderRadius.circular(AppSpacing.radiusPill),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 250),
          curve: kAthlettoEase,
          alignment: on ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: on ? AppColors.ink : AppColors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}

/// Diálogo para logar em outro clube pedindo a senha.
class _LoginClubeDialog extends StatefulWidget {
  final String cpf;
  final ClubeAtleta clube;
  const _LoginClubeDialog({required this.cpf, required this.clube});

  @override
  State<_LoginClubeDialog> createState() => _LoginClubeDialogState();
}

class _LoginClubeDialogState extends State<_LoginClubeDialog> {
  final _senhaController = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
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
    if (_senhaController.text.isEmpty) {
      setState(() => _erro = 'Informe a senha.');
      return;
    }
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      final result = await Api.instance.login(
        cpf: widget.cpf,
        clubeId: widget.clube.clubeId,
        senha: _senhaController.text,
        device: _device(),
      );
      final sessao = Sessao(
        clubeId: widget.clube.clubeId,
        token: result.token,
        atleta: result.atleta,
        clube: result.clube,
      );
      await SessionStore.instance.salvarSessao(sessao);
      if (!mounted) return;
      Navigator.of(context).pop(sessao);
    } on ApiException catch (e) {
      setState(() => _erro = e.mensagem);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          AppAvatar(
              nome: widget.clube.nome, imageUrl: widget.clube.logoUrl, size: 36),
          const SizedBox(width: 10),
          Expanded(child: Text(widget.clube.nome, style: const TextStyle(fontSize: 16))),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppTextField(
            controller: _senhaController,
            label: 'Senha',
            prefixIcon: Icons.lock_outline,
            obscureText: _obscure,
            onSubmitted: (_) => _entrar(),
            suffix: IconButton(
              icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
          if (_erro != null) ...[
            const SizedBox(height: 10),
            Text(_erro!,
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _loading ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        SizedBox(
          width: 110,
          child: PrimaryButton(
            label: 'Entrar',
            loading: _loading,
            onPressed: _entrar,
          ),
        ),
      ],
    );
  }
}
