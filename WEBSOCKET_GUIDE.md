# WebSocket Real-Time Notification System

## 📡 Overview

This guide documents the complete WebSocket notification system built with Socket.IO for real-time updates.

**Features:**
- ✅ Real-time email arrival notifications
- ✅ Dossier update alerts
- ✅ Critical deadline warnings
- ✅ System-wide announcements
- ✅ Browser push notifications
- ✅ Multi-tenant room isolation
- ✅ NextAuth authentication

---

## 🏗️ Architecture

### Components

1. **Server** (`src/lib/websocket.ts`)
   - Socket.IO server initialization
   - NextAuth authentication middleware
   - Room-based broadcasting
   - Event handlers

2. **Client Hook** (`src/hooks/useWebSocket.ts`)
   - React hook for WebSocket connection
   - Auto-connect/reconnect logic
   - State management
   - Browser Notifications API

3. **UI Component** (`src/components/NotificationCenter.tsx`)
   - Notification bell with badge
   - Dropdown panel with tabs
   - Real-time updates
   - Mark as read functionality

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install socket.io socket.io-client @types/socket.io
```

### 2. Initialize WebSocket Server

Create a custom Next.js server or API route to initialize Socket.IO:

**Option A: Custom Server (server.js)**

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeWebSocket } = require('./src/lib/websocket')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize WebSocket
  initializeWebSocket(server)

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log('> WebSocket server initialized')
  })
})
```

**Option B: API Route (src/app/api/socket/route.ts)**

```typescript
import { initializeWebSocket } from '@/lib/websocket'
import { NextRequest } from 'next/server'

// This is a placeholder - Next.js doesn't natively support WebSocket in App Router
// Use Custom Server approach instead
```

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

---

## 📝 Usage Examples

### Client-Side: Using the Hook

```tsx
'use client'

import { useWebSocket } from '@/hooks/useWebSocket'

export function MyComponent() {
  const {
    connected,
    connecting,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    requestNotificationPermission,
  } = useWebSocket({
    autoConnect: true,
    reconnect: true,
    reconnectDelay: 3000,
    debug: true,
  })

  // Request browser notification permission
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  return (
    <div>
      <h3>Connection: {connected ? '🟢 Connected' : '🔴 Disconnected'}</h3>
      <p>Unread: {unreadCount}</p>
      
      <h4>Recent Emails ({notifications.emails.length})</h4>
      <ul>
        {notifications.emails.map(email => (
          <li key={email.id}>
            {email.subject} - {email.from}
            <button onClick={() => markAsRead(email.id)}>Mark Read</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Server-Side: Sending Notifications

```typescript
import { 
  notifyEmailReceived, 
  notifyDossierUpdated, 
  notifyDeadlineAlert, 
  notifySystem 
} from '@/lib/websocket'

// Example: Email monitoring script
async function handleNewEmail(email) {
  // Save email to database
  await prisma.email.create({ data: email })
  
  // Notify user via WebSocket
  notifyEmailReceived({
    id: email.id,
    subject: email.subject,
    from: email.from,
    dossierNumber: email.dossierNumber,
    userId: email.userId,
    tenantId: email.tenantId,
    timestamp: new Date(),
  })
}

// Example: Dossier update
async function updateDossier(dossierId, updates) {
  const dossier = await prisma.dossier.update({
    where: { id: dossierId },
    data: updates,
  })
  
  notifyDossierUpdated({
    id: dossier.id,
    dossierNumber: dossier.numero,
    dossierTitle: `${dossier.client.nom} - ${dossier.type}`,
    action: 'updated',
    userId: dossier.avocat.id,
    tenantId: dossier.tenantId,
    timestamp: new Date(),
  })
}

