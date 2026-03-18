/// Pricing-related data models.

enum PricingTier {
  starter,
  business,
  enterprise,
}

extension PricingTierX on PricingTier {
  String get displayName {
    return switch (this) {
      PricingTier.starter => 'Starter',
      PricingTier.business => 'Business',
      PricingTier.enterprise => 'Enterprise',
    };
  }

  double get price {
    return switch (this) {
      PricingTier.starter => 3.0,
      PricingTier.business => 5.0,
      PricingTier.enterprise => 9.0,
    };
  }

  String get priceString => '\$${price.toStringAsFixed(2)}';

  bool get isPopular {
    return this == PricingTier.business;
  }

  String get description {
    return switch (this) {
      PricingTier.starter => 'For individuals',
      PricingTier.business => 'For small teams',
      PricingTier.enterprise => 'For enterprises',
    };
  }

  List<String> get features {
    return switch (this) {
      PricingTier.starter => [
          'Up to 100 searches/month',
          'Basic HS code lookup',
          'Search history (7 days)',
          'Email support',
        ],
      PricingTier.business => [
          'Up to 500 searches/month',
          'Advanced HS code lookup',
          'Search history (30 days)',
          'Favorites & collections',
          'Priority email support',
          'API access (limited)',
        ],
      PricingTier.enterprise => [
          'Unlimited searches',
          'All features included',
          'Search history (unlimited)',
          'Favorites & collections',
          '24/7 phone & email support',
          'Full API access',
          'Custom integrations',
          'Dedicated account manager',
        ],
    };
  }
}

class PricingPlan {
  final PricingTier tier;
  final String displayName;
  final double price;
  final String description;
  final List<String> features;
  final bool isPopular;

  PricingPlan({
    required this.tier,
    required this.displayName,
    required this.price,
    required this.description,
    required this.features,
    this.isPopular = false,
  });

  factory PricingPlan.fromTier(PricingTier tier) {
    return PricingPlan(
      tier: tier,
      displayName: tier.displayName,
      price: tier.price,
      description: tier.description,
      features: tier.features,
      isPopular: tier.isPopular,
    );
  }

  static List<PricingPlan> getAllPlans() {
    return [
      PricingPlan.fromTier(PricingTier.starter),
      PricingPlan.fromTier(PricingTier.business),
      PricingPlan.fromTier(PricingTier.enterprise),
    ];
  }

  Map<String, dynamic> toJson() => {
        'tier': tier.toString(),
        'display_name': displayName,
        'price': price,
        'description': description,
        'features': features,
        'is_popular': isPopular,
      };

  factory PricingPlan.fromJson(Map<String, dynamic> json) {
    return PricingPlan(
      tier: PricingTier.values.firstWhere(
        (t) => t.toString() == json['tier'],
        orElse: () => PricingTier.starter,
      ),
      displayName: json['display_name'] as String? ?? 'Plan',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] as String? ?? '',
      features: List<String>.from(json['features'] as List? ?? []),
      isPopular: json['is_popular'] as bool? ?? false,
    );
  }
}

class UserSubscription {
  final String userId;
  final PricingTier currentTier;
  final DateTime? subscriptionStartDate;
  final DateTime? subscriptionEndDate;
  final bool isActive;

  UserSubscription({
    required this.userId,
    required this.currentTier,
    this.subscriptionStartDate,
    this.subscriptionEndDate,
    this.isActive = true,
  });

  factory UserSubscription.free(String userId) {
    return UserSubscription(
      userId: userId,
      currentTier: PricingTier.starter,
      isActive: true,
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'current_tier': currentTier.toString(),
        'subscription_start_date': subscriptionStartDate?.toIso8601String(),
        'subscription_end_date': subscriptionEndDate?.toIso8601String(),
        'is_active': isActive,
      };

  factory UserSubscription.fromJson(Map<String, dynamic> json) {
    return UserSubscription(
      userId: json['user_id'] as String,
      currentTier: PricingTier.values.firstWhere(
        (t) =>
            t.toString() ==
            json['current_tier'].toString().replaceFirst('PricingTier.', ''),
        orElse: () => PricingTier.starter,
      ),
      subscriptionStartDate: json['subscription_start_date'] != null
          ? DateTime.parse(json['subscription_start_date'] as String)
          : null,
      subscriptionEndDate: json['subscription_end_date'] != null
          ? DateTime.parse(json['subscription_end_date'] as String)
          : null,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
