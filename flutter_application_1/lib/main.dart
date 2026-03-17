import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/intro_page.dart';
import 'services/auth_service.dart';
import 'screens/home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // UIX-027: Attempt to restore previous session
  await AuthService().tryRestoreSession();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = AuthService().isLoggedIn;
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CeylonHS',
      theme: AppTheme.lightTheme,
      home: isLoggedIn ? const MainHomePage() : const IntroPage(),
    );
  }
}
