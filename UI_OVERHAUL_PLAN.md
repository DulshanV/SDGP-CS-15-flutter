# CeylonHS Flutter App — UI/UX Overhaul Plan

**Created:** 2026-03-17
**Companion doc:** `UI_DECISION_LOG.md` (rationale for every decision)
**Scope:** `flutter_application_1/lib/` — 19 Dart files, 13 screens

---

## Phase 0: Preparation (Before Writing Code)

### 0.1 — Add Dependencies
Update `pubspec.yaml`:
```yaml
dependencies:
  go_router: ^14.0.0        # Declarative routing
  shimmer: ^3.0.0            # Loading skeletons
  cached_network_image: ^3.3.1  # Profile photos with caching
  url_launcher: ^6.2.0       # mailto: links
```

### 0.2 — Create Directory Structure
```
lib/
├── main.dart                 # ← Reduce to <30 lines
├── config.dart               # ← Keep as-is
├── router/
│   └── app_router.dart       # New: go_router config
├── theme/
│   ├── app_colors.dart       # New: centralized colors
│   ├── app_theme.dart        # New: ThemeData + M3
│   └── app_spacing.dart      # New: spacing constants
├── widgets/
│   ├── app_loading.dart      # New: shimmer loading
│   ├── app_error.dart        # New: error state widget
│   ├── app_empty_state.dart  # New: empty state widget
│   └── app_card.dart         # New: shared card widget
├── screens/
│   ├── intro_page.dart       # Extracted from main.dart
│   ├── signup_page.dart      # Extracted from main.dart
│   ├── login_page.dart       # Extracted from main.dart
│   ├── home_page.dart        # Extracted from main.dart (shell + home tab)
│   ├── profile_page.dart     # Extracted from main.dart
│   ├── search_page.dart      # Existing, updated
│   ├── favorites_page.dart   # Existing, updated
│   ├── history_page.dart     # Existing, updated
│   ├── hs_code_detail_page.dart  # Existing, updated
│   ├── pricing_page.dart     # Existing, updated
│   ├── recents_page.dart     # Existing, updated
│   └── admin_dashboard.dart  # Existing, updated
├── models/                   # Existing, no structural changes
│   ├── category_model.dart
│   ├── pricing_model.dart
│   ├── search_result.dart
│   └── user_model.dart
└── services/                 # Existing, minor fixes only
    ├── api_service.dart
    ├── auth_service.dart
    ├── categories_service.dart
    ├── favorites_service.dart
    ├── pricing_service.dart
    └── search_history_service.dart
```

---

## Phase 1: Foundation (Theme + Structure) — Do First

**Goal:** Establish the design system and file structure before touching any screens.

### Step 1.1 — Create `lib/theme/app_colors.dart`
- Extract all color constants from all 12 classes
- Define a single `AppColors` class:
  ```
  primaryBlue: 0xFF0B3EA8
  secondaryBlue: 0xFF0A2E8A
  accentBlue: 0xFF4DA7FF
  softBlue: 0xFFD7EAFF
  textDark: 0xFF1D2F4D
  textMedium: 0xFF5D6778
  textLight: 0xFF9BA5B7
  borderColor: 0xFFDADCE0
  surfaceLight: 0xFFF2F4F8
  backgroundBlue: 0xFFE8F0FE
  ```
- **Ref:** UIX-015

### Step 1.2 — Create `lib/theme/app_spacing.dart`
- 4px grid: `xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`
- Screen horizontal padding: `screenPadding = 20`
- **Ref:** UIX-023

### Step 1.3 — Create `lib/theme/app_theme.dart`
- `ThemeData` with `useMaterial3: true`
- `ColorScheme.fromSeed(seedColor: AppColors.primaryBlue)`
- Custom `TextTheme` mapping existing font sizes to M3 scale
- Component themes: `AppBarTheme`, `CardTheme`, `ElevatedButtonTheme`, `InputDecorationTheme`, `NavigationBarThemeData`
- **Ref:** UIX-015, UIX-021, UIX-024

### Step 1.4 — Split `main.dart` (1,782 lines → ~30 lines)
Extract into separate files:
| Current location | New file | Lines |
|---|---|---|
| IntroPage (33-173) | `screens/intro_page.dart` | ~140 |
| SignUpPage (175-470) | `screens/signup_page.dart` | ~295 |
| LoginPage (472-893) | `screens/login_page.dart` | ~420 |
| MainHomePage (895-1005) | `screens/home_page.dart` | ~110 |
| _HomeContent (1007-1347) | `screens/home_page.dart` | ~340 |
| UserProfilePage (1349-1605) | `screens/profile_page.dart` | ~255 |
| Helper widgets (1606-1782) | Distribute to relevant files | ~175 |
- **Ref:** UIX-016

