# Architecture — acme-billing

Usage-based billing service for the Acme platform. Owns metering, rating, invoice
generation, and the public billing API.

## Overview

A **service** that turns metered usage events into invoices. It is the system of
record for billing state: what a customer used, what it costs, and what has been
billed. It serves an internal finance team and a public billing API.

## Technology

- **Language:** TypeScript on Node 20
- **Framework:** NestJS
- **Datastore:** PostgreSQL (RDS) — the system of record
- **Testing:** Vitest
- **Package manager:** pnpm

## Structure

```
src/metering/     ingests and normalizes usage events
src/rating/       applies price plans to usage (billing math lives here)
src/invoicing/    assembles invoices from rated usage
src/api/          the public billing API surface
migrations/       relational migrations (human-gated)
```

## Boundaries & dependencies

- `rating/` is the only home for billing math. Nothing else computes money.
- `api/` may depend on `invoicing/` and `rating/`; the reverse is forbidden.
- External systems: the platform event bus (usage in), the payments provider
  (charge out). Card data never transits this service.

## Key decisions

- **PostgreSQL over DynamoDB.** Billing needs multi-row transactional integrity;
  PostgreSQL on RDS is the system of record. Trade-off: relational migrations and
  no infinite-scale write path — acceptable for billing volumes.
