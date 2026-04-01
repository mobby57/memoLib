# Gap analysis - operability and product quality

Date: 2026-04-01
Scope: frontend and middleware reliability, state management consistency, domain depth

## Executive summary

The project has strong functional coverage, but three cross-cutting layers are still fragile:

1. Error handling is not consistently centralized across pages and hooks.
2. State management is fragmented (local state, custom hooks, partial react-query usage).
3. Domain expertise behavior is partially implemented but not fully enforced by typed workflows and validation rules.

This document defines a practical remediation plan.

## Evidence from code

### Error handling gaps

- Many pages still use local try/catch with ad hoc messages instead of a shared policy:
  - [src/app/[locale]/ai-assistant/page.tsx](src/app/[locale]/ai-assistant/page.tsx#L51)
  - [src/app/[locale]/analytics/page.tsx](src/app/[locale]/analytics/page.tsx#L73)
- Global error UI exists but contains text encoding issues and no structured diagnostics:
  - [src/app/[locale]/global-error.tsx](src/app/[locale]/global-error.tsx#L67)
- A centralized classifier exists but is not used systematically in pages/routes:
  - [src/lib/error-handler.ts](src/lib/error-handler.ts#L1)

### State management gaps

- Multiple important pages rely on loosely typed local state:
  - [src/app/[locale]/workspaces/page.tsx](src/app/[locale]/workspaces/page.tsx#L12)
  - [src/app/[locale]/workspaces/[id]/page.tsx](src/app/[locale]/workspaces/[id]/page.tsx#L20)
- Hooks expose broad any payloads and repeated manual error throwing:
  - [src/hooks/useWorkspaceReasoning.ts](src/hooks/useWorkspaceReasoning.ts#L78)
- There is no clear app-wide state contract for loading/error/success transitions.

### Domain expertise and typed quality gaps

- Heavy any usage in critical middleware and workflow paths:
  - [src/middleware/zero-trust.ts](src/middleware/zero-trust.ts#L50)
  - [src/lib/workflows/workflow-engine.ts](src/lib/workflows/workflow-engine.ts#L22)
  - [src/lib/workflows/email-intelligence.ts](src/lib/workflows/email-intelligence.ts#L94)
- Several tests indicate unfinished expert behavior with TODO markers:
  - [src/frontend/src/__tests__/services/event-log.service.test.ts](src/frontend/src/__tests__/services/event-log.service.test.ts#L23)
  - [src/frontend/src/__tests__/integration/event-log.integration.test.ts](src/frontend/src/__tests__/integration/event-log.integration.test.ts#L25)

## Priority remediation plan

## Phase 1 - Reliability baseline (2 to 4 days)

1. Enforce shared error pipeline in all API hooks/pages:
   - classifyError + reportError + standard user messages
2. Normalize error boundaries:
   - fix text encoding
   - include correlation id and retry guidance
3. Add a single async action wrapper for UI calls.

Expected result:
- Consistent user-facing errors
- Better production observability
- Lower support noise

## Phase 2 - State coherence (3 to 5 days)

1. Define a global UI state slice (loading, toasts, global errors, pending actions).
2. Migrate top traffic screens to typed server-state patterns (react-query keys and invalidation).
3. Remove broad any from top hooks and return typed result contracts.

Expected result:
- Predictable UI behavior
- Fewer race conditions and stale views
- Easier debugging

## Phase 3 - Domain depth and expert guardrails (4 to 7 days)

1. Add explicit domain decision models for workflow rules (urgency, legal action, assignment).
2. Replace any in middleware/workflow engine with strict action/object enums.
3. Complete TODO tests for event-log immutability and checksum integrity.

Expected result:
- Stronger domain correctness
- Better compliance and audit confidence
- Safer evolution of business logic

## Suggested first implementation package

Package A (fastest impact):
1. Fix and standardize global error views.
2. Create shared UI async action helper.
3. Integrate helper in workspace and ai-assistant pages.
4. Add smoke tests for standardized error rendering.

## Success metrics

- Error handling coverage:
  - at least 90 percent of API calls routed through shared handler
- Type quality:
  - reduce any usage in src/middleware and src/lib/workflows by 50 percent
- Test quality:
  - close all TODOs in event-log service/integration tests
- Product stability:
  - reduce repeated user-reported transient errors by 30 percent

## Decision request

Proceed with Package A first, then Phase 2 migration on workspace and validation flows.
