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
