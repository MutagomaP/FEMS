# FEMS Database Structure (Mermaid ERD)

FEMS uses **database-per-service** on PostgreSQL. Cross-service links are **logical UUID references** (no foreign keys across databases). Identity is linked at runtime via `users.email` = `customers.email`.

## Export schema from a running Postgres

```bash
npm run export:schema
# Full backup (schema + data):
npm run backup:databases
```

Output: `database-export/<timestamp>/*.schema.sql`

---

## 1. System overview (logical, cross-database)

```mermaid
flowchart TB
  subgraph auth_db["fems_auth"]
    users[(users)]
    refresh_tokens[(refresh_tokens)]
    password_reset_tokens[(password_reset_tokens)]
    audit_logs[(audit_logs)]
  end

  subgraph customers_db["fems_customers"]
    customers[(customers)]
  end

  subgraph ext_db["fems_extinguishers"]
    fire_extinguishers[(fire_extinguishers)]
    extinguisher_audit_logs[(extinguisher_audit_logs)]
  end

  subgraph insp_db["fems_inspections"]
    inspection_schedules[(inspection_schedules)]
    maintenance_logs[(maintenance_logs)]
  end

  subgraph notif_db["fems_notifications"]
    notifications[(notifications)]
    notification_deliveries[(notification_deliveries)]
    system_settings[(system_settings)]
  end

  subgraph renew_db["fems_renewals"]
    renewal_requests[(renewal_requests)]
  end

  subgraph comp_db["fems_compliance"]
    compliance_cases[(compliance_cases)]
  end

  users -.email.-> customers
  customers --> fire_extinguishers
  fire_extinguishers --> inspection_schedules
  fire_extinguishers --> maintenance_logs
  fire_extinguishers --> notifications
  fire_extinguishers --> renewal_requests
  fire_extinguishers --> compliance_cases
  customers --> inspection_schedules
  customers --> notifications
  customers --> renewal_requests
  customers --> compliance_cases
  users -.scheduled_by / inspector.-> inspection_schedules
  users -.inspector.-> maintenance_logs
  notifications --> notification_deliveries
  users --> refresh_tokens
  users --> password_reset_tokens
  users --> audit_logs
```

---

## 2. fems_auth (physical FKs)

```mermaid
erDiagram
  users ||--o{ refresh_tokens : has

  users {
    uuid id PK
    varchar first_name
    varchar last_name
    varchar full_name
    varchar email UK
    varchar password
    enum role "ADMIN|CUSTOMER|INSPECTOR"
    timestamptz created_at
    timestamptz updated_at
  }

  refresh_tokens {
    uuid id PK
    uuid user_id FK
    varchar token_hash
    timestamptz expires_at
    timestamptz revoked_at
    timestamptz created_at
  }

  password_reset_tokens {
    uuid id PK
    uuid user_id "ref users.id"
    varchar token_hash
    timestamptz expires_at
    timestamptz used_at
    timestamptz created_at
  }

  audit_logs {
    uuid id PK
    uuid user_id "nullable"
    varchar action
    varchar entity
    uuid entity_id "nullable"
    timestamptz created_at
  }
```

---

## 3. fems_customers

```mermaid
erDiagram
  customers {
    uuid id PK
    varchar full_name
    varchar national_id
    varchar phone
    varchar email UK
    text address
    timestamptz created_at
    timestamptz updated_at
  }
```

---

## 4. fems_extinguishers

```mermaid
erDiagram
  fire_extinguishers {
    uuid id PK
    varchar serial_number UK
    varchar location
    enum type "WATER|CO2|FOAM|DRY_CHEMICAL"
    enum size "2.5_LB|5_LB|9_LB|12_LB"
    date installation_date
    date expiry_date
    enum status "IN_STOCK|ACTIVE|EXPIRING_SOON|EXPIRED|RENEWED"
    uuid customer_id "nullable, ref fems_customers"
    timestamptz created_at
    timestamptz updated_at
  }

  extinguisher_audit_logs {
    uuid id PK
    uuid user_id "nullable, ref fems_auth.users"
    varchar action
    uuid entity_id "extinguisher id"
    text details
    timestamptz created_at
  }
```

---

## 5. fems_inspections

