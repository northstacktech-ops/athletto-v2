class Clube {
  final String id;
  final String nome;
  final String? logoUrl;

  const Clube({
    required this.id,
    required this.nome,
    this.logoUrl,
  });

  factory Clube.fromJson(Map<String, dynamic> json) {
    return Clube(
      id: (json['id'] ?? json['clube_id'] ?? '').toString(),
      nome: (json['nome'] ?? '').toString(),
      logoUrl: json['logo_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nome': nome,
        'logo_url': logoUrl,
      };
}

/// Representa um clube retornado por /consultar-cpf.
class ClubeAtleta {
  final String clubeId;
  final String atletaId;
  final String nome;
  final String? logoUrl;
  final bool senhaDefinida;

  const ClubeAtleta({
    required this.clubeId,
    required this.atletaId,
    required this.nome,
    this.logoUrl,
    required this.senhaDefinida,
  });

  factory ClubeAtleta.fromJson(Map<String, dynamic> json) {
    return ClubeAtleta(
      clubeId: (json['clube_id'] ?? '').toString(),
      atletaId: (json['atleta_id'] ?? '').toString(),
      nome: (json['nome'] ?? '').toString(),
      logoUrl: json['logo_url']?.toString(),
      senhaDefinida: json['senha_definida'] == true,
    );
  }
}
