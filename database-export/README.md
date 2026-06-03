# Database export folder

Generated SQL schema dumps and Mermaid ERD sources for FEMS.

| File | Description |
|------|-------------|
| `ERD.mmd` | Standalone Mermaid ER diagram (paste into [mermaid.live](https://mermaid.live)) |
| `<timestamp>/*.schema.sql` | `pg_dump --schema-only` per database (from `npm run export:schema`) |

## Commands

```bash
# Structure only (recommended for documentation)
npm run export:schema

# Full backup (schema + data)
npm run backup:databases
```

Set connection if not using default local Postgres:

```bash
DATABASE_URL_BASE=postgresql://postgres:yourpass@localhost:5432 npm run export:schema
```

## Databases

| Database | Service | Tables |
|----------|---------|--------|
| `fems_auth` | auth-service | users, refresh_tokens, password_reset_tokens, audit_logs |
| `fems_customers` | customer-service | customers |
| `fems_extinguishers` | extinguisher-service | fire_extinguishers, extinguisher_audit_logs |
| `fems_notifications` | notification-service | notifications, notification_deliveries, system_settings |
| `fems_renewals` | renewal-service | renewal_requests |
| `fems_compliance` | compliance-service | compliance_cases |
| `fems_inspections` | inspection-maintenance-service | inspection_schedules, maintenance_logs |

Full Mermaid diagrams (per database + overview): [docs/DATABASE_ERD.md](../docs/DATABASE_ERD.md)
