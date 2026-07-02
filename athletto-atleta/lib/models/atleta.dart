class Atleta {
  final String id;
  final String nome;
  final String? apelido;
  final String? fotoUrl;
  final String? posicao;
  final int? numeroCamisa;
  final String? status;

  const Atleta({
    required this.id,
    required this.nome,
    this.apelido,
    this.fotoUrl,
    this.posicao,
    this.numeroCamisa,
    this.status,
  });

  factory Atleta.fromJson(Map<String, dynamic> json) {
    int? numero;
    final rawNumero = json['numero_camisa'];
    if (rawNumero is int) {
      numero = rawNumero;
    } else if (rawNumero != null) {
      numero = int.tryParse(rawNumero.toString());
    }

    return Atleta(
      id: (json['id'] ?? '').toString(),
      nome: (json['nome'] ?? '').toString(),
      apelido: json['apelido']?.toString(),
      fotoUrl: json['foto_url']?.toString(),
      posicao: json['posicao']?.toString(),
      numeroCamisa: numero,
      status: json['status']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nome': nome,
        'apelido': apelido,
        'foto_url': fotoUrl,
        'posicao': posicao,
        'numero_camisa': numeroCamisa,
        'status': status,
      };

  /// Nome curto para saudações.
  String get primeiroNome {
    if (apelido != null && apelido!.trim().isNotEmpty) return apelido!.trim();
    final partes = nome.trim().split(RegExp(r'\s+'));
    return partes.isNotEmpty ? partes.first : nome;
  }
}
