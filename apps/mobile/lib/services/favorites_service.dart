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
