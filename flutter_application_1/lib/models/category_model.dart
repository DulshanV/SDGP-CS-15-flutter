import 'package:flutter/material.dart';

/// Featured category data model.
class FeaturedCategory {
  final String id;
  final String name;
  final String description;
  final String? icon;
  final String iconCodePoint; // Unicode code point for icon (e.g., "0xfXXXX")
  final int order;
  final bool isActive;
  final DateTime createdAt;

  FeaturedCategory({
    required this.id,
    required this.name,
    required this.description,
    this.icon,
    required this.iconCodePoint,
    required this.order,
    this.isActive = true,
    required this.createdAt,
  });

  factory FeaturedCategory.fromJson(Map<String, dynamic> json) {
    return FeaturedCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      icon: json['icon'] as String?,
      iconCodePoint: json['icon_code_point'] as String? ?? '0xe3f2fd',
      order: json['order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'icon': icon,
        'icon_code_point': iconCodePoint,
        'order': order,
        'is_active': isActive,
        'created_at': createdAt.toIso8601String(),
      };

  /// Get the IconData from the stored code point.
  IconData getIconData() {
    try {
      final codePoint = int.parse(iconCodePoint, radix: 16);
      return IconData(codePoint, fontFamily: 'MaterialIcons');
    } catch (e) {
      // Fallback to default icon
      return Icons.category;
    }
  }
}

class FeaturedCategoriesResponse {
  final List<FeaturedCategory> categories;
  final int total;

  FeaturedCategoriesResponse({
    required this.categories,
    required this.total,
  });

  factory FeaturedCategoriesResponse.fromJson(Map<String, dynamic> json) {
    return FeaturedCategoriesResponse(
      categories: (json['categories'] as List<dynamic>?)
              ?.map((e) => FeaturedCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      total: json['total'] as int? ?? 0,
    );
  }
}

/// Predefined featured categories with icons.
final Map<String, FeaturedCategory> defaultFeaturedCategories = {
  'spices': FeaturedCategory(
    id: 'spices',
    name: 'Spices',
    description: 'Aromatic spices and seasonings',
    iconCodePoint: '0xf0e6', // local_dining_outlined
    order: 0,
    createdAt: DateTime.now(),
  ),
  'apparel': FeaturedCategory(
    id: 'apparel',
    name: 'Apparel',
    description: 'Clothing and textile products',
    iconCodePoint: '0xe4af', // checkroom_outlined
    order: 1,
    createdAt: DateTime.now(),
  ),
  'stationery': FeaturedCategory(
    id: 'stationery',
    name: 'Stationery',
    description: 'Paper and writing supplies',
    iconCodePoint: '0xe3c9', // edit_note_outlined
    order: 2,
    createdAt: DateTime.now(),
  ),
  'minerals': FeaturedCategory(
    id: 'minerals',
    name: 'Minerals',
    description: 'Raw minerals and ores',
    iconCodePoint: '0xebe7', // grain_outlined
    order: 3,
    createdAt: DateTime.now(),
  ),
  'animal_products': FeaturedCategory(
    id: 'animal_products',
    name: 'Animal',
    description: 'Animal products and derivatives',
    iconCodePoint: '0xea56', // pets_outlined
    order: 4,
    createdAt: DateTime.now(),
  ),
  'cosmetics': FeaturedCategory(
    id: 'cosmetics',
    name: 'Cosmetics',
    description: 'Beauty and personal care',
    iconCodePoint: '0xea1b', // spa_outlined
    order: 5,
    createdAt: DateTime.now(),
  ),
};
