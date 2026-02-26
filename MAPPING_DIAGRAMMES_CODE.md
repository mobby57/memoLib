# 🗺️ Mapping Diagrammes → Code Source

## 📊 Architecture Globale → Code

### 👥 Utilisateurs
```
Diagramme: SA[🦸 SuperAdmin], AV[👨⚖️ Avocat], CL[👤 Client]
```
**Code:**
- `prisma/schema.prisma` → Model `User` avec enum `Role`
- `src/types/user.ts` → Types TypeScript
- `src/middleware.ts` → Vérification rôles

### 🌐 Frontend Pages
```
Diagramme: AUTH, DASH_SA, DASH_AV, DASH_CL
```
**Code:**
- `src/app/auth/login/page.tsx` → Page login
- `src/app/super-admin/dashboard/page.tsx` → Dashboard SuperAdmin
- `src/app/admin/dashboard/page.tsx` → Dashboard Avocat
- `src/app/client-dashboard/page.tsx` → Dashboard Client

### ⚙️ Backend API
```
Diagramme: API[🔌 API REST], WS[💬 WebSocket], CRON[⏰ Cron Jobs]
```
**Code:**
- `src/app/api/**/*.ts` → 200+ API routes
- `src/lib/websocket-service.ts` → WebSocket
- `src/app/api/cron/**/*.ts` → Cron jobs

### 💾 Base de Données
```
Diagramme: PG[(PostgreSQL)], REDIS[(Redis)]
```
**Code:**
- `prisma/schema.prisma` → Schéma complet
- `src/lib/prisma.ts` → Client Prisma
- `src/lib/redis.ts` → Client Redis (Upstash)

### 🔧 Services Externes
```
Diagramme: STRIPE, GMAIL, SENTRY, AZURE
```
**Code:**
- `src/lib/stripe.ts` → Stripe SDK
- `src/lib/email/gmail-monitor.ts` → Gmail API
- `sentry.client.config.ts` → Sentry client
- `src/lib/azure-storage.ts` → Azure Blob

---

## 👥 Hiérarchie Rôles → Code

### Enum Rôles
```typescript
// prisma/schema.prisma
enum Role {
  SUPER_ADMIN    // 🦸 SuperAdmin
  LAWYER         // 👨⚖️ Avocat Principal
  USER           // 👤 Client
  COLLABORATOR   // 👔 Collaborateur
}
```

### Middleware Permissions
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const role = getUserRole(request);
  
  if (path.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
    return redirect('/unauthorized');
  }
  
  if (path.startsWith('/admin') && !['LAWYER', 'SUPER_ADMIN'].includes(role)) {
    return redirect('/unauthorized');
  }
  
  if (path.startsWith('/client') && role !== 'USER') {
    return redirect('/unauthorized');
  }
}
```

---

## 📋 Flux Gestion Dossier → Code

### 1. Créer Dossier
```
Diagramme: A->>S: ➕ Créer dossier
```
**Code:**
```typescript
// src/app/api/dossiers/route.ts
export async function POST(req: Request) {
  const data = await req.json();
  
  const dossier = await prisma.dossier.create({
    data: {
      ...data,
      caseNumber: generateCaseNumber(), // 🔢 Générer numéro
      lawyerId: session.user.id,
    }
  });
  
  return NextResponse.json(dossier);
}
```

### 2. Invitation Client
```
Diagramme: S->>C: 📧 Invitation client
```
**Code:**
```typescript
// src/lib/email/email-service.ts
export async function sendClientInvitation(email: string, dossierId: string) {
  await sendEmail({
    to: email,
    subject: 'Invitation - Nouveau dossier',
    html: emailTemplates.clientInvitation({ dossierId })
  });
}
```

### 3. Upload Documents
```
Diagramme: A->>S: 📄 Upload documents
```
**Code:**
```typescript
// src/app/api/documents/upload/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Upload vers Azure Blob
  const url = await uploadToAzure(file);
  
  // Sauvegarder en DB
  const document = await prisma.document.create({
    data: {
      title: file.name,
      fileUrl: url,
      caseId: formData.get('caseId'),
      uploadedBy: session.user.id
    }
  });
  
  return NextResponse.json(document);
}
```

### 4. Créer Facture
```
Diagramme: A->>S: 💰 Créer facture
```
**Code:**
```typescript
// src/app/api/factures/route.ts
export async function POST(req: Request) {
  const data = await req.json();
  
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      caseId: data.caseId,
      amount: data.amount,
      status: 'PENDING',
      dueDate: addDays(new Date(), 30)
    }
  });
  
  // Envoyer email
  await sendInvoiceEmail(invoice);
  
  return NextResponse.json(invoice);
}
```

### 5. Paiement
```
Diagramme: C->>S: 💳 Paiement
```
**Code:**
```typescript
// src/app/api/payments/create-checkout/route.ts
export async function POST(req: Request) {
  const { invoiceId } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: invoice.stripePrice, quantity: 1 }],
    mode: 'payment',
    success_url: `${baseUrl}/factures/${invoiceId}?success=true`,
    cancel_url: `${baseUrl}/factures/${invoiceId}?canceled=true`,
  });
  
  return NextResponse.json({ url: session.url });
}
```

---

## 🗄️ Modèle de Données → Code

### Schema Prisma Complet
```prisma
// prisma/schema.prisma

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  fullName      String   @map("full_name")
  role          Role
  twoFaEnabled  Boolean  @default(false) @map("2fa_enabled")
  createdAt     DateTime @default(now()) @map("created_at")
  
  lawyer        Lawyer?
  client        Client?
  messages      Message[]
  tasks         Task[]    @relation("AssignedTasks")
}

