import 'package:flutter/material.dart';
import 'screens/search_page.dart';
import 'screens/favorites_page.dart';
import 'screens/history_page.dart';
import 'screens/recents_page.dart';
import 'screens/admin_dashboard.dart';
import 'screens/pricing_page.dart' as new_pricing;
import 'services/search_history_service.dart';
import 'services/auth_service.dart';
import 'services/favorites_service.dart';
import 'services/pricing_service.dart';
import 'models/pricing_model.dart';

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
                  const SizedBox(height: 56),
                  SizedBox(
                    width: 220,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const SignUpPage(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        backgroundColor: accentBlue,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Sign in',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 220,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const LoginPage(),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        side: const BorderSide(color: softBlue, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Log in',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
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

class PricingPage extends StatelessWidget {
  const PricingPage({super.key, this.isEmbedded = false});

  final bool isEmbedded;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FA),
      body: SafeArea(
        child: Stack(
          children: [
            if (!isEmbedded)
              Positioned(
                top: 12,
                left: 18,
                child: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(
                    Icons.arrow_back_rounded,
                    color: Color(0xFF0B3EA8),
                    size: 26,
                  ),
                ),
              ),
            if (!isEmbedded)
              Positioned(
                top: 12,
                right: 18,
                child: IconButton(
                  onPressed: () {},
                  icon: const Icon(
                    Icons.person_outline_rounded,
                    color: Color(0xFF0B3EA8),
                    size: 26,
                  ),
                ),
              ),
            ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(20, isEmbedded ? 20 : 68, 20, 24),
              children: [
                const Text(
                  'Simple, transparent pricing.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF1D2F4D),
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Choose the plan that best fits your search volume and business needs.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF5D6778),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 32),
                _PricingCard(
                  title: 'Starter',
                  price: 3,
                  features: const [
                    '10 Search results per month',
                    'Basic HS code matching',
                    'Email support',
                    'Email support',
                  ],
                  buttonLabel: 'Choose Starter',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Starter plan selected')),
                    );
                  },
                ),
                const SizedBox(height: 16),
                _PricingCard(
                  title: 'Business',
                  price: 5,
                  isMostPopular: true,
                  features: const [
                    '25 Search results per month',
                    'AI-Enhanced accuracy',
                    'Priority search speed',
                    'Export search history',
                  ],
                  buttonLabel: 'Choose Business',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Business plan selected')),
                    );
                  },
                ),
                const SizedBox(height: 16),
                _PricingCard(
                  title: 'Enterprise',
                  price: 9,
                  features: const [
                    '50 Search results per month',
                    'Dedicated support',
                    'Custom API Access',
                    'Bulk classification',
                  ],
                  buttonLabel: 'Choose Enterprise',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Enterprise plan selected')),
                    );
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PricingCard extends StatelessWidget {
  const _PricingCard({
    required this.title,
    required this.price,
    required this.features,
    required this.buttonLabel,
    required this.onPressed,
    this.isMostPopular = false,
  });

  final String title;
  final int price;
  final List<String> features;
  final String buttonLabel;
  final VoidCallback onPressed;
  final bool isMostPopular;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isMostPopular ? const Color(0xFF0B3EA8) : const Color(0xFFD0D8E5),
          width: isMostPopular ? 2 : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0x0F000000),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          if (isMostPopular) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF3D8BFF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'MOST POPULAR',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(height: 14),
          ],
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF1D2F4D),
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  r'$',
                  style: TextStyle(
                    color: Color(0xFF0B3EA8),
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Text(
                '$price',
                style: const TextStyle(
                  color: Color(0xFF0B3EA8),
                  fontSize: 56,
                  fontWeight: FontWeight.w800,
                  height: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          ...features.map((feature) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: Color(0xFF4A90E2),
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        feature,
                        style: const TextStyle(
                          color: Color(0xFF5D6778),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                elevation: 2,
                backgroundColor: const Color(0xFF0B3EA8),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                ),
              ),
              child: Text(
                buttonLabel,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _passCtrl = TextEditingController();
  final AuthService _auth = AuthService();
  bool _busy = false;
  String? _error;

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;

    if (name.isEmpty || email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'All fields are required');
      return;
    }
    if (!email.contains('@')) {
      setState(() => _error = 'Enter a valid email');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    final success = await _auth.signUp(
      email: email,
      fullName: name,
      password: pass,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = 'Sign up failed. Check your connection.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [secondaryBlue, primaryBlue],
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -10,
                        child: Transform.rotate(
                          angle: -0.5,
                          child: Container(
                            width: 160,
                            height: 130,
                            color: const Color(0x22FFFFFF),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: -30,
                        child: Transform.rotate(
                          angle: 0.45,
                          child: Container(
                            width: 130,
                            height: 120,
                            color: const Color(0x18FFFFFF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                IconButton(
                                  onPressed: () => Navigator.of(context).pop(),
                                  icon: const Icon(
                                    Icons.arrow_back_rounded,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                                const Text(
                                  'CeylonHS',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const Spacer(),
                                Icon(
                                  Icons.notifications_none_rounded,
                                  color: Colors.white.withValues(alpha: 0.9),
                                  size: 26,
                                ),
                              ],
                            ),
                            const Spacer(),
                            Icon(
                              Icons.location_city_rounded,
                              size: 72,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Create Your Account',
                          style: TextStyle(
                            color: Color(0xFF1D2F4D),
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign up to get instant HS codes',
                          style: TextStyle(
                            color: primaryBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        _AuthTextField(controller: _nameCtrl, hintText: 'Full Name'),
                        const SizedBox(height: 14),
                        _AuthTextField(controller: _emailCtrl, hintText: 'Email'),
                        const SizedBox(height: 14),
                        _AuthTextField(controller: _passCtrl, hintText: 'Password', obscure: true),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!,
                              style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                        ],
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [secondaryBlue, primaryBlue],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x290B3EA8),
                                  blurRadius: 12,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _busy ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: _busy
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Sign up'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _passCtrl = TextEditingController();
  final AuthService _auth = AuthService();
  bool _busy = false;
  String? _error;

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;

    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'All fields are required');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    final success = await _auth.login(email: email, password: pass);

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = 'Login failed. Check your credentials or connection.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [secondaryBlue, primaryBlue],
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -10,
                        child: Transform.rotate(
                          angle: -0.5,
                          child: Container(
                            width: 160,
                            height: 130,
                            color: const Color(0x22FFFFFF),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: -30,
                        child: Transform.rotate(
                          angle: 0.45,
                          child: Container(
                            width: 130,
                            height: 120,
                            color: const Color(0x18FFFFFF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Align(
                              alignment: Alignment.centerLeft,
                              child: IconButton(
                                onPressed: () => Navigator.of(context).pop(),
                                icon: const Icon(
                                  Icons.arrow_back_rounded,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                            ),
                            const Text(
                              'CeylonHS',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            Align(
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.location_city_rounded,
                                size: 72,
                                color: Colors.white.withValues(alpha: 0.7),
                              ),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            color: Color(0xFF1D2F4D),
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign in to access your dashboard',
                          style: TextStyle(
                            color: primaryBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        _AuthTextField(
                          controller: _emailCtrl,
                          hintText: 'Email',
                          isPrimaryBorder: true,
                        ),
                        const SizedBox(height: 14),
                        _AuthTextField(
                          controller: _passCtrl,
                          hintText: 'Password',
                          obscure: true,
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 8),
                          Text(_error!,
                              style: const TextStyle(
                                  color: Colors.redAccent, fontSize: 13)),
                        ],
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {},
                            style: TextButton.styleFrom(
                              foregroundColor: primaryBlue,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 0,
                                vertical: 2,
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [secondaryBlue, primaryBlue],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x290B3EA8),
                                  blurRadius: 12,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _busy ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: _busy
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Log in'),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute<void>(
                                  builder: (_) => const SignUpPage()),
                            );
                          },
                          child: RichText(
                            text: const TextSpan(
                              style: TextStyle(
                                color: Color(0xFF1D2F4D),
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                              children: [
                                TextSpan(text: "Don't have an "),
                                TextSpan(
                                  text: 'account?',
                                  style: TextStyle(
                                    decoration: TextDecoration.underline,
                                    color: primaryBlue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.hintText,
    this.isPrimaryBorder = false,
    this.obscure = false,
  });

  final TextEditingController controller;
  final String hintText;
  final bool isPrimaryBorder;
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 58,
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(
          color: Color(0xFF1D2F4D),
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            color: const Color(0xFF1D2F4D).withValues(alpha: 0.45),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
              color: isPrimaryBorder
                  ? const Color(0xFF0B3EA8)
                  : const Color(0xFFD5DDE8),
              width: 1.4,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFF0B3EA8),
              width: 1.8,
            ),
          ),
        ),
      ),
    );
  }
}

class MainHomePage extends StatefulWidget {
  const MainHomePage({super.key});

  @override
  State<MainHomePage> createState() => _MainHomePageState();
}

class _MainHomePageState extends State<MainHomePage> {
  int _selectedIndex = 0;
  String? _searchQuery;

  static const List<String> _labels = [
    'Home',
    'Search',
    'Recents',
    'Pricing',
    'Profile',
  ];

  static const List<IconData> _icons = [
    Icons.home_rounded,
    Icons.search_rounded,
    Icons.history_rounded,
    Icons.price_change_rounded,
    Icons.person_rounded,
  ];

  @override
  void initState() {
    super.initState();
    // Initialize favorites on app startup
    _initializeFavorites();
  }

  Future<void> _initializeFavorites() async {
    await FavoritesService().initialize();
  }

  void _navigateToSearch(String query) {
    setState(() {
      _searchQuery = query;
      _selectedIndex = 1;
    });
    // Clear the query after passing it so it doesn't re-trigger
    Future.microtask(() {
      if (mounted) setState(() => _searchQuery = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _HomeContent(onSearch: _navigateToSearch),
          SearchPage(isEmbedded: true, initialQuery: _searchQuery),
          const RecentsPage(isEmbedded: true),
          const PricingPage(isEmbedded: true),
          const _ProfileContent(),
        ],
      ),
      bottomNavigationBar: Container(
        height: 78,
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFEAEAEA)),
          ),
        ),
        child: Row(
          children: List.generate(_labels.length, (index) {
            final bool isSelected = _selectedIndex == index;
            return Expanded(
              child: InkWell(
                onTap: () {
                  setState(() {
                    _selectedIndex = index;
                  });
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _icons[index],
                      size: 23,
                      color: isSelected
                          ? const Color(0xFF0B3EA8)
                          : const Color(0xFF8E8E8E),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _labels[index],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? const Color(0xFF0B3EA8)
                            : const Color(0xFF8E8E8E),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _HomeContent extends StatefulWidget {
  const _HomeContent({this.onSearch});

  final void Function(String query)? onSearch;

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent> {
  final TextEditingController _searchController = TextEditingController();
  final SearchHistoryService _historyService = SearchHistoryService();
  List<String> _recentSearches = [];

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    final searches = await _historyService.getRecentSearches();
    if (mounted) setState(() => _recentSearches = searches);
  }

  void _submitSearch() {
    final q = _searchController.text.trim();
    if (q.isNotEmpty && widget.onSearch != null) {
      widget.onSearch!(q);
      _searchController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF4F7FC),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [secondaryBlue, primaryBlue],
                  ),
                ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Text(
                            'CeylonHS',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: Color(0xE6FFFFFF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person,
                              size: 18,
                              color: Color(0xFF0B3EA8),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Icon(
                            Icons.notifications_none_rounded,
                            size: 22,
                            color: Colors.white,
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(width: 12),
                            const Icon(
                              Icons.search,
                              color: Color(0xFF9BA5B7),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                textInputAction: TextInputAction.search,
                                onSubmitted: (_) => _submitSearch(),
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: Color(0xFF1D2F4D),
                                ),
                                decoration: InputDecoration(
                                  border: InputBorder.none,
                                  hintText: 'Search HS code or Product...',
                                  hintStyle: TextStyle(
                                    fontSize: 16,
                                    color: const Color(0xFF1D2F4D)
                                        .withValues(alpha: 0.45),
                                  ),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: _submitSearch,
                              child: Container(
                                margin: const EdgeInsets.all(4),
                                width: 38,
                                decoration: BoxDecoration(
                                  color: primaryBlue,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.search,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: const [
                          Expanded(
                            child: _HomeActionCard(
                              title: 'Favorites',
                              icon: Icons.bookmark_border_rounded,
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _HomeActionCard(
                              title: 'Tariff Docs',
                              icon: Icons.description_outlined,
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _HomeActionCard(
                              title: 'News',
                              icon: Icons.newspaper_outlined,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recent Searches',
                        style: TextStyle(
                          color: Color(0xFF2C3442),
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 98,
                        child: _recentSearches.isEmpty
                            ? const Center(
                                child: Text(
                                  'No recent searches yet',
                                  style: TextStyle(
                                    color: Color(0xFF9BA5B7),
                                    fontSize: 14,
                                  ),
                                ),
                              )
                            : ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: _recentSearches.length.clamp(0, 5),
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 10),
                                itemBuilder: (_, i) => GestureDetector(
                                  onTap: () {
                                    if (widget.onSearch != null) {
                                      widget.onSearch!(_recentSearches[i]);
                                    }
                                  },
                                  child: _RecentSearchCard(
                                      label: _recentSearches[i]),
                                ),
                              ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Featured Categories',
                        style: TextStyle(
                          color: Color(0xFF2C3442),
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => widget.onSearch?.call('Spices'),
                              child: const _FeaturedCategoryCard(
                                icon: Icons.local_dining_outlined,
                                label: 'Spices',
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => widget.onSearch?.call('Apparel'),
                              child: const _FeaturedCategoryCard(
                                icon: Icons.checkroom_outlined,
                                label: 'Apparel',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => widget.onSearch?.call('Stationery'),
                              child: const _FeaturedCategoryCard(
                                icon: Icons.edit_note_outlined,
                                label: 'Stationery',
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => widget.onSearch?.call('Minerals'),
                              child: const _FeaturedCategoryCard(
                                icon: Icons.grain_outlined,
                                label: 'Minerals',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => widget.onSearch?.call('Animal products'),
                              child: const _FeaturedCategoryCard(
                                icon: Icons.pets_outlined,
                                label: 'Animal',
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => widget.onSearch?.call('Cosmetics'),
                              child: const _FeaturedCategoryCard(
                                icon: Icons.spa_outlined,
                                label: 'Cosmetics',
                              ),
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
      ),
    );
  }
}

class _ProfileContent extends StatefulWidget {
  const _ProfileContent();

  @override
  State<_ProfileContent> createState() => _ProfileContentState();
}

class _ProfileContentState extends State<_ProfileContent> {
  static const Color primaryBlue = Color(0xFF0B3EA8);
  final AuthService _auth = AuthService();

  Future<void> _logout() async {
    await _auth.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const IntroPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.user;
    final isLoggedIn = _auth.isLoggedIn;

    if (!isLoggedIn || user == null) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.person_outline_rounded,
                  size: 64, color: primaryBlue),
              const SizedBox(height: 16),
              const Text('Not logged in',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1D2F4D))),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const LoginPage()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Sign In'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (user.isAdmin)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: primaryBlue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Admin',
                          style: TextStyle(
                              color: primaryBlue,
                              fontSize: 12,
                              fontWeight: FontWeight.w700)),
                    ),
                  const SizedBox(width: 8),
                  const Icon(Icons.person_outline_rounded,
                      color: primaryBlue, size: 22),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                width: 108,
                height: 108,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: primaryBlue, width: 2),
                ),
                child: const Icon(Icons.person_outline_rounded,
                    size: 58, color: primaryBlue),
              ),
              const SizedBox(height: 14),
              Text(
                user.displayName ?? 'User',
                style: const TextStyle(
                  color: Color(0xFF1D2F4D),
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                user.email,
                style: const TextStyle(
                  color: Color(0xFF5D6778),
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),

              // Navigation section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F7FC),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFDDE5F2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('My Activity',
                        style: TextStyle(
                          color: Color(0xFF1D2F4D),
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        )),
                    const SizedBox(height: 14),
                    _ProfileNavRow(
                      icon: Icons.favorite_rounded,
                      label: 'Favorites',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                            builder: (_) => const FavoritesPage()),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _ProfileNavRow(
                      icon: Icons.history_rounded,
                      label: 'Search History',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                            builder: (_) => const HistoryPage()),
                      ),
                    ),
                    if (user.isAdmin) ...[
                      const SizedBox(height: 12),
                      _ProfileNavRow(
                        icon: Icons.dashboard_rounded,
                        label: 'Admin Dashboard',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                              builder: (_) => const AdminDashboardPage()),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 22),
              SizedBox(
                width: 130,
                height: 42,
                child: ElevatedButton(
                  onPressed: _logout,
                  style: ElevatedButton.styleFrom(
                    elevation: 0,
                    backgroundColor: primaryBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    textStyle: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Log Out'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileNavRow extends StatelessWidget {
  const _ProfileNavRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF0B3EA8)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: const TextStyle(
                    color: Color(0xFF1D2F4D),
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  )),
            ),
            const Icon(Icons.chevron_right_rounded,
                size: 20, color: Color(0xFF9DA5B4)),
          ],
        ),
      ),
    );
  }
}

class _HomeActionCard extends StatelessWidget {
  const _HomeActionCard({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF6FA0D9)),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              title,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF2C3442),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentSearchCard extends StatelessWidget {
  const _RecentSearchCard({this.label = 'Ceylon Tea'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 118,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF318DED), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF2C3442),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          const Align(
            alignment: Alignment.bottomRight,
            child: Icon(
              Icons.access_time_rounded,
              size: 16,
              color: Color(0xFFB7BFCC),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedCategoryCard extends StatelessWidget {
  const _FeaturedCategoryCard({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 92,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 30, color: const Color(0xFF6FA0D9)),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF2C3442),
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
