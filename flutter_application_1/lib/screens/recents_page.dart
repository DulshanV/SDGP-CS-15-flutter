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
