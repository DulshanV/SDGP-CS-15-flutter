import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../services/auth_service.dart';
import '../services/favorites_service.dart';
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
            : AppBar(title: const Text('Profile')),
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
                      icon: Icons.favorite_rounded,
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
                      icon: Icons.bookmark_rounded,
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
