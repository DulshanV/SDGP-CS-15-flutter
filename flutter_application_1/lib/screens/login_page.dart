import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import 'home_page.dart';
import 'signup_page.dart';

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
  String? _success;

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
      _success = null;
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
        _error = _auth.lastErrorMessage ??
            'Login failed. Check your credentials and try again.';
      });
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      _busy = true;
      _error = null;
      _success = null;
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

  Future<void> _forgotPassword() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Enter your email first.');
      return;
    }

    setState(() {
      _error = null;
      _success = null;
    });

    final ok = await _auth.sendPasswordReset(email);
    if (!mounted) return;

    setState(() {
      if (ok) {
        _success = 'Password reset email sent to $email';
      } else {
        _error = _auth.lastErrorMessage ?? 'Could not send reset email.';
      }
    });
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Align(
                              alignment: Alignment.centerLeft,
                              child: IconButton(
                                onPressed: () =>
                                    Navigator.of(context).pop(),
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
                            color: AppColors.textDark,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign in to access your dashboard',
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
                        _LoginTextField(
                          controller: _emailCtrl,
                          hintText: 'Email',
                          isPrimaryBorder: true,
                        ),
                        const SizedBox(height: 14),
                        _LoginTextField(
                          controller: _passCtrl,
                          hintText: 'Password',
                          obscure: true,
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 8),
                          Text(_error!,
                              style: const TextStyle(
                                  color: AppColors.error, fontSize: 13)),
                        ],
                        if (_success != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            _success!,
                            style: const TextStyle(
                                color: AppColors.success, fontSize: 13),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: _forgotPassword,
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primaryBlue,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 0, vertical: 2),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
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
                                color: AppColors.textDark,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                              children: [
                                TextSpan(text: "Don't have an "),
                                TextSpan(
                                  text: 'account?',
                                  style: TextStyle(
                                    decoration: TextDecoration.underline,
                                    color: AppColors.primaryBlue,
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

class _LoginTextField extends StatelessWidget {
  const _LoginTextField({
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
            borderSide: BorderSide(
              color: isPrimaryBorder
                  ? AppColors.primaryBlue
                  : AppColors.inputBorder,
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