model Lawyer {
  userId         String  @id @map("user_id")
  barNumber      String  @map("bar_number")
  specialization String
  hourlyRate     Decimal @map("hourly_rate")
  
  user           User    @relation(fields: [userId], references: [id])
  cases          Case[]
}

model Client {
  userId        String  @id @map("user_id")
  siret         String?
  address       String?
  rgpdAccepted  Boolean @default(false) @map("rgpd_accepted")
  
  user          User    @relation(fields: [userId], references: [id])
  cases         Case[]
}

model Case {
  id            String   @id @default(uuid())
  caseNumber    String   @unique @map("case_number")
  lawyerId      String   @map("lawyer_id")
  clientId      String   @map("client_id")
  type          CaseType
  status        CaseStatus
  amount        Decimal?
  deadline      DateTime?
  createdAt     DateTime @default(now()) @map("created_at")
  
  lawyer        Lawyer     @relation(fields: [lawyerId], references: [userId])
  client        Client     @relation(fields: [clientId], references: [userId])
  documents     Document[]
  messages      Message[]
  invoices      Invoice[]
  tasks         Task[]
  events        Event[]
}

model Document {
  id          String   @id @default(uuid())
  caseId      String   @map("case_id")
  title       String
  fileUrl     String   @map("file_url")
  category    DocCategory
  visibility  Visibility
  version     Int      @default(1)
  
  case        Case     @relation(fields: [caseId], references: [id])
}

model Message {
  id        String   @id @default(uuid())
  caseId    String   @map("case_id")
  senderId  String   @map("sender_id")
  content   String   @db.Text
  sentAt    DateTime @default(now()) @map("sent_at")
  
  case      Case     @relation(fields: [caseId], references: [id])
  sender    User     @relation(fields: [senderId], references: [id])
}

model Invoice {
  id            String   @id @default(uuid())
  caseId        String   @map("case_id")
  invoiceNumber String   @unique @map("invoice_number")
  amount        Decimal
  status        InvoiceStatus
  dueDate       DateTime @map("due_date")
  
  case          Case     @relation(fields: [caseId], references: [id])
}

model Task {
  id          String   @id @default(uuid())
  caseId      String   @map("case_id")
  assignedTo  String   @map("assigned_to")
  title       String
  status      TaskStatus
  priority    Priority
  dueDate     DateTime @map("due_date")
  
  case        Case     @relation(fields: [caseId], references: [id])
  assignee    User     @relation("AssignedTasks", fields: [assignedTo], references: [id])
}

model Event {
  id        String   @id @default(uuid())
  caseId    String   @map("case_id")
  title     String
  startDate DateTime @map("start_date")
  endDate   DateTime @map("end_date")
  type      EventType
  
  case      Case     @relation(fields: [caseId], references: [id])
}
```

---

## 📱 Navigation Pages → Code

### Pages Publiques
```
HOME → src/app/page.tsx
LOGIN → src/app/auth/login/page.tsx
REGISTER → src/app/auth/register/page.tsx
```

### Pages Avocat
```
DASH_A → src/app/admin/dashboard/page.tsx
DOSS → src/app/admin/dossiers/page.tsx
CLI → src/app/admin/clients/page.tsx
DOCS → src/app/admin/documents/page.tsx
MSG → src/app/admin/messages/page.tsx
FACT → src/app/admin/billing/page.tsx
CAL → src/app/calendrier/page.tsx
TASK → src/app/admin/taches/page.tsx
ANAL → src/app/admin/analytics/page.tsx
```

### Pages Client
```
DASH_C → src/app/client-dashboard/page.tsx
MES_DOSS → src/app/client/dossiers/page.tsx
MES_DOCS → src/app/client/documents/page.tsx
MES_MSG → src/app/client/messages/page.tsx
MES_FACT → src/app/client/page.tsx (factures section)
PROFIL → src/app/client/profil/page.tsx
```

### Pages SuperAdmin
```
DASH_SA → src/app/super-admin/dashboard/page.tsx
USERS → src/app/super-admin/users/page.tsx
CABINETS → src/app/super-admin/cabinets/page.tsx
SUBS → src/app/super-admin/subscriptions/page.tsx
LOGS → src/app/super-admin/logs/page.tsx
SETTINGS → src/app/super-admin/settings/page.tsx
```

---

## 🔄 Flux Email → Code

### 1. Monitoring Gmail
```
Diagramme: CRON->>GMAIL: 📧 Récupérer emails
```
**Code:**
```typescript
// src/app/api/cron/check-emails/route.ts
export async function GET() {
  const emails = await gmailMonitor.fetchNewEmails();
  
  for (const email of emails) {
    await processEmail(email);
  }
}

