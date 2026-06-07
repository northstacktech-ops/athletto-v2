import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';

/// Campo de texto do protótipo: label branco acima, caixa transparente com
/// borda #737373 (radius 10, altura 50), texto branco, anel de foco lime.
class AppTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool obscureText;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final IconData? prefixIcon;
  final Widget? suffix;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final void Function(String)? onSubmitted;
  final TextInputAction? textInputAction;
  final bool autofocus;

  const AppTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.obscureText = false,
    this.keyboardType,
    this.inputFormatters,
    this.prefixIcon,
    this.suffix,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.textInputAction,
    this.autofocus = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          Text(label,
              style: AppText.custom(
                  size: 14, weight: FontWeight.w500, color: AppColors.white)),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          validator: validator,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          textInputAction: textInputAction,
          autofocus: autofocus,
          cursorColor: AppColors.lime,
          style: AppText.custom(size: 15, color: AppColors.white),
          decoration: InputDecoration(
            isDense: true,
            hintText: hint,
            hintStyle: AppText.custom(size: 15, color: AppColors.faint),
            filled: true,
            fillColor: Colors.transparent,
            prefixIcon: prefixIcon != null
                ? Icon(prefixIcon, color: AppColors.muted, size: 20)
                : null,
            suffixIcon: suffix,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            border: _border(AppColors.border),
            enabledBorder: _border(AppColors.border),
            focusedBorder: _border(AppColors.lime, width: 1.6),
            errorBorder: _border(AppColors.dangerText),
            focusedErrorBorder: _border(AppColors.dangerText, width: 1.6),
            errorStyle:
                AppText.custom(size: 12, color: AppColors.dangerText),
          ),
        ),
      ],
    );
  }

  OutlineInputBorder _border(Color color, {double width = 1}) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusInput),
        borderSide: BorderSide(color: color, width: width),
      );
}

/// Campo de senha com toggle de visibilidade (ícone visibility/_off).
class PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final void Function(String)? onSubmitted;
  final TextInputAction? textInputAction;

  const PasswordField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.textInputAction,
  });

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _show = false;

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      controller: widget.controller,
      label: widget.label,
      hint: widget.hint,
      obscureText: !_show,
      validator: widget.validator,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      textInputAction: widget.textInputAction,
      suffix: IconButton(
        onPressed: () => setState(() => _show = !_show),
        icon: Icon(_show ? Icons.visibility_off : Icons.visibility,
            color: AppColors.muted, size: 20),
        splashRadius: 20,
      ),
    );
  }
}
