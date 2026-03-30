# CeylonHS Project - My Contributions

This document contains all the custom logic, UI implementations, and features developed for the Project.

---

## File: config.dart

```dart
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

```

---

## File: main.dart

```dart
import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/intro_page.dart';
import 'services/auth_service.dart';
import 'screens/home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // UIX-027: Attempt to restore previous session
  await AuthService().tryRestoreSession();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = AuthService().isLoggedIn;
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CeylonHS',
      theme: AppTheme.lightTheme,
      home: isLoggedIn ? const MainHomePage() : const IntroPage(),
    );
  }
}

```

---

## File: models/category_model.dart

```dart
import 'package:flutter/material.dart';

/// Featured category data model.
class FeaturedCategory {
  final String id;
  final String name;
  final String description;
  final String? icon;
  final String iconCodePoint; // Unicode code point for icon (e.g., "0xfXXXX")
  final int order;
  final bool isActive;
  final DateTime createdAt;

  FeaturedCategory({
    required this.id,
    required this.name,
    required this.description,
    this.icon,
    required this.iconCodePoint,
    required this.order,
    this.isActive = true,
    required this.createdAt,
  });

  factory FeaturedCategory.fromJson(Map<String, dynamic> json) {
    return FeaturedCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      icon: json['icon'] as String?,
      iconCodePoint: json['icon_code_point'] as String? ?? '0xe3f2fd',
      order: json['order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'icon': icon,
        'icon_code_point': iconCodePoint,
        'order': order,
        'is_active': isActive,
        'created_at': createdAt.toIso8601String(),
      };

  /// Get the IconData from the stored code point.
  IconData getIconData() {
    try {
      final normalized = iconCodePoint.trim().toLowerCase().startsWith('0x')
          ? iconCodePoint.trim().substring(2)
          : iconCodePoint.trim();
      final codePoint = int.parse(normalized, radix: 16);
      return IconData(codePoint, fontFamily: 'MaterialIcons');
    } catch (e) {
      // Fallback to default icon
      return Icons.category;
    }
  }
}

class FeaturedCategoriesResponse {
  final List<FeaturedCategory> categories;
  final int total;

  FeaturedCategoriesResponse({
    required this.categories,
    required this.total,
  });

  factory FeaturedCategoriesResponse.fromJson(Map<String, dynamic> json) {
    return FeaturedCategoriesResponse(
      categories: (json['categories'] as List<dynamic>?)
              ?.map((e) => FeaturedCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      total: json['total'] as int? ?? 0,
    );
  }
}

/// Predefined featured categories with icons.
final Map<String, FeaturedCategory> defaultFeaturedCategories = {
  'spices': FeaturedCategory(
    id: 'spices',
    name: 'Spices',
    description: 'Aromatic spices and seasonings',
    iconCodePoint: '0xf0e6', // local_dining_outlined
    order: 0,
    createdAt: DateTime.now(),
  ),
  'apparel': FeaturedCategory(
    id: 'apparel',
    name: 'Apparel',
    description: 'Clothing and textile products',
    iconCodePoint: '0xe4af', // checkroom_outlined
    order: 1,
    createdAt: DateTime.now(),
  ),
  'stationery': FeaturedCategory(
    id: 'stationery',
    name: 'Stationery',
    description: 'Paper and writing supplies',
    iconCodePoint: '0xe3c9', // edit_note_outlined
    order: 2,
    createdAt: DateTime.now(),
  ),
  'minerals': FeaturedCategory(
    id: 'minerals',
    name: 'Minerals',
    description: 'Raw minerals and ores',
    iconCodePoint: '0xebe7', // grain_outlined
    order: 3,
    createdAt: DateTime.now(),
  ),
  'animal_products': FeaturedCategory(
    id: 'animal_products',
    name: 'Animal',
    description: 'Animal products and derivatives',
    iconCodePoint: '0xea56', // pets_outlined
    order: 4,
    createdAt: DateTime.now(),
  ),
  'cosmetics': FeaturedCategory(
    id: 'cosmetics',
    name: 'Cosmetics',
    description: 'Beauty and personal care',
    iconCodePoint: '0xea1b', // spa_outlined
    order: 5,
    createdAt: DateTime.now(),
  ),
};

```

---

## File: models/pricing_model.dart

```dart
/// Pricing-related data models.

enum PricingTier {
  starter,
  business,
  enterprise,
}

extension PricingTierX on PricingTier {
  String get displayName {
    return switch (this) {
      PricingTier.starter => 'Starter',
      PricingTier.business => 'Business',
      PricingTier.enterprise => 'Enterprise',
    };
  }

  double get price {
    return switch (this) {
      PricingTier.starter => 3.0,
      PricingTier.business => 5.0,
      PricingTier.enterprise => 9.0,
    };
  }

  String get priceString => '\$${price.toStringAsFixed(2)}';

  bool get isPopular {
    return this == PricingTier.business;
  }

  String get description {
    return switch (this) {
      PricingTier.starter => 'For individuals',
      PricingTier.business => 'For small teams',
      PricingTier.enterprise => 'For enterprises',
    };
  }

  List<String> get features {
    return switch (this) {
      PricingTier.starter => [
          'Up to 100 searches/month',
          'Basic HS code lookup',
          'Search history (7 days)',
          'Email support',
        ],
      PricingTier.business => [
          'Up to 500 searches/month',
          'Advanced HS code lookup',
          'Search history (30 days)',
          'Favorites & collections',
          'Priority email support',
          'API access (limited)',
        ],
      PricingTier.enterprise => [
          'Unlimited searches',
          'All features included',
          'Search history (unlimited)',
          'Favorites & collections',
          '24/7 phone & email support',
          'Full API access',
          'Custom integrations',
          'Dedicated account manager',
        ],
    };
  }
}

class PricingPlan {
  final PricingTier tier;
  final String displayName;
  final double price;
  final String description;
  final List<String> features;
  final bool isPopular;

  PricingPlan({
    required this.tier,
    required this.displayName,
    required this.price,
    required this.description,
    required this.features,
    this.isPopular = false,
  });

  factory PricingPlan.fromTier(PricingTier tier) {
    return PricingPlan(
      tier: tier,
      displayName: tier.displayName,
      price: tier.price,
      description: tier.description,
      features: tier.features,
      isPopular: tier.isPopular,
    );
  }

  static List<PricingPlan> getAllPlans() {
    return [
      PricingPlan.fromTier(PricingTier.starter),
      PricingPlan.fromTier(PricingTier.business),
      PricingPlan.fromTier(PricingTier.enterprise),
    ];
  }

  Map<String, dynamic> toJson() => {
        'tier': tier.toString(),
        'display_name': displayName,
        'price': price,
        'description': description,
        'features': features,
        'is_popular': isPopular,
      };

  factory PricingPlan.fromJson(Map<String, dynamic> json) {
    return PricingPlan(
      tier: PricingTier.values.firstWhere(
        (t) => t.toString() == json['tier'],
        orElse: () => PricingTier.starter,
      ),
      displayName: json['display_name'] as String? ?? 'Plan',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] as String? ?? '',
      features: List<String>.from(json['features'] as List? ?? []),
      isPopular: json['is_popular'] as bool? ?? false,
    );
  }
}

class UserSubscription {
  final String userId;
  final PricingTier currentTier;
  final DateTime? subscriptionStartDate;
  final DateTime? subscriptionEndDate;
  final bool isActive;

  UserSubscription({
    required this.userId,
    required this.currentTier,
    this.subscriptionStartDate,
    this.subscriptionEndDate,
    this.isActive = true,
  });

  factory UserSubscription.free(String userId) {
    return UserSubscription(
      userId: userId,
      currentTier: PricingTier.starter,
      isActive: true,
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'current_tier': currentTier.toString(),
        'subscription_start_date': subscriptionStartDate?.toIso8601String(),
        'subscription_end_date': subscriptionEndDate?.toIso8601String(),
        'is_active': isActive,
      };

  factory UserSubscription.fromJson(Map<String, dynamic> json) {
    return UserSubscription(
      userId: json['user_id'] as String,
      currentTier: PricingTier.values.firstWhere(
        (t) =>
            t.toString() ==
            json['current_tier'].toString().replaceFirst('PricingTier.', ''),
        orElse: () => PricingTier.starter,
      ),
      subscriptionStartDate: json['subscription_start_date'] != null
          ? DateTime.parse(json['subscription_start_date'] as String)
          : null,
      subscriptionEndDate: json['subscription_end_date'] != null
          ? DateTime.parse(json['subscription_end_date'] as String)
          : null,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

```

---

## File: models/search_result.dart

```dart
/// Data models for the HS Code Search API responses.

class HsCodeResult {
  final String hscode;
  final String description;
  final String section;
  final int level;
  final String parent;
  final double relevancePct;
  final List<String> hierarchyPath;

  const HsCodeResult({
    required this.hscode,
    required this.description,
    required this.section,
    required this.level,
    required this.parent,
    required this.relevancePct,
    required this.hierarchyPath,
  });

  factory HsCodeResult.fromJson(Map<String, dynamic> json) {
    return HsCodeResult(
      hscode: json['hscode'] as String? ?? '',
      description: json['description'] as String? ?? '',
      section: json['section'] as String? ?? '',
      level: json['level'] as int? ?? 0,
      parent: json['parent'] as String? ?? '',
      relevancePct: (json['relevance_pct'] as num?)?.toDouble() ?? 0.0,
      hierarchyPath: (json['hierarchy_path'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class SearchResponse {
  final String query;
  final String? correctedQuery;
  final String? enrichmentInfo;
  final int totalResults;
  final List<HsCodeResult> results;

  const SearchResponse({
    required this.query,
    required this.correctedQuery,
    this.enrichmentInfo,
    required this.totalResults,
    required this.results,
  });

  factory SearchResponse.fromJson(Map<String, dynamic> json) {
    // enrichment_info can be a plain string or a map with 'explanation' key
    String? enrichment;
    final rawEnrichment = json['enrichment_info'];
    if (rawEnrichment is String) {
      enrichment = rawEnrichment;
    } else if (rawEnrichment is Map) {
      enrichment = rawEnrichment['explanation'] as String?;
    }

    return SearchResponse(
      query: json['query'] as String? ?? '',
      correctedQuery: json['corrected_query'] as String?,
      enrichmentInfo: enrichment,
      totalResults: json['total_results'] as int? ?? 0,
      results: (json['results'] as List<dynamic>?)
              ?.map((e) => HsCodeResult.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class HsCodeDetail {
  final String hscode;
  final String description;
  final String section;
  final int level;
  final String parent;
  final List<HsCodeChild> children;
  final List<String> hierarchyPath;

  const HsCodeDetail({
    required this.hscode,
    required this.description,
    required this.section,
    required this.level,
    required this.parent,
    required this.children,
    required this.hierarchyPath,
  });

  factory HsCodeDetail.fromJson(Map<String, dynamic> json) {
    return HsCodeDetail(
      hscode: json['hscode'] as String? ?? '',
      description: json['description'] as String? ?? '',
      section: json['section'] as String? ?? '',
      level: json['level'] as int? ?? 0,
      parent: json['parent'] as String? ?? '',
      children: (json['children'] as List<dynamic>?)
              ?.map((e) => HsCodeChild.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      hierarchyPath: (json['hierarchy_path'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class HsCodeChild {
  final String hscode;
  final String description;
  final int level;

  const HsCodeChild({
    required this.hscode,
    required this.description,
    required this.level,
  });

  factory HsCodeChild.fromJson(Map<String, dynamic> json) {
    return HsCodeChild(
      hscode: json['hscode'] as String? ?? '',
      description: json['description'] as String? ?? '',
      level: json['level'] as int? ?? 0,
    );
  }
}

class CategorySection {
  final String section;
  final List<HsCodeChild> chapters;

  const CategorySection({
    required this.section,
    required this.chapters,
  });

  factory CategorySection.fromJson(Map<String, dynamic> json) {
    return CategorySection(
      section: json['section'] as String? ?? '',
      chapters: (json['chapters'] as List<dynamic>?)
              ?.map((e) => HsCodeChild.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

```

