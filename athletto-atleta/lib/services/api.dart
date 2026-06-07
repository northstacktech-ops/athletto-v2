import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/atleta.dart';
import '../models/clube.dart';
import '../models/cobranca.dart';
import '../models/evento.dart';
import '../models/frequencia.dart';
import '../models/notificacao.dart';

/// Exceção com mensagem amigável (PT-BR) para exibir ao usuário.
class ApiException implements Exception {
  final String mensagem;
  final String? codigo;
  final int? statusCode;

  ApiException(this.mensagem, {this.codigo, this.statusCode});

  @override
  String toString() => mensagem;
}

/// Resultado do login.
class LoginResult {
  final String token;
  final Atleta atleta;
  final Clube clube;

  LoginResult({required this.token, required this.atleta, required this.clube});
}

/// Resultado de /me.
class MeResult {
  final Atleta atleta;
  final Clube clube;

  MeResult({required this.atleta, required this.clube});
}

class Api {
  Api._();
  static final Api instance = Api._();

  final http.Client _client = http.Client();

  Uri _uri(String path) => Uri.parse('${Config.apiBaseUrl}$path');

  Map<String, String> _headers({String? token}) {
    final h = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      h['Authorization'] = 'Bearer $token';
    }
    return h;
  }

  // ---------------------------------------------------------------------------
  // Mensagens amigáveis para códigos de erro conhecidos.
  // ---------------------------------------------------------------------------
  static String mensagemErro(String? codigo) {
    switch (codigo) {
      case 'nao_encontrado':
        return 'CPF não localizado. Fale com o seu clube.';
      case 'clube_inativo':
        return 'Este clube está inativo no momento.';
      case 'senha_nao_definida':
        return 'Você ainda não definiu sua senha. Use "Primeiro acesso".';
      case 'credenciais':
        return 'CPF ou senha incorretos.';
      case 'cpf_invalido':
        return 'CPF inválido. Verifique os números digitados.';
      case 'codigo_invalido':
        return 'Código de acesso inválido. Confira com o seu gestor.';
      case 'senha_curta':
        return 'A senha deve ter no mínimo 8 caracteres.';
      default:
        return 'Não foi possível concluir a operação. Tente novamente.';
    }
  }

  Future<http.Response> _post(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    try {
      return await _client
          .post(_uri(path), headers: _headers(token: token), body: jsonEncode(body))
          .timeout(Config.requestTimeout);
    } on TimeoutException {
      throw ApiException('Tempo de conexão esgotado. Verifique sua internet.');
    } catch (_) {
      throw ApiException('Falha de conexão. Verifique sua internet.');
    }
  }

  Future<http.Response> _get(String path, {String? token}) async {
    try {
      return await _client
          .get(_uri(path), headers: _headers(token: token))
          .timeout(Config.requestTimeout);
    } on TimeoutException {
      throw ApiException('Tempo de conexão esgotado. Verifique sua internet.');
    } catch (_) {
      throw ApiException('Falha de conexão. Verifique sua internet.');
    }
  }

  dynamic _decode(http.Response res) {
    if (res.body.isEmpty) return null;
    try {
      return jsonDecode(res.body);
    } catch (_) {
      return null;
    }
  }

  Never _throwFromBody(http.Response res) {
    final data = _decode(res);
    String? codigo;
    if (data is Map && data['erro'] != null) {
      codigo = data['erro'].toString();
    }
    throw ApiException(
      mensagemErro(codigo),
      codigo: codigo,
      statusCode: res.statusCode,
    );
  }

  // ---------------------------------------------------------------------------
  // Endpoints públicos
  // ---------------------------------------------------------------------------

  /// POST /consultar-cpf
  Future<List<ClubeAtleta>> consultarCpf(String cpf) async {
    final res = await _post('/consultar-cpf', {'cpf': cpf});
    final data = _decode(res);

    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      if (data['ok'] == true) {
        final clubesRaw = data['clubes'];
        final clubes = <ClubeAtleta>[];
        if (clubesRaw is List) {
          for (final c in clubesRaw) {
            if (c is Map<String, dynamic>) {
              clubes.add(ClubeAtleta.fromJson(c));
            }
          }
        }
        return clubes;
      }
      throw ApiException(mensagemErro(data['erro']?.toString()),
          codigo: data['erro']?.toString());
    }
    _throwFromBody(res);
  }

  /// POST /login
  Future<LoginResult> login({
    required String cpf,
    required String clubeId,
    required String senha,
    String? device,
  }) async {
    final res = await _post('/login', {
      'cpf': cpf,
      'clube_id': clubeId,
      'senha': senha,
      if (device != null) 'device': device,
    });
    final data = _decode(res);

    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      if (data['token'] != null) {
        return LoginResult(
          token: data['token'].toString(),
          atleta: Atleta.fromJson(
              (data['atleta'] as Map?)?.cast<String, dynamic>() ?? {}),
          clube: Clube.fromJson(
              (data['clube'] as Map?)?.cast<String, dynamic>() ?? {}),
        );
      }
    }
    _throwFromBody(res);
  }

  /// POST /definir-senha
  Future<void> definirSenha({
    required String cpf,
    required String clubeId,
    required String codigo,
    required String senha,
  }) async {
    final res = await _post('/definir-senha', {
      'cpf': cpf,
      'clube_id': clubeId,
      'codigo': codigo,
      'senha': senha,
    });
    final data = _decode(res);

    if (res.statusCode >= 200 &&
        res.statusCode < 300 &&
        data is Map &&
        data['ok'] == true) {
      return;
    }
    _throwFromBody(res);
  }

  // ---------------------------------------------------------------------------
  // Endpoints autenticados
  // ---------------------------------------------------------------------------

  /// POST /logout
  Future<void> logout(String token) async {
    try {
      await _post('/logout', {}, token: token);
    } catch (_) {
      // Logout local prossegue mesmo se o servidor falhar.
    }
  }

  /// GET /me
  Future<MeResult> me(String token) async {
    final res = await _get('/me', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      return MeResult(
        atleta: Atleta.fromJson(
            (data['atleta'] as Map?)?.cast<String, dynamic>() ?? {}),
        clube: Clube.fromJson(
            (data['clube'] as Map?)?.cast<String, dynamic>() ?? {}),
      );
    }
    if (res.statusCode == 401) {
      throw ApiException('Sessão expirada. Faça login novamente.',
          statusCode: 401);
    }
    _throwFromBody(res);
  }

  /// GET /agenda
  Future<List<Evento>> agenda(String token) async {
    final res = await _get('/agenda', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is List) {
      return data
          .whereType<Map>()
          .map((e) => Evento.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    _throwFromBody(res);
  }

  /// GET /cobrancas
  Future<List<Cobranca>> cobrancas(String token) async {
    final res = await _get('/cobrancas', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is List) {
      return data
          .whereType<Map>()
          .map((e) => Cobranca.fromJson(e.cast<String, dynamic>()))
          .toList();
    }
    _throwFromBody(res);
  }

  /// GET /frequencia
  Future<Frequencia> frequencia(String token) async {
    final res = await _get('/frequencia', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      return Frequencia.fromJson(data.cast<String, dynamic>());
    }
    _throwFromBody(res);
  }

  /// GET /avisos
  Future<List<String>> avisos(String token) async {
    final res = await _get('/avisos', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      final raw = data['avisos'];
      final avisos = <String>[];
      if (raw is List) {
        for (final a in raw) {
          if (a is String) {
            avisos.add(a);
          } else if (a is Map) {
            final texto = a['texto'] ?? a['titulo'] ?? a['mensagem'];
            if (texto != null) avisos.add(texto.toString());
          }
        }
      }
      return avisos;
    }
    _throwFromBody(res);
  }

  // ---------------------------------------------------------------------------
  // Foto do atleta
  // ---------------------------------------------------------------------------

  /// POST /foto (multipart) — envia a nova foto de perfil e retorna a URL.
  Future<String> uploadFoto(String token, File arquivo) async {
    http.Response res;
    try {
      final req = http.MultipartRequest('POST', _uri('/foto'));
      req.headers['Authorization'] = 'Bearer $token';
      req.headers['Accept'] = 'application/json';
      req.files.add(await http.MultipartFile.fromPath('foto', arquivo.path));
      final streamed = await req.send().timeout(Config.requestTimeout);
      res = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw ApiException('Tempo de conexão esgotado. Verifique sua internet.');
    } catch (_) {
      throw ApiException('Falha de conexão. Verifique sua internet.');
    }

    final data = _decode(res);
    if (res.statusCode >= 200 &&
        res.statusCode < 300 &&
        data is Map &&
        data['url'] != null) {
      return data['url'].toString();
    }
    _throwFromBody(res);
  }

  // ---------------------------------------------------------------------------
  // Notificações internas + preferências
  // ---------------------------------------------------------------------------

  /// GET /notificacoes
  Future<List<NotificacaoApp>> listarNotificacoes(String token) async {
    final res = await _get('/notificacoes', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      List? raw;
      if (data is List) {
        raw = data;
      } else if (data is Map && data['notificacoes'] is List) {
        raw = data['notificacoes'] as List;
      }
      if (raw != null) {
        return raw
            .whereType<Map>()
            .map((e) => NotificacaoApp.fromJson(e.cast<String, dynamic>()))
            .toList();
      }
    }
    _throwFromBody(res);
  }

  /// POST /notificacoes-ler
  Future<void> marcarNotificacaoLida(
    String token, {
    String? id,
    bool todas = false,
  }) async {
    final res = await _post(
      '/notificacoes-ler',
      {'id': id, 'todas': todas},
      token: token,
    );
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (data == null || (data is Map && data['ok'] != false)) {
        return;
      }
    }
    _throwFromBody(res);
  }

  /// GET /preferencias → {notif_avisos, notif_pagamento}
  Future<Map<String, bool>> getPreferencias(String token) async {
    final res = await _get('/preferencias', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      bool ler(String chave) {
        final v = data[chave];
        if (v is bool) return v;
        return v == null ? true : v.toString() == 'true';
      }

      return {
        'notif_avisos': ler('notif_avisos'),
        'notif_pagamento': ler('notif_pagamento'),
      };
    }
    _throwFromBody(res);
  }

  /// PUT /preferencias (body snake_case)
  Future<void> setPreferencias(
    String token, {
    bool? notifAvisos,
    bool? notifPagamento,
  }) async {
    final body = <String, dynamic>{};
    if (notifAvisos != null) body['notif_avisos'] = notifAvisos;
    if (notifPagamento != null) body['notif_pagamento'] = notifPagamento;

    http.Response res;
    try {
      res = await _client
          .put(_uri('/preferencias'),
              headers: _headers(token: token), body: jsonEncode(body))
          .timeout(Config.requestTimeout);
    } on TimeoutException {
      throw ApiException('Tempo de conexão esgotado. Verifique sua internet.');
    } catch (_) {
      throw ApiException('Falha de conexão. Verifique sua internet.');
    }

    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (data == null || (data is Map && data['ok'] != false)) {
        return;
      }
    }
    _throwFromBody(res);
  }

  // ---------------------------------------------------------------------------
  // LGPD — dados pessoais
  // ---------------------------------------------------------------------------

  /// GET /exportar-dados → JSON com todos os dados pessoais (direito de acesso).
  Future<Map<String, dynamic>> exportarDados(String token) async {
    final res = await _get('/exportar-dados', token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 && res.statusCode < 300 && data is Map) {
      return data.cast<String, dynamic>();
    }
    if (res.statusCode == 401) {
      throw ApiException('Sessão expirada. Faça login novamente.',
          statusCode: 401);
    }
    _throwFromBody(res);
  }

  /// POST /excluir-conta → anonimiza a conta (direito ao esquecimento).
  /// IRREVERSÍVEL. Envia a confirmação exigida pelo servidor.
  Future<void> excluirConta(String token) async {
    final res =
        await _post('/excluir-conta', {'confirmacao': 'EXCLUIR'}, token: token);
    final data = _decode(res);
    if (res.statusCode >= 200 &&
        res.statusCode < 300 &&
        (data == null || (data is Map && data['ok'] != false))) {
      return;
    }
    _throwFromBody(res);
  }

  /// POST /consentimento → registra o aceite dos documentos legais.
  Future<void> registrarConsentimento(
    String token, {
    bool termosUso = true,
    bool politicaPrivacidade = true,
    bool marketing = false,
  }) async {
    final res = await _post(
      '/consentimento',
      {
        'termos_uso': termosUso,
        'politica_privacidade': politicaPrivacidade,
        'marketing': marketing,
      },
      token: token,
    );
    final data = _decode(res);
    if (res.statusCode >= 200 &&
        res.statusCode < 300 &&
        (data == null || (data is Map && data['ok'] != false))) {
      return;
    }
    _throwFromBody(res);
  }
}
