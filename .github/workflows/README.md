# GitHub Workflows

Clean and simplified CI/CD workflow structure for MemoLib.

## Active Workflows

### `ci.yml` - Continuous Integration
- **Trigger**: Push to `main` + Pull Requests to `main`
- **What it does**:
  - Linting (ESLint)
  - Type checking (TypeScript)
  - Testing (Jest)
  - Building (Next.js)
- **Path filtering**: Only runs on code changes (`src/**`, package files, workflow changes)
- **Optimization**: Skips non-code changes (docs, markdown, txt files)

### `deploy-preview.yml` - Preview Deployment
- **Trigger**: Pull Requests (opened, synchronized, reopened) to `main` or `develop`
- **What it does**: Deploys a preview environment for PR testing
- **Concurrency**: Cancels previous preview deployments for the same PR
- **Path filtering**: Only runs on code changes

### `release.yml` - Release Management
- **Trigger**: Manual workflow dispatch or specific events
- **What it does**: Creates releases and tags
- **Dependencies**: Runs after CI passes

## Deleted Workflows (2025-02-01)

These workflows were archived due to redundancy:
- `ci-optimized.yml` → merged into `ci.yml`
- `deploy-multi.yml` → archived (was already marked as disabled)
- `deploy-optimized.yml` → replaced by `deploy-preview.yml`

## Dependabot Configuration

Defined in `../.github/dependabot.yml`:
- **npm**: Weekly updates (Mondays 9:00 AM CET)
- **pip**: Weekly updates (Mondays 9:00 AM CET) - **[ADDED]**
- **github-actions**: Weekly updates (Mondays 9:00 AM CET)

### Changes Made:
1. Added Python (`pip`) ecosystem for backend dependencies
2. Removed invalid `versioning-strategy` option (npm-only)
3. Reorganized labels for better grouping: `npm`, `python`, `ci`
4. Reduced PR limits: npm=8, pip=5, gh-actions=5
5. Improved commit message prefixes: `chore(deps-npm)`, `chore(deps-python)`, `chore(ci)`

## Running Workflows Locally

Use GitHub CLI to test workflows:
```bash
# Validate workflow syntax
gh workflow view ci.yml

# Check workflow runs
gh run list --workflow ci.yml

# View specific run details
gh run view <RUN_ID> --log
```

## Adding a New Workflow

1. Create file in `.github/workflows/`
2. Use `.yml` extension
3. Follow naming convention: `feature-name.yml`
4. Include proper triggers and concurrency settings
5. Test with GitHub CLI before merging
