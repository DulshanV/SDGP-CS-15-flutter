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
