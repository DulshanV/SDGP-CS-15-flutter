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
