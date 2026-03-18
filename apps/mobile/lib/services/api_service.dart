import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/search_result.dart';
import '../models/user_model.dart';
import 'auth_service.dart';

/// Service class for communicating with the HS Code Search API.
class ApiService {
  final String baseUrl;
  final http.Client _client;

  ApiService({String? baseUrl, http.Client? client})
      : baseUrl = baseUrl ?? AppConfig.apiBaseUrl,
        _client = client ?? http.Client();

  /// Search for HS codes by natural language query or HS code.
  ///
  /// Supports typo correction on the server side.
  Future<SearchResponse> search(String query, {int? limit}) async {
    final params = {
      'q': query,
      'limit': (limit ?? AppConfig.defaultSearchLimit).toString(),
    };
    final uri = Uri.parse('$baseUrl/api/v1/search').replace(queryParameters: params);

    final response = await _client.get(uri).timeout(
      const Duration(seconds: 30),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return SearchResponse.fromJson(json);
    } else {
      throw ApiException(
        'Search failed',
        statusCode: response.statusCode,
        body: response.body,
      );
    }
  }

  /// Get full details for a specific HS code, including children and hierarchy.
  Future<HsCodeDetail> getHsCodeDetail(String hscode) async {
    final uri = Uri.parse('$baseUrl/api/v1/hs/$hscode');

    final response = await _client.get(uri).timeout(
      const Duration(seconds: 15),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return HsCodeDetail.fromJson(json);
    } else if (response.statusCode == 404) {
      throw ApiException('HS code not found: $hscode', statusCode: 404);
    } else {
      throw ApiException(
        'Failed to fetch HS code detail',
        statusCode: response.statusCode,
        body: response.body,
      );
    }
  }

  /// Get top-level categories (sections and their chapters).
  Future<List<CategorySection>> getCategories() async {
    final uri = Uri.parse('$baseUrl/api/v1/categories');

    final response = await _client.get(uri).timeout(
      const Duration(seconds: 15),
    );

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body) as List<dynamic>;
      return list
          .map((e) => CategorySection.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw ApiException(
        'Failed to fetch categories',
        statusCode: response.statusCode,
        body: response.body,
      );
    }
  }

  /// Check if the API server is reachable.
  Future<bool> healthCheck() async {
    try {
      final uri = Uri.parse('$baseUrl/api');
      final response = await _client.get(uri).timeout(
        const Duration(seconds: 5),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // ── Authenticated Endpoints ──

  Map<String, String> get _authHeaders => AuthService().authHeaders;

  /// Record a search in server-side history (fire-and-forget).
  Future<void> recordSearch({
    required String query,
    int resultsCount = 0,
    String? topResultHscode,
    String? topResultDescription,
  }) async {
    if (!AuthService().isLoggedIn) return;
    try {
      final params = {
        'query_text': query,
        'results_count': resultsCount.toString(),
        if (topResultHscode != null) 'top_result_hscode': topResultHscode,
        if (topResultDescription != null)
          'top_result_description': topResultDescription,
      };
      final uri = Uri.parse('$baseUrl/api/v1/users/me/history')
          .replace(queryParameters: params);
      await _client.post(uri, headers: _authHeaders).timeout(
        const Duration(seconds: 5),
      );
    } catch (_) {
      // Silently fail — history recording is best-effort
    }
  }

  /// Get paginated server-side search history.
  Future<SearchHistoryResponse> getSearchHistory({
    int page = 1,
    int pageSize = 20,
  }) async {
    final params = {
      'page': page.toString(),
      'page_size': pageSize.toString(),
    };
    final uri = Uri.parse('$baseUrl/api/v1/users/me/history')
        .replace(queryParameters: params);

    final response = await _client.get(uri, headers: _authHeaders).timeout(
      const Duration(seconds: 10),
    );

    if (response.statusCode == 200) {
      return SearchHistoryResponse.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw ApiException('Failed to load history',
          statusCode: response.statusCode, body: response.body);
    }
  }

  /// Clear all search history for the current user.
  Future<void> clearSearchHistory() async {
    final uri = Uri.parse('$baseUrl/api/v1/users/me/history');
    final response = await _client.delete(uri, headers: _authHeaders).timeout(
      const Duration(seconds: 10),
    );
    if (response.statusCode != 200) {
      throw ApiException('Failed to clear history',
          statusCode: response.statusCode);
    }
  }

  // ── Favorites ──

  /// Get the user's favorites list.
  Future<FavoriteListResponse> getFavorites({
    int page = 1,
    int pageSize = 50,
  }) async {
    final params = {
      'page': page.toString(),
      'page_size': pageSize.toString(),
    };
    final uri = Uri.parse('$baseUrl/api/v1/users/me/favorites')
        .replace(queryParameters: params);

    final response = await _client.get(uri, headers: _authHeaders).timeout(
      const Duration(seconds: 10),
    );

    if (response.statusCode == 200) {
      return FavoriteListResponse.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } else {
      throw ApiException('Failed to load favorites',
          statusCode: response.statusCode, body: response.body);
    }
  }

  /// Add an HS code to favorites.
  Future<FavoriteItem> addFavorite({
    required String hscode,
    String? description,
    String? section,
  }) async {
    final uri = Uri.parse('$baseUrl/api/v1/users/me/favorites');
    final body = jsonEncode({
      'hscode': hscode,
      if (description != null) 'description': description,
      if (section != null) 'section': section,
    });
    final response =
        await _client.post(uri, headers: _authHeaders, body: body).timeout(
      const Duration(seconds: 10),
    );

    if (response.statusCode == 200) {
      return FavoriteItem.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } else if (response.statusCode == 409) {
      throw ApiException('Already in favorites', statusCode: 409);
    } else {
      throw ApiException('Failed to add favorite',
          statusCode: response.statusCode, body: response.body);
    }
  }

  /// Remove an HS code from favorites.
  Future<void> removeFavorite(String hscode) async {
    final uri = Uri.parse('$baseUrl/api/v1/users/me/favorites/$hscode');
    final response = await _client.delete(uri, headers: _authHeaders).timeout(
      const Duration(seconds: 10),
    );
    if (response.statusCode != 200) {
      throw ApiException('Failed to remove favorite',
          statusCode: response.statusCode);
    }
  }

  // ── Admin ──

  /// Get search trends (admin only).
  Future<List<TrendItem>> getSearchTrends({int days = 7, int limit = 20}) async {
    final params = {
      'days': days.toString(),
      'limit': limit.toString(),
    };
    final uri = Uri.parse('$baseUrl/api/v1/admin/trends')
        .replace(queryParameters: params);

    final response = await _client.get(uri, headers: _authHeaders).timeout(
      const Duration(seconds: 10),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return (json['trends'] as List<dynamic>)
          .map((e) => TrendItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } else if (response.statusCode == 403) {
      throw ApiException('Admin access required', statusCode: 403);
    } else {
      throw ApiException('Failed to load trends',
          statusCode: response.statusCode);
    }
  }

  /// Get platform stats (admin only).
  Future<PlatformStats> getPlatformStats() async {
    final uri = Uri.parse('$baseUrl/api/v1/admin/stats');
    final response = await _client.get(uri, headers: _authHeaders).timeout(
      const Duration(seconds: 10),
    );

    if (response.statusCode == 200) {
      return PlatformStats.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } else if (response.statusCode == 403) {
      throw ApiException('Admin access required', statusCode: 403);
    } else {
      throw ApiException('Failed to load stats',
          statusCode: response.statusCode);
    }
  }

  void dispose() {
    _client.close();
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? body;

  ApiException(this.message, {this.statusCode, this.body});

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';
}
