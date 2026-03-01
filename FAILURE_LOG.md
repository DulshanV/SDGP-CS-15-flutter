# ⛔ FAILURE LOG — DO NOT DO AGAIN

This file documents every production failure, broken deployment, and major mistake
in this project. Read this BEFORE making any changes to CI/CD, dependencies, or tests.

---

## INCIDENT #001 — Sprint 1 Broke Production for ~6 Hours
**Date:** March 1, 2026
**Severity:** CRITICAL — ceylonhs.com returned 502 Bad Gateway
**Root Cause:** Large untested commit pushed directly to main without local verification

---

### FAILURE 1: `package-lock.json` Out of Sync
**What happened:**
Added 6 new devDependencies to `Nextjs/nextjs/package.json`:
```
vitest, @testing-library/react, @testing-library/jest-dom,
@testing-library/user-event, @vitejs/plugin-react, jsdom
```
...but **never ran `npm install`** locally on Windows before committing.
The `package-lock.json` on disk still reflected the old state without those packages.

**What crashed:**
- CI `npm ci` step on GitHub Actions (Ubuntu runner)
- Error: `npm ci can only install packages when your package.json and package-lock.json are in sync`
- Every single PR CI check — including all 12 Dependabot PRs — failed immediately

**Where it crashed:**
- `.github/workflows/ci.yml` → `frontend` job → `npm ci` step
- Every PR that touched `Nextjs/nextjs/` could not be validated

**Rule going forward:**
> ✅ After editing `package.json`, ALWAYS run `npm install` locally and commit the updated `package-lock.json` in the same commit. Never commit `package.json` changes without a matching lock file update.

---

### FAILURE 2: Vitest `vi` Global in Next.js Production Build
**What happened:**
Created `Nextjs/nextjs/src/test/setup.ts` containing:
```ts
vi.mock('next/navigation', () => ({ ... }))
```
`vi` is a Vitest-only global. It is NOT available in the Node.js/TypeScript environment
that `next build` uses.

The `tsconfig.json` `include` glob was `**/*.ts` which picked up ALL TypeScript files,
including test files. Next.js tried to compile `setup.ts` as part of the production build.

**What crashed:**
- `next build` failed during TypeScript compilation with:
  ```
  ./src/test/setup.ts:11:1
  Type error: Cannot find name 'vi'.
  ```
- This happened AFTER `npm install` succeeded, so deploy.yml kept running
- PM2 was stopped, deleted, and restarted — but serving the **old broken `.next/` build**
- Result: ceylonhs.com returned 502 Bad Gateway

**Where it crashed:**
- DigitalOcean droplet, during deploy step 4: `npm run build`
- `Next.js build worker exited with code: 1 and signal: null`

**Rule going forward:**
> ✅ ALWAYS exclude test files from `tsconfig.json`:
> ```json
> "exclude": ["node_modules", "src/test", "src/**/__tests__", "**/*.test.ts", "**/*.test.tsx", "vitest.config.ts"]
> ```
> ✅ NEVER use test-framework globals (`vi`, `describe`, `it`, `expect` from vitest) in files outside `__tests__/` directories or files ending in `.test.ts`.
> ✅ Run `npm run build` locally before pushing ANY frontend changes.

---

### FAILURE 3: Backend Test Fixtures Used Wrong Module Path for Firebase Mock
**What happened:**
`backend/tests/conftest.py` tried to monkeypatch:
```python
from app.core import auth
monkeypatch.setattr(auth.firebase_auth, "verify_id_token", mock_verify_token)
```
But `app.core.auth` does not have a `firebase_auth` attribute. The actual import in auth.py is:
```python
import firebase_admin.auth
```
The monkeypatch silently failed (no attribute → exception caught → skipped).

**What crashed:**
- All tests that sent `Authorization: Bearer valid_user_token` headers received HTTP 401
- 10 of 18 backend tests failed
- CI backend job failed
- Error was SILENT — no crash, just wrong behavior

