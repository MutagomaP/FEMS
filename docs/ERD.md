# FEMS Entity Relationship Diagram

See **[DATABASE_ERD.md](./DATABASE_ERD.md)** for full Mermaid diagrams (system overview, per-database ERDs, column lists).

Quick reference: copy `database-export/ERD.mmd` into [Mermaid Live Editor](https://mermaid.live).

## Identity link

`users.email` = `customers.email` (runtime resolution, not a database FK).

## Export

```bash
npm run export:schema    # SQL schema dumps → database-export/<timestamp>/
npm run backup:databases # Full SQL backup → backups/<timestamp>/
```
