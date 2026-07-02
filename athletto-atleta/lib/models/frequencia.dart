class RegistroFrequencia {
  final DateTime? data;
  final bool presente;
  final String? turmaNome;

  const RegistroFrequencia({
    this.data,
    required this.presente,
    this.turmaNome,
  });

  factory RegistroFrequencia.fromJson(Map<String, dynamic> json) {
    return RegistroFrequencia(
      data: json['data'] == null
          ? null
          : DateTime.tryParse(json['data'].toString())?.toLocal(),
      presente: json['presente'] == true,
      turmaNome: json['turma_nome']?.toString(),
    );
  }
}

class Frequencia {
  final double percentual;
  final int totalTreinos;
  final int totalPresencas;
  final List<RegistroFrequencia> historico;

  const Frequencia({
    required this.percentual,
    required this.totalTreinos,
    required this.totalPresencas,
    required this.historico,
  });

  factory Frequencia.fromJson(Map<String, dynamic> json) {
    double percentual = 0;
    final rawP = json['percentual'];
    if (rawP is num) {
      percentual = rawP.toDouble();
    } else if (rawP != null) {
      percentual = double.tryParse(rawP.toString()) ?? 0;
    }

    final historicoRaw = json['historico'];
    final historico = <RegistroFrequencia>[];
    if (historicoRaw is List) {
      for (final item in historicoRaw) {
        if (item is Map<String, dynamic>) {
          historico.add(RegistroFrequencia.fromJson(item));
        }
      }
    }

    return Frequencia(
      percentual: percentual,
      totalTreinos: _asInt(json['total_treinos']),
      totalPresencas: _asInt(json['total_presencas']),
      historico: historico,
    );
  }

  static int _asInt(dynamic value) {
    if (value is int) return value;
    if (value == null) return 0;
    return int.tryParse(value.toString()) ?? 0;
  }
}
