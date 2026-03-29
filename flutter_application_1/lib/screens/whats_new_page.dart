import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/logo_app_bar.dart';

/// A page showing recent app changes and new features.
class WhatsNewPage extends StatelessWidget {
  const WhatsNewPage({super.key});

  static const List<_ChangelogEntry> _entries = [
    _ChangelogEntry(
      version: 'v1.4',
      date: 'March 2026',
      label: _EntryLabel.latest,
      changes: [
        _ChangeItem(
          icon: Icons.admin_panel_settings_rounded,
          color: Color(0xFF5C35D9),
          title: 'Admin Module Assignment',
          description:
              'Admins can now directly enroll students in courses from the Users page with a new Assign Module button.',
        ),
        _ChangeItem(
          icon: Icons.folder_copy_outlined,
          color: Color(0xFF2A72D6),
          title: 'Cleaner Repository Structure',
          description:
              'Duplicate files removed from the project root; all components now live in their proper subdirectories.',
        ),
      ],
    ),
    _ChangelogEntry(
      version: 'v1.3',
      date: 'March 2026',
      label: _EntryLabel.none,
      changes: [
        _ChangeItem(
          icon: Icons.calculate_rounded,
          color: Color(0xFF0B8A4C),
          title: 'Tax Calculator',
          description:
              'Estimate import duties and taxes for any HS code right inside the app.',
        ),
      ],
    ),
    _ChangelogEntry(
      version: 'v1.2',
      date: 'March 2026',
      label: _EntryLabel.none,
      changes: [
        _ChangeItem(
          icon: Icons.history_rounded,
          color: Color(0xFF0B3EA8),
          title: 'Search History',
          description:
              'Full server-side search history with result counts, top HS codes, and the ability to clear all records.',
        ),
      ],
    ),
    _ChangelogEntry(
      version: 'v1.1',
      date: 'March 2026',
      label: _EntryLabel.none,
      changes: [
        _ChangeItem(
          icon: Icons.palette_rounded,
          color: Color(0xFFEB6EA5),
          title: 'UI Improvements',
          description:
              'Refreshed color palette, updated logo, improved navigation bar styling, and polished card layouts throughout the app.',
        ),
        _ChangeItem(
          icon: Icons.favorite_rounded,
          color: Color(0xFFE53935),
          title: 'Favorites Navigation',
          description:
              'The Favorites action card on the home screen now navigates directly to your saved HS codes.',
        ),
      ],
    ),
    _ChangelogEntry(
      version: 'v1.0',
      date: 'March 2026',
      label: _EntryLabel.none,
      changes: [
        _ChangeItem(
          icon: Icons.search_rounded,
          color: Color(0xFF0B3EA8),
          title: 'HS Code Search',
          description:
              'Smart search with typo correction and live results to find Sri Lanka Harmonized System codes instantly.',
        ),
        _ChangeItem(
          icon: Icons.star_rounded,
          color: Color(0xFFF9AB00),
          title: 'Favorites',
          description: 'Save frequently used HS codes for quick reference.',
        ),
        _ChangeItem(
          icon: Icons.price_change_rounded,
          color: Color(0xFF2A72D6),
          title: 'Pricing Plans',
          description:
              'View subscription tiers and manage your current plan.',
        ),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: const LogoAppBar(title: "What's New", showLogo: true),
      body: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        itemCount: _entries.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) =>
            _EntryCard(entry: _entries[index]),
      ),
    );
  }
}

// ── Data model ──────────────────────────────────────────────────────────────

enum _EntryLabel { latest, none }

class _ChangeItem {
  const _ChangeItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String description;
}

class _ChangelogEntry {
  const _ChangelogEntry({
    required this.version,
    required this.date,
    required this.label,
    required this.changes,
  });

  final String version;
  final String date;
  final _EntryLabel label;
  final List<_ChangeItem> changes;
}

// ── Widgets ──────────────────────────────────────────────────────────────────

class _EntryCard extends StatelessWidget {
  const _EntryCard({required this.entry});

  final _ChangelogEntry entry;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const Divider(height: 1, color: AppColors.cardBorder),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              children: entry.changes
                  .map((item) => _ChangeRow(item: item))
                  .toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      child: Row(
        children: [
          Text(
            entry.version,
            style: const TextStyle(
              color: AppColors.textDark,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(width: 8),
          if (entry.label == _EntryLabel.latest)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.successBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.successBorder),
              ),
              child: const Text(
                'Latest',
                style: TextStyle(
                  color: AppColors.successText,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const Spacer(),
          Text(
            entry.date,
            style: const TextStyle(
              color: AppColors.textLight,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChangeRow extends StatelessWidget {
  const _ChangeRow({required this.item});

  final _ChangeItem item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: item.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(item.icon, size: 20, color: item.color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    color: AppColors.textHeading,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.description,
                  style: const TextStyle(
                    color: AppColors.textMedium,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
