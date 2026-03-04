import 'package:flutter/foundation.dart';

/// App-wide configuration constants.
class AppConfig {
  AppConfig._();

  /// Base URL for the HS Code Search API.
  ///
  /// Resolves automatically per platform:
  ///   - Android emulator  → 10.0.2.2:8000  (special alias for host loopback)
  ///   - Web / Desktop     → 127.0.0.1:8000
  ///   - Physical device   → set PHYSICAL_DEVICE_IP build arg, or hardcode LAN IP below
  ///
  /// For a deployed backend, set the env/build var NEXT_PUBLIC_API_URL or
  /// change this to your server's public address.
  static String get apiBaseUrl {
    if (defaultTargetPlatform == TargetPlatform.android && !kIsWeb) {
      // Android emulator: host machine is reachable at 10.0.2.2
      return 'http://10.0.2.2:8000';
    }
    // Web, iOS simulator, desktop, physical device on localhost tunnel, etc.
    return 'http://127.0.0.1:8000';
  }

  /// Number of search results to request per query.
  static const int defaultSearchLimit = 10;

  /// Debounce delay for live-search-as-you-type (ms).
  static const int searchDebounceMs = 500;

  /// Maximum recent searches to store locally.
  static const int maxRecentSearches = 20;
}
