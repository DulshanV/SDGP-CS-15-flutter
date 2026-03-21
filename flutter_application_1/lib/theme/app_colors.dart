import 'package:flutter/material.dart';

/// Centralized color constants for the CeylonHS app.
///
/// All screen-level color constants have been consolidated here.
/// Use [AppColors] instead of defining colors in individual State classes.
abstract final class AppColors {
  // ── Brand blues ──
  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);
  static const Color accentBlue = Color(0xFF4DA7FF);
  static const Color softBlue = Color(0xFFD7EAFF);
  static const Color linkBlue = Color(0xFF1967D2);
  static const Color iconBlue = Color(0xFF2E73D3);
  static const Color lightIconBlue = Color(0xFF6FA0D9);

  // ── Surfaces & backgrounds ──
  static const Color surface = Color(0xFFF2F4F8);
  static const Color surfaceAlt = Color(0xFFF4F7FC);
  static const Color backgroundBlue = Color(0xFFE8F0FE);
  static const Color backgroundBlueLight = Color(0xFFEAF3FF);
  static const Color cardBorder = Color(0xFFDADCE0);
  static const Color inputBorder = Color(0xFFD5DDE8);
  static const Color navBorder = Color(0xFFEAEAEA);
  static const Color profileBorder = Color(0xFFDDE5F2);
  static const Color categoryBorder = Color(0xFFD9E5F5);

  // ── Text ──
  static const Color textDark = Color(0xFF1D2F4D);
  static const Color textHeading = Color(0xFF2C3442);
  static const Color textMedium = Color(0xFF5D6778);
  static const Color textLight = Color(0xFF9BA5B7);
  static const Color textMuted = Color(0xFFB7BFCC);
  static const Color textEmpty = Color(0xFFCCD2DC);
  static const Color navInactive = Color(0xFF8E8E8E);

  // ── Semantic ──
  static const Color success = Color(0xFF34A853);
  static const Color successBg = Color(0xFFE6F4EA);
  static const Color successText = Color(0xFF137333);
  static const Color successBorder = Color(0xFFA8DAB5);
  static const Color warning = Color(0xFFF9AB00);
  static const Color warningBg = Color(0xFFFEF7E0);
  static const Color warningText = Color(0xFFB06000);
  static const Color warningBorder = Color(0xFFFDD663);
  static const Color error = Colors.redAccent;
  static const Color chipBg = Color(0xFFF1F3F4);

  // ── Gradient presets ──
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryBlue, secondaryBlue],
  );

  static const LinearGradient primaryGradientDiag = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [secondaryBlue, primaryBlue],
  );

  static const LinearGradient primaryGradientHoriz = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [secondaryBlue, primaryBlue],
  );

  static const LinearGradient searchHeaderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF133665), Color(0xFF3A9EEA)],
  );
}
