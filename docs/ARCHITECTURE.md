# ===========================================

# ARCHITECTURE: ASSISTANT DE SECRÉTARIAT INTELLIGENT

# IAPosteManager

# ===========================================

# Version: 2.0 - Légalement Safe pour Clients Institutionnels

# ===========================================

## 🎯 VISION PRODUIT

**IAPosteManager** est un assistant de gestion de correspondance intelligent
conçu pour les cabinets d'avocats, notaires, et organisations institutionnelles.

### Positionnement

- ✅ **Assistant** de secrétariat (aide à la décision)
- ❌ **PAS** un remplaçant humain (décisions finales par l'utilisateur)
- ✅ **Suggestions** intelligentes
- ❌ **PAS** d'actions automatiques sur données sensibles

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technologique

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Pages     │  │ Components  │  │   Hooks     │         │
│  │  (App Dir)  │  │   (UI)      │  │  (Logic)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              API Routes (Server-Only)                  ││
│  │  • /api/auth/*     → NextAuth.js + Azure AD           ││
│  │  • /api/emails/*   → Gestion emails                   ││
│  │  • /api/ai/*       → IA (suggestions)                 ││
│  │  • /api/webhooks/* → Twilio, Microsoft Graph          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Python/Flask)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   API REST  │  │  Services   │  │   Models    │         │
│  │  Endpoints  │  │  (Business) │  │ (SQLAlchemy)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES EXTERNES                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Azure     │  │   Twilio    │  │ PostgreSQL  │         │
│  │  Key Vault  │  │  WhatsApp   │  │  Database   │         │
│  │  AD / SSO   │  │    SMS      │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Microsoft  │  │   OpenAI    │  │   Azure     │         │
│  │   Graph     │  │   / Llama   │  │   Blob      │         │
│  │  (Outlook)  │  │    (IA)     │  │  Storage    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 STRUCTURE DES DOSSIERS

```
memoLib/
├── .github/
│   └── workflows/
│       ├── ci-cd-optimized.yml    # Pipeline principal
│       └── security-scan.yml      # Scans de sécurité
├── .vscode/
│   ├── settings.json              # Configuration VS Code
│   ├── launch.json                # Debug configurations
│   ├── tasks.json                 # Tâches automatisées
│   └── extensions.json            # Extensions recommandées
├── docs/
│   ├── ARCHITECTURE.md            # Ce document
│   ├── SECURITY_CHECKLIST.md      # Checklist sécurité
│   └── API.md                     # Documentation API
├── src/
│   ├── frontend/                  # Next.js 14 App
│   │   ├── app/
│   │   │   ├── (auth)/           # Routes authentification
│   │   │   ├── (dashboard)/      # Routes dashboard
│   │   │   ├── api/              # API Routes
│   │   │   │   ├── auth/
│   │   │   │   ├── emails/
│   │   │   │   ├── ai/
│   │   │   │   └── webhooks/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/               # Composants réutilisables
│   │   │   ├── emails/           # Composants emails
│   │   │   └── dashboard/        # Composants dashboard
│   │   ├── lib/
│   │   │   ├── auth.ts           # Configuration auth
│   │   │   ├── db.ts             # Client base de données
│   │   │   └── api-client.ts     # Client API
│   │   ├── hooks/
│   │   ├── types/
│   │   └── styles/
│   └── backend/                   # Python/Flask
│       ├── app.py                # Point d'entrée
│       ├── config.py             # Configuration
│       ├── models/               # Modèles SQLAlchemy
│       ├── services/             # Logique métier
│       ├── routes/               # Endpoints API
│       └── utils/
├── tests/
│   ├── frontend/
│   └── backend/
├── .env.example                   # Template variables
├── .pre-commit-config.yaml       # Hooks pre-commit
├── memoLib.code-workspace # Workspace VS Code
└── README.md
```

---

## 🔐 SÉCURITÉ - CONFORMITÉ INSTITUTIONNELLE

### Flux middleware sécurité/auth (vue simplifiée)

```
Request HTTP
  |
  v
proxy.ts
  - headers sécurité
  - CSRF / rate-limit global
  - routage RBAC high-level
  |
  +--> middleware/zero-trust.ts
  |      - authentification
  |      - autorisation contextuelle
  |      - audit trail
  |
  +--> middleware/tenant-isolation.ts
  |      - isolement multi-tenant
  |
  +--> middleware/quota-check.ts
       - contrôle quotas plan
  |
  v
Route API (app/api/*)
  |
  v
Services (lib/*) + Prisma
```

### Responsabilités clés

- `src/proxy.ts` : point d’entrée middleware global, règles hiérarchiques et headers sécurité.
- `src/middleware/zero-trust.ts` : garde-fou authz/authn + journalisation des actions sensibles.
- `src/middleware/tenant-isolation.ts` : empêche l’accès cross-tenant hors rôle autorisé.
- `src/middleware/quota-check.ts` : bloque les créations quand le quota est dépassé.
- `src/lib/auth/nextauth-token.ts` : helper unique `getAuthToken` pour homogénéiser la récupération du token NextAuth.

### Principes Clés

| Aspect               | Implémentation                           |
| -------------------- | ---------------------------------------- |
| **Authentification** | Azure AD SSO obligatoire                 |
| **Autorisation**     | RBAC (Role-Based Access Control)         |
| **Secrets**          | Azure Key Vault uniquement               |
| **Données**          | Chiffrement at-rest et in-transit        |
| **Logs**             | Audit trail complet                      |
| **RGPD**             | Consentement explicite + droit à l'oubli |

### Séparation des Environnements

```
DEV (local)     → .env.local + SQLite
STAGING         → Azure + PostgreSQL test
PRODUCTION      → Azure + PostgreSQL prod + Key Vault
```

---

## 🤖 IA - APPROCHE LÉGALE

### Ce que l'IA FAIT

1. **Suggère** des réponses aux emails
2. **Catégorise** automatiquement les messages
3. **Propose** des priorités
4. **Résume** les conversations longues

### Ce que l'IA NE FAIT PAS

1. ❌ Envoyer des emails automatiquement
2. ❌ Prendre des décisions juridiques
3. ❌ Accéder à des données sans autorisation
4. ❌ Stocker des conversations sensibles

### Flux de Travail

```
Email reçu → IA analyse → Suggestion affichée →
                          ↓
            UTILISATEUR VALIDE → Action exécutée
                    ↓
            UTILISATEUR REFUSE → Aucune action
```

---

## 📧 INTÉGRATIONS

### Email (Microsoft Graph)

```typescript
// Lecture seule par défaut
const emails = await graphClient
  .api("/me/messages")
  .filter("isRead eq false")
  .get();

// Envoi = action explicite utilisateur
await graphClient.api("/me/sendMail").post({ message, saveToSentItems: true });
```

### WhatsApp (Twilio)

```typescript
// Webhook entrant
app.post("/api/webhooks/twilio", async (req, res) => {
  const { From, Body } = req.body;

  // Log pour audit
  await logIncomingMessage(From, Body);

  // Notification à l'utilisateur (pas de réponse auto)
  await notifyUser(userId, { from: From, message: Body });

  res.status(200).send("OK");
});
```

---

## 🚀 DÉPLOIEMENT

### Pipeline CI/CD

```
Push → Lint → Tests → Build → Security Scan → Deploy
              ↓                      ↓
          Frontend +            Gitleaks +
          Backend               npm audit
```

### Azure Infrastructure

```
┌─────────────────────────────────────────┐
│           Azure Static Web Apps          │
│  (Next.js frontend + API Routes)        │
└─────────────────────────────────────────┘
                    │
┌───────────────────┼───────────────────┐
│                   │                   │
▼                   ▼                   ▼
Azure           Azure             Azure
PostgreSQL      Key Vault         Blob Storage
(Data)          (Secrets)         (Files)
```

---

## 📊 MONITORING

### Métriques Clés

- **Performance**: Time to first byte, API latency
- **Disponibilité**: Uptime, error rate
- **Sécurité**: Failed auth attempts, suspicious activity
- **Usage**: Active users, emails processed

### Alertes

| Condition              | Action                    |
| ---------------------- | ------------------------- |
| Error rate > 5%        | Notification Slack        |
| Response time > 2s     | Alerte équipe             |
| Auth failures > 10/min | Blocage + alerte sécurité |

---

## 📋 PROCHAINES ÉTAPES

1. [ ] Configurer Azure AD pour SSO
2. [ ] Déployer Azure Key Vault
3. [ ] Configurer Twilio sandbox
4. [ ] Implémenter Microsoft Graph
5. [ ] Déployer sur Azure Static Web Apps
6. [ ] Configurer monitoring Application Insights

### Guides d'équipe

- [Guide: quand refactorer / quand reporter](./REFRACTORING_DECISION_GUIDE.md)

---

_Document mis à jour: Janvier 2026_
_Version: 2.0_
