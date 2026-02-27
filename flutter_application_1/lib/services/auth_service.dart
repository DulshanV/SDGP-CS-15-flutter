import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../config.dart';
import 'package:http/http.dart' as http;

/// Manages authentication state using dev-tokens (local dev)
/// or Firebase tokens (production).
class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._();
  factory AuthService() => _instance;
  AuthService._();

  UserProfile? _user;
  String? _token;
  bool _isLoading = false;

  UserProfile? get user => _user;
  String? get token => _token;
  bool get isLoggedIn => _user != null && _token != null;
  bool get isLoading => _isLoading;
  bool get isAdmin => _user?.isAdmin ?? false;

  Map<String, String> get authHeaders => {
        if (_token != null) 'Authorization': 'Bearer $_token',
        'Content-Type': 'application/json',
      };

  /// Sign up a new user (dev mode: creates a dev token).
  Future<bool> signUp({
    required String email,
    required String fullName,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Dev mode: generate a uid from the email
      final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
      _token = 'dev-token-$uid';

      // Sync user to backend
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/api/v1/users/sync'),
        headers: authHeaders,
        body: jsonEncode({
          'firebase_uid': uid,
          'email': email,
          'display_name': fullName,
        }),
      );

      if (response.statusCode == 200) {
        _user = UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _token = null;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('SignUp error: $e');
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
    notifyListeners();

    try {
      final uid = email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
      _token = 'dev-token-$uid';

      // Sync to backend (creates user if needed)
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/api/v1/users/sync'),
        headers: authHeaders,
        body: jsonEncode({
          'firebase_uid': uid,
          'email': email,
        }),
      );

      if (response.statusCode == 200) {
        _user = UserProfile.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
        await _persistSession();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _token = null;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('Login error: $e');
      _token = null;
      _isLoading = false;
      notifyListeners();
      return false;
    }
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
