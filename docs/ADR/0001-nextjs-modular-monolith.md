# ADR-0001: Next.js modular monolith for the pilot

**Status:** Accepted
**Date:** 2026-08-21

## Context

MemoLib is a multi-tenant legal SaaS pilot. The product requires authenticated
mail ingestion, human review of AI proposals, dossier management, audit trails,
deadlines, billing, and document uploads. The repository contains a Next.js
application with Route Handlers, Prisma, PostgreSQL, NextAuth, and the relevant
product code. It contains no active ASP.NET Core project.

Running two application backends against the same business database would create
duplicated authorization, validation, data-access, deployment, and audit
responsibilities without a pilot requirement for that complexity.

## Decision

The pilot uses a Next.js 16 modular monolith:

- App Router pages and Route Handlers are the only application boundary.
- Prisma is the only application ORM accessing PostgreSQL.
- Authentication, tenant isolation, RBAC, Zod validation, audit logging, and
  business transactions are enforced server-side in the Next.js application.
- Long-running or resource-intensive work may run in an optional worker
  (email synchronization, OCR, or AI). A worker receives a bounded,
  authenticated job and returns a structured proposal; it never performs a
  business mutation or owns application data.

No new ASP.NET Core or general-purpose backend is introduced for the pilot.

## Consequences

This reduces operational overhead and keeps tenant security, auditability, and
data consistency in one deployable application. It also makes server-side
transactions straightforward for human approval flows.

Workers must be introduced only with a measurable requirement that cannot be
met by Route Handlers, Vercel Cron, and queued jobs. Each worker requires an
explicit contract, idempotency strategy, authentication, observability, and a
failure mode that cannot create a dossier or other business record
automatically.
