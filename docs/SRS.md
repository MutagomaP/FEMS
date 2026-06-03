# Software Requirements Specification (SRS)

## Fire Extinguisher Management System (FEMS)

| Version | 1.0 |
| Date | 2026 |
| Status | Implemented (see checklist audit in project README) |

## 1. Purpose

FEMS supports registration and tracking of fire extinguishers, inspection scheduling, maintenance logging, compliance monitoring, notifications, and operational reporting for building owners, inspectors, and administrators.

## 2. Scope

- **In scope:** Multi-service REST API, JWT authentication, RBAC, React web portal, PostgreSQL persistence, email notifications, PDF/CSV/XLSX reports, Docker deployment.
- **Out of scope (v1):** Mobile native apps, service discovery mesh, separate normalized Roles/UserRoles tables (role stored on `users.role` enum).

## 3. Actors

| Actor | Description |
|-------|-------------|
| Admin | Full inventory, users, customers, reports, settings, compliance |
| Inspector | View extinguishers, complete inspections, log maintenance |
| Customer (User) | Register via portal, own extinguishers, schedule inspections, renewals |

## 4. Functional requirements

### 4.1 Authentication

- FR-A1: Register with first name, last name, email, password (`POST /api/auth/register` or `POST /api/users/register`).
- FR-A2: Login/logout with JWT access + refresh tokens.
- FR-A3: Forgot password via email OTP; reset with OTP + new password.
- FR-A4: Profile read/update (`GET/PATCH /api/users/me` or `/users/profile`).

### 4.2 Fire extinguishers

- FR-E1: CRUD for extinguishers (admin); customers view own (`/extinguishers/mine`).
- FR-E2: Fields: serial (unique), location, type, size, installation date, expiry date, status.
- FR-E3: Expiry date must be after installation date.
- FR-E4: List with pagination, filter, sort (`sortBy`, `sortOrder`).
- FR-E5: Audit log on create/update/delete.

### 4.3 Inspections & maintenance

- FR-I1: Schedule inspection (date, time, extinguisher); future date validation.
- FR-I2: Inspector logs maintenance: action, date, issues, notes, **recommendations**.

### 4.4 Notifications & compliance

- FR-N1: Expiry reminders (90/60/30/7/1 day) via email engine.
- FR-C1: Compliance cases and escalation workflow.

### 4.5 Reporting

- FR-R1: Inventory, inspection, compliance, maintenance reports.
- FR-R2: Export PDF, CSV, XLSX.

## 5. Non-functional requirements

- NFR-1: HTTPS/TLS in production; bcrypt password hashing.
- NFR-2: RBAC on all protected routes.
- NFR-3: API documented via OpenAPI/Swagger at gateway.
- NFR-4: Health endpoint `/api/health`.
- NFR-5: Smoke performance script (`scripts/perf-smoke.mjs`); full load testing optional.

## 6. System context

See `docs/ARCHITECTURE.md` and root `README.md` for service topology (gateway + 8 microservices, 7 databases).

## 7. Acceptance criteria

Aligned with project implementation checklist: all core CRUD paths operational, JWT/RBAC enforced, reports exportable, UI responsive, database backup script provided, CI workflow runs build + frontend tests.