// src/lib/email/gmail-monitor.ts
export async function fetchNewEmails() {
  const gmail = google.gmail({ version: 'v1', auth });
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
  });
  return response.data.messages;
}
```

### 2. Scoring IA
```
Diagramme: S->>IA: 🤖 Analyser email
```
**Code:**
```typescript
// src/lib/ai/email-scorer.ts
export async function scoreEmail(email: Email) {
  const prompt = `Analyser cet email juridique et donner un score de priorité (0-100):
  Sujet: ${email.subject}
  Contenu: ${email.body}`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return parseScore(response.choices[0].message.content);
}
```

### 3. Notification
```
Diagramme: S->>A: 🔔 Notifier avocat
```
**Code:**
```typescript
// src/lib/notifications/notification-service.ts
export async function notifyLawyer(lawyerId: string, email: Email) {
  // WebSocket
  await wsService.send(lawyerId, {
    type: 'NEW_EMAIL',
    data: email
  });
  
  // Email si urgent
  if (email.score > 80) {
    await sendEmail({
      to: lawyer.email,
      subject: '🚨 Email urgent',
      html: emailTemplates.urgentEmail(email)
    });
  }
}
```

---

## 🤖 Assistant IA → Code

### Recherche CESEDA
```
Diagramme: A->>IA: 🔍 Rechercher CESEDA
```
**Code:**
```typescript
// src/app/api/ai/ceseda/route.ts
export async function POST(req: Request) {
  const { query } = await req.json();
  
  const results = await vectorSearch(query, 'ceseda');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Tu es un expert du CESEDA' },
      { role: 'user', content: `${query}\n\nContexte: ${results}` }
    ]
  });
  
  return NextResponse.json({ answer: response.choices[0].message.content });
}
```

### Recherche Légifrance
```
Diagramme: A->>IA: ⚖️ Rechercher Légifrance
```
**Code:**
```typescript
// src/lib/ai/legifrance-service.ts
export async function searchLegifrance(query: string) {
  const response = await fetch('https://api.legifrance.gouv.fr/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LEGIFRANCE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  return response.json();
}
```

### Génération Documents
```
Diagramme: A->>IA: 📝 Générer document
```
**Code:**
```typescript
// src/app/api/ai/generate-document/route.ts
export async function POST(req: Request) {
  const { type, data } = await req.json();
  
  const template = await getTemplate(type);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Tu génères des documents juridiques' },
      { role: 'user', content: `Template: ${template}\nDonnées: ${JSON.stringify(data)}` }
    ]
  });
  
  const docx = await generateDocx(response.choices[0].message.content);
  
  return new Response(docx, {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  });
}
```

---

## 💳 Flux Paiement → Code

### Webhook Stripe
```
Diagramme: STRIPE->>S: ✅ Paiement confirmé
```
**Code:**
```typescript
// src/app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    await prisma.invoice.update({
      where: { id: session.metadata.invoiceId },
      data: { status: 'PAID', paidAt: new Date() }
    });
    
    await sendPaymentConfirmation(session.metadata.invoiceId);
  }
  
  return NextResponse.json({ received: true });
}
```

---

## 📊 Analytics → Code

### Métriques Dashboard
```
Diagramme: A->>S: 📈 Récupérer métriques
```
**Code:**
```typescript
// src/app/api/analytics/metrics/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';
  
  const metrics = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT c.id) as total_cases,
      COUNT(DISTINCT c.client_id) as total_clients,
      SUM(i.amount) as total_revenue,
      AVG(EXTRACT(EPOCH FROM (c.closed_at - c.created_at))/86400) as avg_case_duration
    FROM cases c
    LEFT JOIN invoices i ON i.case_id = c.id
    WHERE c.created_at >= NOW() - INTERVAL ${period}
  `;
  
  return NextResponse.json(metrics);
}
```