### Step 1.5 — Create `lib/router/app_router.dart`
- Define all routes with `GoRouter`
- Auth guard: redirect to `/intro` if not logged in
- Shell route for bottom nav
- Routes:
  ```
  /intro → IntroPage
  /signup → SignUpPage
  /login → LoginPage
  / → MainHomePage (shell)
    /home → HomeContent (tab 0)
    /search → SearchPage (tab 1)
    /recents → RecentsPage (tab 2)
    /pricing → PricingPage (tab 3)
    /profile → ProfilePage (tab 4)
  /detail/:hscode → HsCodeDetailPage
  /favorites → FavoritesPage
  /history → HistoryPage
  /admin → AdminDashboardPage
  ```
- **Ref:** UIX-018

### Step 1.6 — Update `main.dart`
- Only `main()`, `WidgetsFlutterBinding.ensureInitialized()`, and `MyApp`
- Apply `AppTheme.lightTheme` to `MaterialApp.router`
- Wire `GoRouter`
- **Ref:** UIX-015, UIX-016

---

## Phase 2: Quick Wins (Trivial Fixes) — Batch Together

**Goal:** Fix all trivial issues in one pass. Each is < 30 minutes.

| # | Fix | File | Ref |
|---|---|---|---|
| 2.1 | Remove notification bell icon (SignUpPage header) | `signup_page.dart` | UIX-001 |
| 2.2 | Remove notification bell icon (Home header) | `home_page.dart` | UIX-002 |
| 2.3 | Remove "Tariff Docs" action card | `home_page.dart` | UIX-004 |
| 2.4 | Remove "News" action card | `home_page.dart` | UIX-005 |
| 2.5 | Wire "Favorites" card → `FavoritesPage` | `home_page.dart` | UIX-003 |
| 2.6 | Fix Cosmetics icon typo (`'0xealb'` → `'0xea1b'`) | `category_model.dart` | UIX-013 |
| 2.7 | Remove dead `_success` variable and display code | `signup_page.dart` | UIX-012 |
| 2.8 | Remove unused `secondaryBlue` + lint suppress | `search_page.dart` | Dead code |
| 2.9 | Remove stale comment "PricingPage is now imported..." | `main.dart` | Dead code |
| 2.10 | Call `FavoritesService().clearCache()` in `logout()` | `auth_service.dart` | UIX-020 |
| 2.11 | Fix "Sign in" → "Create Account" button text | `intro_page.dart` | UIX-028 |
| 2.12 | Display user profile photo (CircleAvatar + NetworkImage) | `profile_page.dart` | UIX-014 |

---

## Phase 3: Screen Overhaul — One Screen at a Time

**Goal:** Modernize each screen to use the new theme, shared widgets, and M3 components.

### 3.1 — IntroPage
- Apply gradient from `AppColors`
- Use `Theme.of(context).textTheme` for all text
- Rename buttons: "Create Account" / "Log In"
- Add `semanticLabel` to interactive elements
- **Ref:** UIX-028, UIX-030

### 3.2 — SignUpPage & LoginPage
- Add AppBar with back arrow
- Use `Theme.of(context)` styling throughout
- Remove per-class color constants
- Replace manual form styling with `InputDecorationTheme`
- Improve form validation UX (inline errors, realtime validation)
- **Ref:** UIX-029, UIX-015

### 3.3 — MainHomePage (Shell)
- Replace custom bottom nav with M3 `NavigationBar`
- Keep `IndexedStack` for tab persistence
- Wire with `GoRouter` shell route
- **Ref:** UIX-022

### 3.4 — HomeContent (Tab 0)
- Remove inert notification bell
- Remove Tariff Docs and News cards
- Wire Favorites card to navigate
- Redesign featured categories grid with proper cards
- Use shared `AppCard` widget for action cards
- Add shimmer loading for categories
- **Ref:** UIX-002, UIX-003, UIX-004, UIX-005

### 3.5 — SearchPage (Tab 1)
- Use `SearchBar` (M3) instead of custom TextField
- Use shared `AppLoading` for search in progress
- Use shared `AppEmptyState` for no results
- Clean up unused `secondaryBlue`
- Move hardcoded search chips to a config constant or `AppConfig`
- Add `semanticLabel` to result cards
- **Ref:** UIX-017, UIX-025, UIX-026

### 3.6 — RecentsPage (Tab 2)
- Use shared widgets for loading/error/empty states
- Consistent card styling via `AppCard`
- Filter input using M3 styling
- **Ref:** UIX-017

### 3.7 — PricingPage (Tab 3)
- Wire real `PricingService.upgradeSubscription()` in `_processUpgrade()`
- Build actual feature comparison table from plan data
- Replace "Contact Sales" snackbar with `url_launcher` mailto
- Use M3 card components for plan cards
- Add shimmer loading for plans
- **Ref:** UIX-009, UIX-010, UIX-006

