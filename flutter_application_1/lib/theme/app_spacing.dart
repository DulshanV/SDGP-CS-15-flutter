/// Spacing constants based on a 4px grid system.
///
/// Use these instead of arbitrary padding/margin values
/// to maintain visual consistency across the app.
abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  /// Standard horizontal padding for screen content.
  static const double screenPadding = 20;

  /// Standard card border radius.
  static const double cardRadius = 12;

  /// Large card border radius (e.g., profile cards).
  static const double cardRadiusLg = 16;

  /// Extra large border radius (e.g., auth pages).
  static const double cardRadiusXl = 22;

  /// Standard button border radius.
  static const double buttonRadius = 12;

  /// Chip / badge border radius.
  static const double chipRadius = 10;
}
