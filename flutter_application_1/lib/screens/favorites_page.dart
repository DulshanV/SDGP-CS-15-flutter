import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
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

  static const Color primaryBlue = Color(0xFF0B3EA8);

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
      backgroundColor: const Color(0xFFF2F4F8),
      appBar: AppBar(
        title: const Text('Favorites', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
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
              const Icon(Icons.bookmark_border, size: 64, color: Color(0xFFB7BFCC)),
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
            Icon(Icons.bookmark_border, size: 64, color: Color(0xFFB7BFCC)),
            SizedBox(height: 16),
            Text(
              'No favorites yet',
              style: TextStyle(fontSize: 18, color: Color(0xFF5D6778)),
            ),
            SizedBox(height: 8),
            Text(
              'Search for HS codes and tap the heart icon\nto save them here.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Color(0xFF9BA5B7)),
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
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFDADCE0)),
            ),
            child: ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              title: Text(
                fav.hscode,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: primaryBlue,
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
                      style: const TextStyle(fontSize: 13, color: Color(0xFF5D6778)),
                    ),
                  ],
                  if (fav.section != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Section ${fav.section}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF9BA5B7)),
                    ),
                  ],
                ],
              ),
              trailing: IconButton(
                icon: const Icon(Icons.favorite, color: Colors.redAccent),
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