---

## File: models/user_model.dart

```dart
/// Data models for user profile, search history, and favorites.

class UserProfile {
  final String id;
  final String firebaseUid;
  final String email;
  final String? displayName;
  final String? photoUrl;
  final String role;
  final DateTime createdAt;

  UserProfile({
    required this.id,
    required this.firebaseUid,
    required this.email,
    this.displayName,
    this.photoUrl,
    required this.role,
    required this.createdAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] as String,
        firebaseUid: json['firebase_uid'] as String,
        email: json['email'] as String,
        displayName: json['display_name'] as String?,
        photoUrl: json['photo_url'] as String?,
        role: json['role'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  bool get isAdmin => role == 'admin';
}

class SearchHistoryItem {
  final String id;
  final String queryText;
  final String? topResultHscode;
  final String? topResultDescription;
  final int resultsCount;
  final DateTime createdAt;

  SearchHistoryItem({
    required this.id,
    required this.queryText,
    this.topResultHscode,
    this.topResultDescription,
    required this.resultsCount,
    required this.createdAt,
  });

  factory SearchHistoryItem.fromJson(Map<String, dynamic> json) =>
      SearchHistoryItem(
        id: json['id'] as String,
        queryText: json['query_text'] as String,
        topResultHscode: json['top_result_hscode'] as String?,
        topResultDescription: json['top_result_description'] as String?,
        resultsCount: json['results_count'] as int? ?? 0,
        createdAt: DateTime.parse(json['created_at'] as String),
      );
}

class SearchHistoryResponse {
  final int total;
  final List<SearchHistoryItem> items;

  SearchHistoryResponse({required this.total, required this.items});

  factory SearchHistoryResponse.fromJson(Map<String, dynamic> json) =>
      SearchHistoryResponse(
        total: json['total'] as int,
        items: (json['items'] as List<dynamic>)
            .map((e) =>
                SearchHistoryItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class FavoriteItem {
  final String id;
  final String hscode;
  final String? description;
  final String? section;
  final DateTime createdAt;

  FavoriteItem({
    required this.id,
    required this.hscode,
    this.description,
    this.section,
    required this.createdAt,
  });

  factory FavoriteItem.fromJson(Map<String, dynamic> json) => FavoriteItem(
        id: json['id'] as String,
        hscode: json['hscode'] as String,
        description: json['description'] as String?,
        section: json['section'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String),
      );
}

class FavoriteListResponse {
  final int total;
  final List<FavoriteItem> items;

  FavoriteListResponse({required this.total, required this.items});

  factory FavoriteListResponse.fromJson(Map<String, dynamic> json) =>
      FavoriteListResponse(
        total: json['total'] as int,
        items: (json['items'] as List<dynamic>)
            .map((e) => FavoriteItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class TrendItem {
  final String queryText;
  final int searchCount;
  final DateTime lastSearched;

  TrendItem({
    required this.queryText,
    required this.searchCount,
    required this.lastSearched,
  });

  factory TrendItem.fromJson(Map<String, dynamic> json) => TrendItem(
        queryText: json['query_text'] as String,
        searchCount: json['search_count'] as int,
        lastSearched: DateTime.parse(json['last_searched'] as String),
      );
}

class PlatformStats {
  final int totalUsers;
  final int totalSearches;
  final int searchesToday;

  PlatformStats({
    required this.totalUsers,
    required this.totalSearches,
    required this.searchesToday,
  });

  factory PlatformStats.fromJson(Map<String, dynamic> json) => PlatformStats(
        totalUsers: json['total_users'] as int,
        totalSearches: json['total_searches'] as int,
        searchesToday: json['searches_today'] as int,
      );
}

```

---

## File: screens/admin_dashboard.dart

```dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/logo_app_bar.dart';

/// Admin dashboard showing platform stats and search trends.
class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final ApiService _api = ApiService();
  PlatformStats? _stats;
  List<TrendItem> _trends = [];
  bool _isLoading = true;
  String? _error;
  int _trendDays = 7;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (!AuthService().isLoggedIn) {
      setState(() {
        _isLoading = false;
        _error = 'Please log in as admin.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _api.getPlatformStats(),
        _api.getSearchTrends(days: _trendDays),
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0] as PlatformStats;
          _trends = results[1] as List<TrendItem>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: LogoAppBar(
        title: 'Admin Dashboard',
        showLogo: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.admin_panel_settings,
                  size: 64, color: AppColors.textMuted),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textMedium)),
              const SizedBox(height: 16),
              OutlinedButton(
                  onPressed: _loadData, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats cards
            if (_stats != null) ...[
              const Text(
                'Platform Overview',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textHeading),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Users',
                      value: '${_stats!.totalUsers}',
                      icon: Icons.people_outline,
                      color: AppColors.primaryBlue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Total Searches',
                      value: '${_stats!.totalSearches}',
                      icon: Icons.search,
                      color: AppColors.linkBlue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Today',
                      value: '${_stats!.searchesToday}',
                      icon: Icons.today,
                      color: const Color(0xFF0D904F),
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 28),

            // Trends section
            Row(
              children: [
                const Text(
                  'Search Trends',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textHeading),
                ),
                const Spacer(),
                DropdownButton<int>(
                  value: _trendDays,
                  underline: const SizedBox(),
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.textMedium),
                  items: const [
                    DropdownMenuItem(value: 1, child: Text('Today')),
                    DropdownMenuItem(value: 7, child: Text('7 days')),
                    DropdownMenuItem(value: 30, child: Text('30 days')),
                    DropdownMenuItem(value: 90, child: Text('90 days')),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      _trendDays = val;
                      _loadData();
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 14),

            if (_trends.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.trending_up, size: 48, color: AppColors.textMuted),
                    SizedBox(height: 12),
                    Text('No search data for this period',
                        style: TextStyle(
                            color: AppColors.textLight, fontSize: 14)),
                  ],
                ),
              )
            else
              ...List.generate(_trends.length, (i) {
                final trend = _trends[i];
                final maxCount =
                    _trends.first.searchCount.toDouble();
                final barFraction =
                    maxCount > 0 ? trend.searchCount / maxCount : 0.0;

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: i < 3
                                  ? AppColors.primaryBlue
                                  : AppColors.backgroundBlue,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${i + 1}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color:
                                    i < 3 ? Colors.white : AppColors.primaryBlue,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              trend.queryText,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15),
                            ),
                          ),
                          Text(
                            '${trend.searchCount}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primaryBlue,
                                fontSize: 16),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: barFraction,
                          minHeight: 6,
                          backgroundColor: AppColors.backgroundBlue,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(
                            i < 3
                                ? AppColors.primaryBlue
                                : AppColors.accentBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
                fontSize: 24, fontWeight: FontWeight.w800, color: color),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 12, color: AppColors.textMedium, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

```

---

## File: screens/favorites_page.dart

```dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/logo_app_bar.dart';
import 'hs_code_detail_page.dart';

/// Page showing the user's favorited HS codes.
class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  final ApiService _api = ApiService();
  List<FavoriteItem> _favorites = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadFavorites() async {
    if (!AuthService().isLoggedIn) {
      setState(() {
        _isLoading = false;
        _error = 'Please log in to view favorites.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final resp = await _api.getFavorites();
      if (mounted) {
        setState(() {
          _favorites = resp.items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _removeFavorite(FavoriteItem fav) async {
    try {
      await _api.removeFavorite(fav.hscode);
      setState(() => _favorites.remove(fav));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Removed ${fav.hscode} from favorites')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: const LogoAppBar(
        title: 'Favorites',
        showLogo: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.bookmark_border, size: 64, color: AppColors.textMuted),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton(onPressed: _loadFavorites, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    if (_favorites.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bookmark_border, size: 64, color: AppColors.textMuted),
            SizedBox(height: 16),
            Text(
              'No favorites yet',
              style: TextStyle(fontSize: 18, color: AppColors.textMedium),
            ),
            SizedBox(height: 8),
            Text(
              'Search for HS codes and tap the heart icon\nto save them here.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textLight),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadFavorites,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _favorites.length,
        itemBuilder: (context, index) {
          final fav = _favorites[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              title: Text(
                fav.hscode,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryBlue,
                  fontFamily: 'monospace',
                  fontSize: 16,
                ),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (fav.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      fav.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppColors.textMedium),
                    ),
                  ],
                  if (fav.section != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Section ${fav.section}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textLight),
                    ),
                  ],
                ],
              ),
              trailing: IconButton(
                icon: const Icon(Icons.favorite, color: AppColors.error),
                onPressed: () => _removeFavorite(fav),
              ),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => HsCodeDetailPage(hscode: fav.hscode),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

```

---

## File: screens/history_page.dart

```dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';// Contains SearchHistoryItem model
import '../services/api_service.dart';// Handles API calls
import '../services/auth_service.dart';// Handles authentication
import '../theme/app_colors.dart';// App color constants
import '../widgets/logo_app_bar.dart';// Custom AppBar widget
import 'search_page.dart';// Page to navigate when a search is tapped

/// Page showing the user's server-side search history.
class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  final ApiService _api = ApiService();
  List<SearchHistoryItem> _items = [];
  bool _isLoading = true;
  String? _error;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    if (!AuthService().isLoggedIn) {
      setState(() {
        _isLoading = false;
        _error = 'Please log in to view search history.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final resp = await _api.getSearchHistory(pageSize: 50);
      if (mounted) {
        setState(() {
          _items = resp.items;
          _total = resp.total;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _clearHistory() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear History?'),
        content: const Text('This will permanently delete all your search history.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _api.clearSearchHistory();
      setState(() {
        _items.clear();
        _total = 0;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Search history cleared')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: LogoAppBar(
        title: 'Search History',
        showLogo: true,
        actions: [
          if (_items.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Clear history',
              onPressed: _clearHistory,
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.history, size: 64, color: AppColors.textMuted),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton(
                  onPressed: _loadHistory, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    if (_items.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.history, size: 64, color: AppColors.textMuted),
            SizedBox(height: 16),
            Text(
              'No search history yet',
              style: TextStyle(fontSize: 18, color: AppColors.textMedium),
            ),
            SizedBox(height: 8),
            Text(
              'Your searches will appear here once\nyou start searching.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textLight),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadHistory,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              '$_total search${_total == 1 ? '' : 'es'}',
              style: const TextStyle(
                  fontSize: 14, color: AppColors.textLight, fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _items.length,
              itemBuilder: (context, index) {
                final item = _items[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.search, color: AppColors.textLight),
                    title: Text(
                      item.queryText,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (item.topResultHscode != null)
                          Text(
                            'Top: ${item.topResultHscode}${item.topResultDescription != null ? ' — ${item.topResultDescription}' : ''}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.textMedium),
                          ),
                        Text(
                          '${item.resultsCount} results • ${_formatDate(item.createdAt)}',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textLight),
                        ),
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right,
                        color: AppColors.textMuted),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) =>
                              SearchPage(initialQuery: item.queryText),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

```

---

## File: screens/home_page.dart

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import '../services/favorites_service.dart';
import '../services/search_history_service.dart';
import '../services/categories_service.dart';
import '../models/category_model.dart';
import 'search_page.dart';
import 'recents_page.dart';
import 'pricing_page.dart';
import 'profile_page.dart';
import 'favorites_page.dart';

/// Main shell page with bottom navigation bar and tab switching.
class MainHomePage extends StatefulWidget {
  const MainHomePage({super.key});

  @override
  State<MainHomePage> createState() => _MainHomePageState();
}

class _MainHomePageState extends State<MainHomePage> {
  int _selectedIndex = 0;
  String? _searchQuery;

