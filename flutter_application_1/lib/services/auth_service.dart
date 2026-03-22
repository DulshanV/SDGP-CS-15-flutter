import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/favorites_service.dart';
import '../models/user_model.dart';
import '../config.dart';
import 'package:http/http.dart' as http;

/// Manages authentication state.
///
/// - Local API mode: uses dev tokens for fast local testing.
/// - Remote/production API mode: uses Firebase Identity Toolkit ID tokens.
class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._();
  factory AuthService() => _instance;
  AuthService._();

  UserProfile? _user;
  String? _token;
  bool _isLoading = false;
  String? _lastErrorMessage;

  UserProfile? get user => _user;
  String? get token => _token;
  bool get isLoggedIn => _user != null && _token != null;
  bool get isLoading => _isLoading;
  bool get isAdmin => _user?.isAdmin ?? false;
  String? get lastErrorMessage => _lastErrorMessage;

  Map<String, String> get authHeaders => {
        if (_token != null) 'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      };

  static const String _firebaseWebApiKey = String.fromEnvironment(
    'FIREBASE_WEB_API_KEY',
    defaultValue: 'AIzaSyA4CfVHQdOBCxexYnBBv0ryb3A_lai38Rk',
  );

  static const String _googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '1087856269110-1qjdo9n1rhc7qcrdl0vg1vdkn9ah1aa5.apps.googleusercontent.com',
  );

  bool get _useLocalDevToken {
    final base = AppConfig.apiBaseUrl.toLowerCase();
    return base.contains('127.0.0.1') ||
        base.contains('localhost') ||
        base.contains('10.0.2.2');
  }

  Future<Map<String, dynamic>> _firebaseSignUp({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$_firebaseWebApiKey',
    );

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'password': password,
            'returnSecureToken': true,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw _FirebaseAuthException.fromResponse(response.body);
  }

  Future<Map<String, dynamic>> _firebaseSignIn({
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$_firebaseWebApiKey',
    );

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email,
            'password': password,
            'returnSecureToken': true,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw _FirebaseAuthException.fromResponse(response.body);
  }

  Future<void> _firebaseSendPasswordReset({required String email}) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=$_firebaseWebApiKey',
    );

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'requestType': 'PASSWORD_RESET',
            'email': email,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw _FirebaseAuthException.fromResponse(response.body);
    }
  }

  Future<Map<String, dynamic>> _firebaseSignInWithGoogle({
    String? idToken,
    String? accessToken,
  }) async {
    final uri = Uri.parse(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=$_firebaseWebApiKey',
    );

    final hasIdToken = idToken != null && idToken.trim().isNotEmpty;
    final hasAccessToken = accessToken != null && accessToken.trim().isNotEmpty;

    if (!hasIdToken && !hasAccessToken) {
      throw _FirebaseAuthException('GOOGLE_TOKEN_MISSING');
    }

    final parts = <String>[];
    if (hasIdToken) parts.add('id_token=$idToken');
    if (hasAccessToken) parts.add('access_token=$accessToken');
    parts.add('providerId=google.com');
    final encodedPostBody = parts.join('&');

    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'postBody': encodedPostBody,
            'requestUri': kIsWeb ? Uri.base.origin : 'http://localhost',
            'returnSecureToken': true,
            'returnIdpCredential': true,
          }),
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    throw _FirebaseAuthException.fromResponse(response.body);
  }

  void _setError(String message) {
    _lastErrorMessage = message;
  }

  String _redactToken(String? token) {
    if (token == null || token.isEmpty) return '<none>';
    if (token.length <= 16) return '<redacted>';
    return '${token.substring(0, 8)}...${token.substring(token.length - 6)}';
  }

  Future<UserProfile?> _syncUser({
    required String uid,
    required String email,
    String? displayName,
    String? photoUrl,
  }) async {
    final url = '${AppConfig.apiBaseUrl}/api/v1/users/sync';
    final body = {
      'firebase_uid': uid,
      'email': email,
      if (displayName != null && displayName.trim().isNotEmpty)
        'display_name': displayName.trim(),
      if (photoUrl != null && photoUrl.trim().isNotEmpty)
        'photo_url': photoUrl.trim(),
    };

    debugPrint('🔐 Auth DEBUG:');
    debugPrint('  URL: $url');
    debugPrint('  Token: ${_redactToken(_token)}');
    debugPrint('  Body: ${jsonEncode(body)}');
    debugPrint('  Headers: {Authorization: Bearer <redacted>, Content-Type: application/json}');

    final response = await http
        .post(
          Uri.parse(url),
          headers: authHeaders,
          body: jsonEncode(body),
        )
        .timeout(const Duration(seconds: 20));

    debugPrint('  Response Status: ${response.statusCode}');
    debugPrint('  Response Body: ${response.body}');

    if (response.statusCode == 200) {
      return UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }

    debugPrint('⚠️ Backend sync failed: ${response.statusCode}');
    return null;
  }

  UserProfile _fallbackProfile({
    required String uid,
    required String email,
    String? displayName,
  }) {
    return UserProfile(
      id: uid,
      firebaseUid: uid,
      email: email,
      displayName: (displayName != null && displayName.trim().isNotEmpty)
          ? displayName.trim()
          : email.split('@').first,
      photoUrl: null,
      role: 'user',
      createdAt: DateTime.now(),
    );
  }

  /// Sign up a new user (dev mode: creates a dev token).
  Future<bool> signUp({
    required String email,
    required String fullName,
    required String password,
  }) async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      if (_useLocalDevToken) {
        final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
        _token = 'dev-token-$uid';
        _user = await _syncUser(uid: uid, email: email, displayName: fullName);
      } else {
        final firebase = await _firebaseSignUp(email: email, password: password);
        _token = (firebase['idToken'] as String?)?.trim();
        final uid = (firebase['localId'] as String?)?.trim() ?? '';
        final verifiedEmail = (firebase['email'] as String?)?.trim() ?? email;
        _user = await _syncUser(uid: uid, email: verifiedEmail, displayName: fullName) ??
            _fallbackProfile(uid: uid, email: verifiedEmail, displayName: fullName);
      }

      if (_user != null && _token != null) {
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _setError('Could not create user profile in backend. Please try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ SignUp error: $e');
      _setError('Sign up failed. Check your connection and try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Log in an existing user (dev mode: recreates dev token from email).
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      if (_useLocalDevToken) {
        final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
        _token = 'dev-token-$uid';
        _user = await _syncUser(uid: uid, email: email);
      } else {
        final firebase = await _firebaseSignIn(email: email, password: password);
        _token = (firebase['idToken'] as String?)?.trim();
        final uid = (firebase['localId'] as String?)?.trim() ?? '';
        final verifiedEmail = (firebase['email'] as String?)?.trim() ?? email;
        _user = await _syncUser(uid: uid, email: verifiedEmail) ??
            _fallbackProfile(uid: uid, email: verifiedEmail);
      }

      if (_user != null && _token != null) {
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _setError('Login failed while syncing your account. Please try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ Login error: $e');
      _setError('Login failed. Check your connection and try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendPasswordReset(String email) async {
    _lastErrorMessage = null;
    try {
      if (_useLocalDevToken) {
        _setError('Password reset is only available when using Firebase auth.');
        return false;
      }

      await _firebaseSendPasswordReset(email: email.trim());
      return true;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      return false;
    } catch (_) {
      _setError('Could not send reset email. Please try again.');
      return false;
    }
  }

  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    _lastErrorMessage = null;
    notifyListeners();

    try {
      if (kIsWeb && _googleWebClientId.trim().isEmpty) {
        _setError(
          'GOOGLE_WEB_CLIENT_ID is missing for web build. Run with --dart-define=GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com',
        );
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final googleSignIn = GoogleSignIn(
        scopes: const ['email', 'profile'],
        clientId: kIsWeb && _googleWebClientId.isNotEmpty
            ? _googleWebClientId
            : null,
      );

      GoogleSignInAccount? account = await googleSignIn.signInSilently();
      account ??= await googleSignIn.signIn();
      if (account == null) {
        _setError('Google sign-in was cancelled.');
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final auth = await account.authentication;
      final email = account.email;
      final displayName = account.displayName;
      final photoUrl = account.photoUrl;

      if (_useLocalDevToken) {
        final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
        _token = 'dev-token-$uid';
        _user = await _syncUser(
              uid: uid,
              email: email,
              displayName: displayName,
              photoUrl: photoUrl,
            ) ??
            _fallbackProfile(uid: uid, email: email, displayName: displayName);
      } else {
        final idToken = auth.idToken?.trim();
        final accessToken = auth.accessToken?.trim();

        if ((idToken == null || idToken.isEmpty) &&
            (accessToken == null || accessToken.isEmpty)) {
          throw _FirebaseAuthException('GOOGLE_TOKEN_MISSING');
        }

        final firebase = await _firebaseSignInWithGoogle(
          idToken: idToken,
          accessToken: accessToken,
        );

        _token = (firebase['idToken'] as String?)?.trim();
        final uid = (firebase['localId'] as String?)?.trim() ?? '';
        final verifiedEmail = (firebase['email'] as String?)?.trim() ?? email;
        _user = await _syncUser(
              uid: uid,
              email: verifiedEmail,
              displayName: displayName,
              photoUrl: photoUrl,
            ) ??
            _fallbackProfile(
              uid: uid,
              email: verifiedEmail,
              displayName: displayName,
            );
      }

      if (_user != null && _token != null) {
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _setError('Google sign-in failed. Please try again.');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } on _FirebaseAuthException catch (e) {
      _setError(e.userMessage);
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      debugPrint('❌ Google sign-in error: $e');
      _setError(_mapGoogleSignInError(e));
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  String _mapGoogleSignInError(Object error) {
    final raw = error.toString();
    final lower = raw.toLowerCase();

    if (lower.contains('popup_closed_by_user') ||
        lower.contains('popup_closed')) {
      return 'Google sign-in popup was closed before completing login.';
    }
    if (lower.contains('clientid not set') ||
        lower.contains('google-signin-client_id') ||
        lower.contains('appid != null')) {
      return 'Google Web Client ID is missing. Run with --dart-define=GOOGLE_WEB_CLIENT_ID=<web-client-id>.apps.googleusercontent.com';
    }
    if (lower.contains('popup_blocked_by_browser') ||
        lower.contains('popup blocked')) {
      return 'Browser blocked the Google popup. Allow popups for this site and try again.';
    }
    if (lower.contains('idpiframe_initialization_failed') ||
        lower.contains('third-party cookies')) {
      return 'Google sign-in requires third-party cookies for this site. Enable them and try again.';
    }
    if (lower.contains('origin_mismatch') ||
        lower.contains('unauthorized_client') ||
        lower.contains('invalid_client')) {
      return 'Google OAuth client mismatch. Verify GOOGLE_WEB_CLIENT_ID and authorized JavaScript origins.';
    }
    if (lower.contains('access_blocked') || lower.contains('disallowed_useragent')) {
      return 'Google sign-in is blocked by browser or OAuth policy. Try a normal Chrome window and check OAuth settings.';
    }
    if (lower.contains('network')) {
      return 'Network issue during Google sign-in. Check connection and try again.';
    }

    return 'Google sign-in failed. Please try again.';
  }

  /// Try to restore session from local storage.
  Future<void> tryRestoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('auth_token');
    final savedUid = prefs.getString('auth_uid');

    if (savedToken == null || savedUid == null) return;

    _token = savedToken;

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/api/v1/users/me'),
        headers: authHeaders,
      );

      if (response.statusCode == 200) {
        _user = UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
        notifyListeners();
      } else {
        _token = null;
      }
    } catch (e) {
      debugPrint('Session restore failed: $e');
      _token = null;
    }
  }

  /// Log out and clear session.
  Future<void> logout() async {
    _user = null;
    _token = null;
    _lastErrorMessage = null;

    // UIX-020: Clear favorites cache on logout
    FavoritesService().clearCache();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_uid');

    notifyListeners();
  }

  Future<void> _persistSession() async {
    if (_token == null || _user == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', _token!);
    await prefs.setString('auth_uid', _user!.firebaseUid);
  }
}

class _FirebaseAuthException implements Exception {
  final String code;

  _FirebaseAuthException(this.code);

  factory _FirebaseAuthException.fromResponse(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      final error = json['error'] as Map<String, dynamic>?;
      final raw = (error?['message'] as String?) ?? 'UNKNOWN_ERROR';
      return _FirebaseAuthException(raw.split(' ').first.trim());
    } catch (_) {
      return _FirebaseAuthException('UNKNOWN_ERROR');
    }
  }

  String get userMessage {
    switch (code) {
      case 'INVALID_LOGIN_CREDENTIALS':
      case 'INVALID_PASSWORD':
        return 'Incorrect email or password.';
      case 'EMAIL_NOT_FOUND':
        return 'No account found for this email.';
      case 'INVALID_EMAIL':
        return 'Invalid email address.';
      case 'EMAIL_EXISTS':
        return 'This email is already registered.';
      case 'WEAK_PASSWORD':
      case 'WEAK_PASSWORD:':
        return 'Password should be at least 6 characters.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Too many attempts. Try again later.';
      case 'USER_DISABLED':
        return 'This account is disabled.';
      case 'GOOGLE_TOKEN_MISSING':
        return 'Google sign-in token missing. Set GOOGLE_WEB_CLIENT_ID for web builds.';
      case 'OPERATION_NOT_ALLOWED':
        return 'Google sign-in is not enabled in Firebase Authentication.';
      case 'INVALID_IDP_RESPONSE':
      case 'INVALID_ID_TOKEN':
        return 'Google sign-in was rejected by Firebase. Check OAuth client and authorized domains.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}
