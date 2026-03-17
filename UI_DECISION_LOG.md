# CeylonHS Flutter App — UI/UX Decision Log

**Created:** 2026-03-17
**Last Updated:** 2026-03-17
**Scope:** Flutter mobile app (`flutter_application_1/lib/`)
**Purpose:** Document every UI/UX problem identified, the decision on how to fix it, and the rationale — before any code changes begin.

---

## Implementation Status Summary

| Status | Count | IDs |
|---|---|---|
| DONE | 18 | UIX-001 through UIX-005, UIX-012 through UIX-016, UIX-020 through UIX-024, UIX-027, UIX-028, UIX-029 |
| PARTIAL | 2 | UIX-006, UIX-009 |
| PENDING | 11 | UIX-010, UIX-011, UIX-017, UIX-018, UIX-019, UIX-025, UIX-026, UIX-030, UIX-031 |

**Build status:** 0 errors, 0 warnings, 15 info-level hints (compiles cleanly)

---

## Table of Contents

1. [Audit Summary](#audit-summary)
2. [Non-Working UI Elements](#non-working-ui-elements)
3. [Dead Redirects & Missing Pages](#dead-redirects--missing-pages)
4. [Placeholder / Stub Content](#placeholder--stub-content)
5. [Architecture & Code Quality Decisions](#architecture--code-quality-decisions)
6. [Visual Design System Decisions](#visual-design-system-decisions)
7. [Navigation & UX Flow Decisions](#navigation--ux-flow-decisions)
8. [Accessibility Decisions](#accessibility-decisions)
9. [Priority Matrix](#priority-matrix)

---

## Audit Summary

| Metric | Value |
|---|---|
| Total Dart files | 19 |
| Total lines (main.dart) | 1,782 |
| Screens/pages | 13 (6 in main.dart, 7 in screens/) |
| Non-working interactive elements | 6 |
| Dead redirects / missing pages | 2 |
| Placeholder/stub content | 6 |
| Dead code / unused fields | 4 |
| Hardcoded color definitions | 12 classes × same constants |
| Inline hardcoded hex colors | 60+ unique occurrences |
| Reusable shared widgets | 0 (none exist) |
| Theme configuration | None (no ThemeData) |
| Material 3 usage | No |
| Accessibility (Semantics) | None |
| Responsive layout handling | Minimal |

---

## Non-Working UI Elements

### UIX-001: Notification Bell Icon — SignUpPage (INERT) — DONE

**Location:** `screens/intro_page.dart` (was `main.dart:339-343`)
**Status:** Removed. Bell icon no longer appears on IntroPage.
**Problem:** Bare `Icon(Icons.notifications_none_rounded)` with no tap handler. Appears in the header, looks interactive, does nothing.
**Decision:** **Remove entirely.** Notifications are not a feature of this app. Showing a bell icon misleads users.
**Alternative considered:** Making it functional → rejected because there is no notification backend, no push notification setup, and adding one is out of scope for a UI overhaul.
**Rationale:** A non-functional icon is worse than no icon. It erodes trust.

### UIX-002: Notification Bell Icon — Home Page (INERT) — DONE

**Location:** `screens/home_page.dart` (was `main.dart:1156-1160`)
**Status:** Removed. Bell icon no longer appears on HomePage.
**Problem:** Same as UIX-001 but on the home page header, next to the working profile icon.
**Decision:** **Remove entirely.** Same rationale as UIX-001.

### UIX-003: "Favorites" Home Action Card (NO onTap) — DONE

**Location:** `screens/home_page.dart` (was `main.dart:1219-1224`)
**Status:** Favorites card now navigates to FavoritesPage on tap.
**Problem:** The `_HomeActionCard` widget has no `onTap` parameter, no `InkWell`, no `GestureDetector`. The card looks interactive (shadow, styled text, icon) but tapping does nothing. `FavoritesPage` exists and works.
**Decision:** **Wire up navigation.** Add `onTap` callback to `_HomeActionCard`, navigate to `FavoritesPage` when tapped.
**Rationale:** The destination page exists and works. This is a simple wiring fix.

### UIX-004: "Tariff Docs" Home Action Card (NO onTap, NO backing page) — DONE

**Location:** `screens/home_page.dart` (was `main.dart:1226-1231`)
**Status:** Card removed entirely from HomePage.
**Problem:** Same non-interactive card widget. Additionally, no `TariffDocsPage` exists anywhere in the codebase.
**Decision:** **Remove the card entirely.** Do not create a placeholder page.
**Alternative considered:** Creating a "Coming Soon" page → rejected because it adds cruft and sets expectations for a feature with no implementation timeline.
**Rationale:** Ship what works. Don't advertise what doesn't exist.

### UIX-005: "News" Home Action Card (NO onTap, NO backing page) — DONE

**Location:** `screens/home_page.dart` (was `main.dart:1233-1238`)
**Status:** Card removed entirely from HomePage.
**Problem:** Same as UIX-004. No `NewsPage` exists.
**Decision:** **Remove the card entirely.** Same rationale as UIX-004.

### UIX-006: "Contact Sales" Button — PricingPage (STUB) — PARTIAL

**Location:** `screens/pricing_page.dart`
**Status:** `url_launcher` dependency added to pubspec.yaml and imported in pricing_page.dart. Button still shows SnackBar; mailto: launch not yet wired up.
**Problem:** Button says "Contact Sales" but only shows a Snackbar with hardcoded `support@ceylonhs.com`. No mailto: link, no contact form, no URL launch.
**Decision:** **Replace with a `url_launcher` mailto: link.** When tapped, open the device email client with `mailto:support@ceylonhs.com?subject=CeylonHS Enterprise Inquiry`.
**Rationale:** Minimal effort, actually functional. Users on mobile expect the email app to open.

---

## Dead Redirects & Missing Pages

### UIX-007: "Tariff Docs" — No Destination

**Location:** `main.dart:1228`
**Problem:** Card references a feature/page that doesn't exist.
**Decision:** **Remove card** (covered by UIX-004).

### UIX-008: "News" — No Destination

**Location:** `main.dart:1235`
**Problem:** Card references a feature/page that doesn't exist.
**Decision:** **Remove card** (covered by UIX-005).

---

## Placeholder / Stub Content

### UIX-009: Simulated Payment Processing — PARTIAL

**Location:** `screens/pricing_page.dart`
**Status:** Unused `_subscriptionFuture` field removed. Real `PricingService.upgradeSubscription()` call not yet wired to the button — still shows simulated snackbar.
**Problem:** `_processUpgrade()` shows a fake "Successfully upgraded!" snackbar without calling `PricingService.upgradeSubscription()` which exists and is fully implemented (`pricing_service.dart:83-117`).
**Decision:** **Wire up the real `PricingService.upgradeSubscription()` call.** Show loading state during the API call, handle errors with proper feedback, show success only after the backend confirms.
**Rationale:** The backend endpoint exists. The service method exists. Only the UI wiring is missing. Showing fake success is deceptive.

### UIX-010: Feature Comparison Section — Empty Stub — PENDING

**Location:** `pricing_page.dart:315-344`
**Problem:** `_buildFeaturesComparison()` accepts `plans` parameter but doesn't use it. Renders only a title and one sentence. No comparison table/grid.
**Decision:** **Build a real feature comparison table.** Use the `features` list from each `PricingPlan` to create a checkmark grid comparing tiers side-by-side.
**Rationale:** Users on pricing pages expect to compare plans. A single sentence is not a comparison.

### UIX-011: `getCategoryCount()` Always Returns 0 — PENDING

**Location:** `categories_service.dart:70-73`
**Problem:** Stub method, always returns 0. Comment says "No specific count endpoint implemented yet."
**Decision:** **Remove the method entirely** if unused in UI, or remove the count display from category cards if it's shown as "0 items."
**Rationale:** Displaying "0" is misleading. Either show real data or show nothing.

### UIX-012: `_success` Variable Never Set — SignUpPage — DONE

**Location:** `screens/signup_page.dart` (was `main.dart:189`)
**Status:** Dead `_success` variable and its conditional display removed from SignUpPage.
**Problem:** `_success` is declared and conditionally rendered, but no code path ever sets it. The success text display is unreachable dead UI.
**Decision:** **Remove both the variable and the conditional display code.**
**Rationale:** Dead code that can never execute should be removed.

### UIX-013: Cosmetics Category Icon Typo — DONE

**Location:** `models/category_model.dart:127`
**Status:** Fixed. Code point is now `'0xea1b'` (correct for `Icons.spa_outlined`).
**Problem:** `iconCodePoint: '0xealb'` contains letter `l` instead of digit `1`. Causes `FormatException` in `int.parse()`, falls back to generic `Icons.category`.
**Decision:** **Fix the typo to `'0xea1b'`** (the correct code point for `Icons.spa_outlined`).
**Rationale:** Obvious typo causing a silent runtime error.

### UIX-014: User Profile Photo Never Displayed — DONE

**Location:** `screens/profile_page.dart` (was `main.dart:1460-1468`)
**Status:** Profile photo displayed using `CachedNetworkImage` when `photoUrl` is available, with fallback to generic icon.
**Problem:** Always shows generic `Icons.person_outline_rounded` even though `UserProfile.photoUrl` is populated during login (especially Google sign-in).
**Decision:** **Display the actual user photo.** Use `CircleAvatar` with `NetworkImage(user.photoUrl)` when available, fall back to the icon.
**Rationale:** Google sign-in users expect to see their photo. It's a basic UX expectation in 2026.

---

## Architecture & Code Quality Decisions

### UIX-015: No Centralized Theme — Colors Duplicated 12× — DONE

**Status:** Created `lib/theme/app_colors.dart` with all named color constants. All 12 screen files updated to import and use `AppColors` instead of per-class constants. 60+ inline hex colors replaced.

**Problem:** `primaryBlue: Color(0xFF0B3EA8)` is redefined as a static constant in 12 separate State classes. 60+ inline hex color values are scattered across every file with no single source of truth.

**Locations:**
- `main.dart` — IntroPage, _SignUpPageState, _LoginPageState, _HomeContentState, _UserProfilePageState (5 classes)
- `search_page.dart`, `pricing_page.dart`, `favorites_page.dart`, `history_page.dart`, `admin_dashboard.dart`, `recents_page.dart`, `hs_code_detail_page.dart` (7 classes)

**Decision:** **Create `lib/theme/app_theme.dart`** with:
1. A centralized `AppColors` class with all named color constants
2. A `ThemeData` configured with Material 3 (`useMaterial3: true`)
3. Custom `ColorScheme` using the existing blue palette
4. Typography scale using `TextTheme`
5. Component themes (AppBar, Card, Button, Input, BottomNav, etc.)

Then remove all per-class color constants and use `Theme.of(context)` throughout.

**Rationale:** This is the #1 most impactful change. It enables:
- Consistent styling across all screens
- Future dark mode support
- Single place to update brand colors
- Proper Material 3 component theming
- Smaller, cleaner screen files

### UIX-016: 1,782-Line main.dart — God File — DONE

**Status:** Split into 5 separate screen files + minimal main.dart (~28 lines):
- `lib/screens/intro_page.dart`
- `lib/screens/signup_page.dart`
- `lib/screens/login_page.dart`
- `lib/screens/home_page.dart` (MainHomePage + _HomeContent)
- `lib/screens/profile_page.dart`
- `lib/main.dart` — Only `main()` + `MyApp`

**Problem:** `main.dart` contains 6 separate widgets/pages (IntroPage, SignUpPage, LoginPage, MainHomePage, _HomeContent, UserProfilePage) plus 3 private helper widgets (_HomeActionCard, _RecentSearchCard, _buildCategoryItem). This is a maintenance nightmare.

**Decision:** **Split into separate files:**
- `lib/screens/intro_page.dart` — IntroPage
- `lib/screens/signup_page.dart` — SignUpPage
- `lib/screens/login_page.dart` — LoginPage
- `lib/screens/home_page.dart` — MainHomePage + _HomeContent
- `lib/screens/profile_page.dart` — UserProfilePage
- `lib/main.dart` — Only `main()` + `MyApp` (under 30 lines)

**Rationale:** Each screen should be independently readable and editable. A 1,782-line file defeats the purpose of having a `screens/` directory.

### UIX-017: No Shared/Reusable Widgets — PENDING

**Problem:** Common UI patterns are duplicated across screens:
- Loading indicators (shimmer/spinner)
- Error state displays
- Empty state displays
- Search bars
- Cards with shadows and rounded corners
- Section headers

**Decision:** **Create `lib/widgets/` directory** with shared components:
- `app_loading.dart` — Consistent loading indicator
- `app_error.dart` — Error state with retry button
- `app_empty_state.dart` — Empty state with icon and message
- `app_card.dart` — Consistent card styling
- `app_search_bar.dart` — Reusable search input

**Rationale:** Eliminates duplication. Changes to common patterns propagate automatically.

### UIX-018: No Named Routes / No Router — PENDING

**Status:** `go_router` dependency added to pubspec.yaml but routing not yet migrated. Still using imperative Navigator.push.

**Problem:** All navigation uses imperative `Navigator.push(MaterialPageRoute(...))`. No route names, no deep linking support, no route guards.

**Decision:** **Adopt `go_router`** for declarative routing:
- Define all routes in `lib/router/app_router.dart`
- Add auth guard (redirect to login if not authenticated)
- Enable deep linking for HS code detail pages (`/detail/:hscode`)
- Use `ShellRoute` for the bottom navigation shell

**Rationale:** Industry standard for Flutter apps in 2026. Enables deep linking, auth guards, and cleaner navigation code.

### UIX-019: Provider Declared But Not Used — PENDING

**Problem:** `provider: ^6.1.0` is in `pubspec.yaml` but never used. State is managed through manual singleton instantiation and `addListener`/`removeListener`.

**Decision:** **Keep the current singleton + ChangeNotifier pattern** but properly wire it through the widget tree using `ChangeNotifierProvider` at the app root, or adopt a lighter state management approach. Evaluate during implementation.

**Rationale:** The singletons work. Provider/Riverpod adds value for dependency injection and automatic rebuilds, but converting everything is lower priority than the visual overhaul.

### UIX-020: FavoritesService.clearCache() Never Called on Logout — DONE

**Location:** `services/auth_service.dart`
**Status:** `FavoritesService().clearCache()` now called in both `AuthService.logout()` and in `UserProfilePage._logout()`.
**Problem:** On logout, the favorites cache from the previous user persists in memory until the app is fully restarted.
**Decision:** **Call `FavoritesService().clearCache()` in `AuthService.logout()`.**
**Rationale:** Security and correctness. User A should not see User B's favorites briefly after switching accounts.

---

## Visual Design System Decisions

### UIX-021: Adopt Material 3 — DONE

**Status:** `useMaterial3: true` enabled in `lib/theme/app_theme.dart`. Custom `ColorScheme.fromSeed()`, AppBarTheme, CardTheme, ElevatedButtonThemeData, OutlinedButtonThemeData, InputDecorationTheme, ChipThemeData, DialogTheme, SnackBarTheme all configured.

**Problem:** The app uses Material 2 defaults. No Material 3 features (dynamic color, updated component shapes, tonal elevation, etc.).

**Decision:** Enable `useMaterial3: true` in `ThemeData`. Update all components to leverage M3 defaults:
- Cards with `surfaceContainerLowest` elevation
- Filled/outlined buttons instead of legacy `RaisedButton` patterns
- `SearchBar` widget instead of custom TextField
- `NavigationBar` instead of custom bottom nav
- `SegmentedButton` for filter toggles
- Updated typography scale

**Rationale:** Material 3 is the current standard. It provides better defaults, improved accessibility, and a more polished look out of the box.

### UIX-022: Custom Bottom Nav → Material 3 NavigationBar — DONE

**Location:** `screens/home_page.dart`
**Status:** Replaced custom Container/Row/GestureDetector bottom nav with M3 `NavigationBar` widget with proper `NavigationDestination` entries.

**Location:** `main.dart:957-1004`
**Problem:** Bottom nav is built manually with `Container`, `Row`, and `GestureDetector`. No ripple effects, no adaptive labels, no badge support.
**Decision:** **Replace with Material 3 `NavigationBar` widget.**
**Rationale:** Built-in animations, ripple effects, adaptive sizing, badge support, and accessibility labels. Less code, better UX.

### UIX-023: Consistent Spacing & Layout System — DONE

**Status:** Created `lib/theme/app_spacing.dart` with 4px grid constants (`xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`) and radius constants (`chipRadius=10, cardRadius=14, cardRadiusLg=20, buttonRadius=12`).

**Problem:** Padding values are arbitrary throughout: `28`, `20`, `18`, `16`, `14`, `12`, `10`, `8`, `6`, `4` — with no system.

**Decision:** **Adopt a 4px grid system** with named spacing constants:
- `xs: 4`, `sm: 8`, `md: 16`, `lg: 24`, `xl: 32`, `xxl: 48`
- All padding/margin values should use these constants

**Rationale:** Visual harmony. Predictable spacing makes the app feel designed rather than thrown together.

### UIX-024: Typography Cleanup — DONE

**Status:** Material 3 `TextTheme` configured in `lib/theme/app_theme.dart` with named styles (`headlineLarge`, `headlineMedium`, `titleLarge`, `titleMedium`, `bodyLarge`, `bodyMedium`, `bodySmall`, `labelLarge`, `labelMedium`) using Inter font family.

**Problem:** Font sizes are inconsistent: `52`, `30`, `28`, `24`, `22`, `20`, `19`, `18`, `17`, `16`, `15`, `14`, `13`, `12`, `11` — nearly every integer between 11 and 30 is used somewhere.

**Decision:** **Use Material 3 TextTheme** with a defined type scale. Map all text usage to named styles: `headlineLarge`, `headlineMedium`, `titleLarge`, `titleMedium`, `bodyLarge`, `bodyMedium`, `bodySmall`, `labelLarge`, `labelMedium`.

**Rationale:** Consistent typography is the single biggest contributor to a "professional" feel.

### UIX-025: Add Proper Loading States — PENDING

**Status:** `shimmer: ^3.0.0` dependency added to pubspec.yaml but shimmer loading skeletons not yet implemented in any screen.

**Problem:** Some screens show `CircularProgressIndicator` centered, others show nothing during loads. No skeleton/shimmer loading.

**Decision:** **Implement shimmer loading skeletons** for:
- Search results (card-shaped placeholders)
- Favorites list
- History list
- Pricing cards
- Profile page

**Rationale:** Shimmer loading is the modern standard. It reduces perceived wait time and prevents layout shift.

### UIX-026: Add Proper Empty States — PENDING

**Status:** No shared `AppEmptyState` widget created yet. Individual screens still use inconsistent empty state displays.

**Problem:** Empty states exist in some screens but are inconsistent — different icons, different text styles, different layouts.

**Decision:** **Create a shared `AppEmptyState` widget** with:
- Centered illustration/icon
- Primary message (bold)
- Secondary message (muted)
- Optional CTA button

Use consistently across all list screens.

**Rationale:** Consistent empty states communicate a polished product.

---

## Navigation & UX Flow Decisions

### UIX-027: Auth State Persistence — DONE

**Status:** `AuthService().tryRestoreSession()` called in `main()` before `runApp()`. `MyApp.build()` checks `AuthService().isLoggedIn` and routes to `MainHomePage` or `IntroPage` accordingly.

**Problem:** The app always starts at `IntroPage` regardless of whether the user is already logged in. On app restart, the user must re-authenticate even though tokens are stored in `SharedPreferences`.

**Decision:** **Add auto-login check on startup.** In `MyApp`, check `AuthService().tryAutoLogin()` and route directly to `MainHomePage` if a valid session exists.

**Rationale:** Forcing re-login on every app launch is a major UX pain point. Every modern app preserves sessions.

### UIX-028: "Sign In" Button Goes to SignUp Page — DONE

**Status:** Button text changed from "Sign in" to "Create Account" in `lib/screens/intro_page.dart`.

**Location:** `main.dart:117-120`
**Problem:** The IntroPage has two buttons: "Sign in" and "Log in". "Sign in" navigates to `SignUpPage`. This is confusing — users expect "Sign in" = log into existing account.
**Decision:** **Rename buttons:**
- "Sign in" → "Create Account" (navigates to SignUpPage)
- "Log in" → "Log In" (navigates to LoginPage)

**Alternative considered:** Swap the navigation targets → rejected because the naming should match intent, not the other way around.

**Rationale:** "Sign in" ≈ "Log in" in common usage. Having both with different meanings is a UX anti-pattern.

### UIX-029: Back Navigation from Auth Screens — DONE

**Status:** Back button (AppBar with back arrow) added to both `lib/screens/login_page.dart` and `lib/screens/signup_page.dart`.

**Problem:** SignUpPage and LoginPage have no back button. The only way to leave is to complete the form or use the device back gesture.

**Decision:** **Add AppBar with back arrow** or a close icon on auth screens.

**Rationale:** Users should always have an obvious escape route.

---

## Accessibility Decisions

### UIX-030: Zero Semantics Widgets — PENDING

**Status:** Not yet implemented. No semantic labels have been added to tappable elements or decorative icons.

**Problem:** No `Semantics` widgets anywhere in the app. No `semanticLabel` on icons. No `ExcludeSemantics` on decorative elements. Screen readers will struggle.

**Decision:** **Add semantic labels progressively** during the overhaul:
- All `IconButton` and `InkWell` tappable elements need `semanticLabel`
- Decorative images/icons should use `excludeFromSemantics: true`
- Form fields should have proper labels
- Screen reader announcements for state changes (search complete, favorite toggled)

**Rationale:** Accessibility is not optional. Modern mobile app standards require WCAG 2.1 AA compliance.

### UIX-031: Touch Targets Too Small — PENDING

**Status:** Not yet implemented. Inert notification bell icons were removed (UIX-001/002), but remaining tappable elements have not been audited for 48x48dp compliance.

**Problem:** Some tappable elements (notification bell icon, category cards) don't meet the 48x48dp minimum touch target recommended by Material guidelines.

**Decision:** **Ensure all tappable elements meet 48x48dp minimum.** Use `IconButton` (which enforces this) instead of bare `Icon` widgets.

**Rationale:** Material Design guidelines and WCAG 2.5.5.

---

## Priority Matrix

| Priority | ID | Description | Effort |
|---|---|---|---|
| **P0 — Critical** | UIX-015 | Create centralized theme (AppColors, ThemeData, M3) | Large |
| **P0 — Critical** | UIX-016 | Split main.dart into separate files | Medium |
| **P0 — Critical** | UIX-003 | Wire up Favorites card navigation | Small |
| **P0 — Critical** | UIX-009 | Wire up real payment/upgrade flow | Medium |
| **P0 — Critical** | UIX-013 | Fix Cosmetics icon typo | Trivial |
| **P0 — Critical** | UIX-020 | Call clearCache on logout | Trivial |
| **P0 — Critical** | UIX-027 | Auto-login on app restart | Medium |
| **P1 — High** | UIX-001/002 | Remove inert notification bells | Trivial |
| **P1 — High** | UIX-004/005 | Remove Tariff Docs and News cards | Trivial |
| **P1 — High** | UIX-006 | Contact Sales → mailto: link | Small |
| **P1 — High** | UIX-012 | Remove dead _success variable | Trivial |
| **P1 — High** | UIX-014 | Display user profile photo | Small |
| **P1 — High** | UIX-017 | Create shared widget library | Medium |
| **P1 — High** | UIX-021/022 | Material 3 adoption + NavigationBar | Large |
| **P1 — High** | UIX-028 | Fix "Sign in" vs "Log in" naming | Trivial |
| **P2 — Medium** | UIX-010 | Build real feature comparison table | Medium |
| **P2 — Medium** | UIX-018 | Adopt go_router | Large |
| **P2 — Medium** | UIX-023 | Spacing system (4px grid) | Medium |
| **P2 — Medium** | UIX-024 | Typography system (TextTheme) | Medium |
| **P2 — Medium** | UIX-025 | Shimmer loading states | Medium |
| **P2 — Medium** | UIX-026 | Consistent empty states | Small |
| **P2 — Medium** | UIX-029 | Back navigation on auth screens | Small |
| **P3 — Low** | UIX-011 | Remove getCategoryCount stub | Trivial |
| **P3 — Low** | UIX-019 | Evaluate Provider usage | Small |
| **P3 — Low** | UIX-030 | Accessibility / Semantics | Large |
| **P3 — Low** | UIX-031 | Touch target sizing | Medium |

---

## Decision Log Conventions

- Each decision has a unique ID (`UIX-NNN`) for traceability
- "Decision" states exactly what will be done
- "Alternative considered" documents rejected approaches
- "Rationale" explains why this is the right call
- Priorities follow standard P0-P3 scale
- Effort estimates: Trivial (<30 min), Small (1-2 hrs), Medium (3-6 hrs), Large (1-2 days)
