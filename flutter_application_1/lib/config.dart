import 'package:flutter/foundation.dart';

/// App-wide configuration constants.
class AppConfig {
  AppConfig._();

  static const String _remoteApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://ceylonhs.com',
  );

  static const bool _useLocalApi = bool.fromEnvironment(
    'USE_LOCAL_API',
    defaultValue: false,
  );

  /// Base URL for the HS Code Search API.
  ///
  /// Resolves automatically per platform:
  ///   - Android emulator  → 10.0.2.2:8000  (special alias for host loopback)
  ///   - Web / Desktop     → 127.0.0.1:8000
  ///   - Physical device   → set PHYSICAL_DEVICE_IP build arg, or hardcode LAN IP below
  ///
  /// Defaults to the deployed API at https://ceylonhs.com.
  ///
  /// Override at run/build time:
  ///   --dart-define=API_BASE_URL=https://your-api-domain
  ///   --dart-define=USE_LOCAL_API=true
  static String get apiBaseUrl {
    if (!_useLocalApi) {
      return _remoteApiBaseUrl;
    }

    if (defaultTargetPlatform == TargetPlatform.android && !kIsWeb) {
      // Android emulator: host machine is reachable at 10.0.2.2
      return 'http://10.0.2.2:8000';
    }

    // Web / desktop local backend
    return 'http://127.0.0.1:8000';
  }

  /// Number of search results to request per query.
  static const int defaultSearchLimit = 10;

  /// Debounce delay for live-search-as-you-type (ms).
  static const int searchDebounceMs = 500;

  /// Maximum recent searches to store locally.
  static const int maxRecentSearches = 20;
}