---

## 🔒 Sécurité & Audit → Code

### Event Log Immutable
```
Diagramme: S->>LOG: 📝 Enregistrer action
```
**Code:**
```typescript
// src/lib/audit/event-logger.ts
export async function logEvent(event: AuditEvent) {
  const previousHash = await getLastEventHash();
  
  const eventData = {
    ...event,
    timestamp: new Date(),
    previousHash,
    hash: generateHash({ ...event, previousHash })
  };
  
  await prisma.eventLog.create({ data: eventData });
}

// Vérification intégrité
export async function verifyAuditTrail() {
  const events = await prisma.eventLog.findMany({ orderBy: { timestamp: 'asc' } });
  
  for (let i = 1; i < events.length; i++) {
    const expectedHash = generateHash({
      ...events[i],
      previousHash: events[i-1].hash
    });
    
    if (events[i].hash !== expectedHash) {
      throw new Error(`Audit trail compromised at event ${events[i].id}`);
    }
  }
}
```

### Rate Limiting
```
Diagramme: S->>REDIS: 🚦 Vérifier limite
```
**Code:**
```typescript
// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

---

## 🔗 Liens Rapides

### Fichiers Clés
- **Schema DB:** `prisma/schema.prisma`
- **Types:** `src/types/*.ts`
- **API Routes:** `src/app/api/**/*.ts`
- **Services:** `src/lib/**/*.ts`
- **Middleware:** `src/middleware.ts`
- **Config:** `.env.local`, `next.config.js`

### Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [API Routes](docs/API_ROUTES.md)
- [Déploiement](docs/DEPLOYMENT_GUIDE.md)
- [RGPD](docs/CONFORMITE_RGPD_CHECKLIST.md)

---

**Dernière mise à jour:** Février 2026  
**Version:** 1.0.0src/app/super-admin/users/page.tsx
TENANTS → src/app/super-admin/tenants/page.tsx
PLANS → src/app/super-admin/plans/page.tsx
LOGS → src/app/admin/logs/page.tsx
SETTINGS → src/app/super-admin/settings/page.tsx
```

---

## 🔒 Sécurité → Code

### Authentification
```typescript
// src/app/api/auth/[...nextauth]/route.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) return null;
        
        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        
        if (!valid) return null;
        
        // Vérifier 2FA si activé
        if (user.twoFaEnabled) {
          const valid2FA = verifyTOTP(credentials.token, user.twoFaSecret);
          if (!valid2FA) return null;
        }
        
        return user;
      }
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })
  ]
};
```

### Chiffrement
```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Audit Trail
```typescript
// src/lib/services/event-log.service.ts
export const eventLogService = {
  async createEventLog(data: {
    eventType: EventType;
    entityType: string;
    entityId: string;
    actorType: ActorType;
    tenantId: string;
    metadata?: any;
  }) {
    return await prisma.eventLog.create({
      data: {
        ...data,
        timestamp: new Date(),
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
      }
    });
  }
};
```

---

## 📊 Stack Technologique → Code

### Frontend
```json
// package.json
{
  "dependencies": {
    "next": "^16.1.5",           // Next.js 16
    "react": "^19.0.0",          // React 19
    "typescript": "^5.9.3",      // TypeScript
    "tailwindcss": "^3.4.19",    // Tailwind CSS
    "@radix-ui/react-*": "^*"    // Shadcn/ui (Radix)
  }
}
```

### Backend
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
```

### Services
```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// src/lib/email/email-service.ts
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';
Sentry.init({ dsn: process.env.SENTRY_DSN });

// src/lib/email/gmail-monitor.ts
import { google } from 'googleapis';
const gmail = google.gmail('v1');
```

---

## 🎯 Résumé du Mapping

| Diagramme | Fichiers Code | Lignes |
|-----------|---------------|--------|
| Architecture Globale | 50+ fichiers | ~10,000 |
| Hiérarchie Rôles | `schema.prisma`, `middleware.ts` | ~500 |
| Flux Dossier | `api/dossiers/**/*.ts` | ~2,000 |
| Modèle Données | `prisma/schema.prisma` | ~1,500 |
| Navigation | `app/**/*page.tsx` | ~15,000 |
| Sécurité | `lib/auth/**/*.ts` | ~3,000 |
| Stack Tech | `package.json`, configs | ~200 |

**Total: ~32,000 lignes de code mappées!** 🎉
