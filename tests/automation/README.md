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
| `BUG_02` — shipping fee shown in cart and charged once per checkout | `bugfix-api.test.mjs` |
| `BUG-PROD-001` — create product with `categoryId` + multipart image | `bugfix-api.test.mjs` |
| `BUG-PROD-002` — update product with existing + new images | `bugfix-api.test.mjs` |
| `BUG-REG-001` — trim registration fields | `bugfix-api.test.mjs` |
| `BUG-REG-002` — reject name longer than 100 chars | `bugfix-api.test.mjs` |
| `BUG-LOGIN-001` — reject disabled account | `bugfix-api.test.mjs` |
| `BUG-LOGIN-002` — clear both session cookies | `workspace-checks.test.mjs` (source invariant) |
| `BUG-REV-001` — hidden reviews omitted | `bugfix-api.test.mjs` |
| `BUG-REV-002` — rating recomputed after hide/unhide | `bugfix-api.test.mjs` |
| `BUG-REV-003` — Redis-safe product cache invalidation (`X-Cache: MISS`) | `bugfix-api.test.mjs` |
| Remaining report API mismatch (`getReports` / `reviewReport`) | `bugfix-api.test.mjs` |
| Remaining backend spec DI failures | `workspace-checks.test.mjs` (`npm test --prefix backend`) |
| Remaining frontend lint/build/typecheck failures | `workspace-checks.test.mjs` |

`BUG_01` was validated as invalid and is intentionally not implemented or tested.

All rows created by the API suite are removed in its `after` hook.
