class Cobranca {
  final String id;
  final double valor;
  final String status; // pendente | pago | atraso
  final DateTime? dataVencimento;
  final DateTime? dataPagamento;
  final String? abacatepayLink;
  final String? caixinhaNome;

  const Cobranca({
    required this.id,
    required this.valor,
    required this.status,
    this.dataVencimento,
    this.dataPagamento,
    this.abacatepayLink,
    this.caixinhaNome,
  });

  factory Cobranca.fromJson(Map<String, dynamic> json) {
    double valor = 0;
    final rawValor = json['valor'];
    if (rawValor is num) {
      valor = rawValor.toDouble();
    } else if (rawValor != null) {
      valor = double.tryParse(rawValor.toString().replaceAll(',', '.')) ?? 0;
    }

    return Cobranca(
      id: (json['id'] ?? '').toString(),
      valor: valor,
      status: (json['status'] ?? 'pendente').toString().toLowerCase(),
      dataVencimento: _parseDate(json['data_vencimento']),
      dataPagamento: _parseDate(json['data_pagamento']),
      abacatepayLink: json['abacatepay_link']?.toString(),
      caixinhaNome: json['caixinha_nome']?.toString(),
    );
  }

  bool get isPago => status == 'pago';
  bool get isAtraso => status == 'atraso' || status == 'atrasado';
  bool get isPendente => !isPago && !isAtraso;

  bool get podePagar =>
      !isPago &&
      abacatepayLink != null &&
      abacatepayLink!.trim().isNotEmpty;

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString())?.toLocal();
  }
}
