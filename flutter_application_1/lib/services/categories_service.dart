import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/category_model.dart';

/// Service for managing featured categories.
class CategoriesService {
  final String baseUrl;
  final http.Client _client;

  CategoriesService({String? baseUrl, http.Client? client})
      : baseUrl = baseUrl ?? AppConfig.apiBaseUrl,
        _client = client ?? http.Client();

  /// Get all featured categories.
  Future<List<FeaturedCategory>> getFeaturedCategories() async {
    final uri = Uri.parse('$baseUrl/api/v1/categories/featured');

    try {
      final response = await _client.get(uri).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final responseData = FeaturedCategoriesResponse.fromJson(json);
        return responseData.categories;
      } else {
        // Fallback to default categories if API fails
        return defaultFeaturedCategories.values.toList()
          ..sort((a, b) => a.order.compareTo(b.order));
      }
    } catch (e) {
      // Return default categories on error
      return defaultFeaturedCategories.values.toList()
        ..sort((a, b) => a.order.compareTo(b.order));
    }
  }

  /// Get a specific category by ID.
  Future<FeaturedCategory?> getCategory(String categoryId) async {
    final uri = Uri.parse('$baseUrl/api/v1/categories/$categoryId');

    try {
      final response = await _client.get(uri).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return FeaturedCategory.fromJson(json);
      }
      return null;
    } catch (e) {
      return defaultFeaturedCategories[categoryId];
    }
  }

  /// Search for HS codes in a specific category.
  Future<int> getCategoryCount(String categoryName) async {
    final uri = Uri.parse(
      '$baseUrl/api/v1/categories/search',
      // We could add query params like ?category=$categoryName
    );

    try {
      final response = await _client.get(uri).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return json['total'] as int? ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
}
