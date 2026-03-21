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
            icon: Icons.bookmark_border_rounded,
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
                      Icon(cat.getIconData(),
                          color: AppColors.primaryBlue, size: 28),
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
