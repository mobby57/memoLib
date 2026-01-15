# IA Poste Manager - AI Coding Agent Instructions

## Project Overview

IA Poste Manager is a **multi-tenant SaaS legal assistant** for French immigration law (CESEDA). It features a 3-tier architecture:
- **Tier 1: Super Admin** - Platform owner managing law firm tenants
- **Tier 2: Admin/Lawyer** - Law firms managing their client cases  
- **Tier 3: Client** - End users viewing their own legal cases

## Architecture Fundamentals

### Stack
- **Next.js 16** (App Router) with React 19 and TypeScript
- **Prisma ORM** with SQLite (optimized with WAL mode, see [src/lib/prisma.ts](../src/lib/prisma.ts))
- **NextAuth** for multi-level authentication
- **Ollama** for local AI (llama3.2:3b model)
- **Socket.io** for real-time notifications
- **Tailwind CSS** for styling

### Path Aliases
Always use `@/` imports:
- `@/lib/*` - Core utilities (prisma, logger, websocket)
- `@/components/*` - React components
- `@/types/*` - TypeScript definitions
- `@/middleware/*` - Security and auth middleware

### Multi-Tenant Isolation
Every database query MUST filter by `tenantId` to ensure data isolation. The schema enforces this in [prisma/schema.prisma](../prisma/schema.prisma). Sessions contain `user.tenantId` - always validate access.

## Critical Development Patterns

### Authentication Flow
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
// session.user.role: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT'
// session.user.tenantId: string
```

### Database Access
```typescript
import { prisma } from '@/lib/prisma';

// ALWAYS filter by tenantId for tenant-scoped operations
const dossiers = await prisma.dossier.findMany({
  where: { 
    tenantId: session.user.tenantId,
    // ... other filters
  }
});
```

The Prisma client in [src/lib/prisma.ts](../src/lib/prisma.ts) includes:
- Auto-optimized SQLite with WAL mode
- Soft delete middleware
- Query performance logging (dev mode)
- Metrics collection

### Logging System
```typescript
import { logger, logDossierAction, logIAUsage } from '@/lib/logger';

// RGPD-compliant logging - automatically anonymizes sensitive data
logger.info('Action performed', { 
  userId, 
  tenantId, 
  dossierId,
  actionJuridique: 'CREATE_DOSSIER' 
});
```

See [src/lib/logger.ts](../src/lib/logger.ts) for specialized logging functions.

### AI Integration (Ollama)
```typescript
import { OllamaClient } from '@/lib/ai/ollama-client';

const ai = new OllamaClient();
if (await ai.isAvailable()) {
  const result = await ai.generate(prompt, systemPrompt);
}
```

Ollama runs locally at `http://localhost:11434`. Always check availability before use and provide fallbacks.

## Development Workflows

### Starting Development
Use PowerShell scripts in project root:
- `.\start.ps1` - Auto-check environment, install deps, start dev server
- `.\build.ps1` - Production build with validation
- `.\test-all.ps1` - Run all tests

Or npm scripts:
```bash
npm run dev          # Start dev server with Turbo
npm run db:studio    # Open Prisma Studio GUI
npm run email:monitor # Start email monitoring
```

### Database Operations
```bash
npx prisma generate           # Generate client after schema changes
npx prisma db push            # Push schema changes (dev)
npm run db:seed:complete      # Seed with test data (3 law firms)
```

Test tenants: `cabinet-dupont`, `cabinet-martin`, `cabinet-rousseau`

### Environment Variables
See [.env.local.example](../.env.local.example):
- `DATABASE_URL` - SQLite file path
- `NEXTAUTH_SECRET` - Session encryption key
- `OLLAMA_BASE_URL` - Local AI endpoint
- `GMAIL_*` - Email monitoring credentials (optional)

## Project-Specific Conventions

### Email Processing
The system monitors Gmail for legal emails with AI classification. See [EMAIL_SYSTEM_COMPLETE.md](../EMAIL_SYSTEM_COMPLETE.md):
- Auto-classifies: `nouveau_client`, `ceseda`, `urgent`, `laposte_notification`
- Extracts deadlines, tracking numbers, phone numbers
- Creates workspaces and client records automatically

