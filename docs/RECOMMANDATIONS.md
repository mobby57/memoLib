# RECOMMANDATIONS - PROCHAINES ÉTAPES

Ce document synthétise les actions à entreprendre pour finaliser la sécurité et la conformité de **IA Poste Manager**.

---

## ✅ COMPLÉTÉ (Janvier 2026)

### 1. Architecture Sécurité
- ✅ Documentation Zero-Trust complète ([SECURITE_CONFORMITE.md](SECURITE_CONFORMITE.md))
- ✅ Guide d'utilisation développeur ([GUIDE_UTILISATION_SECURITE.md](GUIDE_UTILISATION_SECURITE.md))
- ✅ Bibliothèques de sécurité (crypto, audit, AI isolation)
- ✅ Middleware Zero-Trust global
- ✅ Migration base de données (AuditLog, DocumentVersion)

### 2. Conformité RGPD
- ✅ DPIA (Data Protection Impact Assessment) ([DPIA.md](DPIA.md))
- ✅ Registre des traitements CNIL ([DOSSIER_CNIL.md](DOSSIER_CNIL.md))
- ✅ CGU/CGV complètes ([CGU_CGV.md](CGU_CGV.md))
- ✅ Politique de confidentialité ([POLITIQUE_CONFIDENTIALITE.md](POLITIQUE_CONFIDENTIALITE.md))

### 3. Documentation commerciale
- ✅ Pitch investisseurs ([PITCH_INVESTISSEURS.md](PITCH_INVESTISSEURS.md))
- ✅ Arguments de vente sécurité ("Même nous ne pouvons pas lire vos dossiers")

### 4. Tests migration
- ✅ Prisma Studio lancé (vérification tables AuditLog, DocumentVersion)
- ✅ Middleware vérifié (compatible avec 14 routes API existantes)
- ✅ Exemples d'intégration créés ([src/examples/audit-integration-examples.ts](../src/examples/audit-integration-examples.ts))

### 5. Template de personnalisation
- ✅ Guide de remplacement ([CONFIG_TEMPLATE.md](CONFIG_TEMPLATE.md))
- ✅ Identification des 30 champs à personnaliser

---

## 🔄 ACTIONS IMMÉDIATES (1-2 semaines)

### 1. Personnalisation de la documentation

**Priorité : Haute** | **Temps estimé : 2-3 heures**

1. Ouvrir [CONFIG_TEMPLATE.md](CONFIG_TEMPLATE.md)
2. Remplir tous les champs avec vos informations réelles :
   - Raison sociale, SIRET, RCS
   - Adresse siège social
   - Nom et contact DPO
   - Emails professionnels
   - Hébergeur et datacenter
3. Utiliser VS Code "Rechercher et Remplacer" (Ctrl+Shift+H) :
   - Filtrer sur `docs/**/*.md`
   - Remplacer `[Votre Société SAS]` → Votre nom de société
   - Remplacer `[Numéro SIRET]` → Votre SIRET
   - Etc. (suivre le guide CONFIG_TEMPLATE)

**Validation :**
```bash
# Vérifier qu'il ne reste aucun placeholder
rg "\[À compléter\]|\[Votre" docs/
```

---

### 2. Intégration Prisma dans les routes API

**Priorité : Haute** | **Temps estimé : 1-2 jours**

**Problème actuel :** Les routes API utilisent des données mockées (`TENANT_DOSSIERS`, `TENANT_USERS`)

**Actions :**

1. **Remplacer les mocks par Prisma :**

Exemple pour [src/app/api/tenant/[id]/dossiers/route.ts](../src/app/api/tenant/[id]/dossiers/route.ts) :

```typescript
// ❌ AVANT (mock)
const dossiers = TENANT_DOSSIERS[tenantId] || [];

// ✅ APRÈS (Prisma + Audit)
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma'; // Créer ce fichier

const dossiers = await prisma.dossier.findMany({
  where: { tenantId },
  include: { client: true, documents: true }
});

await logAudit({
  tenantId,
  userId: session.user.id,
  action: 'READ',
  objectType: 'dossier',
  objectId: 'list',
  metadata: { count: dossiers.length },
  ipAddress: req.headers.get('x-forwarded-for'),
  success: true
});
```