### 3.8 — UserProfilePage (Tab 4)
- Display user photo (CircleAvatar + NetworkImage)
- Use M3 `ListTile` for menu items
- Consistent styling from theme
- **Ref:** UIX-014

### 3.9 — HsCodeDetailPage
- M3 Card styling for detail sections
- Consistent hierarchy display
- Fix silent catch in `_checkFavoriteStatus` (at least log it)
- **Ref:** UIX-015

### 3.10 — FavoritesPage & HistoryPage
- Shared loading/error/empty widgets
- Consistent card styling
- Pull-to-refresh
- **Ref:** UIX-017

### 3.11 — AdminDashboardPage
- M3 Cards for stats
- Consistent theme usage
- **Ref:** UIX-015

---

## Phase 4: Auto-Login & Session Management

### 4.1 — Implement `AuthService.tryAutoLogin()`
- Check `SharedPreferences` for stored token on app start
- Validate token freshness (Firebase tokens expire after 1 hour — check `expiresIn`)
- If valid, load user profile and route to `MainHomePage`
- If expired/missing, route to `IntroPage`
- **Ref:** UIX-027

### 4.2 — Add Splash Screen
- Brief branded splash while auto-login check runs
- Prevents flash of IntroPage for logged-in users

---

## Phase 5: Polish & Accessibility

### 5.1 — Shimmer Loading States
- Search results skeleton
- Favorites list skeleton
- History list skeleton
- Pricing cards skeleton
- Profile page skeleton
- **Ref:** UIX-025

### 5.2 — Empty States
- Consistent `AppEmptyState` widget across:
  - Search (no results)
  - Favorites (no favorites yet)
  - History (no history yet)
  - Recents (no recent searches)
- **Ref:** UIX-026

### 5.3 — Accessibility Pass
- Add `Semantics` to all interactive elements
- Ensure 48x48dp touch targets
- Test with TalkBack
- **Ref:** UIX-030, UIX-031

### 5.4 — Animations & Transitions
- Page transitions via `GoRouter` custom transitions
- Hero animations for HS code cards → detail page
- Staggered list animations for search results
- Smooth bottom nav transitions

---

## Implementation Order Summary

```
Phase 0 (Prep)         → 1 hour
Phase 1 (Foundation)   → 1-2 days
  1.1  AppColors
  1.2  AppSpacing
  1.3  AppTheme
  1.4  Split main.dart
  1.5  GoRouter setup
  1.6  Wire new main.dart
Phase 2 (Quick Wins)   → 2-3 hours
  2.1-2.12 (batch all trivial fixes)
Phase 3 (Screen Work)  → 2-3 days
  3.1-3.11 (one screen at a time)
Phase 4 (Auth/Session) → 3-4 hours
  4.1  Auto-login
  4.2  Splash screen
Phase 5 (Polish)       → 1-2 days
  5.1  Shimmer loading
  5.2  Empty states
  5.3  Accessibility
  5.4  Animations
```

---

## Files Changed Summary

| Action | Count | Files |
|---|---|---|
| **New files** | 10 | `app_colors.dart`, `app_spacing.dart`, `app_theme.dart`, `app_router.dart`, `app_loading.dart`, `app_error.dart`, `app_empty_state.dart`, `app_card.dart`, `intro_page.dart` (extract), `signup_page.dart` (extract), `login_page.dart` (extract), `home_page.dart` (extract), `profile_page.dart` (extract) |
| **Major edits** | 8 | `main.dart` (gutted), all 7 screen files |
| **Minor edits** | 4 | `pubspec.yaml`, `auth_service.dart`, `category_model.dart`, `pricing_page.dart` |
| **No changes** | 7 | All model files (except category_model), `api_service.dart`, `search_history_service.dart`, `categories_service.dart`, `favorites_service.dart`, `pricing_service.dart`, `config.dart` |

---

## Success Criteria

After the overhaul, the app should meet these standards:

1. **Zero non-working UI elements** — every visible button/icon does something or is removed
2. **Centralized theming** — changing `AppColors.primaryBlue` updates the entire app
3. **Material 3** — uses `NavigationBar`, `SearchBar`, `FilledButton`, M3 Cards
4. **< 200 lines per screen file** — average, excluding complex screens like SearchPage
5. **main.dart < 30 lines** — only app setup
6. **Shared widgets** — loading, error, empty states used consistently
7. **Auto-login** — returning users go straight to home
8. **Proper routing** — `go_router` with auth guards
9. **No hardcoded colors** — all from `AppColors` or `Theme.of(context)`
10. **Accessibility basics** — semantic labels, 48dp touch targets
