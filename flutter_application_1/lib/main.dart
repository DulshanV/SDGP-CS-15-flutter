import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CeylonHs Intro',
      home: const IntroPage(),
    );
  }
}

class IntroPage extends StatelessWidget {
  const IntroPage({super.key});

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);
  static const Color accentBlue = Color(0xFF4DA7FF);
  static const Color softBlue = Color(0xFFD7EAFF);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [primaryBlue, secondaryBlue],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    '☂️',
                    style: TextStyle(fontSize: 90),
                  ),
                  const SizedBox(height: 48),
                  const Text(
                    'CeylonHS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 52,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichText(
                    textAlign: TextAlign.center,
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'From product to code\n',
                          style: TextStyle(
                            color: softBlue,
                            fontSize: 24,
                            fontWeight: FontWeight.w500,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.3,
                            height: 1.25,
                          ),
                        ),
                        TextSpan(
                          text: 'in Seconds.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.5,
                            shadows: [
                              Shadow(
                                color: Color(0xAA9ED5FF),
                                blurRadius: 16,
                              ),
                              Shadow(
                                color: Color(0x809ED5FF),
                                blurRadius: 28,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 64),
                  InkWell(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const AuthEntryPage(
                            isRegistered: false,
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(30),
                    child: Container(
                      width: 60,
                      height: 60,
                      decoration: const BoxDecoration(
                        color: accentBlue,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.arrow_forward,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AuthEntryPage extends StatefulWidget {
  const AuthEntryPage({super.key, required this.isRegistered});

  final bool isRegistered;

  @override
  State<AuthEntryPage> createState() => _AuthEntryPageState();
}

class _AuthEntryPageState extends State<AuthEntryPage> {
  late bool _hasRegistered;

  @override
  void initState() {
    super.initState();
    _hasRegistered = widget.isRegistered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFFE6EEFF),
              borderRadius: BorderRadius.circular(22),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Stack(
                children: [
                  Positioned(
                    top: -60,
                    left: -100,
                    right: -100,
                    child: Transform.rotate(
                      angle: -0.55,
                      child: Container(
                        height: 82,
                        color: const Color(0x66FFFFFF),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 70,
                    left: -90,
                    right: -90,
                    child: Transform.rotate(
                      angle: -0.52,
                      child: Container(
                        height: 70,
                        color: const Color(0x55FFFFFF),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 170,
                    left: -80,
                    right: -80,
                    child: Transform.rotate(
                      angle: 0.6,
                      child: Container(
                        height: 56,
                        color: const Color(0x334A78D4),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
                    child: Column(
                      children: [
                        Container(
                          height: 230,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD7E5FF),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Stack(
                            children: [
                              Positioned.fill(
                                child: Center(
                                  child: SizedBox(
                                    width: 300,
                                    height: 180,
                                    child: ClipPath(
                                      clipper: _TopBlobClipper(),
                                      child: Image.asset(
                                        'assets/images/auth_template.png',
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Container(
                                          color: const Color(0xFFCEE0FF),
                                          alignment: Alignment.center,
                                          child: const Icon(
                                            Icons.location_city_rounded,
                                            size: 120,
                                            color: Color(0xFF1D4FB4),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 0,
                                right: 0,
                                bottom: 0,
                                child: Container(
                                  height: 34,
                                  color: const Color(0xFF4A78D4),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 22),
                        const Text(
                          'CeylonHS',
                          style: TextStyle(
                            fontSize: 40,
                            color: Color(0xFF0C2C75),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Get instant, accurate classification\nfor your import/export goods.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 20,
                            color: Color(0xFF1D4595),
                            fontWeight: FontWeight.w500,
                            height: 1.32,
                          ),
                        ),
                        const Spacer(),
                        SizedBox(
                          width: double.infinity,
                          height: 58,
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2E6EEB),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              textStyle: const TextStyle(
                                fontSize: 34,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            child: const Text('Log in'),
                          ),
                        ),
                        const SizedBox(height: 14),
                        if (!_hasRegistered)
                          SizedBox(
                            width: double.infinity,
                            height: 58,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _hasRegistered = true;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Registration successful. Please log in.',
                                    ),
                                  ),
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                backgroundColor: const Color(0xFFF8F8F8),
                                foregroundColor: const Color(0xFF2E6EEB),
                                side: const BorderSide(color: Color(0xFFDCE7FF)),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: const Text('Sign up'),
                            ),
                          )
                        else
                          const Text(
                            'Already registered? Use Log in.',
                            style: TextStyle(
                              color: Color(0xFF335AAB),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TopBlobClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(size.width * 0.04, size.height * 0.56);
    path.cubicTo(
      size.width * 0.06,
      size.height * 0.24,
      size.width * 0.23,
      size.height * 0.15,
      size.width * 0.41,
      size.height * 0.11,
    );
    path.cubicTo(
      size.width * 0.62,
      size.height * 0.06,
      size.width * 0.86,
      size.height * 0.16,
      size.width * 0.92,
      size.height * 0.38,
    );
    path.cubicTo(
      size.width * 0.96,
      size.height * 0.54,
      size.width * 0.89,
      size.height * 0.72,
      size.width * 0.77,
      size.height * 0.82,
    );
    path.cubicTo(
      size.width * 0.62,
      size.height * 0.95,
      size.width * 0.39,
      size.height * 0.98,
      size.width * 0.24,
      size.height * 0.87,
    );
    path.cubicTo(
      size.width * 0.10,
      size.height * 0.77,
      size.width * 0.02,
      size.height * 0.68,
      size.width * 0.04,
      size.height * 0.56,
    );
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}