/// App-wide configuration constants.
class AppConfig {
  AppConfig._();

  /// Base URL for the HS Code Search API.
  /// Change this to your deployed server URL in production.
  ///
  /// For Android emulator use: http://10.0.2.2:8000
  /// For iOS simulator / desktop / web use: http://127.0.0.1:8000
  /// For physical device on same Wi-Fi: http://<your-lan-ip>:8000
  static const String apiBaseUrl = 'http://127.0.0.1:8000';

  /// Number of search results to request per query.
  static const int defaultSearchLimit = 10;

  /// Debounce delay for live-search-as-you-type (ms).
  static const int searchDebounceMs = 500;

  /// Maximum recent searches to store locally.
  static const int maxRecentSearches = 20;
}
