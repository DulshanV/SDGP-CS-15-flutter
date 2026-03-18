import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

/// Simple local storage for recent searches using SharedPreferences.
class SearchHistoryService {
  static const String _key = 'recent_searches';

  /// Get the list of recent search queries (newest first).
  Future<List<String>> getRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_key) ?? [];
  }

  /// Add a query to recent searches. Deduplicates and limits size.
  Future<void> addSearch(String query) async {
    if (query.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final searches = prefs.getStringList(_key) ?? [];

    // Remove if already exists (so it moves to top)
    searches.remove(query.trim());
    // Insert at beginning
    searches.insert(0, query.trim());
    // Trim to max size
    if (searches.length > AppConfig.maxRecentSearches) {
      searches.removeRange(AppConfig.maxRecentSearches, searches.length);
    }

    await prefs.setStringList(_key, searches);
  }

  /// Remove a single search from history.
  Future<void> removeSearch(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final searches = prefs.getStringList(_key) ?? [];
    searches.remove(query);
    await prefs.setStringList(_key, searches);
  }

  /// Clear all recent searches.
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
