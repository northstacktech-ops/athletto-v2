import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/app_theme.dart';
import '../widgets/pressable.dart';
import 'cpf_screen.dart';

/// Onboarding: carrossel de 2 slides em tela cheia. Foto B&W de fundo com
/// gradiente escuro de baixo para cima; conteúdo (logo, título, corpo e
/// controles) ancorado embaixo. "Pular" e "Finalizar" levam ao CpfScreen.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  static const _slides = <String>[
    'assets/img/onboarding-soccer.png',
    'assets/img/onboarding-volley.png',
  ];

  final _controller = PageController();
  int _index = 0;

  bool get _isLast => _index == _slides.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_isLast) {
      _finalizar();
    } else {
      _controller.nextPage(
        duration: const Duration(milliseconds: 700),
        curve: kAthlettoEase,
      );
    }
  }

  void _goTo(int i) {
    _controller.animateToPage(
      i,
      duration: const Duration(milliseconds: 500),
      curve: kAthlettoEase,
    );
  }

  void _finalizar() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const CpfScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Foto de fundo que desliza com o carrossel.
            PageView.builder(
              controller: _controller,
              itemCount: _slides.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) => Image.asset(
                _slides[i],
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
              ),
            ),

            // Gradiente escuro para legibilidade (de baixo para cima).
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    AppColors.black,
                    Color(0x00000000),
                    Color(0x40000000),
                  ],
                  stops: [0.20, 0.56, 1.0],
                ),
              ),
              child: SizedBox.expand(),
            ),

            // Conteúdo fixo ancorado embaixo.
            SafeArea(
              child: Column(
                children: [
                  const Spacer(),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(40, 0, 40, 50),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Image.asset(
                            'assets/img/logo.png',
                            height: 44,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text.rich(
                          TextSpan(
                            style: AppText.custom(
                                size: 24,
                                weight: FontWeight.w700,
                                color: AppColors.white,
                                height: 1.25),
                            children: const [
                              TextSpan(text: 'Acompanhe seus '),
                              TextSpan(
                                  text: 'treinos',
                                  style: TextStyle(color: AppColors.lime)),
                              TextSpan(text: ' de forma prática'),
                            ],
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'Treinos, mensalidades, calendário, e tudo que você '
                          'precisa na palma da sua mão',
                          textAlign: TextAlign.center,
                          style: AppText.custom(
                              size: 14,
                              color: AppColors.white,
                              height: 1.45),
                        ),
                        const SizedBox(height: 44),
                        Row(
                          children: [
                            Pressable(
                              onTap: _finalizar,
                              child: Text('Pular',
                                  style: AppText.custom(
                                      size: 14, color: AppColors.white)),
                            ),
                            const Spacer(),
                            _Dots(count: _slides.length, index: _index, onTap: _goTo),
                            const Spacer(),
                            Pressable(
                              onTap: _next,
                              child: Text(
                                _isLast ? 'Finalizar' : 'Próximo',
                                style: AppText.custom(
                                    size: 14,
                                    weight: FontWeight.w700,
                                    color: AppColors.lime),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  final int count;
  final int index;
  final ValueChanged<int> onTap;

  const _Dots({required this.count, required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(count, (i) {
        final active = i == index;
        return Padding(
          padding: EdgeInsets.only(right: i == count - 1 ? 0 : 6),
          child: GestureDetector(
            onTap: () => onTap(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              curve: kAthlettoEase,
              height: 9,
              width: active ? 26 : 9,
              decoration: BoxDecoration(
                color: active ? AppColors.lime : const Color(0x80D9D9D9),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        );
      }),
    );
  }
}
