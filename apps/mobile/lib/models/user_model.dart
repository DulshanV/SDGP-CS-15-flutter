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
