# 0001 — PostgreSQL over DynamoDB

- **Status:** accepted (2026-02-14)
- **Context:** billing requires multi-row transactional integrity — invoices, line items, and ledger entries must commit together.
- **Decision:** PostgreSQL on RDS is the system of record.
- **Alternatives rejected:** DynamoDB — no cross-row transactions across the access patterns we need; would push consistency logic into the application.
- **Consequences:** relational migrations are required (constitution rule 3 gates them); no infinite-scale write path without later sharding.
- **Superseded by:** —
