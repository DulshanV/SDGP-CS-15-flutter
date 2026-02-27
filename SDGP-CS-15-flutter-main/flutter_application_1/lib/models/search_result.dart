/// Data models for the HS Code Search API responses.

class HsCodeResult {
  final String hscode;
  final String description;
  final String section;
  final int level;
  final String parent;
  final double relevancePct;
  final List<String> hierarchyPath;

  const HsCodeResult({
    required this.hscode,
    required this.description,
    required this.section,
    required this.level,
    required this.parent,
    required this.relevancePct,
    required this.hierarchyPath,
  });

  factory HsCodeResult.fromJson(Map<String, dynamic> json) {
    return HsCodeResult(
      hscode: json['hscode'] as String? ?? '',
      description: json['description'] as String? ?? '',
      section: json['section'] as String? ?? '',
      level: json['level'] as int? ?? 0,
      parent: json['parent'] as String? ?? '',
      relevancePct: (json['relevance_pct'] as num?)?.toDouble() ?? 0.0,
      hierarchyPath: (json['hierarchy_path'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class SearchResponse {
  final String query;
  final String? correctedQuery;
  final String? enrichmentInfo;
  final int totalResults;
  final List<HsCodeResult> results;

  const SearchResponse({
    required this.query,
    required this.correctedQuery,
    this.enrichmentInfo,
    required this.totalResults,
    required this.results,
  });

  factory SearchResponse.fromJson(Map<String, dynamic> json) {
    // enrichment_info can be a plain string or a map with 'explanation' key
    String? enrichment;
    final rawEnrichment = json['enrichment_info'];
    if (rawEnrichment is String) {
      enrichment = rawEnrichment;
    } else if (rawEnrichment is Map) {
      enrichment = rawEnrichment['explanation'] as String?;
    }

    return SearchResponse(
      query: json['query'] as String? ?? '',
      correctedQuery: json['corrected_query'] as String?,
      enrichmentInfo: enrichment,
      totalResults: json['total_results'] as int? ?? 0,
      results: (json['results'] as List<dynamic>?)
              ?.map((e) => HsCodeResult.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class HsCodeDetail {
  final String hscode;
  final String description;
  final String section;
  final int level;
  final String parent;
  final List<HsCodeChild> children;
  final List<String> hierarchyPath;

  const HsCodeDetail({
    required this.hscode,
    required this.description,
    required this.section,
    required this.level,
    required this.parent,
    required this.children,
    required this.hierarchyPath,
  });

  factory HsCodeDetail.fromJson(Map<String, dynamic> json) {
    return HsCodeDetail(
      hscode: json['hscode'] as String? ?? '',
      description: json['description'] as String? ?? '',
      section: json['section'] as String? ?? '',
      level: json['level'] as int? ?? 0,
      parent: json['parent'] as String? ?? '',
      children: (json['children'] as List<dynamic>?)
              ?.map((e) => HsCodeChild.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      hierarchyPath: (json['hierarchy_path'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

class HsCodeChild {
  final String hscode;
  final String description;
  final int level;

  const HsCodeChild({
    required this.hscode,
    required this.description,
    required this.level,
  });

  factory HsCodeChild.fromJson(Map<String, dynamic> json) {
    return HsCodeChild(
      hscode: json['hscode'] as String? ?? '',
      description: json['description'] as String? ?? '',
      level: json['level'] as int? ?? 0,
    );
  }
}

class CategorySection {
  final String section;
  final List<HsCodeChild> chapters;

  const CategorySection({
    required this.section,
    required this.chapters,
  });

  factory CategorySection.fromJson(Map<String, dynamic> json) {
    return CategorySection(
      section: json['section'] as String? ?? '',
      chapters: (json['chapters'] as List<dynamic>?)
              ?.map((e) => HsCodeChild.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