```mermaid
erDiagram
  inspection_schedules {
    uuid id PK
    uuid extinguisher_id "ref fems_extinguishers"
    uuid customer_id "ref fems_customers"
    uuid scheduled_by_user_id "ref fems_auth.users"
    uuid inspector_user_id "nullable, ref fems_auth.users"
    date inspection_date
    varchar inspection_time "HH:mm"
    enum status "PENDING|COMPLETED|OVERDUE|CANCELLED"
    text notes
    timestamptz created_at
    timestamptz updated_at
  }

  maintenance_logs {
    uuid id PK
    uuid extinguisher_id "ref fems_extinguishers"
    uuid inspector_user_id "ref fems_auth.users"
    varchar action_taken
    date maintenance_date
    text issues_identified
    text notes
    text recommendations
    timestamptz created_at
  }
```

---

## 6. fems_notifications

```mermaid
erDiagram
  notifications ||--o{ notification_deliveries : has

  notifications {
    uuid id PK
    uuid customer_id "ref fems_customers"
    uuid extinguisher_id "ref fems_extinguishers"
    text message
    enum type "EXPIRY_*|REMINDER_*|WARNING|INSPECTION_*"
    enum channel "EMAIL|SMS"
    enum status "SENT|READ"
    timestamptz sent_at
    timestamptz read_at
    timestamptz created_at
  }

  notification_deliveries {
    uuid id PK
    uuid notification_id FK
    enum channel
    enum status "SENT|DELIVERED|FAILED"
    timestamptz sent_at
    timestamptz delivered_at
    text error_message
  }

  system_settings {
    varchar key PK
    jsonb value
    timestamptz updated_at
  }
```

---

## 7. fems_renewals

```mermaid
erDiagram
  renewal_requests {
    uuid id PK
    uuid customer_id "ref fems_customers"
    uuid extinguisher_id "ref fems_extinguishers"
    enum request_type "SERVICE|REPLACEMENT|INSPECTION"
    enum status "PENDING|APPROVED|REJECTED|COMPLETED"
    text description
    timestamptz created_at
    timestamptz updated_at
  }
```

---

## 8. fems_compliance

```mermaid
erDiagram
  compliance_cases {
    uuid id PK
    uuid customer_id "ref fems_customers"
    uuid extinguisher_id "ref fems_extinguishers"
    enum case_status "OPEN|WARNING_SENT|FINAL_WARNING|ESCALATED|CLOSED"
    timestamptz closed_at
    text notes
    timestamptz created_at
    timestamptz updated_at
  }
```

---

## 9. Consolidated logical ERD (all entities)

```mermaid
erDiagram
  USERS ||--o{ REFRESH_TOKENS : has
  USERS ||--o{ PASSWORD_RESET_TOKENS : has
  USERS ||--o{ AUDIT_LOGS : generates

  CUSTOMERS ||--o{ FIRE_EXTINGUISHERS : owns
  FIRE_EXTINGUISHERS ||--o{ INSPECTION_SCHEDULES : scheduled_for
  FIRE_EXTINGUISHERS ||--o{ MAINTENANCE_LOGS : maintained
  FIRE_EXTINGUISHERS ||--o{ NOTIFICATIONS : alerts
  FIRE_EXTINGUISHERS ||--o{ RENEWAL_REQUESTS : renewals
  FIRE_EXTINGUISHERS ||--o{ COMPLIANCE_CASES : cases
  FIRE_EXTINGUISHERS ||--o{ EXTINGUISHER_AUDIT_LOGS : audited

  CUSTOMERS ||--o{ INSPECTION_SCHEDULES : requests
  CUSTOMERS ||--o{ NOTIFICATIONS : receives
  CUSTOMERS ||--o{ RENEWAL_REQUESTS : submits
  CUSTOMERS ||--o{ COMPLIANCE_CASES : subject

  NOTIFICATIONS ||--o{ NOTIFICATION_DELIVERIES : delivers

  USERS {
    uuid id PK
    string email UK
    enum role
  }

  CUSTOMERS {
    uuid id PK
    string email UK
    string full_name
  }

  FIRE_EXTINGUISHERS {
    uuid id PK
    string serial_number UK
    uuid customer_id "nullable"
    enum status
  }

  INSPECTION_SCHEDULES {
    uuid id PK
    uuid extinguisher_id
    uuid customer_id
    uuid inspector_user_id "nullable"
  }

  MAINTENANCE_LOGS {
    uuid id PK
    uuid extinguisher_id
    uuid inspector_user_id
  }

  NOTIFICATIONS {
    uuid id PK
    uuid customer_id
    uuid extinguisher_id
  }

  RENEWAL_REQUESTS {
    uuid id PK
    uuid customer_id
    uuid extinguisher_id
  }

  COMPLIANCE_CASES {
    uuid id PK
    uuid customer_id
    uuid extinguisher_id
  }
```

**Note:** `USERS` and `CUSTOMERS` are linked by matching `email`, not a database foreign key.
