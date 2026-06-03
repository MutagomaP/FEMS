# FEMS Deployment Guide

## Environment Variables

### Shared (all services)

| Variable | Description | Example |
|----------|-------------|---------|
| JWT_SECRET | JWT signing secret | long-random-string |
| SERVICE_INTERNAL_KEY | Service-to-service auth | dev-internal-service-key |
| CORS_ORIGIN | Allowed frontend origin | http://localhost:5173 |
| NODE_ENV | Environment | production |

### auth-service

| Variable | Description |
|----------|-------------|
| PORT | 3001 |
| DATABASE_URL | postgresql://user:pass@host:5432/fems_auth |
| JWT_EXPIRES_IN | 15m |
| REFRESH_TOKEN_EXPIRES_DAYS | 7 |

### notification-service

| Variable | Description |
|----------|-------------|
| SMTP_HOST | Mail server host |
| SMTP_PORT | 587 |
| SMTP_USER | SMTP username |
| SMTP_PASSWORD | SMTP password |

If SMTP is not configured, emails are logged to console (mock mode).

### report-service

| Variable | Description |
|----------|-------------|
| PORT | 3007 |
| INSPECTION_SERVICE_URL | http://inspection-maintenance-service:3008 |

### inspection-maintenance-service

| Variable | Description |
|----------|-------------|
| PORT | 3008 |
| DATABASE_URL | postgresql://user:pass@host:5432/fems_inspections |
| CUSTOMER_SERVICE_URL | http://customer-service:3002 |
| NOTIFICATION_SERVICE_URL | http://notification-service:3004 |

### api-gateway

| Variable | Description |
|----------|-------------|
| INSPECTION_SERVICE_URL | http://inspection-maintenance-service:3008 |

### frontend

| Variable | Description |
|----------|-------------|
| VITE_API_URL | http://localhost:3000/api |

## Docker Deployment

### Production build

```bash
docker compose up --build -d
```

Services:
- Frontend: http://localhost:8080
- API Gateway: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

### Post-deploy seed

```bash
docker compose exec auth-service node /app/scripts/seed.mjs
```

Or run seed from host against exposed Postgres:

```bash
DATABASE_HOST=localhost node scripts/seed.mjs
```

## Database backup and restore

### Export (backup)

Requires `pg_dump` on PATH. From the project root:

```bash
npm run backup:databases
```

Optional connection override:

```bash
DATABASE_URL_BASE=postgresql://postgres:YOUR_PASSWORD@localhost:5433 npm run backup:databases
```

SQL files are written to `backups/<timestamp>/` (one file per database: `fems_auth`, `fems_customers`, etc.).

### Import (restore)

Requires `psql` on PATH. Restore all databases from a backup folder:

```bash
npm run restore:databases -- backups/<timestamp>
```

Example:

```bash
npm run restore:databases -- backups/2026-06-03T09-00-00
```

**Note:** Databases must already exist (`scripts/init-databases.sql`). Restore overwrites data in existing tables.

## Manual Deployment

1. Provision PostgreSQL and run `scripts/init-databases.sql`
2. Set `.env` files for each service
3. Build shared package: `npm run build:shared`
4. Build each service: `npm run build --workspace=@fems/<service>`
5. Start services (use PM2 or systemd)
6. Build frontend: `cd frontend && npm run build`
7. Serve frontend with nginx, proxy `/api` to gateway

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `SERVICE_INTERNAL_KEY`
- [ ] Set `NODE_ENV=production` (disables TypeORM synchronize)
- [ ] Configure SMTP for email notifications
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up database backups per service DB (`npm run backup:databases`)
- [ ] Configure reverse proxy (nginx) with TLS
- [ ] Set rate limiting thresholds
- [ ] Monitor cron job execution logs

## Health Checks

| Endpoint | Expected |
|----------|----------|
| GET /api/health | `{ "status": "ok", "gateway": true }` |
| GET /api/docs | Swagger UI loads |

## Scaling Notes

- Each service can scale independently
- report-service is stateless — scale horizontally
- Cron jobs should run on single instance per service (use leader election in multi-instance setups)
- PostgreSQL can be consolidated to one instance with separate databases (current design)
