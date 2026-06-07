/// Notificação interna do app do atleta.
///
/// Lê o JSON em snake_case devolvido pelo endpoint `/notificacoes`.
class NotificacaoApp {
  final String id;
  final String tipo;
  final String titulo;
  final String mensagem;
  final String? detalhe;
  final String? acaoLabel;
  final String? acaoDestino;
  final bool lida;
  final DateTime? criadaEm;

  const NotificacaoApp({
    required this.id,
    required this.tipo,
    required this.titulo,
    required this.mensagem,
    this.detalhe,
    this.acaoLabel,
    this.acaoDestino,
    required this.lida,
    this.criadaEm,
  });

  factory NotificacaoApp.fromJson(Map<String, dynamic> json) {
    DateTime? criada;
    final rawCriada = json['criada_em'];
    if (rawCriada != null) {
      criada = DateTime.tryParse(rawCriada.toString());
    }

    return NotificacaoApp(
      id: (json['id'] ?? '').toString(),
      tipo: (json['tipo'] ?? 'clube').toString(),
      titulo: (json['titulo'] ?? '').toString(),
      mensagem: (json['mensagem'] ?? '').toString(),
      detalhe: json['detalhe']?.toString(),
      acaoLabel: json['acao_label']?.toString(),
      acaoDestino: json['acao_destino']?.toString(),
      lida: json['lida'] == true,
      criadaEm: criada,
    );
  }
}
