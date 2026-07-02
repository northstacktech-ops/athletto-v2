class Evento {
  final String id;
  final String titulo;
  final String? descricao;
  final String? tipo;
  final DateTime? dataInicio;
  final DateTime? dataFim;
  final String? local;

  const Evento({
    required this.id,
    required this.titulo,
    this.descricao,
    this.tipo,
    this.dataInicio,
    this.dataFim,
    this.local,
  });

  factory Evento.fromJson(Map<String, dynamic> json) {
    return Evento(
      id: (json['id'] ?? '').toString(),
      titulo: (json['titulo'] ?? '').toString(),
      descricao: json['descricao']?.toString(),
      tipo: json['tipo']?.toString(),
      dataInicio: _parseDate(json['data_inicio']),
      dataFim: _parseDate(json['data_fim']),
      local: json['local']?.toString(),
    );
  }

  bool get isTreino => (tipo ?? '').toLowerCase().contains('treino');

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString())?.toLocal();
  }
}
