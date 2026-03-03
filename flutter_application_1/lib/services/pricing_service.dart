import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/pricing_model.dart';
import 'auth_service.dart';

/// Service for managing pricing plans and subscriptions.
class PricingService {
  final String baseUrl;
  final http.Client _client;
  final AuthService _authService;

  PricingService({
    String? baseUrl,
    http.Client? client,
    AuthService? authService,
  })  : baseUrl = baseUrl ?? AppConfig.apiBaseUrl,
        _client = client ?? http.Client(),
        _authService = authService ?? AuthService();

  /// Get all available pricing plans.
  Future<List<PricingPlan>> getAllPricingPlans() async {
    final uri = Uri.parse('$baseUrl/api/v1/pricing/plans');

    try {
      final response = await _client.get(uri).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final plansJson = json['plans'] as List<dynamic>? ?? [];
        return plansJson
            .map((p) => PricingPlan.fromJson(p as Map<String, dynamic>))
            .toList();
      } else {
        // Fallback to local pricing tiers if API fails
        return PricingPlan.getAllPlans();
      }
    } catch (e) {
      // Fallback to local pricing tiers if request fails
      return PricingPlan.getAllPlans();
    }
  }

  /// Get user's current subscription.
  Future<UserSubscription> getUserSubscription(String userId) async {
    final token = await _authService.getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final uri = Uri.parse('$baseUrl/api/v1/pricing/subscription/$userId');

    try {
      final response = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return UserSubscription.fromJson(json);
      } else if (response.statusCode == 404) {
        // User has no subscription yet, return free tier
        return UserSubscription.free(userId);
      } else {
        throw Exception(
          'Failed to fetch subscription: ${response.statusCode}',
        );
      }
    } catch (e) {
      // Return free tier as fallback
      return UserSubscription.free(userId);
    }
  }

  /// Upgrade user's subscription to a specific tier.
  Future<UserSubscription> upgradeSubscription(
    String userId,
    PricingTier tier,
  ) async {
    final token = await _authService.getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final uri = Uri.parse('$baseUrl/api/v1/pricing/subscription/$userId/upgrade');
    final body = jsonEncode({
      'tier': tier.displayName.toLowerCase(),
    });

    final response = await _client.post(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: body,
    ).timeout(
      const Duration(seconds: 15),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return UserSubscription.fromJson(json);
    } else {
      throw Exception(
        'Failed to upgrade subscription: ${response.statusCode}',
      );
    }
  }

  /// Get pricing details for a specific plan.
  Future<PricingPlan> getPricingPlan(PricingTier tier) async {
    final plans = await getAllPricingPlans();
    return plans.firstWhere(
      (plan) => plan.tier == tier,
      orElse: () => PricingPlan.fromTier(tier),
    );
  }

  /// Check if user is on a specific tier or higher.
  Future<bool> isUserOnTier(String userId, PricingTier requiredTier) async {
    final subscription = await getUserSubscription(userId);
    return subscription.currentTier.index >= requiredTier.index;
  }

  /// Get feature availability for current user subscription.
  Future<List<String>> getAvailableFeatures(String userId) async {
    final subscription = await getUserSubscription(userId);
    return subscription.currentTier.features;
  }
}