// Example: Deadline alert
async function checkDeadlines() {
  const urgentDossiers = await prisma.dossier.findMany({
    where: {
      delaiCritique: {
        lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      }
    }
  })
  
  urgentDossiers.forEach(dossier => {
    const daysRemaining = Math.ceil(
      (dossier.delaiCritique.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    )
    
    notifyDeadlineAlert({
      id: `deadline-${dossier.id}`,
      dossierNumber: dossier.numero,
      message: `Délai critique dans ${daysRemaining} jours`,
      urgency: daysRemaining <= 1 ? 'critical' : 'urgent',
      deadlineType: dossier.type,
      remainingDays: daysRemaining,
      userId: dossier.avocat.id,
      tenantId: dossier.tenantId,
      timestamp: new Date(),
    })
  })
}
```

---

## 🎨 Notification Types

### 1. Email Received

```typescript
interface EmailNotification {
  id: string
  subject: string
  from: string
  dossierNumber?: string
  userId: string
  tenantId: string
  timestamp: Date
}
```

**Event:** `email-received`

**Trigger:** When new email arrives and is classified

**UI Display:**
- Blue envelope icon
- Subject line
- From address
- Dossier number (if linked)

---

### 2. Dossier Updated

```typescript
interface DossierNotification {
  id: string
  dossierNumber: string
  dossierTitle: string
  action: 'created' | 'updated' | 'status_changed' | 'document_added'
  status?: string
  userId: string
  tenantId: string
  timestamp: Date
}
```

**Event:** `dossier-updated`

**Trigger:** When dossier is created, updated, or status changes

**UI Display:**
- Green briefcase icon
- Dossier title
- Action type (created/updated/etc.)
- Dossier number link

---

### 3. Deadline Alert

```typescript
interface DeadlineAlert {
  id: string
  dossierNumber: string
  message: string
  urgency: 'critical' | 'urgent' | 'warning' | 'info'
  deadlineType: string
  remainingDays: number
  userId: string
  tenantId: string
  timestamp: Date
}
```

**Event:** `deadline-alert`

**Trigger:** When deadline approaches (daily cron check)

**UI Display:**
- Red/orange/yellow alert icon (based on urgency)
- Warning message
- Days remaining
- Deadline type

**Browser Notification:** Critical alerts (`urgency: 'critical'`) show browser push notification with `requireInteraction: true`

---

### 4. System Notification

```typescript
interface SystemNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  userId?: string
  tenantId?: string
  timestamp: Date
}
```

**Event:** `system-notification`

**Trigger:** System-wide announcements, maintenance, errors

**UI Display:**
- Purple info icon
- Title + message
- Type-based styling

---

## 🔐 Authentication

WebSocket connections are authenticated using NextAuth sessions:

```typescript
// Server-side middleware
io.use(async (socket, next) => {
  const session = await getServerSession(authOptions) as Session | null
  
  if (!session?.user) {
    return next(new Error('Unauthorized'))
  }
  
  // Attach user data to socket
  socket.data.userId = (session.user as any).id
  socket.data.tenantId = (session.user as any).tenantId
  socket.data.role = (session.user as any).role
  
  next()
})
```

**Security Features:**
- Session-based authentication
- Automatic user/tenant isolation via rooms
- Role-based access control ready

---

## 🏠 Room Architecture

### Tenant Rooms
- **Room ID:** `tenant:${tenantId}`
- **Purpose:** Broadcast to all users in a cabinet
- **Auto-join:** Users join their tenant room on connection
- **Use Cases:** System announcements, tenant-wide alerts

### User Rooms
- **Room ID:** `user:${userId}`
- **Purpose:** Send notifications to specific user
- **Auto-join:** Users join their personal room on connection
- **Use Cases:** Personal emails, assigned dossiers, deadlines

### Broadcast Examples

```typescript
// Send to specific user
emitToUser(userId, 'email-received', emailData)

// Broadcast to all users in a tenant
emitToTenant(tenantId, 'system-notification', {
  title: 'Maintenance',
  message: 'Scheduled maintenance at 2am',
  type: 'warning'
})

// Broadcast to everyone
emitToAll('system-notification', {
  title: 'Platform Update',
  message: 'New features available!',
  type: 'success'
})
```

---

## 🔔 Browser Notifications

### Requesting Permission

```typescript
import { useWebSocket } from '@/hooks/useWebSocket'

function App() {
  const { requestNotificationPermission } = useWebSocket()
  
  useEffect(() => {
    // Request on first load
    requestNotificationPermission()
  }, [])
}
```

### Automatic Notifications

The hook automatically shows browser notifications for:
- **Emails:** New email arrivals
- **Critical Deadlines:** When `urgency === 'critical'`
- **System Errors:** When `type === 'error'`

**Example:**
```javascript
// Critical deadline triggers browser notification
notifyDeadlineAlert({
  urgency: 'critical',
  message: 'OQTF délai expire demain!',
  // ... other fields
})