Scripts in [scripts/](../scripts/):
- `email-monitor.ts` - Main monitoring loop
- `email-to-workspace-ai.ts` - AI-powered workspace creation

### CESEDA Legal Domain
Types of cases (dossiers):
- **OQTF** (Obligation de Quitter le Territoire Français) - CRITICAL priority
- **Naturalisation** - Citizenship applications
- **Asile politique** - Political asylum
- **Carte de résident** - Residence permits

Priority levels: `critique` > `haute` > `normale` > `faible`

### Security & Compliance
Zero-trust architecture with RGPD compliance:
- All actions logged to immutable audit trail
- Documents versioned with SHA-256 hashing
- AI processes anonymized data only
- Session timeout with [src/components/SessionTimeoutManager.tsx](../src/components/SessionTimeoutManager.tsx)

See [docs/SECURITE_CONFORMITE.md](../docs/SECURITE_CONFORMITE.md).

### Smart Forms System
Dynamic forms with AI suggestions ([SMART_FORMS_IMPLEMENTATION_COMPLETE.md](../SMART_FORMS_IMPLEMENTATION_COMPLETE.md)):
- Auto-calculate impact scores
- Multi-level approval workflows
- Real-time risk assessment
- Ollama integration for contextual help

### WebSocket Real-Time Updates
```typescript
import { initWebSocket } from '@/lib/websocket';

// Client-side
const socket = initWebSocket();
socket.on('email-received', (data: EmailNotification) => { /* ... */ });
socket.on('deadline-alert', (data: DeadlineAlert) => { /* ... */ });
```

Events: `email-received`, `dossier-updated`, `deadline-alert`, `system-notification`

## Code Quality Standards

### Testing
```bash
npm test             # Jest with coverage
npm run test:watch   # Watch mode
```

Tests in [src/__tests__/](../src/__tests__/) organized by type: `lib/`, `components/`, `api/`, `services/`

### Type Safety
- Enable strict mode (already configured in [tsconfig.json](../tsconfig.json))
- Use types from `@/types/index.ts` for domain models
- Prisma generates types automatically - don't duplicate

### Component Structure
- Server components by default (Next.js 16 App Router)
- Use `'use client'` only when needed (hooks, interactivity)
- Organize by feature: [src/components/dossiers/](../src/components/dossiers/), [src/components/dashboards/](../src/components/dashboards/)

## Common Pitfalls

1. **Missing tenant isolation** - Always filter by `tenantId` in database queries
2. **Hardcoding URLs** - Use `process.env.NEXTAUTH_URL` or dynamic base URLs
3. **Blocking AI calls** - Always check `ai.isAvailable()` and provide fallbacks
4. **Ignoring RGPD** - Use `logger` functions, never `console.log` sensitive data
5. **SQLite locking** - WAL mode is configured; avoid concurrent writes from multiple processes

## Key Files Reference

- [prisma/schema.prisma](../prisma/schema.prisma) - Complete database schema with 50+ models
- [src/lib/prisma.ts](../src/lib/prisma.ts) - Enhanced Prisma client with optimizations
- [src/lib/logger.ts](../src/lib/logger.ts) - RGPD-compliant logging system
- [src/lib/websocket.ts](../src/lib/websocket.ts) - Real-time notification server
- [lib/ai/ollama-client.ts](../lib/ai/ollama-client.ts) - Local AI client
- [src/types/index.ts](../src/types/index.ts) - Core TypeScript definitions
- [README.md](../README.md) - Comprehensive project overview with 3-tier architecture

## Additional Context

- **Language**: French UI for French legal professionals
- **Deployment**: Docker-ready ([Dockerfile](../Dockerfile), [docker-compose.yml](../docker-compose.yml))
- **CI/CD**: GitHub Actions workflows in [.github/workflows/](../workflows/)
- **Documentation**: Extensive MD files in root cover specific features (PRISMA_EXPERT_GUIDE.md, EMAIL_SYSTEM_COMPLETE.md, etc.)

When in doubt about architectural decisions, refer to extensive markdown documentation in project root or ask clarifying questions before implementing.