2. **Créer `src/lib/prisma.ts` :**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

3. **Routes à modifier (14 au total) :**

| Fichier | Action | Modèle Prisma |
|---------|--------|---------------|
| `api/tenant/[id]/dossiers/route.ts` | CRUD dossiers | `prisma.dossier` |
| `api/tenant/[id]/clients/route.ts` | CRUD clients | `prisma.client` |
| `api/tenant/[id]/factures/route.ts` | CRUD factures | `prisma.facture` |
| `api/admin/clients/route.ts` | Liste clients | `prisma.client` |
| `api/admin/dossiers/route.ts` | Liste dossiers | `prisma.dossier` |
| `api/client/my-dossiers/route.ts` | Dossiers du client | `prisma.dossier` |
| ... | ... | ... |

**Référence :** [src/examples/audit-integration-examples.ts](../src/examples/audit-integration-examples.ts) (5 exemples complets)

**Validation :**
- Tester chaque route avec Postman ou Thunder Client
- Vérifier les logs d'audit dans Prisma Studio

---

### 3. Ajouter l'authentification MFA

**Priorité : Moyenne** | **Temps estimé : 1 jour**

**Pourquoi :** RGPD et Zero-Trust recommandent MFA pour les rôles critiques (ADMIN, SUPER_ADMIN)

**Actions :**

1. Installer `@otplib/preset-default` et `qrcode` :
```bash
npm install @otplib/preset-default qrcode
npm install -D @types/qrcode
```

2. Créer `src/lib/mfa.ts` :
```typescript
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

export async function generateMFASecret(userEmail: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(userEmail, 'IA Poste Manager', secret);
  const qrCode = await QRCode.toDataURL(otpauth);
  
  return { secret, qrCode };
}

export function verifyMFAToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}
```

3. Ajouter champ `mfaSecret` dans le modèle `User` (Prisma) :
```prisma
model User {
  // ... champs existants
  mfaSecret   String?
  mfaEnabled  Boolean @default(false)
}
```

4. Modifier NextAuth callback :
```typescript
// Dans api/auth/[...nextauth]/route.ts
callbacks: {
  async signIn({ user, account, credentials }) {
    if (user.mfaEnabled) {
      const token = credentials?.mfaToken;
      if (!token || !verifyMFAToken(token, user.mfaSecret)) {
        throw new Error('MFA_REQUIRED');
      }
    }
    return true;
  }
}
```

---

## 📅 ACTIONS À COURT TERME (1 mois)

### 4. Pentest externe

**Priorité : Haute** | **Budget : 500-2000 €** | **Temps : 1-2 semaines**

**Pourquoi :** Détecter les vulnérabilités avant production

**Prestataires recommandés (France) :**

| Nom | Spécialité | Prix indicatif |
|-----|-----------|----------------|
| **Vaadata** | Pentest web/API | 800-1500 € |
| **Intrinsec** | Pentest + audit RGPD | 1500-3000 € |
| **Synacktiv** | Pentest avancé | 2000-5000 € |
| **Freelance (Malt)** | Pentest ponctuel | 500-1200 € |

**Livrables attendus :**
- Rapport de vulnérabilités (CVSS scoring)
- Plan de remédiation priorisé
- Re-test après corrections

**Action :** Demander 3 devis avant fin février 2026

---

### 5. Formation équipe

**Priorité : Moyenne** | **Temps : 1 journée**

**Objectif :** Former les développeurs et collaborateurs aux nouvelles fonctionnalités de sécurité

**Programme de formation (4h) :**

1. **Module 1 : Architecture Zero-Trust (45 min)**
   - Principe "Never Trust, Always Verify"
   - Middleware et RBAC
   - Démo : Traçabilité d'une requête

2. **Module 2 : Système d'audit (1h)**
   - Fonctions `logAudit()` et helpers
   - Consultation des logs (Prisma Studio)
   - Cas pratique : Ajouter un audit sur une nouvelle route

3. **Module 3 : Isolation IA (45 min)**
   - Anonymisation avec `prepareDossierForAI()`
   - Validation des inputs
   - Tag des outputs IA
   - Cas pratique : Analyser un dossier en toute sécurité