  @override
  void initState() {
    super.initState();
    FavoritesService().initialize();
  }

  void _navigateToSearch(String query) {
    setState(() {
      _searchQuery = query;
      _selectedIndex = 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _HomeContent(onSearch: _navigateToSearch),
          SearchPage(isEmbedded: true, initialQuery: _searchQuery),
          const RecentsPage(isEmbedded: true),
          const PricingPage(isEmbedded: true),
          const UserProfilePage(isEmbedded: true),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search_rounded),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history_rounded),
            label: 'Recents',
          ),
          NavigationDestination(
            icon: Icon(Icons.price_change_outlined),
            selectedIcon: Icon(Icons.price_change_rounded),
            label: 'Pricing',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

/// Tab 0: Home dashboard content.
class _HomeContent extends StatefulWidget {
  const _HomeContent({required this.onSearch});

  final ValueChanged<String> onSearch;

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent> {
  final AuthService _auth = AuthService();
  final SearchHistoryService _history = SearchHistoryService();
  final CategoriesService _categoriesService = CategoriesService();

  List<FeaturedCategory> _categories = [];
  List<String> _recentSearches = [];
  bool _isLoadingCategories = true;

  static const Map<String, _CategoryVisualStyle> _categoryStyleById = {
    'spices': _CategoryVisualStyle(
      icon: Icons.ramen_dining_rounded,
      start: Color(0xFFFF9B59),
      end: Color(0xFFFF7043),
    ),
    'apparel': _CategoryVisualStyle(
      icon: Icons.checkroom_rounded,
      start: Color(0xFF8B6CFF),
      end: Color(0xFF6A5AE0),
    ),
    'stationery': _CategoryVisualStyle(
      icon: Icons.edit_note_rounded,
      start: Color(0xFF4DB6E5),
      end: Color(0xFF2A92C4),
    ),
    'minerals': _CategoryVisualStyle(
      icon: Icons.diamond_outlined,
      start: Color(0xFF7F8C9A),
      end: Color(0xFF5F6B77),
    ),
    'animal_products': _CategoryVisualStyle(
      icon: Icons.pets_rounded,
      start: Color(0xFFFFB86A),
      end: Color(0xFFF58A3D),
    ),
    'cosmetics': _CategoryVisualStyle(
      icon: Icons.auto_awesome_rounded,
      start: Color(0xFFEB6EA5),
      end: Color(0xFFD94C8B),
    ),
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final catFuture = _categoriesService.getFeaturedCategories();
    final recentFuture = _history.getRecentSearches();

    final results = await Future.wait([catFuture, recentFuture]);

    if (mounted) {
      setState(() {
        _categories = results[0] as List<FeaturedCategory>;
        _recentSearches = results[1] as List<String>;
        _isLoadingCategories = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 22),
                      _buildSearchBar(),
                      const SizedBox(height: 28),
                      _buildActionCards(),
                      const SizedBox(height: 28),
                      _buildFeaturedCategories(),
                      const SizedBox(height: 24),
                      _buildRecentSearches(),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
      decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.asset(
              'assets/images/logo.png',
              height: 32,
              width: 32,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          const Text(
            'CeylonHS',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          // UIX-002: Removed inert notification bell
          InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const UserProfilePage(),
                ),
              );
            },
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.profileBorder, width: 1.5),
              ),
              child: _buildProfileAvatar(size: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileAvatar({required double size}) {
    final user = _auth.user;
    if (user?.photoUrl != null && user!.photoUrl!.isNotEmpty) {
      return ClipOval(
        child: CachedNetworkImage(
          imageUrl: user.photoUrl!,
          width: size * 2,
          height: size * 2,
          fit: BoxFit.cover,
          placeholder: (_, __) =>
              Icon(Icons.person_rounded, size: size, color: Colors.white),
          errorWidget: (_, __, ___) =>
              Icon(Icons.person_rounded, size: size, color: Colors.white),
        ),
      );
    }
    return Icon(Icons.person_rounded, size: size, color: Colors.white);
  }

  Widget _buildSearchBar() {
    return GestureDetector(
      onTap: () => widget.onSearch(''),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: const [
            BoxShadow(
                color: Color(0x0D000000), blurRadius: 8, offset: Offset(0, 2)),
          ],
        ),
        child: const Row(
          children: [
            SizedBox(width: 14),
            Icon(Icons.search, color: AppColors.textLight, size: 22),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Search products or brands...',
                style: TextStyle(
                  color: AppColors.textLight,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCards() {
    // UIX-003: Favorites card now navigates. UIX-004/005: Removed Tariff Docs & News cards.
    return Row(
      children: [
        Expanded(
          child: _HomeActionCard(
            title: 'Favorites',
            icon: Icons.favorite_border_rounded,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                    builder: (_) => const FavoritesPage()),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFeaturedCategories() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Featured Categories',
          style: TextStyle(
            color: AppColors.textHeading,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (_isLoadingCategories)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ),
          )
        else
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.05,
            children: _categories.map((cat) {
              final style = _resolveCategoryVisualStyle(cat);

              return InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => widget.onSearch(cat.name),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.categoryBorder),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [style.start, style.end],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(13),
                          boxShadow: [
                            BoxShadow(
                              color: style.end.withValues(alpha: 0.28),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Icon(style.icon, color: Colors.white, size: 24),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        cat.name,
                        style: const TextStyle(
                          color: AppColors.textHeading,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  _CategoryVisualStyle _resolveCategoryVisualStyle(FeaturedCategory cat) {
    final idKey = cat.id.trim().toLowerCase();
    final fromId = _categoryStyleById[idKey];
    if (fromId != null) {
      return fromId;
    }

    final searchSpace = '${cat.name} ${cat.description}'.toLowerCase();

    if (_containsAny(searchSpace, [
      'spice',
      'herb',
      'season',
      'tea',
      'food',
    ])) {
      return const _CategoryVisualStyle(
        icon: Icons.ramen_dining_rounded,
        start: Color(0xFFFF9B59),
        end: Color(0xFFFF7043),
      );
    }

    if (_containsAny(searchSpace, [
      'textile',
      'apparel',
      'clothing',
      'fabric',
      'garment',
    ])) {
      return const _CategoryVisualStyle(
        icon: Icons.checkroom_rounded,
        start: Color(0xFF8B6CFF),
        end: Color(0xFF6A5AE0),
      );
    }

    if (_containsAny(searchSpace, [
      'paper',
      'stationery',
      'book',
      'office',
      'print',
    ])) {
      return const _CategoryVisualStyle(
        icon: Icons.edit_note_rounded,
        start: Color(0xFF4DB6E5),
        end: Color(0xFF2A92C4),
      );
    }

    if (_containsAny(searchSpace, [
      'mineral',
      'ore',
      'metal',
      'stone',
      'gem',
    ])) {
      return const _CategoryVisualStyle(
        icon: Icons.diamond_outlined,
        start: Color(0xFF7F8C9A),
        end: Color(0xFF5F6B77),
      );
    }

    if (_containsAny(searchSpace, [
      'animal',
      'livestock',
      'leather',
      'wool',
      'dairy',
    ])) {
      return const _CategoryVisualStyle(
        icon: Icons.pets_rounded,
        start: Color(0xFFFFB86A),
        end: Color(0xFFF58A3D),
      );
    }

    if (_containsAny(searchSpace, [
      'cosmetic',
      'beauty',
      'care',
      'fragrance',
      'perfume',
    ])) {
      return const _CategoryVisualStyle(
        icon: Icons.auto_awesome_rounded,
        start: Color(0xFFEB6EA5),
        end: Color(0xFFD94C8B),
      );
    }

    return _CategoryVisualStyle(
      icon: cat.getIconData(),
      start: const Color(0xFF4D9DFF),
      end: const Color(0xFF2A72D6),
    );
  }

  bool _containsAny(String source, List<String> terms) {
    for (final term in terms) {
      if (source.contains(term)) {
        return true;
      }
    }
    return false;
  }

  Widget _buildRecentSearches() {
    if (_recentSearches.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Searches',
          style: TextStyle(
            color: AppColors.textHeading,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _recentSearches.take(6).map((label) {
            return InkWell(
              borderRadius: BorderRadius.circular(30),
              onTap: () => widget.onSearch(label),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.access_time_rounded,
                        size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: const TextStyle(
                        color: AppColors.textHeading,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _HomeActionCard extends StatelessWidget {
  const _HomeActionCard({
    required this.title,
    required this.icon,
    this.onTap,
  });

  final String title;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: const [
            BoxShadow(
                color: Color(0x08000000), blurRadius: 6, offset: Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.backgroundBlue,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.primaryBlue, size: 22),
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.textHeading,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryVisualStyle {
  const _CategoryVisualStyle({
    required this.icon,
    required this.start,
    required this.end,
  });

  final IconData icon;
  final Color start;
  final Color end;
}

```

---

## File: screens/hs_code_detail_page.dart

```dart
import 'package:flutter/material.dart';
import '../models/search_result.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/logo_app_bar.dart';

/// Detail page for a single HS code, showing full hierarchy and children.
class HsCodeDetailPage extends StatefulWidget {
  const HsCodeDetailPage({super.key, required this.hscode});

  final String hscode;

  @override
  State<HsCodeDetailPage> createState() => _HsCodeDetailPageState();
}

class _HsCodeDetailPageState extends State<HsCodeDetailPage> {
  final ApiService _api = ApiService();
  HsCodeDetail? _detail;
  bool _isLoading = true;
  String? _error;
  bool _isFavorite = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
    _checkFavoriteStatus();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final detail = await _api.getHsCodeDetail(widget.hscode);
      if (mounted) {
        setState(() {
          _detail = detail;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _checkFavoriteStatus() async {
    if (!AuthService().isLoggedIn) return;
    try {
      final resp = await _api.getFavorites(pageSize: 200);
      if (mounted) {
        setState(() {
          _isFavorite =
              resp.items.any((f) => f.hscode == widget.hscode);
        });
      }
    } catch (e) {
      debugPrint('Could not check favorite status: $e');
    }
  }

  Future<void> _toggleFavorite() async {
    if (!AuthService().isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to use favorites')),
      );
      return;
    }
    try {
      if (_isFavorite) {
        await _api.removeFavorite(widget.hscode);
        if (mounted) setState(() => _isFavorite = false);
      } else {
        await _api.addFavorite(
          hscode: widget.hscode,
          description: _detail?.description,
          section: _detail?.section,
        );
        if (mounted) setState(() => _isFavorite = true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: LogoAppBar(
        title: 'HS ${widget.hscode}',
        showLogo: true,
        actions: [
          if (AuthService().isLoggedIn)
            IconButton(
              icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border),
              color: _isFavorite ? AppColors.error : Colors.white,
              onPressed: _toggleFavorite,
              tooltip: _isFavorite ? 'Remove from favorites' : 'Add to favorites',
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _loadDetail,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final d = _detail!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // HS Code header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  d.hscode,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryBlue,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  d.description,
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.textHeading,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _infoChip('Section', d.section),
                    _infoChip('Level', '${d.level}'),
                    if (d.parent.isNotEmpty) _infoChip('Parent', d.parent),
                  ],
                ),
              ],
            ),
          ),

          // Hierarchy path
          if (d.hierarchyPath.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text(
              'Classification Hierarchy',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: d.hierarchyPath.asMap().entries.map((entry) {
                  final i = entry.key;
                  final text = entry.value;
                  final isLast = i == d.hierarchyPath.length - 1;
                  return Padding(
                    padding: EdgeInsets.only(left: i * 16.0, bottom: i < d.hierarchyPath.length - 1 ? 12 : 0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: isLast ? AppColors.primaryBlue : AppColors.backgroundBlue,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${i + 1}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isLast ? Colors.white : AppColors.primaryBlue,
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 2),
                              Text(
                                text,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isLast
                                      ? AppColors.primaryBlue
                                      : AppColors.textMedium,
                                  fontWeight: isLast
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],

          // Children
          if (d.children.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Sub-classifications (${d.children.length})',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 10),
            ...d.children.map((child) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 4),
                    title: Text(
                      child.hscode,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryBlue,
                        fontFamily: 'monospace',
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Text(
                      child.description,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textMedium,
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => HsCodeDetailPage(hscode: child.hscode),
                        ),
                      );
                    },
                  ),
                )),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _infoChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.backgroundBlue,
        borderRadius: BorderRadius.circular(8),
      ),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 12),
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(
                  color: AppColors.textMedium, fontWeight: FontWeight.w500),
            ),
            TextSpan(
              text: value,
              style: const TextStyle(
                  color: AppColors.linkBlue, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

```

---

## File: screens/intro_page.dart

```dart
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'signup_page.dart';
import 'login_page.dart';

class IntroPage extends StatelessWidget {
  const IntroPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.asset(
                      'assets/images/logo.png',
                      height: 140,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'CeylonHS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 52,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichText(
                    textAlign: TextAlign.center,
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'From product to code\n',
                          style: TextStyle(
                            color: AppColors.softBlue,
                            fontSize: 24,
                            fontWeight: FontWeight.w500,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.3,
                            height: 1.25,
                          ),
                        ),
                        TextSpan(
                          text: 'in Seconds.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.5,
                            shadows: [
                              Shadow(color: Color(0xAA9ED5FF), blurRadius: 16),
                              Shadow(color: Color(0x809ED5FF), blurRadius: 28),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 56),
                  // UIX-028: Renamed "Sign in" → "Create Account"
                  SizedBox(
                    width: 220,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const SignUpPage(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        backgroundColor: AppColors.accentBlue,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Create Account',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 220,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const LoginPage(),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        side: const BorderSide(
                            color: AppColors.softBlue, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Log In',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

```

---

## File: screens/login_page.dart

```dart
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import 'home_page.dart';
import 'signup_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _passCtrl = TextEditingController();
  final AuthService _auth = AuthService();
  bool _busy = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;

    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'All fields are required');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });

    final success = await _auth.login(email: email, password: pass);

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = _auth.lastErrorMessage ??
            'Login failed. Check your credentials and try again.';
      });
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });

    final success = await _auth.signInWithGoogle();
    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = _auth.lastErrorMessage ?? 'Google sign-in failed.';
      });
    }
  }

  Future<void> _forgotPassword() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Enter your email first.');
      return;
    }

    setState(() {
      _error = null;
      _success = null;
    });

    final ok = await _auth.sendPasswordReset(email);
    if (!mounted) return;

    setState(() {
      if (ok) {
        _success = 'Password reset email sent to $email';
      } else {
        _error = _auth.lastErrorMessage ?? 'Could not send reset email.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradientDiag,
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -10,
                        child: Transform.rotate(
                          angle: -0.5,
                          child: Container(
                            width: 160,
                            height: 130,
                            color: const Color(0x22FFFFFF),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: -30,
                        child: Transform.rotate(
                          angle: 0.45,
                          child: Container(
                            width: 130,
                            height: 120,
                            color: const Color(0x18FFFFFF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Align(
                              alignment: Alignment.centerLeft,
                              child: IconButton(
                                onPressed: () =>
                                    Navigator.of(context).pop(),
                                icon: const Icon(
                                  Icons.arrow_back_rounded,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                            ),
                            const Text(
                              'CeylonHS',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            Align(
                              alignment: Alignment.center,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: Image.asset(
                                  'assets/images/logo.png',
                                  height: 84,
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            color: AppColors.textDark,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign in to access your dashboard',
                          style: TextStyle(
                            color: AppColors.primaryBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: OutlinedButton.icon(
                            onPressed: _busy ? null : _submitGoogle,
                            icon: const Icon(Icons.g_mobiledata, size: 24),
                            label: const Text(
                              'Continue with Google',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        _LoginTextField(
                          controller: _emailCtrl,
                          hintText: 'Email',
                          isPrimaryBorder: true,
                        ),
                        const SizedBox(height: 14),
                        _LoginTextField(
                          controller: _passCtrl,
                          hintText: 'Password',
                          obscure: true,
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 8),
                          Text(_error!,
                              style: const TextStyle(
                                  color: AppColors.error, fontSize: 13)),
                        ],
                        if (_success != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            _success!,
                            style: const TextStyle(
                                color: AppColors.success, fontSize: 13),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: _forgotPassword,
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primaryBlue,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 0, vertical: 2),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                  fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradientHoriz,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x290B3EA8),
                                  blurRadius: 12,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _busy ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: _busy
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Log in'),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute<void>(
                                  builder: (_) => const SignUpPage()),
                            );
                          },
                          child: RichText(
                            text: const TextSpan(
                              style: TextStyle(
                                color: AppColors.textDark,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                              children: [
                                TextSpan(text: "Don't have an "),
                                TextSpan(
                                  text: 'account?',
                                  style: TextStyle(
                                    decoration: TextDecoration.underline,
                                    color: AppColors.primaryBlue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LoginTextField extends StatelessWidget {
  const _LoginTextField({
    required this.controller,
    required this.hintText,
    this.isPrimaryBorder = false,
    this.obscure = false,
  });

  final TextEditingController controller;
  final String hintText;
  final bool isPrimaryBorder;
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 58,
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(
          color: AppColors.textDark,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            color: AppColors.textDark.withValues(alpha: 0.45),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
              color: isPrimaryBorder
                  ? AppColors.primaryBlue
                  : AppColors.inputBorder,
              width: 1.4,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppColors.primaryBlue,
              width: 1.8,
            ),
          ),
        ),
      ),
    );
  }
}

```

---

## File: screens/pricing_page.dart

```dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/pricing_model.dart';
import '../services/pricing_service.dart';
import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/logo_app_bar.dart';

class PricingPage extends StatefulWidget {
  const PricingPage({super.key, this.isEmbedded = false});

  final bool isEmbedded;

  @override
  State<PricingPage> createState() => _PricingPageState();
}

class _PricingPageState extends State<PricingPage> {
  late final PricingService _pricingService;
  late final AuthService _authService;

  late Future<List<PricingPlan>> _plansFuture;

  @override
  void initState() {
    super.initState();
    _pricingService = PricingService();
    _authService = AuthService();
    _plansFuture = _pricingService.getAllPricingPlans();

    // Load user's current subscription
    _loadSubscription();
  }

  void _loadSubscription() {
    final user = _authService.user;
    if (user != null) {
      _pricingService.getUserSubscription(user.id);
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.isEmbedded
          ? null
          : const LogoAppBar(
              title: 'Pricing Plans',
            ),
      body: SingleChildScrollView(
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
          ),
          child: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const Text(
                        'Choose Your Plan',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Find the perfect plan for your HS code search needs',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.softBlue,
                        ),
                      ),
                      const SizedBox(height: 24),
                      FutureBuilder<List<PricingPlan>>(
                        future: _plansFuture,
                        builder: (context, snapshot) {
                          if (snapshot.connectionState ==
                              ConnectionState.waiting) {
                            return const CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            );
                          }

                          if (snapshot.hasError) {
                            return const Text(
                              'Error loading plans',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            );
                          }

                          final plans = snapshot.data ?? PricingPlan.getAllPlans();

                          return Column(
                            children: [
                              // Pricing cards
                              ...plans.map((plan) {
                                return _buildPricingCard(context, plan);
                              }),

                              // Features comparison section
                              const SizedBox(height: 48),
                              _buildFeaturesComparison(plans),

                              // FAQ section
                              const SizedBox(height: 48),
                              _buildFaqSection(),

                              // Contact section
                              const SizedBox(height: 48),
                              _buildContactSection(context),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPricingCard(BuildContext context, PricingPlan plan) {
    final isPopular = plan.isPopular;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Card(
        elevation: isPopular ? 8 : 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isPopular ? AppColors.accentBlue : Colors.transparent,
            width: isPopular ? 2 : 0,
          ),
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isPopular
                  ? [AppColors.softBlue, Colors.white]
                  : [Colors.white, Colors.grey[50]!],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Popular badge
                if (isPopular)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.accentBlue,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Most Popular',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),

                const SizedBox(height: 16),

                // Plan name
                Text(
                  plan.displayName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlue,
                  ),
                ),

                const SizedBox(height: 8),

                // Description
                Text(
                  plan.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textMedium,
                  ),
                ),

                const SizedBox(height: 16),

                // Price
                Row(
                  children: [
                    Text(
                      '\$${plan.price.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlue,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '/month',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // CTA Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _handlePlanSelection(context, plan),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular ? AppColors.accentBlue : AppColors.primaryBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Get Started',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Features list
                ...plan.features.map((feature) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: const BoxDecoration(
                            color: AppColors.accentBlue,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            feature,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturesComparison(List<PricingPlan> plans) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Feature Comparison',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlue,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'All plans include basic HS code search. Higher tiers unlock more features and API access.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFaqSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Frequently Asked Questions',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlue,
            ),
          ),
          const SizedBox(height: 20),
          _buildFaqItem(
            'Can I change my plan?',
            'Yes, you can upgrade or downgrade your plan at any time.',
          ),
          const SizedBox(height: 16),
          _buildFaqItem(
            'Do you offer refunds?',
            'We offer a 30-day money-back guarantee for new subscriptions.',
          ),
          const SizedBox(height: 16),
          _buildFaqItem(
            'Is there a free trial?',
            'The Starter plan is completely free with limited features.',
          ),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          question,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.primaryBlue,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          answer,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.textMedium,
          ),
        ),
      ],
    );
  }

  Widget _buildContactSection(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.accentBlue,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Need a Custom Plan?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Contact our sales team for enterprise solutions.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              launchUrl(Uri.parse('mailto:support@ceylonhs.com?subject=CeylonHS Enterprise Inquiry'));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.accentBlue,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Contact Sales',
              style: TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handlePlanSelection(BuildContext context, PricingPlan plan) {
    // Show confirmation dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Upgrade to ${plan.displayName}'),
        content: Text(
          'This plan costs \$${plan.price.toStringAsFixed(2)}/month. '
          'Do you want to proceed?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _processUpgrade(context, plan);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
            ),
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }

  Future<void> _processUpgrade(BuildContext context, PricingPlan plan) async {
    Navigator.pop(context);

    final user = _authService.user;
    if (user == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please log in to upgrade your plan.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    try {
      await _pricingService.upgradeSubscription(user.id, plan.tier);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully upgraded to ${plan.displayName} plan!'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upgrade failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }

    // Reload subscription info
    _loadSubscription();
  }
}

```

---

## File: screens/profile_page.dart

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import '../services/favorites_service.dart';
import '../widgets/logo_app_bar.dart';
import 'favorites_page.dart';
import 'history_page.dart';
import 'admin_dashboard.dart';
import 'login_page.dart';
import 'intro_page.dart';

class UserProfilePage extends StatefulWidget {
  const UserProfilePage({super.key, this.isEmbedded = false});

  final bool isEmbedded;

  @override
  State<UserProfilePage> createState() => _UserProfilePageState();
}

class _UserProfilePageState extends State<UserProfilePage> {
  final AuthService _auth = AuthService();
  final FavoritesService _favorites = FavoritesService();

  @override
  void initState() {
    super.initState();
    _auth.addListener(_onAuthChanged);
    _favorites.addListener(_onFavChanged);
  }

  @override
  void dispose() {
    _auth.removeListener(_onAuthChanged);
    _favorites.removeListener(_onFavChanged);
    super.dispose();
  }

  void _onAuthChanged() {
    if (mounted) setState(() {});
  }

  void _onFavChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _logout() async {
    // UIX-020: Clear favorites cache on logout
    FavoritesService().clearCache();
    await _auth.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const IntroPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.user;

    if (user == null) {
      return Scaffold(
        appBar: widget.isEmbedded
            ? null
            : const LogoAppBar(title: 'Profile'),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.person_off_outlined,
                  size: 64, color: AppColors.textEmpty),
              const SizedBox(height: 16),
              const Text(
                'Not logged in',
                style:
                    TextStyle(fontSize: 18, color: AppColors.textMedium),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const LoginPage()),
                  );
                },
                child: const Text('Log In'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: widget.isEmbedded ? null : const LogoAppBar(title: 'Profile'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            children: [
              // Profile header card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    // UIX-014: Display user profile photo
                    _buildAvatar(user),
                    const SizedBox(height: 14),
                    Text(
                      user.displayName ?? user.email.split('@').first,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Quick stats row
              Row(
                children: [
                  Expanded(
                    child: _StatBox(
                      label: 'Favorites',
                      value: '${_favorites.favorites.length}',
                      icon: _favorites.favorites.isNotEmpty
                          ? Icons.favorite
                          : Icons.favorite_border,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatBox(
                      label: 'Role',
                      value: user.role.toUpperCase(),
                      icon: Icons.badge_rounded,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Menu items
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  children: [
                    _ProfileMenuItem(
                      icon: _favorites.favorites.isNotEmpty
                          ? Icons.favorite
                          : Icons.favorite_border,
                      label: 'Favorites',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                            builder: (_) => const FavoritesPage()),
                      ),
                    ),
                    const Divider(height: 1),
                    _ProfileMenuItem(
                      icon: Icons.history_rounded,
                      label: 'Search History',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                            builder: (_) => const HistoryPage()),
                      ),
                    ),
                    if (_auth.isAdmin) ...[
                      const Divider(height: 1),
                      _ProfileMenuItem(
                        icon: Icons.admin_panel_settings_rounded,
                        label: 'Admin Dashboard',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                              builder: (_) => const AdminDashboardPage()),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Logout
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _logout,
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Log Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(dynamic user) {
    if (user.photoUrl != null && user.photoUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 40,
        backgroundColor: Colors.white.withValues(alpha: 0.2),
        child: ClipOval(
          child: CachedNetworkImage(
            imageUrl: user.photoUrl!,
            width: 76,
            height: 76,
            fit: BoxFit.cover,
            placeholder: (_, __) => const Icon(
                Icons.person_outline_rounded,
                size: 46,
                color: Colors.white),
            errorWidget: (_, __, ___) => const Icon(
                Icons.person_outline_rounded,
                size: 46,
                color: Colors.white),
          ),
        ),
      );
    }
    return CircleAvatar(
      radius: 40,
      backgroundColor: Colors.white.withValues(alpha: 0.2),
      child: const Icon(Icons.person_outline_rounded,
          size: 46, color: Colors.white),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primaryBlue, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.primaryBlue,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textMedium,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  const _ProfileMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primaryBlue),
      title: Text(
        label,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 15,
          color: AppColors.textHeading,
        ),
      ),
      trailing:
          const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}

```

---

## File: screens/recents_page.dart

```dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/search_history_service.dart';
import '../theme/app_colors.dart';
import '../widgets/logo_app_bar.dart';
import 'search_page.dart';

/// Dedicated page for viewing and managing recent searches.
/// Shows both local recent searches and server-side search history.
class RecentsPage extends StatefulWidget {
  const RecentsPage({super.key, this.isEmbedded = false});

  /// When true, hides the back button (used inside bottom nav).
  final bool isEmbedded;

  @override
  State<RecentsPage> createState() => _RecentsPageState();
}

class _RecentsPageState extends State<RecentsPage> {
  final ApiService _api = ApiService();
  final SearchHistoryService _history = SearchHistoryService();
  final AuthService _auth = AuthService();

  List<String> _localRecents = [];
  List<SearchHistoryItem> _serverHistory = [];
  bool _isLoadingServer = false;
  String? _error;
  String _filterText = '';

  @override
  void initState() {
    super.initState();
    _loadRecents();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadRecents() async {
    // Load local recents
    final locals = await _history.getRecentSearches();
    if (mounted) {
      setState(() => _localRecents = locals);
    }

    // Load server history if logged in
    if (_auth.isLoggedIn) {
      _loadServerHistory();
    }
  }

  Future<void> _loadServerHistory() async {
    setState(() {
      _isLoadingServer = true;
      _error = null;
    });

    try {
      final resp = await _api.getSearchHistory(pageSize: 50);
      if (mounted) {
        setState(() {
          _serverHistory = resp.items;
          _isLoadingServer = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingServer = false;
          _error = e.toString();
        });
      }
    }
  }

  Future<void> _clearAllRecents() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear All Recent Searches?'),
        content: const Text('This will delete all your local search history.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await _history.clearAll();
    setState(() => _localRecents.clear());

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Recent searches cleared')),
      );
    }
  }

  Future<void> _removeRecent(String query) async {
    await _history.removeSearch(query);
    setState(() => _localRecents.remove(query));
  }

  Future<void> _searchFromRecent(String query) async {
    // Record to server if logged in
    if (_auth.isLoggedIn) {
      await _api.recordSearch(query: query);
    }

    // Navigate to search with the query
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (ctx) => SearchPage(initialQuery: query),
        ),
      );
    }
  }

  List<String> _getFilteredLocalRecents() {
    if (_filterText.isEmpty) return _localRecents;
    final lower = _filterText.toLowerCase();
    return _localRecents
        .where((q) => q.toLowerCase().contains(lower))
        .toList();
  }

  List<SearchHistoryItem> _getFilteredServerHistory() {
    if (_filterText.isEmpty) return _serverHistory;
    final lower = _filterText.toLowerCase();
    return _serverHistory
        .where((item) => item.queryText.toLowerCase().contains(lower))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.isEmbedded ? null : const LogoAppBar(
        title: 'Recent Searches',
      ),
      body: Column(
        children: [
          // Search filter
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (value) {
                setState(() => _filterText = value);
              },
              decoration: InputDecoration(
                hintText: 'Filter searches...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMedium),
                suffixIcon: _filterText.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.textMedium),
                        onPressed: () {
                          setState(() => _filterText = '');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_localRecents.isEmpty && _serverHistory.isEmpty) {
      return _buildEmptyState();
    }

    final localFiltered = _getFilteredLocalRecents();
    final serverFiltered = _getFilteredServerHistory();

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Local recent searches
          if (localFiltered.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  const Text(
                    'Local Recent Searches',
                    style: TextStyle(
                      color: AppColors.textHeading,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: _clearAllRecents,
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: const Text('Clear'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.error,
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
            ),
            ...localFiltered.map((q) => _buildRecentItem(
              query: q,
              subtitle: 'Local search',
              onTap: () => _searchFromRecent(q),
              onRemove: () => _removeRecent(q),
            )),
            const SizedBox(height: 16),
          ],

          // Server-side history (if logged in)
          if (_auth.isLoggedIn) ...[
            if (_isLoadingServer)
              const Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              )
            else if (_error != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Could not load server history',
                      style: TextStyle(color: Colors.red[700]),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _loadServerHistory,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              )
            else if (serverFiltered.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Text(
                  'Search History (${_serverHistory.length} total)',
                  style: const TextStyle(
                    color: AppColors.textHeading,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              ...serverFiltered.map((item) => _buildHistoryItem(item)),
            ],
          ],

          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.history,
            size: 64,
            color: AppColors.textMuted,
          ),
          const SizedBox(height: 16),
          const Text(
            'No recent searches',
            style: TextStyle(
              color: AppColors.textMedium,
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your search history will appear here',
            style: TextStyle(
              color: AppColors.textLight,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              // Navigate to search
              if (widget.isEmbedded) {
                // When embedded in bottom nav, navigate to search page
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (ctx) => const SearchPage(),
                  ),
                );
              } else {
                // When used as standalone page, go back
                Navigator.pop(context);
              }
            },
            icon: const Icon(Icons.search),
            label: const Text('Start Searching'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentItem({
    required String query,
    required String subtitle,
    required VoidCallback onTap,
    required VoidCallback onRemove,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(
            children: [
              const Icon(
                Icons.access_time,
                size: 20,
                color: AppColors.textMedium,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      query,
                      style: const TextStyle(
                        color: AppColors.textHeading,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 18, color: AppColors.textMedium),
                onPressed: onRemove,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints.tightFor(
                  width: 40,
                  height: 40,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryItem(SearchHistoryItem item) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () => _searchFromRecent(item.queryText),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(
            children: [
              const Icon(
                Icons.history,
                size: 20,
                color: AppColors.textMedium,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.queryText,
                      style: const TextStyle(
                        color: AppColors.textHeading,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item.resultsCount} results',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (item.topResultHscode != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.chipBg,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    item.topResultHscode!,
                    style: const TextStyle(
                      color: AppColors.primaryBlue,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

```

---

## File: screens/search_page.dart

```dart
import 'dart:async';
import 'package:flutter/material.dart';
import '../config.dart';
import '../theme/app_colors.dart';
import '../models/search_result.dart';
import '../services/api_service.dart';
import '../services/search_history_service.dart';
import '../services/favorites_service.dart';
import '../services/auth_service.dart';
import '../widgets/logo_app_bar.dart';
import 'hs_code_detail_page.dart';

/// Full-featured search page with live search, typo correction, and result cards.
class SearchPage extends StatefulWidget {
  const SearchPage({super.key, this.isEmbedded = false, this.initialQuery});

  final bool isEmbedded;
  final String? initialQuery;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  final ApiService _api = ApiService();
  final SearchHistoryService _history = SearchHistoryService();
  final FavoritesService _favorites = FavoritesService();

  SearchResponse? _searchResponse;
  bool _isLoading = false;
  String? _error;
  Timer? _debounce;
  List<String> _recentSearches = [];

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
    _favorites.addListener(_onFavoritesChanged);
    _applyInitialQuery(widget.initialQuery);
  }

  @override
  void didUpdateWidget(covariant SearchPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialQuery != widget.initialQuery) {
      _applyInitialQuery(widget.initialQuery);
    }
  }

  void _applyInitialQuery(String? query) {
    if (query == null || query.trim().isEmpty) return;
    final normalized = query.trim();
    _searchController.text = normalized;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _performSearch(normalized);
    });
  }

  void _onFavoritesChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    _debounce?.cancel();
    _favorites.removeListener(_onFavoritesChanged);
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    final searches = await _history.getRecentSearches();
    if (mounted) {
      setState(() => _recentSearches = searches);
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    if (value.trim().length >= 2) {
      _debounce = Timer(
        Duration(milliseconds: AppConfig.searchDebounceMs),
        () => _performSearch(value.trim()),
      );
    } else if (value.trim().isEmpty) {
      setState(() {
        _searchResponse = null;
        _error = null;
      });
    }
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      final response = await _api.search(query);
      if (mounted) {
        setState(() { _searchResponse = response; _isLoading = false; });
        _history.addSearch(query);
        _loadRecentSearches();
        _api.recordSearch(
          query: query,
          resultsCount: response.totalResults,
          topResultHscode: response.results.isNotEmpty ? response.results.first.hscode : null,
          topResultDescription: response.results.isNotEmpty ? response.results.first.description : null,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() { _isLoading = false; _error = _friendlyError(e); });
      }
    }
  }

  String _friendlyError(Object e) {
    final msg = e.toString();
    if (msg.contains('Connection refused') || msg.contains('SocketException') || msg.contains('TimeoutException')) {
      return 'Cannot connect to search server.\nMake sure the API is running at ${AppConfig.apiBaseUrl}';
    }
    return 'Search failed: $msg';
  }

  void _submitSearch() {
    final query = _searchController.text.trim();
    if (query.isNotEmpty) {
      _debounce?.cancel();
      _performSearch(query);
      _searchFocus.unfocus();
    }
  }

  void _searchFromRecent(String query) {
    _searchController.text = query;
    _performSearch(query);
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() { _searchResponse = null; _error = null; });
    _searchFocus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
      decoration: const BoxDecoration(gradient: AppColors.searchHeaderGradient),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/images/logo.png',
                  height: 28,
                  width: 28,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 8),
              const Text('CeylonHS', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
              const Spacer(),
              const Text('HS Code Search', style: TextStyle(color: Color(0xCCFFFFFF), fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [BoxShadow(color: Color(0x20000000), blurRadius: 8, offset: Offset(0, 2))],
            ),
            child: Row(
              children: [
                const SizedBox(width: 14),
                const Icon(Icons.search, color: AppColors.textLight, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    onChanged: _onSearchChanged,
                    onSubmitted: (_) => _submitSearch(),
                    textInputAction: TextInputAction.search,
                    style: const TextStyle(fontSize: 16, color: AppColors.textDark),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      hintText: 'Search products or brands, e.g. "laptop", "Premio"...',
                      hintStyle: TextStyle(fontSize: 15, color: AppColors.textDark.withValues(alpha: 0.4)),
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                    ),
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    onPressed: _clearSearch,
                    icon: const Icon(Icons.close, size: 20, color: AppColors.textLight),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                Container(
                  margin: const EdgeInsets.all(4),
                  decoration: BoxDecoration(color: AppColors.primaryBlue, borderRadius: BorderRadius.circular(8)),
                  child: IconButton(
                    onPressed: _submitSearch,
                    icon: const Icon(Icons.arrow_forward, size: 20, color: Colors.white),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 38, minHeight: 38),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Try brand names like "Premio" or "Dilmah" — AI-powered search',
              style: TextStyle(color: Color(0x99FFFFFF), fontSize: 12, fontWeight: FontWeight.w400),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primaryBlue),
            SizedBox(height: 16),
            Text('Searching...', style: TextStyle(color: AppColors.textMedium, fontSize: 14)),
          ],
        ),
      );
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.textEmpty),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMedium, fontSize: 14)),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => _performSearch(_searchController.text.trim()),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (_searchResponse != null) return _buildResults();
    return _buildEmptyState();
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Try searching for', style: TextStyle(color: AppColors.textMedium, fontSize: 14, fontWeight: FontWeight.w500)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['laptop', 'rice', 'cotton fabric', 'smartphone', 'Premio', 'Dilmah', 'chocolate', 'live horses', 'men\'s wool coat', 'sedan 1300cc'].map((q) => _buildChip(q)).toList(),
          ),
          if (_recentSearches.isNotEmpty) ...[
            const SizedBox(height: 28),
            Row(
              children: [
                const Text('Recent Searches', style: TextStyle(color: AppColors.textHeading, fontSize: 18, fontWeight: FontWeight.w700)),
                const Spacer(),
                TextButton(
                  onPressed: () async { await _history.clearAll(); _loadRecentSearches(); },
                  style: TextButton.styleFrom(foregroundColor: AppColors.textMedium, padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                  child: const Text('Clear all', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ..._recentSearches.take(8).map((q) => ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: const Icon(Icons.access_time, size: 18, color: AppColors.textMuted),
              title: Text(q, style: const TextStyle(color: AppColors.textHeading, fontSize: 15, fontWeight: FontWeight.w500)),
              trailing: IconButton(
                icon: const Icon(Icons.close, size: 16, color: AppColors.textEmpty),
                onPressed: () async { await _history.removeSearch(q); _loadRecentSearches(); },
              ),
              onTap: () => _searchFromRecent(q),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildChip(String label) {
    return ActionChip(label: Text(label), onPressed: () => _searchFromRecent(label));
  }

  Widget _buildResults() {
    final resp = _searchResponse!;
    if (resp.results.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search_off, size: 48, color: AppColors.textEmpty),
              const SizedBox(height: 16),
              Text('No results found for "${resp.query}"', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textHeading, fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Try different keywords or check your spelling.', style: TextStyle(color: AppColors.textMedium, fontSize: 14)),
            ],
          ),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      itemCount: resp.results.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) return _buildResultsHeader(resp);
        return _buildResultCard(resp.results[index - 1]);
      },
    );
  }

  Widget _buildResultsHeader(SearchResponse resp) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (resp.correctedQuery != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: AppColors.warningBg, border: Border.all(color: AppColors.warningBorder), borderRadius: BorderRadius.circular(10)),
            child: InkWell(
              onTap: () => _searchFromRecent(resp.correctedQuery!),
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(color: Color(0xFF3C4043), fontSize: 14),
                  children: [
                    const TextSpan(text: 'Did you mean '),
                    TextSpan(text: resp.correctedQuery, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primaryBlue, decoration: TextDecoration.underline)),
                    const TextSpan(text: '?'),
                  ],
                ),
              ),
            ),
          ),
        ],
        if (resp.enrichmentInfo != null && resp.enrichmentInfo!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: AppColors.backgroundBlue, border: Border.all(color: const Color(0xFFAECAF7)), borderRadius: BorderRadius.circular(10)),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(padding: EdgeInsets.only(top: 1), child: Icon(Icons.auto_awesome, size: 18, color: AppColors.linkBlue)),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('AI-Powered Result', style: TextStyle(color: AppColors.linkBlue, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                      const SizedBox(height: 2),
                      Text(resp.enrichmentInfo!, style: const TextStyle(color: Color(0xFF1A3A6B), fontSize: 13, fontWeight: FontWeight.w500, height: 1.3)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 2),
          child: Text('${resp.totalResults} result${resp.totalResults != 1 ? 's' : ''} found', style: const TextStyle(color: AppColors.textMedium, fontSize: 13, fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }

  String? _parentBreadcrumb(HsCodeResult result) {
    if (result.hierarchyPath.length < 2) return null;
    final ancestors = result.hierarchyPath.sublist(0, result.hierarchyPath.length - 1);
    final parts = ancestors.map((p) { final i = p.indexOf(': '); return i >= 0 ? p.substring(i + 2) : p; }).toList();
    return parts.map((p) => p.length > 60 ? '${p.substring(0, 57)}…' : p).join(' › ');
  }

  Widget _buildResultCard(HsCodeResult result) {
    final Color badgeColor, badgeTextColor, borderColor;
    if (result.relevancePct >= 50) {
      badgeColor = AppColors.successBg; badgeTextColor = AppColors.successText; borderColor = AppColors.successBorder;
    } else if (result.relevancePct >= 30) {
      badgeColor = AppColors.warningBg; badgeTextColor = AppColors.warningText; borderColor = AppColors.cardBorder;
    } else {
      badgeColor = AppColors.chipBg; badgeTextColor = AppColors.textMedium; borderColor = AppColors.cardBorder;
    }
    final parentCrumb = _parentBreadcrumb(result);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: borderColor)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => HsCodeDetailPage(hscode: result.hscode))),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text(result.hscode, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: AppColors.primaryBlue, fontFamily: 'monospace')),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: badgeColor, borderRadius: BorderRadius.circular(10)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(result.relevancePct >= 50 ? Icons.check_circle_outline : result.relevancePct >= 30 ? Icons.info_outline : Icons.help_outline, size: 13, color: badgeTextColor),
                    const SizedBox(width: 4),
                    Text('${result.relevancePct.toStringAsFixed(1)}%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: badgeTextColor)),
                  ]),
                ),
                const SizedBox(width: 8),
                if (AuthService().isLoggedIn)
                  GestureDetector(
                    onTap: () async {
                      try {
                        await _favorites.toggleFavorite(hscode: result.hscode, description: result.description, section: result.section);
                        if (mounted) setState(() {});
                      } catch (e) {
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    },
                    child: Icon(
                      _favorites.isFavorited(result.hscode) ? Icons.favorite : Icons.favorite_border,
                      color: _favorites.isFavorited(result.hscode) ? AppColors.error : AppColors.textLight,
                      size: 20,
                    ),
                  ),
              ]),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (result.relevancePct / 100).clamp(0.0, 1.0),
                  minHeight: 3,
                  backgroundColor: AppColors.chipBg,
                  valueColor: AlwaysStoppedAnimation<Color>(result.relevancePct >= 50 ? AppColors.success : result.relevancePct >= 30 ? AppColors.warning : AppColors.textMuted),
                ),
              ),
              if (parentCrumb != null) ...[
                const SizedBox(height: 8),
                Row(children: [
                  const Icon(Icons.account_tree_outlined, size: 13, color: AppColors.textLight),
                  const SizedBox(width: 5),
                  Expanded(child: Text(parentCrumb, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Color(0xFF7A8599), fontStyle: FontStyle.italic, height: 1.3))),
                ]),
              ],
              const SizedBox(height: 8),
              Text(result.description, style: const TextStyle(fontSize: 15, color: AppColors.textHeading, fontWeight: FontWeight.w500, height: 1.4)),
              const SizedBox(height: 10),
              Wrap(spacing: 6, runSpacing: 4, children: [_metaTag(result.section), _metaTag('Level ${result.level}')]),
              if (result.hierarchyPath.length > 1) ...[
                const SizedBox(height: 8),
                Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    childrenPadding: const EdgeInsets.only(left: 4, bottom: 4),
                    title: Row(children: [
                      const Icon(Icons.account_tree, size: 14, color: AppColors.textMedium),
                      const SizedBox(width: 6),
                      Text('Classification path (${result.hierarchyPath.length} levels)', style: const TextStyle(fontSize: 12, color: AppColors.textMedium, fontWeight: FontWeight.w500)),
                    ]),
                    children: result.hierarchyPath.asMap().entries.map((entry) {
                      final i = entry.key; final p = entry.value; final isLast = i == result.hierarchyPath.length - 1;
                      return Padding(
                        padding: EdgeInsets.only(left: i * 12.0, bottom: 4),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(isLast ? '▸ ' : '› ', style: TextStyle(color: isLast ? AppColors.primaryBlue : AppColors.textLight, fontWeight: FontWeight.bold, fontSize: 13)),
                          Expanded(child: Text(p, style: TextStyle(fontSize: 12, color: isLast ? AppColors.primaryBlue : AppColors.textMedium, fontWeight: isLast ? FontWeight.w600 : FontWeight.w400))),
                        ]),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _metaTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: AppColors.chipBg, borderRadius: BorderRadius.circular(4)),
      child: Text(text, style: const TextStyle(fontSize: 11, color: AppColors.textMedium, fontWeight: FontWeight.w500)),
    );
  }
}

```

---

## File: screens/signup_page.dart

```dart
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import 'home_page.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({super.key});

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _passCtrl = TextEditingController();
  final AuthService _auth = AuthService();
  bool _busy = false;
  String? _error;
  // UIX-012: Removed unreachable _success variable

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;

    if (name.isEmpty || email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'All fields are required');
      return;
    }
    if (!email.contains('@')) {
      setState(() => _error = 'Enter a valid email');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    final success = await _auth.signUp(
      email: email,
      fullName: name,
      password: pass,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = _auth.lastErrorMessage ?? 'Sign up failed. Please try again.';
      });
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    final success = await _auth.signInWithGoogle();
    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute<void>(builder: (_) => const MainHomePage()),
        (route) => false,
      );
    } else {
      setState(() {
        _busy = false;
        _error = _auth.lastErrorMessage ?? 'Google sign-in failed.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradientDiag,
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -10,
                        child: Transform.rotate(
                          angle: -0.5,
                          child: Container(
                            width: 160,
                            height: 130,
                            color: const Color(0x22FFFFFF),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: -30,
                        child: Transform.rotate(
                          angle: 0.45,
                          child: Container(
                            width: 130,
                            height: 120,
                            color: const Color(0x18FFFFFF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                IconButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(),
                                  icon: const Icon(
                                    Icons.arrow_back_rounded,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                                const Text(
                                  'CeylonHS',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const Spacer(),
                                // UIX-001: Removed inert notification bell icon
                              ],
                            ),
                            const Spacer(),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: Image.asset(
                                'assets/images/logo.png',
                                height: 84,
                                fit: BoxFit.contain,
                              ),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Create Your Account',
                          style: TextStyle(
                            color: AppColors.textDark,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign up to get instant HS codes',
                          style: TextStyle(
                            color: AppColors.primaryBlue,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: OutlinedButton.icon(
                            onPressed: _busy ? null : _submitGoogle,
                            icon: const Icon(Icons.g_mobiledata, size: 24),
                            label: const Text(
                              'Continue with Google',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        _AuthTextField(
                            controller: _nameCtrl, hintText: 'Full Name'),
                        const SizedBox(height: 14),
                        _AuthTextField(
                            controller: _emailCtrl, hintText: 'Email'),
                        const SizedBox(height: 14),
                        _AuthTextField(
                            controller: _passCtrl,
                            hintText: 'Password',
                            obscure: true),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!,
                              style: const TextStyle(
                                  color: AppColors.error, fontSize: 13)),
                        ],
                        // UIX-012: Removed unreachable _success display
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradientHoriz,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x290B3EA8),
                                  blurRadius: 12,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _busy ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: _busy
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Sign up'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.hintText,
    this.obscure = false,
  });

  final TextEditingController controller;
  final String hintText;
  final bool obscure;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 58,
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(
          color: AppColors.textDark,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            color: AppColors.textDark.withValues(alpha: 0.45),
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppColors.inputBorder,
              width: 1.4,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: AppColors.primaryBlue,
              width: 1.8,
            ),
          ),
        ),
      ),
    );
  }
}

```

---

## File: services/api_service.dart

```dart
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

```

---

## File: services/auth_service.dart

```dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/favorites_service.dart';
import '../models/user_model.dart';
import '../config.dart';
import 'package:http/http.dart' as http;

/// Manages authentication state.
///
/// - Local API mode: uses dev tokens for fast local testing.
/// - Remote/production API mode: uses Firebase Identity Toolkit ID tokens.
class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._();
  factory AuthService() => _instance;
  AuthService._();

  UserProfile? _user;
  String? _token;
  bool _isLoading = false;
  String? _lastErrorMessage;

  UserProfile? get user => _user;
  String? get token => _token;
  bool get isLoggedIn => _user != null && _token != null;
  bool get isLoading => _isLoading;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get lastErrorMessage => _lastErrorMessage;

  Map<String, String> get authHeaders => {
        if (_token != null) 'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      };

  static const String _firebaseWebApiKey = String.fromEnvironment(
    'FIREBASE_WEB_API_KEY',
    defaultValue: 'AIzaSyA4CfVHQdOBCxexYnBBv0ryb3A_lai38Rk',
  );

  static const String _googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );

  bool get _useLocalDevToken {
    final base = AppConfig.apiBaseUrl.toLowerCase();
    return base.contains('127.0.0.1') ||
        base.contains('localhost') ||
        base.contains('10.0.2.2');
  }

  Future<Map<String, dynamic>> _firebaseSignUp({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$_firebaseWebApiKey',
    );

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'password': password,
            'returnSecureToken': true,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw _FirebaseAuthException.fromResponse(response.body);
  }

  Future<Map<String, dynamic>> _firebaseSignIn({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$_firebaseWebApiKey',
    );

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'password': password,
            'returnSecureToken': true,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw _FirebaseAuthException.fromResponse(response.body);
  }

  Future<void> _firebaseSendPasswordReset({required String email}) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=$_firebaseWebApiKey',
    );

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'requestType': 'PASSWORD_RESET',
            'email': email,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw _FirebaseAuthException.fromResponse(response.body);
    }
  }

  Future<Map<String, dynamic>> _firebaseSignInWithGoogle({
    String? idToken,
    String? accessToken,
  }) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=$_firebaseWebApiKey',
    );

    final hasIdToken = idToken != null && idToken.trim().isNotEmpty;
    final hasAccessToken = accessToken != null && accessToken.trim().isNotEmpty;

    if (!hasIdToken && !hasAccessToken) {
      throw _FirebaseAuthException('GOOGLE_TOKEN_MISSING');
    }

    final parts = <String>[];
    if (hasIdToken) parts.add('id_token=$idToken');
    if (hasAccessToken) parts.add('access_token=$accessToken');
    parts.add('providerId=google.com');
    final encodedPostBody = parts.join('&');

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'postBody': encodedPostBody,
            'requestUri': kIsWeb ? Uri.base.origin : 'http://localhost',
            'returnSecureToken': true,
            'returnIdpCredential': true,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    throw _FirebaseAuthException.fromResponse(response.body);
  }

  void _setError(String message) {
    _lastErrorMessage = message;
  }

  String _redactToken(String? token) {
    if (token == null || token.isEmpty) return '<none>';
    if (token.length <= 16) return '<redacted>';
    return '${token.substring(0, 8)}...${token.substring(token.length - 6)}';
  }

  Future<UserProfile?> _syncUser({
    required String uid,
    required String email,
    String? displayName,
    String? photoUrl,
  }) async {
    final url = '${AppConfig.apiBaseUrl}/api/v1/users/sync';
    final body = {
      'firebase_uid': uid,
      'email': email,
      if (displayName != null && displayName.trim().isNotEmpty)
        'display_name': displayName.trim(),
      if (photoUrl != null && photoUrl.trim().isNotEmpty)
        'photo_url': photoUrl.trim(),
    };

    debugPrint('🔐 Auth DEBUG:');
    debugPrint('  URL: $url');
    debugPrint('  Token: ${_redactToken(_token)}');
    debugPrint('  Body: ${jsonEncode(body)}');
    debugPrint('  Headers: {Authorization: Bearer <redacted>, Content-Type: application/json}');

    final response = await http
        .post(
          Uri.parse(url),
          headers: authHeaders,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 20));

    debugPrint('  Response Status: ${response.statusCode}');
    debugPrint('  Response Body: ${response.body}');

    if (response.statusCode == 200) {
      return UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }

    debugPrint('⚠️ Backend sync failed: ${response.statusCode}');
    return null;
  }

  UserProfile _fallbackProfile({
    required String uid,
    required String email,
    String? displayName,
  }) {
    return UserProfile(
      id: uid,
      firebaseUid: uid,
      email: email,
      displayName: (displayName != null && displayName.trim().isNotEmpty)
          ? displayName.trim()
          : email.split('@').first,
      photoUrl: null,
      role: 'user',
      createdAt: DateTime.now(),
    );
  }

  /// Sign up a new user (dev mode: creates a dev token).
  Future<bool> signUp({
    required String email,
    required String fullName,
    required String password,
  }) async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      if (_useLocalDevToken) {
        final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
        _token = 'dev-token-$uid';
        _user = await _syncUser(uid: uid, email: email, displayName: fullName);
      } else {
        final firebase = await _firebaseSignUp(email: email, password: password);
        _token = (firebase['idToken'] as String?)?.trim();
        final uid = (firebase['localId'] as String?)?.trim() ?? '';
        final verifiedEmail = (firebase['email'] as String?)?.trim() ?? email;
        _user = await _syncUser(uid: uid, email: verifiedEmail, displayName: fullName) ??
            _fallbackProfile(uid: uid, email: verifiedEmail, displayName: fullName);
      }

      if (_user != null && _token != null) {
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _setError('Could not create user profile in backend. Please try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ SignUp error: $e');
      _setError('Sign up failed. Check your connection and try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Log in an existing user (dev mode: recreates dev token from email).
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      if (_useLocalDevToken) {
        final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
        _token = 'dev-token-$uid';
        _user = await _syncUser(uid: uid, email: email);
      } else {
        final firebase = await _firebaseSignIn(email: email, password: password);
        _token = (firebase['idToken'] as String?)?.trim();
        final uid = (firebase['localId'] as String?)?.trim() ?? '';
        final verifiedEmail = (firebase['email'] as String?)?.trim() ?? email;
        _user = await _syncUser(uid: uid, email: verifiedEmail) ??
            _fallbackProfile(uid: uid, email: verifiedEmail);
      }

      if (_user != null && _token != null) {
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _setError('Login failed while syncing your account. Please try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ Login error: $e');
      _setError('Login failed. Check your connection and try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendPasswordReset(String email) async {
    _lastErrorMessage = null;
    try {
      if (_useLocalDevToken) {
        _setError('Password reset is only available when using Firebase auth.');
        return false;
      }

      await _firebaseSendPasswordReset(email: email.trim());
      return true;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      return false;
    } catch (_) {
      _setError('Could not send reset email. Please try again.');
      return false;
    }
  }

  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      if (kIsWeb && _googleWebClientId.trim().isEmpty) {
        _setError(
          'GOOGLE_WEB_CLIENT_ID is missing for web build. Run with --dart-define=GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com',
        );
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final googleSignIn = GoogleSignIn(
        scopes: const ['email', 'profile'],
        clientId: kIsWeb && _googleWebClientId.isNotEmpty
            ? _googleWebClientId
            : null,
      );

      GoogleSignInAccount? account = await googleSignIn.signInSilently();
      account ??= await googleSignIn.signIn();
      if (account == null) {
        _setError('Google sign-in was cancelled.');
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final auth = await account.authentication;
      final email = account.email;
      final displayName = account.displayName;
      final photoUrl = account.photoUrl;

      if (_useLocalDevToken) {
        final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
        _token = 'dev-token-$uid';
        _user = await _syncUser(
              uid: uid,
              email: email,
              displayName: displayName,
              photoUrl: photoUrl,
            ) ??
            _fallbackProfile(uid: uid, email: email, displayName: displayName);
      } else {
        final idToken = auth.idToken?.trim();
        final accessToken = auth.accessToken?.trim();

        if ((idToken == null || idToken.isEmpty) &&
            (accessToken == null || accessToken.isEmpty)) {
          throw _FirebaseAuthException('GOOGLE_TOKEN_MISSING');
        }

        final firebase = await _firebaseSignInWithGoogle(
          idToken: idToken,
          accessToken: accessToken,
        );

        _token = (firebase['idToken'] as String?)?.trim();
        final uid = (firebase['localId'] as String?)?.trim() ?? '';
        final verifiedEmail = (firebase['email'] as String?)?.trim() ?? email;
        _user = await _syncUser(
              uid: uid,
              email: verifiedEmail,
              displayName: displayName,
              photoUrl: photoUrl,
            ) ??
            _fallbackProfile(
              uid: uid,
              email: verifiedEmail,
              displayName: displayName,
            );
      }

      if (_user != null && _token != null) {
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _setError('Google sign-in failed. Please try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ Google sign-in error: $e');
      _setError(_mapGoogleSignInError(e));
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  String _mapGoogleSignInError(Object error) {
    final raw = error.toString();
    final lower = raw.toLowerCase();

    if (lower.contains('popup_closed_by_user') ||
        lower.contains('popup_closed')) {
      return 'Google sign-in popup was closed before completing login.';
    }
    if (lower.contains('clientid not set') ||
        lower.contains('google-signin-client_id') ||
        lower.contains('appid != null')) {
      return 'Google Web Client ID is missing. Run with --dart-define=GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com';
    }
    if (lower.contains('popup_blocked_by_browser') ||
        lower.contains('popup blocked')) {
      return 'Browser blocked the Google popup. Allow popups for this site and try again.';
    }
    if (lower.contains('idpiframe_initialization_failed') ||
        lower.contains('third-party cookies')) {
      return 'Google sign-in requires third-party cookies for this site. Enable them and try again.';
    }
    if (lower.contains('origin_mismatch') ||
        lower.contains('unauthorized_client') ||
        lower.contains('invalid_client')) {
      return 'Google OAuth client mismatch. Verify GOOGLE_WEB_CLIENT_ID and authorized JavaScript origins.';
    }
    if (lower.contains('access_blocked') || lower.contains('disallowed_useragent')) {
      return 'Google sign-in is blocked by browser or OAuth policy. Try a normal Chrome window and check OAuth settings.';
    }
    if (lower.contains('network')) {
      return 'Network issue during Google sign-in. Check connection and try again.';
    }

    return 'Google sign-in failed. Please try again.';
  }

  /// Try to restore session from local storage.
  Future<void> tryRestoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('auth_token');
    final savedUid = prefs.getString('auth_uid');

    if (savedToken == null || savedUid == null) return;

    _token = savedToken;

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/api/v1/users/me'),
        headers: authHeaders,
      );

      if (response.statusCode == 200) {
        _user = UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
        notifyListeners();
      } else {
        _token = null;
      }
    } catch (e) {
      debugPrint('Session restore failed: $e');
      _token = null;
    }
  }

  /// Log out and clear session.
  Future<void> logout() async {
    _user = null;
    _token = null;
    _lastErrorMessage = null;

    // UIX-020: Clear favorites cache on logout
    FavoritesService().clearCache();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_uid');

    notifyListeners();
  }

  Future<void> _persistSession() async {
    if (_token == null || _user == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', _token!);
    await prefs.setString('auth_uid', _user!.firebaseUid);
  }
}

class _FirebaseAuthException implements Exception {
  final String code;

  _FirebaseAuthException(this.code);

  factory _FirebaseAuthException.fromResponse(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      final error = json['error'] as Map<String, dynamic>?;
      final raw = (error?['message'] as String?) ?? 'UNKNOWN_ERROR';
      return _FirebaseAuthException(raw.split(' ').first.trim());
    } catch (_) {
      return _FirebaseAuthException('UNKNOWN_ERROR');
    }
  }

  String get userMessage {
    switch (code) {
      case 'INVALID_LOGIN_CREDENTIALS':
      case 'INVALID_PASSWORD':
        return 'Incorrect email or password.';
      case 'EMAIL_NOT_FOUND':
        return 'No account found for this email.';
      case 'INVALID_EMAIL':
        return 'Invalid email address.';
      case 'EMAIL_EXISTS':
        return 'This email is already registered.';
      case 'WEAK_PASSWORD':
      case 'WEAK_PASSWORD:':
        return 'Password should be at least 6 characters.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Too many attempts. Try again later.';
      case 'USER_DISABLED':
        return 'This account is disabled.';
      case 'GOOGLE_TOKEN_MISSING':
        return 'Google sign-in token missing. Set GOOGLE_WEB_CLIENT_ID for web builds.';
      case 'OPERATION_NOT_ALLOWED':
        return 'Google sign-in is not enabled in Firebase Authentication.';
      case 'INVALID_IDP_RESPONSE':
      case 'INVALID_ID_TOKEN':
        return 'Google sign-in was rejected by Firebase. Check OAuth client and authorized domains.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}

```

---

## File: services/categories_service.dart

```dart
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

```

---

## File: services/favorites_service.dart

```dart
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import 'api_service.dart';
import 'auth_service.dart';

/// Service for managing user favorites with local caching and sync.
class FavoritesService extends ChangeNotifier {
  static final FavoritesService _instance = FavoritesService._();
  factory FavoritesService() => _instance;
  FavoritesService._();

  final ApiService _api = ApiService();
  
  // Local cache of favorites (HS codes only for quick lookup)
  Set<String> _favoriteHscodes = {};
  
  // Full favorites data for display
  List<FavoriteItem> _favorites = [];
  
  bool _isLoading = false;
  bool _isSynced = false;
  String? _error;

  /// Get all favorited HS codes (for quick checks)
  Set<String> get favoriteHscodes => _favoriteHscodes;
  
  /// Get full favorites list
  List<FavoriteItem> get favorites => _favorites;
  
  bool get isLoading => _isLoading;
  bool get isSynced => _isSynced;
  String? get error => _error;

  /// Check if a specific HS code is favorited
  bool isFavorited(String hscode) => _favoriteHscodes.contains(hscode);

  /// Initialize favorites on app startup (called from main.dart)
  Future<void> initialize() async {
    if (!AuthService().isLoggedIn) {
      _favoriteHscodes.clear();
      _favorites.clear();
      _isSynced = false;
      notifyListeners();
      return;
    }

    await syncFavorites();
  }

  /// Sync favorites from backend and cache locally
  Future<void> syncFavorites() async {
    if (!AuthService().isLoggedIn) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.getFavorites(pageSize: 200);
      _favorites = response.items;
      _favoriteHscodes = {for (var item in response.items) item.hscode};
      _isSynced = true;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Add a favorite and update local cache
  Future<void> addFavorite({
    required String hscode,
    String? description,
    String? section,
  }) async {
    if (!AuthService().isLoggedIn) {
      _error = 'Please log in to use favorites';
      notifyListeners();
      return;
    }

    try {
      final item = await _api.addFavorite(
        hscode: hscode,
        description: description,
        section: section,
      );
      _favoriteHscodes.add(hscode);
      _favorites.add(item);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Remove a favorite and update local cache
  Future<void> removeFavorite(String hscode) async {
    if (!AuthService().isLoggedIn) {
      _error = 'Please log in to use favorites';
      notifyListeners();
      return;
    }

    try {
      await _api.removeFavorite(hscode);
      _favoriteHscodes.remove(hscode);
      _favorites.removeWhere((f) => f.hscode == hscode);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Toggle favorite status (add or remove)
  Future<bool> toggleFavorite({
    required String hscode,
    String? description,
    String? section,
  }) async {
    if (isFavorited(hscode)) {
      await removeFavorite(hscode);
      return false;
    } else {
      await addFavorite(
        hscode: hscode,
        description: description,
        section: section,
      );
      return true;
    }
  }

  /// Clear local cache (when user logs out)
  void clearCache() {
    _favoriteHscodes.clear();
    _favorites.clear();
    _isSynced = false;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}

```

---

## File: services/pricing_service.dart

```dart
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
    final token = _authService.token;
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
    final token = _authService.token;
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

```

---

## File: services/search_history_service.dart

```dart
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

```

---

## File: theme/app_colors.dart

```dart
import 'package:flutter/material.dart';

/// Centralized color constants for the CeylonHS app.
///
/// All screen-level color constants have been consolidated here.
/// Use [AppColors] instead of defining colors in individual State classes.
abstract final class AppColors {
  // ── Brand blues ──
  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);
  static const Color accentBlue = Color(0xFF4DA7FF);
  static const Color softBlue = Color(0xFFD7EAFF);
  static const Color linkBlue = Color(0xFF1967D2);
  static const Color iconBlue = Color(0xFF2E73D3);
  static const Color lightIconBlue = Color(0xFF6FA0D9);

  // ── Surfaces & backgrounds ──
  static const Color surface = Color(0xFFF2F4F8);
  static const Color surfaceAlt = Color(0xFFF4F7FC);
  static const Color backgroundBlue = Color(0xFFE8F0FE);
  static const Color backgroundBlueLight = Color(0xFFEAF3FF);
  static const Color cardBorder = Color(0xFFDADCE0);
  static const Color inputBorder = Color(0xFFD5DDE8);
  static const Color navBorder = Color(0xFFEAEAEA);
  static const Color profileBorder = Color(0xFFDDE5F2);
  static const Color categoryBorder = Color(0xFFD9E5F5);

  // ── Text ──
  static const Color textDark = Color(0xFF1D2F4D);
  static const Color textHeading = Color(0xFF2C3442);
  static const Color textMedium = Color(0xFF5D6778);
  static const Color textLight = Color(0xFF9BA5B7);
  static const Color textMuted = Color(0xFFB7BFCC);
  static const Color textEmpty = Color(0xFFCCD2DC);
  static const Color navInactive = Color(0xFF8E8E8E);

  // ── Semantic ──
  static const Color success = Color(0xFF34A853);
  static const Color successBg = Color(0xFFE6F4EA);
  static const Color successText = Color(0xFF137333);
  static const Color successBorder = Color(0xFFA8DAB5);
  static const Color warning = Color(0xFFF9AB00);
  static const Color warningBg = Color(0xFFFEF7E0);
  static const Color warningText = Color(0xFFB06000);
  static const Color warningBorder = Color(0xFFFDD663);
  static const Color error = Colors.redAccent;
  static const Color chipBg = Color(0xFFF1F3F4);

  // ── Gradient presets ──
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryBlue, secondaryBlue],
  );

  static const LinearGradient primaryGradientDiag = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [secondaryBlue, primaryBlue],
  );

  static const LinearGradient primaryGradientHoriz = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [secondaryBlue, primaryBlue],
  );

  static const LinearGradient searchHeaderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF133665), Color(0xFF3A9EEA)],
  );
}

```

---

## File: theme/app_spacing.dart

```dart
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

```

---

## File: theme/app_theme.dart

```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_spacing.dart';

/// App-wide Material 3 theme configuration.
abstract final class AppTheme {
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primaryBlue,
      primary: AppColors.primaryBlue,
      secondary: AppColors.accentBlue,
      surface: Colors.white,
      error: AppColors.error,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.surface,

      // ── AppBar ──
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),

      // ── NavigationBar (bottom nav) ──
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: AppColors.backgroundBlue,
        height: 72,
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.primaryBlue,
            );
          }
          return const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.navInactive,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              size: 24,
              color: AppColors.primaryBlue,
            );
          }
          return const IconThemeData(
            size: 24,
            color: AppColors.navInactive,
          );
        }),
      ),

      // ── Card ──
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
          side: const BorderSide(color: AppColors.cardBorder),
        ),
        color: Colors.white,
      ),

      // ── ElevatedButton ──
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          minimumSize: const Size.fromHeight(48),
        ),
      ),

      // ── OutlinedButton ──
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryBlue,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
          ),
          side: const BorderSide(color: AppColors.primaryBlue),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          minimumSize: const Size.fromHeight(48),
        ),
      ),

      // ── TextButton ──
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryBlue,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // ── InputDecoration ──
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        hintStyle: TextStyle(
          color: AppColors.textDark.withValues(alpha: 0.45),
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
          borderSide: const BorderSide(color: AppColors.inputBorder, width: 1.4),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
          borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
          borderSide: const BorderSide(color: AppColors.error, width: 1.4),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
          borderSide: const BorderSide(color: AppColors.error, width: 1.8),
        ),
      ),

      // ── Chip ──
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.backgroundBlue,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.md),
        ),
        labelStyle: const TextStyle(
          color: AppColors.linkBlue,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),

      // ── Divider ──
      dividerTheme: const DividerThemeData(
        color: AppColors.cardBorder,
        thickness: 1,
        space: 0,
      ),

      // ── SnackBar ──
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.sm),
        ),
      ),

      // ── Dialog ──
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLg),
        ),
      ),
    );
  }
}

```

---

## File: widgets/logo_app_bar.dart

```dart
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Custom AppBar widget that includes the CeylonHS logo
class LogoAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showLogo;
  final VoidCallback? onLogoTap;
  final List<Widget>? actions;
  final double? elevation;

  const LogoAppBar({
    super.key,
    this.title,
    this.showLogo = true,
    this.onLogoTap,
    this.actions,
    this.elevation = 0,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.primaryBlue,
      foregroundColor: Colors.white,
      elevation: elevation,
      title: showLogo
          ? Row(
              children: [
                GestureDetector(
                  onTap: onLogoTap,
                  child: Image.asset(
                    'assets/images/logo.png',
                    height: 40,
                    fit: BoxFit.contain,
                  ),
                ),
                if (title != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title!,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            )
          : Text(
              title ?? 'CeylonHS',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
      actions: actions,
      centerTitle: false,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(56);
}

```

---

