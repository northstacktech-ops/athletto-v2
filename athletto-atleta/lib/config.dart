/// Configurações globais do app.
///
/// Para apontar para outro ambiente, altere [apiBaseUrl].
class Config {
  /// Base URL da API do app do atleta.
  static const String apiBaseUrl = 'https://athletto-v2.vercel.app/api/app';

  /// Cor primária da marca (#3d5afe).
  static const int brandColorValue = 0xFF3D5AFE;

  /// Timeout padrão das requisições.
  static const Duration requestTimeout = Duration(seconds: 20);

  /// Base URL do site público (páginas LGPD, suporte, etc.).
  static const String webBaseUrl = 'https://athletto-v2.vercel.app';
}
