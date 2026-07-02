import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/atleta.dart';
import '../models/clube.dart';

/// Dados de uma sessão ativa (token + cache de atleta e clube).
class Sessao {
  final String clubeId;
  final String token;
  final Atleta? atleta;
  final Clube? clube;

  const Sessao({
    required this.clubeId,
    required this.token,
    this.atleta,
    this.clube,
  });

  Map<String, dynamic> toJson() => {
        'clube_id': clubeId,
        'token': token,
        'atleta': atleta?.toJson(),
        'clube': clube?.toJson(),
      };

  factory Sessao.fromJson(Map<String, dynamic> json) {
    return Sessao(
      clubeId: (json['clube_id'] ?? '').toString(),
      token: (json['token'] ?? '').toString(),
      atleta: json['atleta'] is Map<String, dynamic>
          ? Atleta.fromJson(json['atleta'] as Map<String, dynamic>)
          : null,
      clube: json['clube'] is Map<String, dynamic>
          ? Clube.fromJson(json['clube'] as Map<String, dynamic>)
          : null,
    );
  }

  Sessao copyWith({Atleta? atleta, Clube? clube}) => Sessao(
        clubeId: clubeId,
        token: token,
        atleta: atleta ?? this.atleta,
        clube: clube ?? this.clube,
      );
}

/// Gerencia persistência de sessões por clube no armazenamento seguro.
class SessionStore {
  SessionStore._();
  static final SessionStore instance = SessionStore._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _ultimoClubeKey = 'ultimoClubeId';
  static const _cpfKey = 'ultimoCpf';

  String _sessaoKey(String clubeId) => 'sessao:$clubeId';

  /// Salva (ou substitui) a sessão de um clube e marca como último clube.
  Future<void> salvarSessao(Sessao sessao) async {
    await _storage.write(
      key: _sessaoKey(sessao.clubeId),
      value: jsonEncode(sessao.toJson()),
    );
    await _storage.write(key: _ultimoClubeKey, value: sessao.clubeId);
  }

  /// Atualiza apenas o cache de atleta/clube de uma sessão existente.
  Future<void> atualizarCache(
    String clubeId, {
    Atleta? atleta,
    Clube? clube,
  }) async {
    final atual = await lerSessao(clubeId);
    if (atual == null) return;
    await _storage.write(
      key: _sessaoKey(clubeId),
      value: jsonEncode(atual.copyWith(atleta: atleta, clube: clube).toJson()),
    );
  }

  Future<Sessao?> lerSessao(String clubeId) async {
    final raw = await _storage.read(key: _sessaoKey(clubeId));
    if (raw == null || raw.isEmpty) return null;
    try {
      return Sessao.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<String?> lerUltimoClubeId() => _storage.read(key: _ultimoClubeKey);

  Future<Sessao?> lerUltimaSessao() async {
    final clubeId = await lerUltimoClubeId();
    if (clubeId == null || clubeId.isEmpty) return null;
    return lerSessao(clubeId);
  }

  Future<void> setUltimoClubeId(String clubeId) =>
      _storage.write(key: _ultimoClubeKey, value: clubeId);

  Future<void> salvarCpf(String cpf) => _storage.write(key: _cpfKey, value: cpf);

  Future<String?> lerCpf() => _storage.read(key: _cpfKey);

  /// Remove a sessão de um clube. Se for o último clube, limpa o ponteiro.
  Future<void> removerSessao(String clubeId) async {
    await _storage.delete(key: _sessaoKey(clubeId));
    final ultimo = await lerUltimoClubeId();
    if (ultimo == clubeId) {
      await _storage.delete(key: _ultimoClubeKey);
    }
  }

  Future<void> limparTudo() async {
    await _storage.deleteAll();
  }
}
