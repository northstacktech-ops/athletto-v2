import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

/// Formata a entrada como CPF: 000.000.000-00
class CpfInputFormatter extends TextInputFormatter {
  const CpfInputFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final limited = digits.length > 11 ? digits.substring(0, 11) : digits;

    final buffer = StringBuffer();
    for (int i = 0; i < limited.length; i++) {
      if (i == 3 || i == 6) buffer.write('.');
      if (i == 9) buffer.write('-');
      buffer.write(limited[i]);
    }

    final text = buffer.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

/// Helpers de formatação.
class Fmt {
  static final _moeda =
      NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$', decimalDigits: 2);

  static String moeda(double valor) => _moeda.format(valor);

  static String somenteDigitos(String s) => s.replaceAll(RegExp(r'\D'), '');

  static String dataCurta(DateTime? d) {
    if (d == null) return '--';
    return DateFormat('dd/MM').format(d);
  }

  static String dataCompleta(DateTime? d) {
    if (d == null) return '--';
    return DateFormat('dd/MM/yyyy').format(d);
  }

  static String dataHora(DateTime? d) {
    if (d == null) return '--';
    return DateFormat('dd/MM HH:mm').format(d);
  }

  static String hora(DateTime? d) {
    if (d == null) return '--';
    return DateFormat('HH:mm').format(d);
  }

  static String diaSemana(DateTime d) {
    final s = DateFormat('EEEE', 'pt_BR').format(d);
    return s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
  }
}
