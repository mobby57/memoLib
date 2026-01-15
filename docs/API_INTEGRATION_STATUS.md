# API Routes - Statut d'Intégration

## ✅ Routes Intégrées avec Prisma + Audit

### Routes Tenant
- ✅ **GET /api/tenant/[id]/dossiers** - Liste dossiers avec audit
  - Prisma: `dossier.findMany()` avec filtres (statut, priorité)
  - Audit: Logs READ avec count et filtres
  - Relations: client, documents (5 récents), _count
  
- ✅ **GET /api/tenant/[id]/clients** - Liste clients avec audit
  - Prisma: `client.findMany()` avec recherche
  - Audit: Logs READ avec search filter
  - Relations: dossiers (3 récents), _count

- ✅ **GET /api/tenant/[id]/factures** - Liste factures avec audit
  - Prisma: `facture.findMany()` avec statut
  - Audit: Logs READ avec totaux calculés
  - Relations: dossier → client
  - Calcul: montantTotal, montantPaye, montantEnAttente, montantEnRetard

### Routes Admin
- ✅ **GET /api/admin/dossiers** - Liste dossiers admin
  - Prisma: `dossier.findMany()` par tenantId
  - Audit: Logs READ admin-list
  - Relations: client, _count (documents, factures)

- ✅ **POST /api/admin/dossiers** - Créer dossier
  - Prisma: `dossier.create()` avec validation tenant
  - Audit: Logs CREATE (succès + échec si limite atteinte)
  - Vérification: Plan limits, client ownership
  - Auto-génération: Numéro de dossier (D-YYYY-NNN)

### Routes Client
- ✅ **GET /api/client/my-dossiers** - Mes dossiers
  - Prisma: `dossier.findMany()` par clientId
  - Audit: Logs READ my-list
  - Relations: _count (documents, rendezVous)
  - Sécurité: Vérification rôle CLIENT

---

## 📝 Routes Restantes (Sans Prisma/Audit)

### Routes Admin
- ⏳ **GET /api/admin/clients** - Nécessite intégration
- ⏳ **POST /api/admin/clients** - Création client

### Routes Client  
- ⏳ **GET /api/client/my-factures** - Factures du client

### Routes Super Admin
- ⏳ **GET /api/super-admin/tenants** - Liste tenants
- ⏳ **POST /api/super-admin/tenants** - Créer tenant
- ⏳ **GET /api/super-admin/tenants/[id]** - Détails tenant
- ⏳ **PATCH /api/super-admin/tenants/[id]** - Modifier tenant

### Routes Tenant (Autres)
- ⏳ **GET /api/tenant/[id]/dashboard** - Statistiques dashboard

### Routes Auth
- ✅ **POST /api/auth/[...nextauth]** - Déjà avec NextAuth (pas de changement requis)

---

## 🔐 Sécurité Implémentée

### Isolation Multi-tenant
✅ Toutes les requêtes vérifient `tenantId`
✅ Aucun accès croisé entre tenants possible

### Audit Logging
✅ Logs pour READ, CREATE
✅ Capture IP, userId, tenantId
✅ Métadonnées (count, filtres, résultats)
✅ Logs d'échec (tenant non trouvé, limites atteintes)

### RBAC
✅ Vérification rôles (ADMIN, CLIENT)
✅ CLIENT ne voit que ses dossiers
✅ ADMIN voit tout son tenant

### Plan Limits
✅ Vérification avant création dossier
✅ Compteur incrémenté après succès
✅ Audit des dépassements de limite

---

## 🧪 Tests à Effectuer

### Test 1: Route Dossiers
```bash
# GET dossiers d'un tenant
curl http://localhost:3000/api/tenant/cabinet-dupont/dossiers

# Avec filtre statut
curl http://localhost:3000/api/tenant/cabinet-dupont/dossiers?statut=en_cours

# Avec filtre priorité
curl http://localhost:3000/api/tenant/cabinet-dupont/dossiers?priorite=haute
```

**Vérification:**
- [ ] Retourne les dossiers du tenant uniquement
- [ ] Filtres fonctionnent
- [ ] Relations chargées (client, documents)
- [ ] Log d'audit créé dans AuditLog table

---

### Test 2: Route Clients
```bash
# GET clients d'un tenant
curl http://localhost:3000/api/tenant/cabinet-dupont/clients

# Avec recherche
curl http://localhost:3000/api/tenant/cabinet-dupont/clients?search=Ahmed
```

**Vérification:**
- [ ] Retourne clients du tenant
- [ ] Recherche par nom/email fonctionne
- [ ] Dossiers récents inclus
- [ ] Log d'audit créé

---

### Test 3: Route Factures
```bash
# GET factures d'un tenant
curl http://localhost:3000/api/tenant/cabinet-dupont/factures

# Avec filtre statut
curl http://localhost:3000/api/tenant/cabinet-dupont/factures?statut=payee
```

