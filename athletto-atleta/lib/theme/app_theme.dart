import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design system do app do atleta — derivado do protótipo (design handoff).
/// Identidade: tema escuro (ink), acento lime, fonte Plus Jakarta Sans.
///
/// Tokens espelham `protótipo/.../styles.css` (:root) e o README de handoff.
class AppColors {
  // Marca / acento
  static const lime = Color(0xFFC7EF66); // primary/accent
  static const limeDim = Color(0x80C7EF66); // rgba(199,239,102,.5)
  static const limeTint = Color(0x24C7EF66); // ~rgba(199,239,102,.14)
  static const limeTint16 = Color(0x29C7EF66); // ~rgba(199,239,102,.16)
  static const limeTint12 = Color(0x1FC7EF66); // ~rgba(199,239,102,.12)

  // Superfícies
  static const ink = Color(0xFF1A1A1A); // fundo principal
  static const card = Color(0xFF242424); // cards, listas, tab bars
  static const black = Color(0xFF000000); // onboarding bg
  static const receipt = Color(0xFF101010); // fundo do comprovante

  // Texto
  static const white = Color(0xFFFFFFFF);
  static const muted = Color(0xFFB2B2B2); // texto secundário
  static const muted2 = Color(0xFFDADADA);
  static const faint = Color(0xFF676D75); // terciário, nav inativo, eyebrows
  static const faintest = Color(0xFF4A4A4A); // versão
  static const gray = Color(0xFF666666);

  // Linhas
  static const border = Color(0xFF737373); // bordas de input / auth
  static const hairline = Color(0x14FFFFFF); // ~rgba(255,255,255,.08)

  // Estados (reaproveitados em Financeiro e Alertas)
  static const danger = Color(0xFFFF5A5A); // vencido / sair / erro
  static const dangerText = Color(0xFFFF6B6B); // texto de erro de login
  static const warning = Color(0xFFF0B429); // pendente futuro / "vence em breve"
  static const info = Color(0xFF4FA6FF); // aviso de clube
  static const isento = Color(0xFF9AA0A6); // cobrança isenta

  // Tints de estado
  static const warningTint = Color(0x24F0B429);
  static const dangerTint = Color(0x24FF5A5A);
  static const infoTint = Color(0x294FA6FF);
  static const isentoTint = Color(0x299AA0A6);
}

/// Espaçamentos e raios padrão (px do handoff).
class AppSpacing {
  static const double screenH = 24; // padding horizontal de tela
  static const double card = 16; // padding de card
  static const double radiusSmall = 8;
  static const double radiusCard = 16;
  static const double radiusInput = 10; // inputs / botões
  static const double radiusPill = 999; // pills / toggles / tabs
  static const double buttonHeight = 50;
  static const double buttonHeightInline = 44;
}

/// Curva de animação do handoff (easeOutExpo).
const Curve kAthlettoEase = Cubic(0.19, 1, 0.22, 1);

/// Tipografia — Plus Jakarta Sans (corpo) + Poppins (labels da nav).
class AppText {
  static TextStyle _jakarta({
    required double size,
    FontWeight weight = FontWeight.w400,
    Color color = AppColors.white,
    double? height,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) {
    return GoogleFonts.plusJakartaSans(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      letterSpacing: letterSpacing,
      fontStyle: fontStyle,
    );
  }

  // Títulos / números
  static TextStyle hero = _jakarta(
      size: 45, weight: FontWeight.w800, fontStyle: FontStyle.italic);
  static TextStyle h1 = _jakarta(size: 24, weight: FontWeight.w700);
  static TextStyle h1Small = _jakarta(size: 20, weight: FontWeight.w700);
  static TextStyle profileName = _jakarta(size: 22, weight: FontWeight.w800);
  static TextStyle bigNumber = _jakarta(
      size: 34, weight: FontWeight.w800, letterSpacing: -0.5);
  static TextStyle bigNumber36 = _jakarta(
      size: 36, weight: FontWeight.w800, letterSpacing: -0.5);

  // Seções / cards
  static TextStyle sectionTitle = _jakarta(size: 20, weight: FontWeight.w700);
  static TextStyle sectionHeading = _jakarta(size: 16, weight: FontWeight.w700);
  static TextStyle cardTitle = _jakarta(size: 15, weight: FontWeight.w700);
  static TextStyle cardTitle14 = _jakarta(size: 14, weight: FontWeight.w700);

  // Corpo
  static TextStyle body = _jakarta(size: 14, height: 1.45);
  static TextStyle body15 =
      _jakarta(size: 15, weight: FontWeight.w500, height: 1.5);
  static TextStyle bodyMuted =
      _jakarta(size: 14, height: 1.45, color: AppColors.muted);

  // Eyebrow / labels (uppercase)
  static TextStyle eyebrow = _jakarta(
      size: 12,
      weight: FontWeight.w700,
      letterSpacing: 0.5,
      color: AppColors.faint);

  // Micro / timestamps
  static TextStyle micro =
      _jakarta(size: 11.5, weight: FontWeight.w500, color: AppColors.faint);

  // Citação (Home)
  static TextStyle quote = _jakarta(
      size: 15,
      weight: FontWeight.w500,
      fontStyle: FontStyle.italic,
      height: 1.4,
      color: AppColors.lime);

  // Label da bottom-nav (Poppins)
  static TextStyle navLabel(Color color) =>
      GoogleFonts.poppins(fontSize: 12, color: color, height: 1.0);

  static TextStyle custom({
    required double size,
    FontWeight weight = FontWeight.w400,
    Color color = AppColors.white,
    double? height,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) =>
      _jakarta(
          size: size,
          weight: weight,
          color: color,
          height: height,
          letterSpacing: letterSpacing,
          fontStyle: fontStyle);
}

/// ThemeData global do app (dark + lime).
ThemeData buildAthlettoTheme() {
  final base = ThemeData(brightness: Brightness.dark, useMaterial3: true);
  const colorScheme = ColorScheme.dark(
    primary: AppColors.lime,
    onPrimary: AppColors.ink,
    secondary: AppColors.lime,
    surface: AppColors.card,
    onSurface: AppColors.white,
    error: AppColors.danger,
  );

  return base.copyWith(
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.ink,
    textTheme: GoogleFonts.plusJakartaSansTextTheme(base.textTheme)
        .apply(bodyColor: AppColors.white, displayColor: AppColors.white),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.ink,
      foregroundColor: AppColors.white,
      elevation: 0,
      centerTitle: true,
    ),
    iconTheme: const IconThemeData(color: AppColors.white),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.card,
      contentTextStyle: AppText.body.copyWith(color: AppColors.white),
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    splashColor: Colors.transparent,
    highlightColor: Colors.transparent,
  );
}