// User sees:
// ⚠️ Délai critique
// OQTF délai expire demain!
// [requireInteraction: true - stays visible]
```

---

## 📊 Connection States

### Hook States

```typescript
const {
  connected,    // boolean - Currently connected
  connecting,   // boolean - Connection in progress
  error,        // string | null - Connection error message
  clientsCount, // number - Total connected clients
} = useWebSocket()
```

### UI Indicators

**Status Badge (top-right of bell icon):**
- 🟢 Green dot → Connected
- 🟡 Pulsing yellow → Connecting
- 🔴 Red dot → Disconnected

**Connection Status Label:**
- "En direct" (green) → Connected
- "Connexion..." (yellow) → Connecting
- "Déconnecté" (red) → Disconnected

---

## 🔄 Auto-Reconnect

Automatic reconnection is enabled by default:

```typescript
useWebSocket({
  autoConnect: true,      // Connect on mount
  reconnect: true,        // Auto-reconnect on disconnect
  reconnectDelay: 3000,   // Wait 3s before reconnect
})
```

**Reconnect Triggers:**
- Server disconnect
- Network failure
- Connection timeout

**Reconnect Flow:**
1. Detect disconnect
2. Wait `reconnectDelay` milliseconds
3. Attempt reconnection
4. On success: re-join tenant/user rooms
5. On failure: retry after delay

---

## 🧪 Testing

### Manual Testing

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Open Multiple Browser Tabs:**
   - Login as different users
   - Observe real-time sync

3. **Trigger Notifications:**
   - Send test email → Check email notification
   - Update dossier → Check dossier notification
   - Run deadline check → Check deadline alerts

### Integration with Email Monitor

**File:** `scripts/email-monitor.ts`

```typescript
import { notifyEmailReceived } from '@/lib/websocket'

async function processEmail(email) {
  // ... classification logic ...
  
  const savedEmail = await prisma.email.create({
    data: {
      objet: email.subject,
      expediteur: email.from,
      // ... other fields
    }
  })
  
  // Send WebSocket notification
  notifyEmailReceived({
    id: savedEmail.id,
    subject: savedEmail.objet,
    from: savedEmail.expediteur,
    dossierNumber: savedEmail.dossier?.numero,
    userId: savedEmail.userId,
    tenantId: savedEmail.tenantId,
    timestamp: new Date(),
  })
  
  console.log('✅ Email notification sent via WebSocket')
}
```

---

## 🎯 Integration Checklist

- [x] WebSocket server module created (`src/lib/websocket.ts`)
- [x] React hook created (`src/hooks/useWebSocket.ts`)
- [x] Notification UI component created (`src/components/NotificationCenter.tsx`)
- [x] Added to layout (`src/app/layout.tsx`)
- [x] socket.io-client installed
- [ ] Custom Next.js server setup (`server.js`)
- [ ] Email monitor integration
- [ ] Dossier API route integration
- [ ] Deadline cron job integration
- [ ] Production deployment configuration

---

## 🚧 Remaining Work

### 1. HTTP Server Setup (CRITICAL)
**Priority:** HIGH  
**Time:** 30 minutes

Create `server.js` in project root:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeWebSocket } = require('./src/lib/websocket')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  })

  initializeWebSocket(server)

  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
    console.log('> WebSocket server active')
  })
})
```

Update `package.json`:
```json
{
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js"
  }
}
```

### 2. Email Monitor Integration
**Priority:** HIGH  
**Time:** 15 minutes

Add to `scripts/email-monitor.ts`:

```typescript
import { notifyEmailReceived } from '@/lib/websocket'

// After saving email to database:
notifyEmailReceived({
  id: email.id,
  subject: email.objet,
  from: email.expediteur,
  dossierNumber: email.dossier?.numero,
  userId: email.userId,
  tenantId: email.tenantId,
  timestamp: new Date(),
})
```

### 3. Dossier API Integration
**Priority:** MEDIUM  
**Time:** 30 minutes

Add to dossier routes:
- `src/app/api/tenant/[id]/dossiers/route.ts` (create)
- `src/app/api/tenant/[id]/dossiers/[dossierId]/route.ts` (update)

```typescript
import { notifyDossierUpdated } from '@/lib/websocket'

// After creating/updating dossier:
notifyDossierUpdated({
  id: dossier.id,
  dossierNumber: dossier.numero,
  dossierTitle: `${dossier.client.nom} - ${dossier.type}`,
  action: 'created', // or 'updated'
  userId: dossier.avocatId,
  tenantId: dossier.tenantId,
  timestamp: new Date(),
})
```

### 4. Deadline Cron Job
**Priority:** MEDIUM  
**Time:** 45 minutes

