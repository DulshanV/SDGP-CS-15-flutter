import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CeylonHs Intro',
      home: const IntroPage(),
    );
  }
}

class IntroPage extends StatelessWidget {
  const IntroPage({super.key});

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);
  static const Color accentBlue = Color(0xFF4DA7FF);
  static const Color softBlue = Color(0xFFD7EAFF);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [primaryBlue, secondaryBlue],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    '☂️',
                    style: TextStyle(fontSize: 90),
                  ),
                  const SizedBox(height: 48),
                  const Text(
                    'CeylonHS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 52,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichText(
                    textAlign: TextAlign.center,
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'From product to code\n',
                          style: TextStyle(
                            color: softBlue,
                            fontSize: 24,
                            fontWeight: FontWeight.w500,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.3,
                            height: 1.25,
                          ),
                        ),
                        TextSpan(
                          text: 'in Seconds.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            fontStyle: FontStyle.italic,
                            letterSpacing: 0.5,
                            shadows: [
                              Shadow(
                                color: Color(0xAA9ED5FF),
                                blurRadius: 16,
                              ),
                              Shadow(
                                color: Color(0x809ED5FF),
                                blurRadius: 28,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 56),
                  SizedBox(
                    width: 220,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const SignUpPage(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        backgroundColor: accentBlue,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Sign in',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 220,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const LoginPage(),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        side: const BorderSide(color: softBlue, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Log in',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AuthEntryPage extends StatefulWidget {
  const AuthEntryPage({super.key, required this.isRegistered});

  final bool isRegistered;

  @override
  State<AuthEntryPage> createState() => _AuthEntryPageState();
}

class _AuthEntryPageState extends State<AuthEntryPage> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final double topSectionHeight = constraints.maxHeight * 0.52;
            final double cardTop = topSectionHeight - 26;

            return Stack(
              children: [
                Container(
                  height: topSectionHeight,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment(-0.9, -1),
                      end: Alignment(1, 1),
                      colors: [Color(0xFF133665), Color(0xFF3A9EEA)],
                    ),
                  ),
                ),
                Positioned(
                  top: -68,
                  left: -58,
                  child: Container(
                    width: 210,
                    height: 210,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0x12000000),
                    ),
                  ),
                ),
                Positioned(
                  top: 78,
                  right: -46,
                  child: Container(
                    width: 172,
                    height: 172,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0x12000000),
                    ),
                  ),
                ),
                const Positioned(
                  top: 210,
                  left: 180,
                  child: Icon(Icons.circle, color: Color(0x44FFFFFF), size: 6),
                ),
                const Positioned(
                  top: 194,
                  right: 88,
                  child: Icon(Icons.circle, color: Color(0x3AFFFFFF), size: 4),
                ),
                Positioned(
                  left: 0,
                  right: 0,
                  top: 28,
                  child: Column(
                    children: [
                      SizedBox(
                        height: 138,
                        child: Image.asset(
                          'assets/images/fallback_city.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 28),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 28),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'CeylonHS',
                            style: TextStyle(
                              fontSize: 42,
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 28),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Your Gateway to Global Trade.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xE6FFFFFF),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: cardTop,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFFF6F7FA),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(34)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 42, 24, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Instant, AI-powered HS\ncode classification for Sri\nLanka Customs.',
                            style: TextStyle(
                              fontSize: 16,
                              height: 1.35,
                              color: Color(0xFF1B2A44),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 28),
                          Center(
                            child: SizedBox(
                              width: 208,
                              child: _EntryActionButtons(
                                onSignUp: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => const SignUpPage(),
                                    ),
                                  );
                                },
                                onLogIn: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => const LoginPage(),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: TextButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => const LoginPage(),
                                  ),
                                );
                              },
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 18,
                                    height: 18,
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: const Color(0xFFD6DBE3),
                                        width: 1,
                                      ),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: Text(
                                        'G',
                                        style: TextStyle(
                                          color: Color(0xFF4A90E2),
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Already have your account?',
                                    style: TextStyle(
                                      color: Color(0xFF9098A8),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: cardTop + 56,
                  left: 0,
                  child: Container(
                    width: 8,
                    height: 14,
                    color: const Color(0xFF0B3C74),
                  ),
                ),
                Positioned(
                  top: cardTop + 56,
                  right: 0,
                  child: Container(
                    width: 8,
                    height: 14,
                    color: const Color(0xFF2A90E9),
                  ),
                ),
              ],
            );
          },
        ),
      ),
      bottomNavigationBar: _EntryBottomNav(
        onTap: (index) {
          if (index == 0) {
            return;
          }

          if (index == 1) {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const HsCodeFinderPage(),
              ),
            );
            return;
          }

          if (index == 3) {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const LoginPage(),
              ),
            );
            return;
          }

          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => const MainHomePage(),
            ),
          );
        },
      ),
    );
  }
}

