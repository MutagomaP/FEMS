# API Test Results

## How to run

```bash
npm run dev:services
npm run seed
npm run test:apis
```

The script [`scripts/test-apis.mjs`](../scripts/test-apis.mjs) exercises the API gateway at `http://localhost:3000/api`.

## Last run

| Field | Value |
|-------|-------|
| Date | 2026-06-03 |
| Environment | Local development (Windows) |
| Services | 9 processes (gateway + 8 microservices, ports 3000–3008) |
| Seed | `npm run seed` executed before test run |
| Result | **34/34 passed** |
| Exit code | 0 |

## Coverage

- Gateway health and root
- Auth: login (admin, customer, inspector), refresh, logout, register fields
- Users: profile, change password (when seeded)
- Customers CRUD paths
- Extinguishers list/mine
- Inspections schedule/list
- Maintenance log (inspector)
- Notifications, renewals, compliance, settings
- Reports: dashboard, CSV exports, inventory and inspection report endpoints

## Test output summary

```
API TEST SUMMARY: 34/34 passed
✓ Gateway health and root
✓ Admin, customer, and inspector login
✓ Users/me, users list, refresh token
✓ Customers (admin list, customer me, by id)
✓ Extinguishers (admin list, customer mine, status filter)
✓ Notifications (customer me, admin list, mark read)
✓ Renewals (admin list, customer mine)
✓ Compliance cases
✓ Settings (notification schedule, escalation rules)
✓ Reports (dashboard, expired, expiring, compliance, renewals, notifications, inventory, inspections-pending)
✓ Inspections (schedule, mine)
✓ Maintenance log (inspector)
✓ Auth logout
```

## Expected outcome

All listed tests should return HTTP 2xx when all nine backend services (ports 3000–3008) are running and `npm run seed` has been executed.

Re-run after schema changes: restart services (TypeORM sync), then `npm run seed`.

## Security notes

- JWT required on protected routes
- RBAC enforced per role
- Service-to-service routes require `X-Service-Key`
- Auth endpoints rate-limited via `@nestjs/throttler`

## Frontend tests

```bash
cd frontend && npm test
```

Unit tests cover auth slice, validation utilities, and login page rendering.

## Performance smoke test

```bash
npm run test:perf
```

Runs `scripts/perf-smoke.mjs` against the gateway (health + authenticated list/report calls). This is a lightweight smoke test, not full load/stress testing.
