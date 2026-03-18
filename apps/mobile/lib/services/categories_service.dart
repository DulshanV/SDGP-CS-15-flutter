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

  List<FeaturedCategory> _defaultCategories() {
    return defaultFeaturedCategories.values.toList()
      ..sort((a, b) => a.order.compareTo(b.order));
  }

  /// Get all featured categories.
  Future<List<FeaturedCategory>> getFeaturedCategories() async {
    final uri = Uri.parse('$baseUrl/api/v1/categories/featured');

    try {
      final response = await _client.get(uri).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);

        if (decoded is Map<String, dynamic>) {
          final responseData = FeaturedCategoriesResponse.fromJson(decoded);
          if (responseData.categories.isNotEmpty) {
            return responseData.categories;
          }
        }

        return _defaultCategories();
      } else {
        // Fallback to default categories if API fails
        return _defaultCategories();
      }
    } catch (e) {
      // Return default categories on error
      return _defaultCategories();
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
    // No specific count endpoint implemented yet, returning 0
    return 0;
  }
}