4. **Module 4 : RGPD en pratique (45 min)**
   - Droits des utilisateurs (accès, rectification, suppression)
   - Gestion des demandes RGPD
   - Incident de sécurité : que faire ?

**Support :** Créer slides à partir de [GUIDE_UTILISATION_SECURITE.md](GUIDE_UTILISATION_SECURITE.md)

**Validation :** Quiz final (10 questions)

---

### 6. Tests de charge et scalabilité

**Priorité : Moyenne** | **Temps : 2-3 jours**

**Objectif :** Vérifier que l'application supporte la charge attendue

**Scénarios de test :**

| Scénario | Utilisateurs concurrents | Durée | Critère de succès |
|----------|-------------------------|-------|-------------------|
| **Consultation dossiers** | 50 | 10 min | < 500ms (P95) |
| **Upload documents** | 20 | 5 min | < 2s (P95) |
| **Analyse IA** | 10 | 5 min | < 10s (P95) |
| **Connexion/Déconnexion** | 100 | 5 min | < 300ms (P95) |

**Outils recommandés :**

1. **k6** (recommandé) :
```bash
npm install -g k6
```

Exemple de script ([tests/load/dossiers.js](../tests/load/dossiers.js)) :
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Montée en charge
    { duration: '3m', target: 50 },  // Plateau
    { duration: '1m', target: 0 },   // Redescente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/tenant/1/dossiers', {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

2. **Artillery** :
```bash
npm install -g artillery
artillery quick --count 50 --num 100 http://localhost:3000/api/tenant/1/dossiers
```

**Métriques à surveiller :**
- Temps de réponse (P50, P95, P99)
- Taux d'erreur (< 0.1%)
- Throughput (requêtes/sec)
- Utilisation CPU/RAM serveur

**Action :** Créer dossier `tests/load/` avec scripts k6

---

## 📆 ACTIONS À MOYEN TERME (3-6 mois)

### 7. Certification ISO 27001 (démarrage)

**Priorité : Haute** | **Budget : 10 000 - 30 000 €** | **Durée : 6-12 mois**

**Pourquoi :** Différenciateur commercial majeur (exigé par grands cabinets, entreprises)

**Étapes :**

1. **Gap Analysis (Mois 1-2)** :
   - Auto-évaluation vs ISO 27001:2022
   - Identification des écarts
   - Plan de remédiation

2. **Mise en conformité (Mois 3-8)** :
   - Politique de sécurité (SMSI)
   - Procédures et processus
   - Sensibilisation du personnel
   - Audits internes

3. **Audit de certification (Mois 9-12)** :
   - Stage 1 : Audit documentaire
   - Stage 2 : Audit sur site
   - Certification délivrée

**Organismes certificateurs (France) :**
- AFNOR Certification
- Bureau Veritas
- LRQA
- DNV

**Coûts :**
- Consultant externe : 5 000 - 15 000 €
- Audit de certification : 5 000 - 10 000 €
- Outils SMSI : 500 - 2 000 €/an

**ROI :** +30% de conversions clients (cabinets > 50 avocats)

**Action :** Demander devis "Gap Analysis ISO 27001" avant fin mars 2026

---

### 8. Programme Bug Bounty

**Priorité : Faible** | **Budget : Variable**

**Concept :** Récompenser les chercheurs en sécurité qui trouvent des vulnérabilités

**Plateformes :**
- **YesWeHack** (France) : ~100-5000 € par vulnérabilité
- **HackerOne** : International
- **Intigriti** : Europe

**Avantages :**
- Détection continue de vulnérabilités
- Communauté de chercheurs
- Réputation de transparence

**Inconvénients :**
- Coût variable (dépend des découvertes)
- Gestion administrative

**Action :** Envisager après 6 mois en production

---

## 🔍 MONITORING ET AMÉLIORATION CONTINUE

### 9. Dashboard de sécurité

**Créer un tableau de bord :** [src/app/super-admin/security/page.tsx](../src/app/super-admin/security/page.tsx)

**Métriques à afficher :**

