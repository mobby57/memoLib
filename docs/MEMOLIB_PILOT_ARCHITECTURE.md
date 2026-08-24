# MemoLib Pilot Architecture

## Product boundary

The pilot delivers one controlled loop:

```text
Gmail or Outlook
  -> authenticated ingestion
  -> email triage
  -> proposed action or dossier draft
  -> human validation
  -> living dossier
  -> daily briefing
```

No client, dossier, deadline, outgoing message, or invoice is created automatically.
Every business effect requires an authenticated, tenant-scoped human decision.

## Existing capabilities

| Workflow step | Reuse | Required correction |
| --- | --- | --- |
| Mailbox connection | `EmailAccount`, `/api/email/connect/*`, settings emails | Signed state, PKCE, session binding, encrypted tokens and complete Outlook UX |
| Mail synchronization | `/api/cron/email-sync`, provider message IDs | Delegate to common ingestion instead of persisting unprocessed email |
| External ingestion | `/api/emails/incoming`, `lib/email/ingestion.ts`, `EmailAttachment` | Keep signature, Zod and deduplication; remove automatic business creation |
| Extraction | `lib/adapters/email.adapter.ts`, email classifier | Return a structured, validated proposal only |
| Human triage | `emails/page.tsx`, pending-actions service | Persist proposals, tenant-scope them and audit every decision |
| Dossier creation | `Draft`, `/api/drafts/[id]/validate`, `Dossier`, `LegalDeadline` | Make the full decision transaction atomic |
| Daily briefing | `MorningBrief.tsx`, morning-brief API | Tenant-scope and mount on the dashboard |

Isolate from the pilot: workspace reasoning, smart inbox/information units,
legacy OAuth routes, duplicate email webhooks, email paste/create-dossier flows,
and unfinished admin integration pages.

## Minimal target architecture

`Email` remains the source event. `Dossier` remains the living aggregate.
`WorkflowExecution` records idempotent processing and `AuditLog` provides the
immutable decision trail.

Add exactly one model, `ActionProposal`:

```text
tenantId, emailId?, dossierId?, type, status, priority, riskLevel,
rationale, payloadJson, proposedAt, proposedBy, decidedAt, decidedBy,
decisionReason, executedAt, executedBy, executionResult, idempotencyKey,
createdAt, updatedAt
```

Indexes:

```text
(tenantId, status, priority)
(dossierId, status)
(emailId)
unique (tenantId, idempotencyKey)
```

Extend:

- `EmailAccount`: encrypted provider tokens, scopes and sync state.
- `Email`: `emailAccountId` and explicit ingestion status.
- `WorkflowExecution`: a tenant-scoped unique source event key.
- `AuditLog`: correlation ID, actor type and a minimized decision payload.

Do not add a generic event engine, workspace, or living-dossier model for the
pilot. Those concepts are already represented by the models above.

## Security contract

- Tenant identity comes only from the authenticated session or `EmailAccount`,
  never from request bodies.
- OAuth callbacks require signed one-time state, PKCE and the initiating
  session/user/tenant.
- OAuth tokens are encrypted at rest.
- All user routes require authentication, tenant scoping, RBAC and Zod input
  validation.
- Ingestion is provider-idempotent; analysis failure cannot create a dossier.
- Action approval is server-side whitelisted. The client only sends an
  optionally bounded decision note.
- Audit entries store identifiers and hashes, not raw email bodies or PII.

## Pilot screens

1. `settings/emails`: a single Gmail/Outlook connection screen.
2. `emails`: triage inbox for proposals, draft association and decisions.
3. `dossiers/[id]`: dossier summary, timeline, source links, open risks and
   pending actions.
4. `dashboard`: mounted morning briefing for pending proposals, deadlines and
   incomplete dossiers.

Hide the existing copy-paste onboarding and unfinished integration screens
until they implement this same loop.

## API boundary

Keep and correct:

- OAuth Gmail/Outlook endpoints.
- `/api/cron/email-sync`.
- `/api/emails/incoming` as the sole signed external ingestion path.
- Draft validation/rejection and legal-deadline endpoints.
- Morning briefing and tenant-scoped dossier read APIs.

Deprecate:

- `/api/emails/paste`, `/api/emails/create-dossier`,
  `/api/emails/[id]/integrate`.
- Duplicate email webhooks.
- Existing pending-actions mutations.
- Workspace reasoning APIs.

Create:

```text
GET  /api/action-proposals
POST /api/action-proposals/[id]/approve
POST /api/action-proposals/[id]/reject
```

## Delivery order

### P0

1. Add `ActionProposal` and the minimal model extensions.
2. Secure OAuth and synchronize through the common ingestion service.
3. Build ingestion to create only drafts and action proposals.
4. Make draft/proposal approval tenant-scoped, auditable and transactional.

Acceptance tests include OAuth state mismatch, token encryption, provider
deduplication, malformed payload rejection, cross-tenant 403, analysis
failure without business creation, rollback, and concurrent approval.

### P1

5. Replace onboarding with mailbox connection and triage.
6. Build the living dossier screen and daily briefing.

The E2E acceptance scenario is: mocked mailbox connection, imported email,
proposal creation, human approval, dossier/deadline visibility, and strict
tenant isolation.