class _EntryActionButtons extends StatelessWidget {
  const _EntryActionButtons({required this.onSignUp, required this.onLogIn});

  final VoidCallback onSignUp;
  final VoidCallback onLogIn;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF2B8FF0), width: 2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 40,
            child: ElevatedButton(
              onPressed: onSignUp,
              style: ElevatedButton.styleFrom(
                elevation: 0,
                backgroundColor: const Color(0xFF2B8FF0),
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(8),
                    topRight: Radius.circular(8),
                  ),
                ),
              ),
              child: const Text(
                'Register',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 40,
            child: OutlinedButton(
              onPressed: onLogIn,
              style: OutlinedButton.styleFrom(
                side: BorderSide.none,
                foregroundColor: const Color(0xFF2B8FF0),
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  ),
                ),
              ),
              child: const Text(
                'Log in',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EntryBottomNav extends StatelessWidget {
  const _EntryBottomNav({required this.onTap});

  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    const List<_EntryBottomNavItem> items = [
      _EntryBottomNavItem(
        index: 0,
        icon: Icons.home_filled,
        label: 'Home',
        active: true,
      ),
      _EntryBottomNavItem(index: 1, icon: Icons.search, label: 'History'),
      _EntryBottomNavItem(index: 2, icon: Icons.access_time, label: 'History'),
      _EntryBottomNavItem(index: 3, icon: Icons.person_outline, label: 'Profile'),
    ];

    return Container(
      height: 68,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE7EAF0))),
      ),
      child: Row(
        children: items.map((item) {
          return Expanded(
            child: InkWell(
              onTap: () => onTap(item.index),
              child: item,
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _EntryBottomNavItem extends StatelessWidget {
  const _EntryBottomNavItem({
    required this.index,
    required this.icon,
    required this.label,
    this.active = false,
  });

  final int index;
  final IconData icon;
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final Color color = active ? const Color(0xFF2B8FF0) : const Color(0xFF9EA6B5);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class HsCodeFinderPage extends StatefulWidget {
  const HsCodeFinderPage({super.key, this.isEmbedded = false});

  final bool isEmbedded;

  @override
  State<HsCodeFinderPage> createState() => _HsCodeFinderPageState();
}

class _HsCodeFinderPageState extends State<HsCodeFinderPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _itemPriceController = TextEditingController();
  final TextEditingController _detailsController = TextEditingController();

  String? _selectedOrigin;
  String? _selectedDestination;
  String? _selectedCurrency = 'USD - US Dollar';

  static const List<String> _countries = [
    'Sri Lanka',
    'India',
    'China',
    'Singapore',
    'United Arab Emirates',
  ];

  static const List<String> _currencies = [
    'USD - US Dollar',
    'LKR - Sri Lankan Rupee',
    'EUR - Euro',
    'INR - Indian Rupee',
  ];

  @override
  void dispose() {
    _emailController.dispose();
    _itemPriceController.dispose();
    _detailsController.dispose();
    super.dispose();
  }

  void _submitSearch() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Searching HS code...'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F4F8),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 86),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF133665), Color(0xFF3A9EEA)],
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      top: -42,
                      left: -38,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0x14000000),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 54,
                      right: -24,
                      child: Container(
                        width: 148,
                        height: 148,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0x12000000),
                        ),
                      ),
                    ),
                    Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(
                              Icons.public,
                              color: Colors.white,
                              size: 20,
                            ),
                            SizedBox(width: 6),
                            Text(
                              'CeylonHS',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 34,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        SizedBox(
                          height: 96,
                          child: Image.asset(
                            'assets/images/fallback_city.png',
                            fit: BoxFit.contain,
                          ),
                        ),
                        const SizedBox(height: 14),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'HS Code Finder',
                            style: TextStyle(
                              color: Color(0xFF0F223C),
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Fill in the details below to your harmonized system code',
                            style: TextStyle(
                              color: Color(0xE6FFFFFF),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(0, -48),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(12, 14, 12, 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F9FB),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x16000000),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const _SearchFieldLabel('Email'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: _searchInputDecoration('Enter your email'),
                            validator: (value) {
                              final String input = value?.trim() ?? '';
                              if (input.isEmpty || !input.contains('@')) {
                                return 'Enter a valid email';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: _LabeledDropdown(
                                  label: 'Made In',
                                  hint: 'Select Country',
                                  value: _selectedOrigin,
                                  items: _countries,
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedOrigin = value;
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _LabeledDropdown(
                                  label: 'Ship To',
                                  hint: 'Select Destination',
                                  value: _selectedDestination,
                                  items: _countries,
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedDestination = value;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const _SearchFieldLabel('Item Price'),
                                    const SizedBox(height: 6),
                                    TextFormField(
                                      controller: _itemPriceController,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      decoration: _searchInputDecoration('0.00'),
                                      validator: (value) {
                                        final String input = value?.trim() ?? '';
                                        if (input.isEmpty) {
                                          return 'Required';
                                        }
                                        final double? parsed = double.tryParse(input);
                                        if (parsed == null || parsed < 0) {
                                          return 'Invalid';
                                        }
                                        return null;
                                      },
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _LabeledDropdown(
                                  label: 'Currency',
                                  hint: 'Currency',
                                  value: _selectedCurrency,
                                  items: _currencies,
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedCurrency = value;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const _SearchFieldLabel('Product Details'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _detailsController,
                            maxLines: 2,
                            decoration: _searchInputDecoration('Enter product details........'),
                            validator: (value) {
                              if ((value ?? '').trim().isEmpty) {
                                return 'Add product details';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: SizedBox(
                              width: 172,
                              height: 42,
                              child: ElevatedButton(
                                onPressed: _submitSearch,
                                style: ElevatedButton.styleFrom(
                                  elevation: 2,
                                  backgroundColor: const Color(0xFF0B3EA8),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(22),
                                  ),
                                ),
                                child: const Text(
                                  'Search HS Code',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _searchInputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        color: Color(0xFF8D96A6),
        fontSize: 14,
      ),
      filled: true,
      fillColor: const Color(0xFFF1F4F9),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFD0D8E5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFD0D8E5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF0B3EA8), width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFD9534F)),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFD9534F), width: 1.4),
      ),
      isDense: true,
    );
  }
}

class _SearchFieldLabel extends StatelessWidget {
  const _SearchFieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF687388),
        fontSize: 11,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _LabeledDropdown extends StatelessWidget {
  const _LabeledDropdown({
    required this.label,
    required this.hint,
    required this.items,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final String hint;
  final List<String> items;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SearchFieldLabel(label),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF1F4F9),
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFD0D8E5)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFD0D8E5)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF0B3EA8), width: 1.4),
            ),
            isDense: true,
          ),
          hint: Text(
            hint,
            style: const TextStyle(
              color: Color(0xFF8D96A6),
              fontSize: 14,
            ),
          ),
          style: const TextStyle(
            color: Color(0xFF49576D),
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          items: items
              .map(
                (item) => DropdownMenuItem<String>(
                  value: item,
                  child: Text(item, overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class PricingPage extends StatelessWidget {
  const PricingPage({super.key, this.isEmbedded = false});

  final bool isEmbedded;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FA),
      body: SafeArea(
        child: Stack(
          children: [
            if (!isEmbedded)
              Positioned(
                top: 12,
                left: 18,
                child: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(
                    Icons.arrow_back_rounded,
                    color: Color(0xFF0B3EA8),
                    size: 26,
                  ),
                ),
              ),
            if (!isEmbedded)
              Positioned(
                top: 12,
                right: 18,
                child: IconButton(
                  onPressed: () {},
                  icon: const Icon(
                    Icons.person_outline_rounded,
                    color: Color(0xFF0B3EA8),
                    size: 26,
                  ),
                ),
              ),
            ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(20, isEmbedded ? 20 : 68, 20, 24),
              children: [
                const Text(
                  'Simple, transparent pricing.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF1D2F4D),
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Choose the plan that best fits your search volume and business needs.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF5D6778),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 32),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 280,
                        child: _PricingCard(
                          title: 'Starter',
                          price: 3,
                          features: const [
                            '10 Search results per month',
                            'Basic HS code matching',
                            'Email support',
                            'Email support',
                          ],
                          buttonLabel: 'Choose Starter',
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Starter plan selected')),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      SizedBox(
                        width: 280,
                        child: _PricingCard(
                          title: 'Business',
                          price: 5,
                          isMostPopular: true,
                          features: const [
                            '25 Search results per month',
                            'AI-Enhanced accuracy',
                            'Priority search speed',
                            'Export search history',
                          ],
                          buttonLabel: 'Choose Business',
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Business plan selected')),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      SizedBox(
                        width: 280,
                        child: _PricingCard(
                          title: 'Enterprise',
                          price: 9,
                          features: const [
                            '50 Search results per month',
                            'Dedicated support',
                            'Custom API Access',
                            'Bulk classification',
                          ],
                          buttonLabel: 'Choose Enterprise',
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Enterprise plan selected')),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PricingCard extends StatelessWidget {
  const _PricingCard({
    required this.title,
    required this.price,
    required this.features,
    required this.buttonLabel,
    required this.onPressed,
    this.isMostPopular = false,
  });

  final String title;
  final int price;
  final List<String> features;
  final String buttonLabel;
  final VoidCallback onPressed;
  final bool isMostPopular;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isMostPopular ? const Color(0xFF0B3EA8) : const Color(0xFFD0D8E5),
          width: isMostPopular ? 2 : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0x0F000000),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          if (isMostPopular) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF3D8BFF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'MOST POPULAR',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(height: 14),
          ],
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF1D2F4D),
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  r'$',
                  style: TextStyle(
                    color: Color(0xFF0B3EA8),
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Text(
                '$price',
                style: const TextStyle(
                  color: Color(0xFF0B3EA8),
                  fontSize: 56,
                  fontWeight: FontWeight.w800,
                  height: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          ...features.map((feature) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: Color(0xFF4A90E2),
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        feature,
                        style: const TextStyle(
                          color: Color(0xFF5D6778),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                elevation: 2,
                backgroundColor: const Color(0xFF0B3EA8),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                ),
              ),
              child: Text(
                buttonLabel,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SignUpPage extends StatelessWidget {
  const SignUpPage({super.key});

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [secondaryBlue, primaryBlue],
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -10,
                        child: Transform.rotate(
                          angle: -0.5,
                          child: Container(
                            width: 160,
                            height: 130,
                            color: const Color(0x22FFFFFF),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: -30,
                        child: Transform.rotate(
                          angle: 0.45,
                          child: Container(
                            width: 130,
                            height: 120,
                            color: const Color(0x18FFFFFF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'CeylonHS',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 34,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const Spacer(),
                                Icon(
                                  Icons.notifications_none_rounded,
                                  color: Colors.white.withValues(alpha: 0.9),
                                  size: 26,
                                ),
                              ],
                            ),
                            const Spacer(),
                            Icon(
                              Icons.location_city_rounded,
                              size: 72,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Create Your Account',
                          style: TextStyle(
                            color: Color(0xFF1D2F4D),
                            fontSize: 46,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign up to get instant HS codes',
                          style: TextStyle(
                            color: primaryBlue,
                            fontSize: 28,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        const _LoginMockField(
                          hintText: 'Full Name',
                        ),
                        const SizedBox(height: 14),
                        const _LoginMockField(
                          hintText: 'Email or Phone Number',
                        ),
                        const SizedBox(height: 14),
                        const _LoginMockField(
                          hintText: 'Password',
                        ),
                        const SizedBox(height: 26),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [secondaryBlue, primaryBlue],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x290B3EA8),
                                  blurRadius: 12,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute<void>(
                                    builder: (_) => const MainHomePage(),
                                  ),
                                  (route) => false,
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 46,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: const Text('Sign up'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  height: 220,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [secondaryBlue, primaryBlue],
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: -40,
                        left: -10,
                        child: Transform.rotate(
                          angle: -0.5,
                          child: Container(
                            width: 160,
                            height: 130,
                            color: const Color(0x22FFFFFF),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: -30,
                        child: Transform.rotate(
                          angle: 0.45,
                          child: Container(
                            width: 130,
                            height: 120,
                            color: const Color(0x18FFFFFF),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'CeylonHS',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 34,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Spacer(),
                            Align(
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.location_city_rounded,
                                size: 72,
                                color: Colors.white.withValues(alpha: 0.7),
                              ),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            color: Color(0xFF1D2F4D),
                            fontSize: 46,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Sign in to access your dashboard',
                          style: TextStyle(
                            color: primaryBlue,
                            fontSize: 28,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 26),
                        const _LoginMockField(
                          hintText: 'Email or Phone Number',
                          isPrimaryBorder: true,
                        ),
                        const SizedBox(height: 14),
                        const _LoginMockField(
                          hintText: 'Password',
                        ),
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {},
                            style: TextButton.styleFrom(
                              foregroundColor: primaryBlue,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 0,
                                vertical: 2,
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Forgot Password?',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [secondaryBlue, primaryBlue],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x290B3EA8),
                                  blurRadius: 12,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pushAndRemoveUntil(
                                  MaterialPageRoute<void>(
                                    builder: (_) => const MainHomePage(),
                                  ),
                                  (route) => false,
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 46,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              child: const Text('Log in'),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        RichText(
                          text: const TextSpan(
                            style: TextStyle(
                              color: Color(0xFF1D2F4D),
                              fontSize: 32,
                              fontWeight: FontWeight.w500,
                            ),
                            children: [
                              TextSpan(text: 'Don’t have your '),
                              TextSpan(
                                text: 'account?',
                                style: TextStyle(
                                  decoration: TextDecoration.underline,
                                  color: primaryBlue,
                                ),
                              ),
                              TextSpan(text: ' *'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LoginMockField extends StatelessWidget {
  const _LoginMockField({required this.hintText, this.isPrimaryBorder = false});

  final String hintText;
  final bool isPrimaryBorder;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 58,
      child: TextField(
        obscureText: hintText == 'Password',
        style: const TextStyle(
          color: Color(0xFF1D2F4D),
          fontSize: 22,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: TextStyle(
            color: const Color(0xFF1D2F4D).withValues(alpha: 0.45),
            fontSize: 22,
            fontWeight: FontWeight.w500,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
              color: isPrimaryBorder
                  ? const Color(0xFF0B3EA8)
                  : const Color(0xFFD5DDE8),
              width: 1.4,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(0xFF0B3EA8),
              width: 1.8,
            ),
          ),
        ),
      ),
    );
  }
}

class MainHomePage extends StatefulWidget {
  const MainHomePage({super.key});

  @override
  State<MainHomePage> createState() => _MainHomePageState();
}

class _MainHomePageState extends State<MainHomePage> {
  int _selectedIndex = 0;

  static const List<String> _labels = [
    'Home',
    'Search',
    'Pricing',
    'Profile',
  ];

  static const List<IconData> _icons = [
    Icons.home_rounded,
    Icons.search_rounded,
    Icons.price_change_rounded,
    Icons.person_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: const [
          _HomeContent(),
          HsCodeFinderPage(isEmbedded: true),
          PricingPage(isEmbedded: true),
          _ProfileContent(),
        ],
      ),
      bottomNavigationBar: Container(
        height: 78,
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFEAEAEA)),
          ),
        ),
        child: Row(
          children: List.generate(_labels.length, (index) {
            final bool isSelected = _selectedIndex == index;
            return Expanded(
              child: InkWell(
                onTap: () {
                  setState(() {
                    _selectedIndex = index;
                  });
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _icons[index],
                      size: 23,
                      color: isSelected
                          ? const Color(0xFF0B3EA8)
                          : const Color(0xFF8E8E8E),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _labels[index],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? const Color(0xFF0B3EA8)
                            : const Color(0xFF8E8E8E),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _HomeContent extends StatelessWidget {
  const _HomeContent();

  static const Color primaryBlue = Color(0xFF0B3EA8);
  static const Color secondaryBlue = Color(0xFF0A2E8A);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF4F7FC),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [secondaryBlue, primaryBlue],
                  ),
                ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Text(
                            'CeylonHS',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: Color(0xE6FFFFFF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person,
                              size: 18,
                              color: Color(0xFF0B3EA8),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Icon(
                            Icons.notifications_none_rounded,
                            size: 22,
                            color: Colors.white,
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(width: 12),
                            const Icon(
                              Icons.search,
                              color: Color(0xFF9BA5B7),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: Color(0xFF1D2F4D),
                                ),
                                decoration: InputDecoration(
                                  border: InputBorder.none,
                                  hintText: 'Search HS code or Product...',
                                  hintStyle: TextStyle(
                                    fontSize: 16,
                                    color: const Color(0xFF1D2F4D)
                                        .withValues(alpha: 0.45),
                                  ),
                                ),
                              ),
                            ),
                            Container(
                              margin: const EdgeInsets.all(4),
                              width: 38,
                              decoration: BoxDecoration(
                                color: primaryBlue,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.mic_none_rounded,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: const [
                          Expanded(
                            child: _HomeActionCard(
                              title: 'Favorites',
                              icon: Icons.bookmark_border_rounded,
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _HomeActionCard(
                              title: 'Tariff Docs',
                              icon: Icons.description_outlined,
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _HomeActionCard(
                              title: 'News',
                              icon: Icons.newspaper_outlined,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recent Searches',
                        style: TextStyle(
                          color: Color(0xFF2C3442),
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 98,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: const [
                            _RecentSearchCard(),
                            SizedBox(width: 10),
                            _RecentSearchCard(),
                            SizedBox(width: 10),
                            _RecentSearchCard(),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Featured Categories',
                        style: TextStyle(
                          color: Color(0xFF2C3442),
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Row(
                        children: [
                          Expanded(
                            child: _FeaturedCategoryCard(
                              icon: Icons.camera_alt_outlined,
                              label: 'Spices',
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _FeaturedCategoryCard(
                              icon: Icons.description_outlined,
                              label: 'Apparel',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Row(
                        children: [
                          Expanded(
                            child: _FeaturedCategoryCard(
                              icon: Icons.bubble_chart_outlined,
                              label: 'Apparel',
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _FeaturedCategoryCard(
                              icon: Icons.grain_outlined,
                              label: 'Minerals',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Row(
                        children: [
                          Expanded(
                            child: _FeaturedCategoryCard(
                              icon: Icons.pets_outlined,
                              label: 'Animal',
                            ),
                          ),
                          SizedBox(width: 10),
                          Expanded(
                            child: _FeaturedCategoryCard(
                              icon: Icons.spa_outlined,
                              label: 'Cosmetics',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF4F7FC),
      child: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.person_outline_rounded,
                size: 80,
                color: Color(0xFF0B3EA8),
              ),
              const SizedBox(height: 20),
              const Text(
                'Profile',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1D2F4D),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Coming soon',
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF8E8E8E),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeActionCard extends StatelessWidget {
  const _HomeActionCard({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF6FA0D9)),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              title,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF2C3442),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentSearchCard extends StatelessWidget {
  const _RecentSearchCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 118,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF318DED), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Ceylon Tea -',
            style: TextStyle(
              color: Color(0xFF2C3442),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 2),
          Text(
            '0902.10',
            style: TextStyle(
              color: Color(0xFF5D6778),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          Spacer(),
          Align(
            alignment: Alignment.bottomRight,
            child: Icon(
              Icons.access_time_rounded,
              size: 16,
              color: Color(0xFFB7BFCC),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturedCategoryCard extends StatelessWidget {
  const _FeaturedCategoryCard({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 92,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 30, color: const Color(0xFF6FA0D9)),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF2C3442),
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