Create `scripts/deadline-checker.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { notifyDeadlineAlert } from '@/lib/websocket'

const prisma = new PrismaClient()

async function checkDeadlines() {
  const today = new Date()
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
  
  const urgentDossiers = await prisma.dossier.findMany({
    where: {
      delaiCritique: {
        lte: threeDaysFromNow,
        gte: today
      },
      statut: { notIn: ['FERME', 'ANNULE'] }
    },
    include: {
      avocat: true
    }
  })
  
  for (const dossier of urgentDossiers) {
    const daysRemaining = Math.ceil(
      (dossier.delaiCritique.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    )
    
    notifyDeadlineAlert({
      id: `deadline-${dossier.id}-${today.toISOString()}`,
      dossierNumber: dossier.numero,
      message: `⚠️ Délai ${dossier.type} expire dans ${daysRemaining} jour(s)`,
      urgency: daysRemaining <= 1 ? 'critical' : daysRemaining <= 2 ? 'urgent' : 'warning',
      deadlineType: dossier.type,
      remainingDays: daysRemaining,
      userId: dossier.avocatId,
      tenantId: dossier.tenantId,
      timestamp: new Date(),
    })
  }
  
  console.log(`✅ Checked ${urgentDossiers.length} urgent deadlines`)
}

checkDeadlines().catch(console.error).finally(() => prisma.$disconnect())
```

Add cron job (Linux/Mac `crontab -e`):
```
0 9 * * * cd /path/to/project && node scripts/deadline-checker.ts
```

Or Windows Task Scheduler:
```powershell
schtasks /create /tn "Deadline Checker" /tr "node C:\path\to\project\scripts\deadline-checker.ts" /sc daily /st 09:00
```

---

## 🌐 Production Deployment

### Environment Variables

Add to `.env.production`:

```bash
# WebSocket Configuration
WEBSOCKET_ENABLED=true
WEBSOCKET_PATH=/api/socket
WEBSOCKET_CORS_ORIGIN=https://yourdomain.com

# Next.js
NODE_ENV=production
```

### Cloudflare Pages

**Note:** Cloudflare Pages doesn't support WebSocket directly. Use Cloudflare Workers + Durable Objects instead.

**Alternative:** Deploy to:
- **Render.com:** Full WebSocket support
- **Railway.app:** Full WebSocket support
- **Vercel:** Limited (use Pusher/Ably instead)

### Render.com Deployment

`render.yaml`:
```yaml
services:
  - type: web
    name: iapostemanager
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** "Disconnected" status, red badge

**Solutions:**
1. Check server is running with WebSocket initialized
2. Verify `server.js` is being used (not `next dev`)
3. Check browser console for errors
4. Verify NextAuth session exists

```bash
# Check if WebSocket server is running
curl -I http://localhost:3000/socket.io/
# Should return HTTP 400 (expected for GET request)
```

---

### No Notifications Appearing

**Problem:** Connected but no notifications show

**Solutions:**
1. Verify notification helper called: `notifyEmailReceived()`, etc.
2. Check user/tenant IDs match session
3. Check browser console for event logs (enable debug mode)
4. Verify user is in correct tenant room

```typescript
// Enable debug mode
useWebSocket({ debug: true })

// Check console for:
// [WebSocket] Connected
// [WebSocket] Joined tenant: xxx
// [WebSocket] Email received: {...}
```

---

### Browser Notifications Not Showing

**Problem:** Critical alerts don't trigger browser notification

**Solutions:**
1. Check permission: `Notification.permission === 'granted'`
2. Manually grant permission in browser settings
3. Call `requestNotificationPermission()` on mount
4. Test with simple notification:

```javascript
new Notification('Test', {
  body: 'This is a test',
  requireInteraction: true
})
```

---

### TypeScript Errors

**Problem:** Socket.IO type errors

**Solutions:**
1. Install types: `npm install --save-dev @types/socket.io`
2. Cast session: `(session.user as any).id`
3. Add type assertions where needed

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Next.js Custom Server](https://nextjs.org/docs/advanced-features/custom-server)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [NextAuth Session Management](https://next-auth.js.org/getting-started/client#usesession)

---

## 📝 Changelog

### v1.0.0 (2026-01-07)
- ✅ Initial WebSocket server implementation
- ✅ React hook with auto-reconnect
- ✅ NotificationCenter UI component
- ✅ Browser Notifications API integration
- ✅ 4 notification types (email, dossier, deadline, system)
- ✅ Room-based multi-tenant architecture
- ✅ NextAuth authentication

---

**Status:** ✅ Infrastructure Complete | ⏳ Integration Pending

**Next Steps:**
1. Create custom server (`server.js`)
2. Integrate email monitor
3. Integrate dossier APIs
4. Deploy deadline cron job
5. Production deployment

---

**Author:** IA Poste Manager Team  
**Last Updated:** 2026-01-07  
**Version:** 1.0.0
