# SDGP-CS-15-flutter
flutter implementation of the CS -15

## Backend ↔ Flutter integration quick matrix

| Target | Flutter `apiBaseUrl` | Backend `HOST` | Backend reachable at | CORS origin to allow |
|---|---|---|---|---|
| Android emulator | `http://10.0.2.2:8000` | `127.0.0.1` (default) | `http://10.0.2.2:8000` | `http://10.0.2.2:8000` or `*` for dev |
| iOS simulator / desktop / web on same machine | `http://127.0.0.1:8000` | `127.0.0.1` | `http://127.0.0.1:8000` | `http://127.0.0.1:8000` |
| Physical device on same LAN | `http://<your-lan-ip>:8000` | `0.0.0.0` | `http://<your-lan-ip>:8000` | `http://<your-lan-ip>:8000` |

Notes:
- In production set `ENV=production` and use real Firebase tokens (dev tokens are rejected).
- For LAN testing, also set `CORS_ORIGINS` to the exact origin you are using (or `[*]` only in development).
- `PORT` defaults to 8000; change both sides together if you override it.