```typescript
// Pseudo-code
const SecurityDashboard = async () => {
  const metrics = {
    // Audit
    totalAudits: await prisma.auditLog.count(),
    failedLogins24h: await countFailedLogins(24),
    unauthorizedAccess24h: await detectUnauthorizedAccess('all', 24),
    
    // Documents
    documentsWithHash: await prisma.document.count({ where: { hash: { not: null } } }),
    documentVersions: await prisma.documentVersion.count(),
    
    // IA
    aiCallsToday: await prisma.aIAction.count({ where: { createdAt: { gte: startOfDay(new Date()) } } }),
    
    // Utilisateurs
    mfaEnabled: await prisma.user.count({ where: { mfaEnabled: true } }),
    activeUsers24h: await countActiveUsers(24),
  };
  
  return <div>
    <Card title="Audit Logs" value={metrics.totalAudits} />
    <Card title="Failed Logins (24h)" value={metrics.failedLogins24h} alert={metrics.failedLogins24h > 10} />
    {/* ... */}
  </div>
};
```

---

### 10. Alertes automatiques

**Créer `src/lib/alerts.ts` :**

```typescript
import { sendEmail } from './email';

export async function checkSecurityAlerts() {
  // Détection tentatives de force brute
  const suspiciousIPs = await prisma.auditLog.groupBy({
    by: ['ipAddress'],
    where: {
      action: 'LOGIN_FAILED',
      timestamp: { gte: new Date(Date.now() - 3600000) } // 1h
    },
    _count: { ipAddress: true },
    having: { ipAddress: { _count: { gt: 5 } } }
  });
  
  if (suspiciousIPs.length > 0) {
    await sendEmail({
      to: 'security@votre-societe.com',
      subject: '[ALERT] Suspicious login attempts',
      body: `${suspiciousIPs.length} IPs with > 5 failed logins in 1h`
    });
  }
  
  // Détection accès cross-tenant
  const crossTenantAttempts = await detectUnauthorizedAccess('all', 1);
  if (crossTenantAttempts.length > 0) {
    await sendEmail({
      to: 'security@votre-societe.com',
      subject: '[CRITICAL] Cross-tenant access attempt',
      body: JSON.stringify(crossTenantAttempts, null, 2)
    });
  }
}
```

**Cron job (via Vercel Cron ou node-cron) :**

```typescript
// api/cron/security-check/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  await checkSecurityAlerts();
  return new Response('OK');
}
```

---

## 📋 CHECKLIST FINALE PRÉ-PRODUCTION

Avant de déployer en production :

### Sécurité
- [ ] Tous les secrets dans variables d'environnement (pas de hardcode)
- [ ] `NEXTAUTH_SECRET` généré avec `openssl rand -base64 32`
- [ ] HTTPS activé (certificat SSL valide)
- [ ] Middleware Zero-Trust actif sur toutes les routes
- [ ] MFA activé pour tous les ADMIN/SUPER_ADMIN
- [ ] Backups automatiques configurés (quotidiens)
- [ ] Plan de reprise d'activité (PRA) documenté

### Conformité
- [ ] Tous les champs `[À compléter]` remplis
- [ ] DPO nommé officiellement (mail + courrier)
- [ ] DPIA validée et signée
- [ ] Registre CNIL à jour
- [ ] CGU/CGV publiées sur le site web
- [ ] Politique de confidentialité accessible
- [ ] Bannière cookies configurée
- [ ] Procédure de gestion des demandes RGPD opérationnelle

### Tests
- [ ] Tests unitaires (couverture > 70%)
- [ ] Tests d'intégration API
- [ ] Tests de charge (k6) réussis
- [ ] Pentest externe effectué (vulnérabilités critiques corrigées)
- [ ] Test de récupération après incident (backup restore)

### Documentation
- [ ] README.md à jour
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Guide utilisateur rédigé
- [ ] Runbook opérationnel (déploiement, rollback, incidents)

---

## 📞 SUPPORT

Pour toute question sur ces recommandations :

**Email technique :** dev@votre-societe.com  
**Email sécurité :** security@votre-societe.com  
**Email RGPD :** dpo@votre-societe.com

---

**Dernière mise à jour :** Janvier 2026  
**Prochaine révision :** Avril 2026
