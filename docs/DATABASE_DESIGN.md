# FEMS Database Design

Each microservice owns its PostgreSQL database. TypeORM `synchronize: true` in development auto-creates schemas.

## fems_auth

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| full_name | VARCHAR(200) | |
| email | VARCHAR(255) UNIQUE | |
| password | VARCHAR(255) | bcrypt hash |
| role | ENUM | ADMIN, CUSTOMER, INSPECTOR |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### refresh_tokens
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| token_hash | VARCHAR | SHA-256 of raw token |
| expires_at | TIMESTAMP | |
| revoked_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID | nullable |
| action | VARCHAR(255) | |
| entity | VARCHAR(255) | |
| entity_id | UUID | nullable |
| created_at | TIMESTAMP | |

## fems_customers

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| full_name | VARCHAR(255) | |
| national_id | VARCHAR(50) | |
| phone | VARCHAR(20) | |
| email | VARCHAR(255) UNIQUE | Links to users.email |
| address | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_extinguishers

### fire_extinguishers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| serial_number | VARCHAR(100) UNIQUE | |
| location | VARCHAR(255) | |
| type | ENUM | WATER, CO2, FOAM, DRY_CHEMICAL |
| size | ENUM | 2.5_LB, 5_LB, 9_LB, 12_LB |
| installation_date | DATE | |
| expiry_date | DATE | |
| status | ENUM | IN_STOCK, ACTIVE, EXPIRING_SOON, EXPIRED, RENEWED |
| customer_id | UUID | nullable; ref fems_customers |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_notifications

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID | |
| extinguisher_id | UUID | nullable |
| message | TEXT | |
| type | VARCHAR | EXPIRY_90, EXPIRY_60, etc. |
| channel | ENUM | EMAIL, SMS |
| status | ENUM | SENT, READ |
| sent_at | TIMESTAMP | |
| read_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

Unique constraint: `(type, extinguisher_id, customer_id)`

### notification_deliveries
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| notification_id | UUID FK | |
| channel | ENUM | EMAIL, SMS |
| status | ENUM | SENT, DELIVERED, FAILED |
| sent_at | TIMESTAMP | |
| delivered_at | TIMESTAMP | nullable |
| error_message | TEXT | nullable |

### system_settings
| Column | Type | Notes |
|--------|------|-------|
| key | VARCHAR PK | |
| value | JSONB | |
| updated_at | TIMESTAMP | |

## fems_renewals

### renewal_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID | |
| extinguisher_id | UUID | |
| request_type | ENUM | SERVICE, REPLACEMENT, INSPECTION |
| status | ENUM | PENDING, APPROVED, REJECTED, COMPLETED |
| description | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_compliance

### compliance_cases
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID | |
| extinguisher_id | UUID | |
| case_status | ENUM | OPEN, WARNING_SENT, FINAL_WARNING, ESCALATED, CLOSED |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_inspections

### inspection_schedules
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| extinguisher_id | UUID | |
| customer_id | UUID | |
| scheduled_by_user_id | UUID | |
| inspector_user_id | UUID | nullable |
| inspection_date | DATE | |
| inspection_time | VARCHAR(5) | HH:mm |
| status | ENUM | PENDING, COMPLETED, OVERDUE, CANCELLED |
| notes | TEXT | nullable |

### maintenance_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| extinguisher_id | UUID | |
| inspector_user_id | UUID | |
| action_taken | VARCHAR(255) | |
| maintenance_date | DATE | |
| issues_identified | TEXT | nullable |
| notes | TEXT | nullable |
| recommendations | TEXT | nullable |

### extinguisher_audit_logs (fems_extinguishers)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID | nullable |
| action | VARCHAR(64) | e.g. EXTINGUISHER_CREATED |
| entity_id | UUID | extinguisher id |
| details | TEXT | JSON snapshot |
| created_at | TIMESTAMP | |

### password_reset_tokens
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID | ref users.id |
| token_hash | VARCHAR(64) | |
| expires_at | TIMESTAMPTZ | |
| used_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | |

## Initialization

```bash
psql -U postgres -f scripts/init-databases.sql
npm run dev:services
npm run seed
```

## Export & ERD

```bash
npm run export:schema
```

Mermaid diagrams: [DATABASE_ERD.md](./DATABASE_ERD.md) · standalone file: `database-export/ERD.mmd`
