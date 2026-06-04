# Fire Extinguisher Management System (FEMS)

Enterprise-grade microservices platform for managing fire extinguisher inventory, expiration tracking, customer notifications, compliance monitoring, and regulatory escalation.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Redux Toolkit, Recharts |
| Backend | NestJS 11, TypeORM, PostgreSQL |
| Auth | JWT + Refresh Token rotation, bcrypt, RBAC |
| API Docs | Swagger (merged at gateway) |
| Scheduling | `@nestjs/schedule` cron jobs |
| Containerization | Docker Compose |

## Architecture

```
React Frontend (:5173 / :8080)
        │
        ▼
API Gateway (:3000)
        │
   ┌────┴────┬──────────┬─────────────┬──────────┬────────────┬──────────┬────────────┐
   ▼         ▼          ▼             ▼          ▼            ▼          ▼            ▼
 Auth    Customer  Extinguisher  Notification  Renewal  Compliance  Report  Inspection
 :3001    :3002      :3003         :3004       :3005     :3006      :3007     :3008
   │         │          │             │          │            │          │            │
   └─────────┴──────────┴─────────────┴──────────┴────────────┴──────────┴────────────┘
                              PostgreSQL (7 databases)
```

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm

### 1. Install dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Create databases

PostgreSQL must be running. If `psql` fails with **Connection refused**, check your port — many local installs use **5433** instead of 5432 (this project’s sibling KParking setup does too).

```bash
# Default port (5432)
psql -U postgres -f scripts/init-databases.sql

# If PostgreSQL listens on 5433 (common on Windows)
psql -U postgres -p 5433 -f scripts/init-databases.sql
```

**Windows (full path, port 5433):**

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -p 5433 -f scripts/init-databases.sql
```

After creating databases, each service `.env` uses port **5433** (see `.env.example`). Adjust the password if yours is not `postgres` or `12345`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5433/fems_auth
```

### 3. Configure environment

Copy `.env.example` to `.env` in each service and the frontend:

```bash
cp services/auth-service/.env.example services/auth-service/.env
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/customer-service/.env.example services/customer-service/.env
cp services/extinguisher-service/.env.example services/extinguisher-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp services/compliance-service/.env.example services/compliance-service/.env
cp services/report-service/.env.example services/report-service/.env
cp services/inspection-maintenance-service/.env.example services/inspection-maintenance-service/.env
cp frontend/.env.example frontend/.env
```

**Windows (PowerShell):**

```powershell
Copy-Item services\auth-service\.env.example services\auth-service\.env
Copy-Item services\api-gateway\.env.example services\api-gateway\.env
Copy-Item services\customer-service\.env.example services\customer-service\.env
Copy-Item services\extinguisher-service\.env.example services\extinguisher-service\.env
Copy-Item services\notification-service\.env.example services\notification-service\.env
Copy-Item services\compliance-service\.env.example services\compliance-service\.env
Copy-Item services\report-service\.env.example services\report-service\.env
Copy-Item services\inspection-maintenance-service\.env.example services\inspection-maintenance-service\.env
Copy-Item frontend\.env.example frontend\.env
```

### 4. Start all backend services

```bash
npm run build:shared
npm run dev:services
```

The gateway starts **after** ports 3001–3008 are listening (so Swagger merges all 8 OpenAPI specs and `/api/settings` proxies to notification-service on 3004).

If you see **`EADDRINUSE`** (port already in use), stop leftover processes and restart:

```bash
npm run stop:services
npm run dev:services
```

### 5. Seed demo data

**Start backend services first** (TypeORM creates tables on startup), then seed:

```bash
npm run dev:services
```

In a **second terminal**, from the **project root** (not `frontend/`), once services are running:

```bash
cd "C:\Users\admin\Desktop\Templates\Restful practical\FireExtinguisherManagement"
npm run seed
```

### 6. Test all APIs (before frontend)

With **all 9 backend services** running (`npm run dev:services` — ports 3000–3008):

```bash
npm run seed
npm run test:apis
```

If report or inspection tests fail with **502**, ensure report-service (port **3007**) and inspection-maintenance-service (port **3008**) are running. Restart everything:

```bash
npm run stop:services
npm run dev:services
```

All 34 gateway API checks should pass. Then start the frontend.

### 7. Start frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fems.local | Admin@123 |
| Customer (User) | alice@example.com | Customer@123 |
| Inspector | inspector@fems.local | Inspector@123 |

## Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API Gateway | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Customer registration |
| POST | `/api/auth/refresh` | Refresh tokens |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/users/me` | Current user |
| CRUD | `/api/customers` | Customer management |
| CRUD | `/api/extinguishers` | Extinguisher management |
| GET | `/api/notifications` | Notification center |
| GET | `/api/compliance/cases` | Compliance cases |
| GET | `/api/inspections` | Inspection scheduling |
| GET | `/api/maintenance` | Maintenance logs |
| GET | `/api/reports/*` | Reports (PDF/XLSX/CSV) |
| GET | `/api/reports/dashboard-summary` | Dashboard charts |

Full documentation: http://localhost:3000/api/docs

## User Roles

**Admin** — Full access: customers, extinguishers, notifications, compliance, reports, settings.

**Customer** — View own extinguishers and notifications, schedule inspections.

## Business Rules

- **Pre-expiry alerts** (90 / 60 / 30 / 7 days, and on expiry) sent **immediately** when an extinguisher is registered or updated, plus a daily job to catch status changes
- **Post-expiry workflow**: Day 0 alert → Day 15 reminder → Day 30 warning → Day 60 escalation
- Notifications sent via email (SMS-ready architecture)
- Compliance cases escalate to authorities after configurable period

## Project Structure

```
├── packages/shared/       # @fems/shared — guards, DTOs, bootstrap
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── customer-service/
│   ├── extinguisher-service/
│   ├── notification-service/
│   ├── compliance-service/
│   ├── report-service/
│   └── inspection-maintenance-service/
├── frontend/              # React SPA
├── scripts/               # DB init, seed, backup, restore
├── docs/                  # Architecture, API, deployment
└── docker/                # Dockerfiles
```

## Testing

```bash
# API smoke tests (requires all 9 services + seed)
npm run test:apis

# Backend unit tests
npm test --workspace=@fems/auth-service

# Frontend tests
cd frontend && npm test
```

## Database backup and restore

Export all service databases (requires `pg_dump` on PATH):

```bash
npm run backup:databases
```

Output is written to `backups/<timestamp>/`. Restore from a backup directory:

```bash
npm run restore:databases -- backups/<timestamp>
```

See [Deployment Guide](docs/DEPLOYMENT.md) for production backup notes.

## Documentation

- [System Guide (for newcomers)](docs/SYSTEM_GUIDE.md)
- [ERD](docs/ERD.md)
- [User Manual](docs/USER_MANUAL.md)
- [UI Mockups](docs/UI_MOCKUPS.md)
- [Test Results](docs/TEST_RESULTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

Proprietary — Fire Extinguisher Management System
