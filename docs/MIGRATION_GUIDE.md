# 🚀 GUIDE DE MIGRATION — WORKSPACE JURIDIQUE

**Version fondatrice — Étapes d'implémentation**

---

## 📋 PRÉREQUIS

- Node.js 18+
- PostgreSQL 14+
- Prisma CLI installé
- Variables d'environnement configurées

---

## 🔄 ÉTAPE 1 : BACKUP

```bash
# Backup de la base actuelle
pg_dump -U postgres -d memolib > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup du schéma Prisma actuel
cp prisma/schema.prisma prisma/schema_backup.prisma
```

---

## 🗄️ ÉTAPE 2 : MIGRATION DU SCHÉMA

### A. Remplacer le schéma
```bash
# Remplacer l'ancien schéma par le nouveau
cp prisma/schema_final.prisma prisma/schema.prisma
```

### B. Générer la migration
```bash
npx prisma migrate dev --name workspace_foundation --create-only
```

### C. Vérifier la migration
```bash
# Ouvrir le fichier de migration généré
# Vérifier que toutes les tables sont créées correctement
```

### D. Appliquer la migration
```bash
npx prisma migrate dev
npx prisma generate
```

---

## 🌱 ÉTAPE 3 : SEEDING

### A. Configurer package.json
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### B. Installer les dépendances
```bash
npm install -D ts-node @types/node
npm install bcryptjs
npm install -D @types/bcryptjs
```

### C. Exécuter le seed
```bash
npx prisma db seed
```

**Résultat attendu** :
- ✅ 3 plans créés (Starter, Pro, Enterprise)
- ✅ 6 articles CESEDA créés
- ✅ 1 tenant démo créé
- ✅ 1 super admin créé (admin@memolib.com / Admin123!)

---

## 🔌 ÉTAPE 4 : TESTER LES API

### A. InformationUnit
```bash
# Créer une InformationUnit
curl -X POST http://localhost:3000/api/information-units \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID",
    "source": "EMAIL",
    "content": "Test email content",
    "changedBy": "USER_ID"
  }'

# Lister les InformationUnits
curl "http://localhost:3000/api/information-units?tenantId=TENANT_ID"
```

### B. LegalDeadline
```bash
# Créer un délai
curl -X POST http://localhost:3000/api/legal-deadlines \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID",
    "dossierId": "DOSSIER_ID",
    "clientId": "CLIENT_ID",
    "type": "RECOURS_CONTENTIEUX",
    "label": "Recours TA Paris",
    "referenceDate": "2024-01-15",
    "legalDays": 60,
    "createdBy": "USER_ID"
  }'

# Lister les délais
curl "http://localhost:3000/api/legal-deadlines?tenantId=TENANT_ID"
```

### C. Proof
```bash
# Créer une preuve
curl -X POST http://localhost:3000/api/proofs \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID",
    "type": "DOCUMENT_RECEPTION",
    "title": "AR Préfecture",
    "proofDate": "2024-01-15",
    "capturedBy": "USER_ID"
  }'
```

### D. AuditLog
```bash
# Créer un log
curl -X POST http://localhost:3000/api/audit-logs \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID",
    "userId": "USER_ID",
    "userEmail": "user@example.com",
    "userRole": "admin",
    "action": "CREATE",
    "entityType": "Dossier",
    "entityId": "DOSSIER_ID"
  }'
```

---

## ⏰ ÉTAPE 5 : CONFIGURER LES CRON JOBS

### A. Variables d'environnement
```env
CRON_SECRET=your-secure-secret-here
```

### B. Tester le cron manuellement
```bash
curl -X POST http://localhost:3000/api/cron/deadline-alerts \
  -H "Authorization: Bearer your-secure-secret-here"
```

### C. Configurer Vercel Cron (production)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/deadline-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 🔐 ÉTAPE 6 : INTÉGRER L'AUDIT

### A. Modifier les routes existantes
```typescript
// Exemple : src/app/api/clients/route.ts
import { createAuditLog, getAuditContext } from '@/lib/audit';

export async function POST(request: NextRequest) {
  // ... code existant ...
  
  const user = await getUser(request); // Votre fonction d'auth
  const context = getAuditContext(request, user);
  
  const client = await prisma.client.create({ /* ... */ });
  
  await createAuditLog(
    context,
    'CREATE',
    'Client',
    client.id,
    null,
    client
  );
  
  return NextResponse.json({ success: true, client });
}
```

### B. Appliquer à toutes les routes
- ✅ /api/clients
- ✅ /api/dossiers
- ✅ /api/documents
- ✅ /api/emails
- ✅ /api/factures

---

## 📊 ÉTAPE 7 : VÉRIFICATION

### A. Vérifier les tables
```sql
-- Compter les enregistrements
SELECT 'plans' as table_name, COUNT(*) FROM "Plan"
UNION ALL
SELECT 'legal_references', COUNT(*) FROM "LegalReference"
UNION ALL
SELECT 'tenants', COUNT(*) FROM "Tenant"
UNION ALL
SELECT 'users', COUNT(*) FROM "User";
```

### B. Vérifier les index
```sql
-- Lister les index
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### C. Vérifier les contraintes
```sql
-- Lister les contraintes
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;
```

---

## 🧪 ÉTAPE 8 : TESTS

### A. Test InformationUnit
```typescript
// Test déduplication
const content = "Test content";
const unit1 = await createInformationUnit(content);
const unit2 = await createInformationUnit(content); // Doit échouer (409)
```

### B. Test LegalDeadline
```typescript
// Test calcul automatique
const deadline = await createLegalDeadline({
  type: 'RECOURS_CONTENTIEUX',
  referenceDate: '2024-01-15',
  legalDays: 60,
});
// dueDate doit être 2024-03-16
```

### C. Test Proof
```typescript
// Test blockchain
const proof1 = await createProof({ /* ... */ });
const proof2 = await createProof({ /* ... */ });
// proof2.chainPreviousId doit être proof1.id
```

### D. Test AuditLog
```typescript
// Test immuabilité
const log = await createAuditLog({ /* ... */ });
await updateAuditLog(log.id); // Doit échouer (403)
```

---

## 🚨 ROLLBACK (SI NÉCESSAIRE)

```bash
# Restaurer le backup
psql -U postgres -d memolib < backup_YYYYMMDD_HHMMSS.sql

# Restaurer l'ancien schéma
cp prisma/schema_backup.prisma prisma/schema.prisma
npx prisma generate
```

---

## ✅ CHECKLIST FINALE

- [ ] Backup effectué
- [ ] Migration appliquée
- [ ] Seed exécuté
- [ ] 3 plans créés
- [ ] 6 articles CESEDA créés
- [ ] Tenant démo créé
- [ ] Super admin créé
- [ ] API InformationUnit testée
- [ ] API LegalDeadline testée
- [ ] API Proof testée
- [ ] API AuditLog testée
- [ ] Cron deadline-alerts testé
- [ ] Audit intégré aux routes existantes
- [ ] Tests unitaires passés
- [ ] Documentation à jour

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs : `npx prisma studio`
2. Vérifier la base : `psql -U postgres -d memolib`
3. Rollback si nécessaire

---

**Document créé le** : {{ DATE }}
**Auteur** : Équipe Produit
**Statut** : GUIDE OFFICIEL
