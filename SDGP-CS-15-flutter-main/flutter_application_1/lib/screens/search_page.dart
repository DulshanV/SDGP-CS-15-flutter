import 'dart:async';
import 'package:flutter/material.dart';
import '../config.dart';
import '../models/search_result.dart';
import '../services/api_service.dart';
import '../services/search_history_service.dart';
import 'hs_code_detail_page.dart';

/// Full-featured search page that replaces the old HsCodeFinderPage.
/// Supports live search, typo correction display, and result cards.
class SearchPage extends StatefulWidget {
  const SearchPage({super.key, this.isEmbedded = false, this.initialQuery});

  /// When true, hides the back button (used inside bottom nav).
  final bool isEmbedded;

  /// Optional initial query to trigger search immediately.
  final String? initialQuery;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  final ApiService _api = ApiService();
  final SearchHistoryService _history = SearchHistoryService();

  SearchResponse? _searchResponse;
  bool _isLoading = false;
  String? _error;
  Timer? _debounce;
  List<String> _recentSearches = [];

  static const Color primaryBlue = Color(0xFF0B3EA8);
  // ignore: unused_field
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _searchController.text = widget.initialQuery!;
      // Execute after frame so context is available
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _performSearch(widget.initialQuery!);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    _debounce?.cancel();
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

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _api.search(query);
      if (mounted) {
        setState(() {
          _searchResponse = response;
          _isLoading = false;
        });
        // Save to recent searches (local)
        _history.addSearch(query);
        _loadRecentSearches();
        // Record to server-side history (fire-and-forget)
        _api.recordSearch(
          query: query,
          resultsCount: response.totalResults,
          topResultHscode:
              response.results.isNotEmpty ? response.results.first.hscode : null,
          topResultDescription: response.results.isNotEmpty
              ? response.results.first.description
              : null,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = _friendlyError(e);
        });
      }
    }
  }

  String _friendlyError(Object e) {
    final msg = e.toString();
    if (msg.contains('Connection refused') ||
        msg.contains('SocketException') ||
        msg.contains('TimeoutException')) {
      return 'Cannot connect to search server.\n'
          'Make sure the API is running at ${AppConfig.apiBaseUrl}';
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
    setState(() {
      _searchResponse = null;
      _error = null;
    });
    _searchFocus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F8),
      body: SafeArea(
        child: Column(
          children: [
            // ── Header + Search Bar ──
            _buildHeader(),
            // ── Results Area ──
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF133665), Color(0xFF3A9EEA)],
        ),
      ),
      child: Column(
        children: [
          // Title row
          Row(
            children: [
              const Icon(Icons.public, color: Colors.white, size: 20),
              const SizedBox(width: 6),
              const Text(
                'CeylonHS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              const Text(
                'HS Code Search',
                style: TextStyle(
                  color: Color(0xCCFFFFFF),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Search bar
          Container(
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x20000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                const SizedBox(width: 14),
                const Icon(Icons.search, color: Color(0xFF9BA5B7), size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    onChanged: _onSearchChanged,
                    onSubmitted: (_) => _submitSearch(),
                    textInputAction: TextInputAction.search,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color(0xFF1D2F4D),
                    ),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      hintText: 'Search products or brands, e.g. "laptop", "Premio"...',
                      hintStyle: TextStyle(
                        fontSize: 15,
                        color: const Color(0xFF1D2F4D).withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                ),
                if (_searchController.text.isNotEmpty)
                  IconButton(
                    onPressed: _clearSearch,
                    icon: const Icon(Icons.close, size: 20, color: Color(0xFF9BA5B7)),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                Container(
                  margin: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: primaryBlue,
                    borderRadius: BorderRadius.circular(8),
                  ),
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
          // Hint text
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Try brand names like "Premio" or "Dilmah" — AI-powered search',
              style: TextStyle(
                color: Color(0x99FFFFFF),
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    // Loading state
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: primaryBlue),
            SizedBox(height: 16),
            Text(
              'Searching...',
              style: TextStyle(color: Color(0xFF5D6778), fontSize: 14),
            ),
          ],
        ),
      );
    }

    // Error state
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFFCCD2DC)),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF5D6778), fontSize: 14),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => _performSearch(_searchController.text.trim()),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
                style: OutlinedButton.styleFrom(foregroundColor: primaryBlue),
              ),
            ],
          ),
        ),
      );
    }

    // Results
    if (_searchResponse != null) {
      return _buildResults();
    }

    // Empty state — show recent searches + suggestions
    return _buildEmptyState();
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick search chips
          const Text(
            'Try searching for',
            style: TextStyle(
              color: Color(0xFF5D6778),
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              'laptop',
              'rice',
              'cotton fabric',
              'smartphone',
              'Premio',
              'Dilmah',
              'chocolate',
              'live horses',
              'men\'s wool coat',
              'sedan 1300cc',
            ].map((q) => _buildChip(q)).toList(),
          ),

          // Recent searches
          if (_recentSearches.isNotEmpty) ...[
            const SizedBox(height: 28),
            Row(
              children: [
                const Text(
                  'Recent Searches',
                  style: TextStyle(
                    color: Color(0xFF2C3442),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () async {
                    await _history.clearAll();
                    _loadRecentSearches();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF5D6778),
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Clear all', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ..._recentSearches.take(8).map((q) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: const Icon(Icons.access_time, size: 18, color: Color(0xFFB7BFCC)),
                  title: Text(
                    q,
                    style: const TextStyle(
                      color: Color(0xFF2C3442),
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 16, color: Color(0xFFCCD2DC)),
                    onPressed: () async {
                      await _history.removeSearch(q);
                      _loadRecentSearches();
                    },
                  ),
                  onTap: () => _searchFromRecent(q),
                )),
          ],
        ],
      ),
    );
  }

  Widget _buildChip(String label) {
    return ActionChip(
      label: Text(label),
      labelStyle: const TextStyle(
        color: Color(0xFF1967D2),
        fontSize: 13,
        fontWeight: FontWeight.w500,
      ),
      backgroundColor: const Color(0xFFE8F0FE),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onPressed: () => _searchFromRecent(label),
    );
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
              const Icon(Icons.search_off, size: 48, color: Color(0xFFCCD2DC)),
              const SizedBox(height: 16),
              Text(
                'No results found for "${resp.query}"',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF2C3442),
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Try different keywords or check your spelling.',
                style: TextStyle(color: Color(0xFF5D6778), fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      itemCount: resp.results.length + 1, // +1 for header
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
        // "Did you mean?" suggestion (clickable, never auto-applied)
        if (resp.correctedQuery != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF7E0),
              border: Border.all(color: const Color(0xFFFDD663)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: InkWell(
              onTap: () => _searchFromRecent(resp.correctedQuery!),
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(color: Color(0xFF3C4043), fontSize: 14),
                  children: [
                    const TextSpan(text: 'Did you mean '),
                    TextSpan(
                      text: resp.correctedQuery,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: primaryBlue,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                    const TextSpan(text: '?'),
                  ],
                ),
              ),
            ),
          ),
        ],
        // AI enrichment banner (brand/trade name resolution)
        if (resp.enrichmentInfo != null && resp.enrichmentInfo!.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F0FE),
              border: Border.all(color: const Color(0xFFAECAF7)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 1),
                  child: Icon(Icons.auto_awesome, size: 18, color: Color(0xFF1967D2)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'AI-Powered Result',
                        style: TextStyle(
                          color: Color(0xFF1967D2),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        resp.enrichmentInfo!,
                        style: const TextStyle(
                          color: Color(0xFF1A3A6B),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        // Result count
        Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 2),
          child: Text(
            '${resp.totalResults} result${resp.totalResults != 1 ? 's' : ''} found',
            style: const TextStyle(
              color: Color(0xFF5D6778),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  /// Extract a short parent breadcrumb from the hierarchy path.
  /// e.g. ["01.03: Live Swine", "0103.91: Weighing < 50 kg"] → "Live Swine"
  String? _parentBreadcrumb(HsCodeResult result) {
    if (result.hierarchyPath.length < 2) return null;
    // Take all ancestors except the last (which is the item itself)
    final ancestors = result.hierarchyPath.sublist(0, result.hierarchyPath.length - 1);
    // Strip "HS.Code: " prefix from each and take only the description part
    final parts = ancestors.map((p) {
      final colonIdx = p.indexOf(': ');
      return colonIdx >= 0 ? p.substring(colonIdx + 2) : p;
    }).toList();
    // Truncate long parents to keep breadcrumb compact
    final truncated = parts.map((p) => p.length > 60 ? '${p.substring(0, 57)}…' : p);
    return truncated.join(' › ');
  }

  Widget _buildResultCard(HsCodeResult result) {
    final Color badgeColor;
    final Color badgeTextColor;
    final Color borderColor;
    if (result.relevancePct >= 50) {
      badgeColor = const Color(0xFFE6F4EA);
      badgeTextColor = const Color(0xFF137333);
      borderColor = const Color(0xFFA8DAB5);
    } else if (result.relevancePct >= 30) {
      badgeColor = const Color(0xFFFEF7E0);
      badgeTextColor = const Color(0xFFB06000);
      borderColor = const Color(0xFFDADCE0);
    } else {
      badgeColor = const Color(0xFFF1F3F4);
      badgeTextColor = const Color(0xFF5D6778);
      borderColor = const Color(0xFFDADCE0);
    }

    final parentCrumb = _parentBreadcrumb(result);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: borderColor),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => HsCodeDetailPage(hscode: result.hscode),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // HS Code + relevance badge + confidence bar
              Row(
                children: [
                  Text(
                    result.hscode,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: primaryBlue,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: badgeColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          result.relevancePct >= 50
                              ? Icons.check_circle_outline
                              : result.relevancePct >= 30
                                  ? Icons.info_outline
                                  : Icons.help_outline,
                          size: 13,
                          color: badgeTextColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${result.relevancePct.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: badgeTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Confidence bar
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (result.relevancePct / 100).clamp(0.0, 1.0),
                  minHeight: 3,
                  backgroundColor: const Color(0xFFF1F3F4),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    result.relevancePct >= 50
                        ? const Color(0xFF34A853)
                        : result.relevancePct >= 30
                            ? const Color(0xFFF9AB00)
                            : const Color(0xFFB7BFCC),
                  ),
                ),
              ),
              // Parent breadcrumb — gives context to orphan descriptions
              if (parentCrumb != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.account_tree_outlined, size: 13, color: Color(0xFF9BA5B7)),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        parentCrumb,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF7A8599),
                          fontStyle: FontStyle.italic,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              // Description
              Text(
                result.description,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFF2C3442),
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 10),
              // Meta tags
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  _metaTag(result.section),
                  _metaTag('Level ${result.level}'),
                ],
              ),
              // Hierarchy — expandable
              if (result.hierarchyPath.length > 1) ...[
                const SizedBox(height: 8),
                Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    childrenPadding: const EdgeInsets.only(left: 4, bottom: 4),
                    title: Row(
                      children: [
                        const Icon(Icons.account_tree, size: 14, color: Color(0xFF5D6778)),
                        const SizedBox(width: 6),
                        Text(
                          'Classification path (${result.hierarchyPath.length} levels)',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF5D6778),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    children: result.hierarchyPath.asMap().entries
                        .map((entry) {
                          final i = entry.key;
                          final p = entry.value;
                          final isLast = i == result.hierarchyPath.length - 1;
                          return Padding(
                            padding: EdgeInsets.only(left: i * 12.0, bottom: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isLast ? '▸ ' : '› ',
                                  style: TextStyle(
                                    color: isLast ? primaryBlue : const Color(0xFF9BA5B7),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    p,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isLast ? primaryBlue : const Color(0xFF5D6778),
                                      fontWeight: isLast ? FontWeight.w600 : FontWeight.w400,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        })
                        .toList(),
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
      decoration: BoxDecoration(
        color: const Color(0xFFF1F3F4),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          color: Color(0xFF5D6778),
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
