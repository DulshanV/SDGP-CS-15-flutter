import 'package:flutter/material.dart';

/// CeylonHS App Theme Configuration
/// Centralized color and theme definitions for consistency across the app
class AppTheme {
  // Primary color palette
  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);
  static const Color accentBlue = Color(0xFF4DA7FF);
  static const Color softBlue = Color(0xFFD7EAFF);

  // Gradient definitions
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryBlue, secondaryBlue],
  );

  // Text styles
  static const TextStyle appTitleStyle = TextStyle(
    color: Colors.white,
    fontSize: 52,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.3,
  );

  static const TextStyle subtitleStyle = TextStyle(
    color: softBlue,
    fontSize: 24,
    fontWeight: FontWeight.w500,
    fontStyle: FontStyle.italic,
    letterSpacing: 0.3,
    height: 1.25,
  );

  static const TextStyle accentTextStyle = TextStyle(
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
  );

  // Button styles
  static ButtonStyle primaryButtonStyle = ElevatedButton.styleFrom(
    elevation: 0,
    backgroundColor: accentBlue,
    foregroundColor: Colors.white,
    minimumSize: const Size.fromHeight(48),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  );

  static ButtonStyle outlinedButtonStyle = OutlinedButton.styleFrom(
    foregroundColor: Colors.white,
    minimumSize: const Size.fromHeight(48),
    side: const BorderSide(color: softBlue, width: 1.5),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  );

  static const TextStyle buttonTextStyle = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w700,
  );
}