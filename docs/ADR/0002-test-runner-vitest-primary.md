# ADR-0002: Vitest as primary test runner, Jest retained for integration tier

**Status:** Accepted
**Date:** 2026-10-05

## Context

The repository was mid-migration from Jest to Vitest. An audit of the current
state found:

- **Vitest is the de facto primary runner.** ~340 test files import from
  `vitest`. The `test`, `test:ci`, `test:unit`, `test:components`, and most
  `test:*` scripts run Vitest. `test:ci` alone runs 266 files / 4870 tests.
- **Only two test files still use the Jest API as their framework:**
  - `src/lib/services/__tests__/legal-proof.service.test.ts` (`@jest/globals`,
    `jest.mock`)
  - `src/lib/multichannel/__tests__/adapter-pattern.test.ts` (`@jest/globals`)
- **Two mock modules use `jest.fn()`:** `src/__mocks__/lib/prisma.ts`,
  `src/__mocks__/stripe.ts`.
- **A `jest` global shim is relied upon by multiple Vitest tests** that call
  jest-compatible globals (`jest.setSystemTime`, `jest.runAllTimersAsync`,
  `jest.requireActual`, etc.). These are Vitest tests, not Jest tests.
- **Jest still backs the integration tier.** The `test:integration` and
  `coverage:check` scripts invoke `jest` against `src/__tests__/integration/**`,
  which require a real database and are intentionally excluded from `test:ci`.
  Four Jest config files exist: `jest.config.js`, `jest.config.optimized.js`,
  `jest.tasks.config.cjs`, `jest.e2e.config.cjs`, plus `jest.setup.js`.

The helper `scripts/migrate-jest-to-vitest.ts` exists but the migration was
never completed.

## Decision

Keep both runners for now, with Vitest as the primary runner:

- **Vitest** owns unit, component, API-route, and the default/CI test suites.
- **Jest** is retained only for the integration tier (`test:integration`,
  `coverage:check`) that runs against a real database outside `test:ci`.

The migration is **not** forced in this pass. Converting the two Jest-API test
files, the two mock modules, and the four Jest configs — then rewiring the
integration/coverage scripts and pruning ~8 Jest devDependencies — touches
CI-relevant integration tooling and the shared `jest` global shim on a
production-green application. The risk outweighs the benefit without the ability
to verify the DB-backed integration tier in this environment.

## Consequences

- The dual-runner setup remains until a dedicated migration pass can run and
  verify the integration tier against a real database.
- New tests should be written in **Vitest** (`import { ... } from 'vitest'`).
  Do not add new `@jest/globals` imports.
- Future full migration (tracked, not scheduled here) would:
  1. Convert the 2 Jest-API test files and 2 mock modules to Vitest (`vi.*`).
  2. Replace the `jest` global shim with Vitest's `vi` across the ~10 Vitest
     tests that use jest-compatible globals.
  3. Port `test:integration` / `coverage:check` to a Vitest config with a real
     DB, and verify the integration suite passes.
  4. Remove `jest.*` config files and `jest.setup.js`; prune Jest
     devDependencies (`jest`, `@jest/*`, `jest-environment-jsdom`,
     `eslint-plugin-jest`, `@types/jest`, etc.).
  5. Update `.github/AUDIT_CI_CHECKLIST_SCORE.md` and any scripts referencing
     `jest`.
