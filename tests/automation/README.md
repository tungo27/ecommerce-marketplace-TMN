# Automation regression suite

This suite verifies every validated bug fix from `fix/validated-bugs-batch1` plus
the pre-existing build/lint/test failures that were fixed afterwards.

## Prerequisites

- Backend API reachable at `http://localhost:4000/api`
  (override with `AUTOMATION_API_URL`).
- Docker container `marketplace-postgres` running, since the suite promotes a
  generated account to `ADMIN`, marks orders as `DELIVERED`, disables an account
  for the login check, and removes all generated rows afterwards.
- Node.js 20+ (uses the built-in `node:test` runner, no extra dependencies).

Start the infrastructure from the repository root if needed:

```bash
docker compose up -d
npm run start:prod --prefix backend
```

## Run

```bash
npm run test:automation
```

Individual suites:

```bash
npm run test:automation:api       # API integration checks for the bug list
npm run test:automation:workspace # unit/e2e/lint/build/typecheck + source invariants
```

## Coverage

| Check | Covered by |
| --- | --- |
| `BUG_02` — 30000 shipping in cart, charged once at checkout, order total + history agree | `bugfix-api.test.mjs` + `workspace-checks.test.mjs` |
| `BUG-PROD-001` — create product with `categoryId` + multipart image | `bugfix-api.test.mjs` |
| `BUG-PROD-001` — extra `images` field in body is whitelisted | `bugfix-api.test.mjs` |
| `BUG-PROD-001` — stale category id returns a clear 400 | `bugfix-api.test.mjs` |
| `BUG-PROD-002` — update product with existing + new images (multipart PUT) | `bugfix-api.test.mjs` |
| `BUG-REG-001` — reject whitespace-only name and trim stored name | `bugfix-api.test.mjs` |
| `BUG-REG-002` — reject name longer than 100 chars | `bugfix-api.test.mjs` |
| `BUG-LOGIN-001` — password checked before disabled status | `bugfix-api.test.mjs` + `workspace-checks.test.mjs` |
| Banned account cannot reuse an existing JWT | `bugfix-api.test.mjs` + `workspace-checks.test.mjs` |
| `BUG-LOGIN-002` — clear both session cookies on logout and 401 | `workspace-checks.test.mjs` (source invariant) |
| `BUG-REV-001` — hidden reviews omitted | `bugfix-api.test.mjs` |
| `BUG-REV-002` — rating recomputed after hide/unhide | `bugfix-api.test.mjs` |
| `BUG-REV-003` — Redis-safe product cache invalidation (`X-Cache: MISS`) | `bugfix-api.test.mjs` |
| Category cache invalidated; admin can create category without slug | `bugfix-api.test.mjs` + `workspace-checks.test.mjs` |
| Backoffice FormData is never converted to JSON | `workspace-checks.test.mjs` |
| Remaining report API mismatch (`getReports` / `reviewReport`) | `bugfix-api.test.mjs` |
| Backend unit/e2e tests, builds, lint, typecheck | `workspace-checks.test.mjs` |

`BUG_01` was validated as invalid and is intentionally not implemented or tested.

All rows created by the API suite are removed in its `after` hook.