**Where it crashed:**
- `backend/tests/conftest.py` fixture `mock_firebase_auth`
- Affected: `test_admin.py` (all admin endpoint tests), `test_search.py` (authenticated search)

**Rule going forward:**
> ✅ Always mock at the module where the function is **used**, not where it is **defined**.
> ✅ Correct pattern:
> ```python
> monkeypatch.setattr("firebase_admin.auth.verify_id_token", mock_verify_token)
> ```
> ✅ After writing any mock, run the tests locally and verify the target tests are PASSING, not just not-erroring.

---

### FAILURE 4: Async/Sync Database Mismatch in Test Fixtures
**What happened:**
The test `get_db` override yielded a **synchronous** SQLAlchemy session:
```python
engine = create_engine("sqlite:///:memory:", ...)
SessionLocal = sessionmaker(bind=engine)
```
But all FastAPI route handlers use `await db.execute(...)` — requiring an **async** session.

**What crashed:**
- All admin route tests failed with:
  ```
  TypeError: object ChunkedIteratorResult can't be used in 'await' expression
  ```
- 8 admin tests failed

**Where it crashed:**
- `backend/tests/conftest.py` → `test_db` and `client` fixtures
- `backend/app/api/routes/admin.py` → any `await db.execute()` call

**Rule going forward:**
> ✅ When overriding `get_db` for tests, ALWAYS use async SQLAlchemy:
> ```python
> from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
> engine = create_async_engine("sqlite+aiosqlite:///./test.db")
> ```
> ✅ Never mix sync `create_engine` with async route handlers.

---

### FAILURE 5: Backend Test Functions Named After Non-Existent API Functions
**What happened:**
`Nextjs/nextjs/src/lib/__tests__/api.test.ts` was written with:
```ts
import { searchHSCodes, fetchHSCodeDetail } from '../api';
```
But the actual exports in `src/lib/api.ts` are:
```ts
export async function search(...)
export async function getHsCodeDetail(...)
```
The functions were renamed at some point in development. The tests were written against the old names.

**What crashed:**
- All frontend vitest tests failed with import errors
- CI frontend test step failed

**Where it crashed:**
- `Nextjs/nextjs/src/lib/__tests__/api.test.ts` lines 1-5 (imports)

**Rule going forward:**
> ✅ Before writing tests for a function, OPEN THE SOURCE FILE and copy the exact export name.
> ✅ After writing test files, run `npm test` locally once before committing — import errors surface instantly.

---

### FAILURE 6: Dependabot Enabled Too Early (Before CI Was Verified Stable)
**What happened:**
`.github/dependabot.yml` was added in the same Sprint 1 commit that broke the CI.
GitHub immediately auto-created 12 Dependabot PRs:
- 4 for GitHub Actions version bumps
- 3 for npm updates
- 5 for pip updates

Each PR triggered CI. CI was broken (see Failures 1-5). All 12 PRs showed ❌ failed.
The GitHub PR list was flooded with noise, making it impossible to distinguish real failures
from broken infrastructure.

**What crashed:**
- CI on all 12 Dependabot PRs
- Developer visibility — hard to see what was a real bug vs broken CI
- Repository had 12 open PRs with red Xs simultaneously

**Rule going forward:**
> ✅ NEVER add `dependabot.yml` until CI is proven stable for at least a few days.
> ✅ When enabling Dependabot, use `open-pull-requests-limit: 3` or lower initially.
> ✅ If CI breaks after enabling Dependabot, disable immediately:
> ```bash
> git mv .github/dependabot.yml .github/dependabot.yml.disabled
> ```

---

### FAILURE 7: Duplicate Dependency Entry in `requirements.txt`
**What happened:**
`httpx==0.28.1` was already listed in the main dependencies section.
A second entry was added in the `# Testing` section:
```
# Testing
pytest==8.3.4
pytest-asyncio==0.24.0
pytest-cov==6.0.0
httpx==0.28.1  # Already listed above, used by TestClient  ← DUPLICATE
```

