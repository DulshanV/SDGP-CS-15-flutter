import 'package:flutter/material.dart';
import '../models/pricing_model.dart';
import '../services/pricing_service.dart';
import '../services/auth_service.dart';

class PricingPage extends StatefulWidget {
  const PricingPage({super.key, this.isEmbedded = false});

  final bool isEmbedded;
}

class _PricingPageState extends State<PricingPage> {
  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);
  static const Color accentBlue = Color(0xFF4DA7FF);
  static const Color softBlue = Color(0xFFD7EAFF);

  late final PricingService _pricingService;
  late final AuthService _authService;

  late Future<List<PricingPlan>> _plansFuture;
  late Future<UserSubscription?> _subscriptionFuture;

  @override
  void initState() {
    super.initState();
    _pricingService = PricingService();
    _authService = AuthService();
    _plansFuture = _pricingService.getAllPricingPlans();

    // Load user's current subscription
    _loadSubscription();
  }

  void _loadSubscription() {
    _authService.getCurrentUser().then((user) {
      if (user != null) {
        _subscriptionFuture =
            _pricingService.getUserSubscription(user.id).then((sub) => sub);
        setState(() {});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pricing Plans'),
        backgroundColor: primaryBlue,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [primaryBlue, secondaryBlue],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const Text(
                        'Choose Your Plan',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Find the perfect plan for your HS code search needs',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 16,
                          color: softBlue,
                        ),
                      ),
                      const SizedBox(height: 24),
                      FutureBuilder<List<PricingPlan>>(
                        future: _plansFuture,
                        builder: (context, snapshot) {
                          if (snapshot.connectionState ==
                              ConnectionState.waiting) {
                            return const CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            );
                          }

                          if (snapshot.hasError) {
                            return Text(
                              'Error loading plans',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            );
                          }

                          final plans = snapshot.data ?? PricingPlan.getAllPlans();

                          return Column(
                            children: [
                              // Pricing cards
                              ...plans.map((plan) {
                                return _buildPricingCard(context, plan);
                              }).toList(),

                              // Features comparison section
                              const SizedBox(height: 48),
                              _buildFeaturesComparison(plans),

                              // FAQ section
                              const SizedBox(height: 48),
                              _buildFaqSection(),

                              // Contact section
                              const SizedBox(height: 48),
                              _buildContactSection(context),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPricingCard(BuildContext context, PricingPlan plan) {
    final isPopular = plan.isPopular;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Card(
        elevation: isPopular ? 8 : 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isPopular ? accentBlue : Colors.transparent,
            width: isPopular ? 2 : 0,
          ),
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isPopular
                  ? [softBlue, Colors.white]
                  : [Colors.white, Colors.grey[50]!],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Popular badge
                if (isPopular)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: accentBlue,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Most Popular',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),

                const SizedBox(height: 16),

                // Plan name
                Text(
                  plan.displayName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: primaryBlue,
                  ),
                ),

                const SizedBox(height: 8),

                // Description
                Text(
                  plan.description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),

                const SizedBox(height: 16),

                // Price
                Row(
                  children: [
                    Text(
                      '\$${plan.price.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: primaryBlue,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '/month',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // CTA Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _handlePlanSelection(context, plan),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular ? accentBlue : primaryBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Get Started',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Features list
                ...plan.features.map((feature) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: accentBlue,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            feature,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturesComparison(List<PricingPlan> plans) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Feature Comparison',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: primaryBlue,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'All plans include basic HS code search. Higher tiers unlock more features and API access.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFaqSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Frequently Asked Questions',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: primaryBlue,
            ),
          ),
          const SizedBox(height: 20),
          _buildFaqItem(
            'Can I change my plan?',
            'Yes, you can upgrade or downgrade your plan at any time.',
          ),
          const SizedBox(height: 16),
          _buildFaqItem(
            'Do you offer refunds?',
            'We offer a 30-day money-back guarantee for new subscriptions.',
          ),
          const SizedBox(height: 16),
          _buildFaqItem(
            'Is there a free trial?',
            'The Starter plan is completely free with limited features.',
          ),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          question,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: primaryBlue,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          answer,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }

  Widget _buildContactSection(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: accentBlue,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Need a Custom Plan?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Contact our sales team for enterprise solutions.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Contact support: support@ceylonhs.com'),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: accentBlue,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Contact Sales',
              style: TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handlePlanSelection(BuildContext context, PricingPlan plan) {
    // Show confirmation dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Upgrade to ${plan.displayName}'),
        content: Text(
          'This plan costs \$${plan.price.toStringAsFixed(2)}/month. '
          'Do you want to proceed?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _processUpgrade(context, plan);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryBlue,
            ),
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }

  void _processUpgrade(BuildContext context, PricingPlan plan) {
    // Simulate payment processing
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Successfully upgraded to ${plan.displayName} plan!'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );

    // Reload subscription info
    _loadSubscription();
  }
}
