import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import 'home_page.dart';

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
  // UIX-012: Removed unreachable _success variable

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
        _error = _auth.lastErrorMessage ?? 'Sign up failed. Please try again.';
      });
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final success = await _auth.signInWithGoogle();
    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = _auth.lastErrorMessage ?? 'Google sign-in failed.';
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
                    gradient: AppColors.primaryGradientDiag,
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
                                  onPressed: () =>
                                      Navigator.of(context).pop(),
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
                                // UIX-001: Removed inert notification bell icon
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
                            color: AppColors.textDark,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign up to get instant HS codes',
                          style: TextStyle(
                            color: AppColors.primaryBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: OutlinedButton.icon(
                            onPressed: _busy ? null : _submitGoogle,
                            icon: const Icon(Icons.g_mobiledata, size: 24),
                            label: const Text(
                              'Continue with Google',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        _AuthTextField(
                            controller: _nameCtrl, hintText: 'Full Name'),
                        const SizedBox(height: 14),
                        _AuthTextField(
                            controller: _emailCtrl, hintText: 'Email'),
                        const SizedBox(height: 14),
                        _AuthTextField(
                            controller: _passCtrl,
                            hintText: 'Password',
                            obscure: true),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!,
                              style: const TextStyle(
                                  color: AppColors.error, fontSize: 13)),
                        ],
                        // UIX-012: Removed unreachable _success display
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradientHoriz,
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

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.hintText,
    this.obscure = false,
  });

  final TextEditingController controller;
  final String hintText;
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 58,
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(
          color: AppColors.textDark,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            color: AppColors.textDark.withValues(alpha: 0.45),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppColors.inputBorder,
              width: 1.4,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppColors.primaryBlue,
              width: 1.8,
            ),
          ),
        ),
      ),
    );
  }
}