**What crashed:**
- pip installation during deployment produced warnings
- Potentially caused pip to skip or re-resolve the package, risking version conflicts
- Minor contributor to overall deployment instability

**Where it crashed:**
- `backend/requirements.txt` line 49
- Manifested during: deploy.yml step 7 `pip install -r requirements.txt`

**Rule going forward:**
> ✅ Before adding any package to `requirements.txt`, search the file first:
> ```bash
> grep "httpx" requirements.txt
> ```
> ✅ Use a single alphabetically-organized or category-organized section. No duplicate entries ever.

---

### FAILURE 8: Force Push Did Not Trigger Deployment
**What happened:**
After reverting main to `b9f0ae3` with `git push origin main --force`, the deployment
GitHub Action did NOT run. The site remained at 502.

**Why:**
The `deploy.yml` workflow only triggers on `push` to `main` when files in these paths change:
```yaml
paths:
  - 'Nextjs/**'
  - 'backend/**'
  - 'deploy.sh'
  - '.github/workflows/deploy.yml'
```
A force push that moves HEAD *backward* does not create new file diffs —
GitHub does not detect any changed files and therefore does not run the workflow.

**What crashed:**
- Production stayed at 502 for additional ~30 minutes while waiting for a "deployment that never came"

**Rule going forward:**
> ✅ A force-push revert to a previous commit will NOT trigger `paths`-filtered workflows.
> ✅ After a force-push revert, always touch a file in the monitored paths and push a new commit, OR use `workflow_dispatch`:
> ```bash
> # Touch deploy.yml to force a trigger
> git commit --allow-empty -m "chore: trigger redeploy"
> git push origin main
> ```
> ✅ `workflow_dispatch` is now added to `deploy.yml` — use the GitHub Actions UI "Run workflow" button for manual triggers.

---

### FAILURE 9: Large Multi-Feature Commit Pushed Directly to `main`
**What happened:**
Commit `1932cb3` was a single 1,922-line commit adding 18 new files covering:
- Backend test suite (pytest)
- Frontend test suite (vitest)
- 3 README rewrites
- SEO files (sitemap, robots.txt, OG image)
- Dependabot configuration
- CI workflow changes

None of these were tested locally before pushing. By the time errors surfaced, the
commit was already on `main` and deployed.

**What crashed:**
- Everything in Failures 1-7 above, all at once

**Rule going forward:**
> ✅ Never push more than one logical change at a time to `main`.
> ✅ Use feature branches. Test on the branch. Only merge when CI passes.
> ✅ Minimum checklist before pushing frontend changes:
> ```bash
> cd Nextjs/nextjs
> npm install          # sync lock file
> npm run build        # confirm production build works
> npm test             # confirm tests pass
> ```
> ✅ Minimum checklist before pushing backend changes:
> ```bash
> cd backend
> source venv/bin/activate
> pip install -r requirements.txt
> pytest tests/ -v    # confirm tests pass
> python -c "from app.main import app"  # confirm imports work
> ```

---

## QUICK REFERENCE — Pre-Push Checklist

### Frontend (Nextjs/nextjs)
- [ ] `npm install` run after any `package.json` change
- [ ] `package-lock.json` committed alongside `package.json` changes
- [ ] `npm run build` succeeds locally
- [ ] `npm test` passes locally
- [ ] Test files are excluded in `tsconfig.json`
- [ ] No test-framework globals (`vi`, `describe`) outside test files

### Backend (backend/)
- [ ] No duplicate packages in `requirements.txt`
- [ ] `pytest tests/ -v` passes locally
- [ ] `python -c "from app.main import app"` succeeds
- [ ] All new test mocks verified to actually intercept (not silently fail)
- [ ] Async routes use async test fixtures

### CI/CD
- [ ] CI passing on a feature branch BEFORE merging to `main`
- [ ] Dependabot only enabled when CI is stable for 3+ days
- [ ] After force-push revert, manually trigger deploy via GitHub Actions UI

---

*Last updated: March 1, 2026*
*Maintained by: development team — update this file every time a new failure occurs*