**Vérification:**
- [ ] Retourne factures du tenant
- [ ] Totaux calculés correctement
- [ ] Relations dossier → client chargées
- [ ] Log d'audit avec totaux

---

### Test 4: Admin - Créer Dossier
```bash
# POST nouveau dossier (nécessite auth)
curl -X POST http://localhost:3000/api/admin/dossiers \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client-123",
    "typeDossier": "Titre de séjour",
    "statut": "en_cours",
    "priorite": "normale"
  }'
```

**Vérification:**
- [ ] Dossier créé avec numéro auto (D-2026-001)
- [ ] Client ownership vérifiée
- [ ] Plan limits respectés
- [ ] Log d'audit CREATE avec metadata
- [ ] Échec si limite atteinte (avec audit d'échec)

---

### Test 5: Vérifier Audit Logs
**Via Prisma Studio:**
1. Ouvrir http://localhost:5555
2. Aller dans table `AuditLog`
3. Vérifier présence de logs pour:
   - [ ] READ dossiers (objectType=dossier, action=READ)
   - [ ] READ clients (objectType=client)
   - [ ] READ factures (objectType=facture)
   - [ ] CREATE dossier (objectType=dossier, action=CREATE)

**Champs à vérifier:**
- [ ] `tenantId` présent
- [ ] `userId` présent (ou 'anonymous')
- [ ] `ipAddress` capturé
- [ ] `hash` généré (SHA-256)
- [ ] `metadata` JSON correct
- [ ] `success` = true pour requêtes valides

---

### Test 6: Isolation Multi-tenant
```bash
# Tenter d'accéder aux dossiers d'un autre tenant
curl http://localhost:3000/api/tenant/cabinet-martin/dossiers

# Ne doit retourner QUE les dossiers de cabinet-martin
# PAS ceux de cabinet-dupont ou cabinet-rousseau
```

**Vérification:**
- [ ] Aucun accès croisé
- [ ] Erreur 404 si tenant inexistant
- [ ] Log d'audit d'échec si tenant non trouvé

---

## 📊 Résultats Attendus

### Base de Données
Après tests, la DB doit contenir:
- **Tenants:** 3 (cabinet-dupont, cabinet-martin, cabinet-rousseau)
- **Clients:** Au moins 1 par tenant
- **Dossiers:** Plusieurs par tenant
- **Factures:** Plusieurs par dossier
- **AuditLog:** Entrées pour chaque requête API

### Logs d'Audit
Minimum attendu:
- 10+ entrées READ (dossiers, clients, factures)
- 1+ entrée CREATE (si création dossier testée)
- Aucune entrée avec `success=false` sauf tests d'erreur intentionnels

---

## 🚨 Erreurs Potentielles

### Erreur 1: "Tenant non trouvé"
**Cause:** Aucun tenant n'existe dans la DB
**Solution:** Exécuter seed script
```bash
npx tsx prisma/seed.ts
```

### Erreur 2: "Client not found"
**Cause:** ClientId fourni n'existe pas ou appartient à autre tenant
**Solution:** Vérifier dans Prisma Studio les IDs valides

### Erreur 3: "Plan limit reached"
**Cause:** Limite du plan STARTER atteinte
**Solution:** 
- Upgrader le plan dans TenantSettings
- Ou supprimer des dossiers existants

### Erreur 4: Relations non chargées
**Cause:** Prisma Client pas régénéré
**Solution:** `npx prisma generate`

---

## ✅ Checklist de Validation

Avant de considérer l'intégration complète:

### Code
- [x] `src/lib/prisma.ts` créé (singleton)
- [x] Routes utilisent `import { prisma } from '@/lib/prisma'`
- [x] Routes utilisent `import { logAudit } from '@/lib/audit'`
- [x] Aucun `new PrismaClient()` dans les routes
- [x] Aucune donnée mockée (TENANT_DOSSIERS supprimés)

### Fonctionnalités
- [ ] Tests manuels effectués (6 tests ci-dessus)
- [ ] Logs d'audit vérifiés dans Prisma Studio
- [ ] Isolation multi-tenant confirmée
- [ ] Plan limits fonctionnent
- [ ] Erreurs gérées avec audit d'échec

### Performance
- [ ] Requêtes optimisées (select spécifiques, pas de N+1)
- [ ] Relations limitées (take: 3 ou 5 pour éviter surcharge)
- [ ] Index Prisma en place (tenantId, clientId)

### Documentation
- [x] Exemples d'intégration créés ([src/examples/audit-integration-examples.ts](../src/examples/audit-integration-examples.ts))
- [x] Guide d'utilisation disponible ([docs/GUIDE_UTILISATION_SECURITE.md](../docs/GUIDE_UTILISATION_SECURITE.md))
- [x] Recommandations documentées ([docs/RECOMMANDATIONS.md](../docs/RECOMMANDATIONS.md))

---

**Prochaines étapes:** Tester chaque route manuellement ou créer tests automatisés
