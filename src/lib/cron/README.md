# Services CRON - MemoLib

Services de tâches planifiées pour automatiser les opérations de maintenance et conformité.

## 📋 Services Disponibles

### 1. Purge Automatique Preuves Légales

**Fichier** : `legal-proof-purge.ts`
**Conformité** : RGPD Art. 5.1.e (Limitation de conservation)

Supprime automatiquement les preuves légales expirées (> 10 ans par défaut).

#### Utilisation

```typescript
import { purgeLegalProofs } from '@/lib/cron/legal-proof-purge';

// Dry run (simulation)
const result = await purgeLegalProofs({
  dryRun: true,
  retentionYears: 10,
});
console.log(`${result.totalExpired} preuves à supprimer`);
console.log(`${result.ignored} preuves ignorées (contentieux)`);

// Production (suppression réelle avec archivage)
const result = await purgeLegalProofs({
  dryRun: false,
  archiveBeforeDelete: true,
  ignoreActiveContentieux: true,
});
console.log(`${result.deleted} preuves supprimées`);
console.log(`${result.archived} preuves archivées`);
```

#### Configuration

| Option                    | Type    | Défaut | Description                             |
| ------------------------- | ------- | ------ | --------------------------------------- |
| `retentionYears`          | number  | 10     | Durée de rétention en années            |
| `archiveBeforeDelete`     | boolean | true   | Archiver avant suppression (Azure Blob) |
| `dryRun`                  | boolean | false  | Mode simulation (pas de suppression)    |
| `ignoreActiveContentieux` | boolean | true   | Ignorer dossiers en contentieux         |

#### Planification (Vercel Cron)

**Fichier** : `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/purge-legal-proofs",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

**Fréquence** : 1er de chaque mois à 2h du matin

**Route API** : `src/frontend/app/api/cron/purge-legal-proofs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { purgeLegalProofs } from '@/lib/cron/legal-proof-purge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Sécurité: Vérifier token Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await purgeLegalProofs({
      dryRun: false,
      archiveBeforeDelete: true,
      ignoreActiveContentieux: true,
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[CRON] Purge failed:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

#### Environnement

```env
# .env.production
CRON_SECRET=your_vercel_cron_secret_token_here
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

#### Statistiques

```typescript
import { getLegalProofRetentionStats } from '@/lib/cron/legal-proof-purge';

const stats = await getLegalProofRetentionStats();
console.log(`Total: ${stats.total} preuves`);
console.log(`Expirées (>10 ans): ${stats.expiredCount} (${stats.expiredPercentage.toFixed(2)}%)`);
console.log(`Récentes (<1 an): ${stats.byAge.lessThanOneYear}`);
```

#### Logs & Monitoring

- **EventLog** : Chaque purge génère un événement `LEGAL_PROOF_PURGE_COMPLETED`
- **Sentry** : Erreurs remontées automatiquement
- **Console** : Logs détaillés avec timestamps

#### Sécurité

1. **Authentification** : Token `CRON_SECRET` requis
2. **Dry-run par défaut** : Éviter suppressions accidentelles
3. **Contentieux protégés** : Dossiers actifs jamais supprimés
4. **Archivage obligatoire** : Backup Azure avant suppression
5. **Audit trail** : EventLog conserve historique

#### Restoration Procédure

Si suppression accidentelle :

```typescript
// 1. Récupérer depuis Azure Blob
const { BlobServiceClient } = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient('legal-proofs-archive');

// 2. Lister archives d'un tenant
const blobs = containerClient.listBlobsFlat({ prefix: 'tenant_abc123/' });

// 3. Télécharger et restaurer
for await (const blob of blobs) {
  const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
  const downloadResponse = await blockBlobClient.download();
  const proofData = await streamToString(downloadResponse.readableStreamBody);
  const proof = JSON.parse(proofData);

  // Recréer en base
  await prisma.legalProof.create({ data: proof });
}
```

---

## 🔜 Autres Services CRON (à venir)

### 2. Email Monitoring

**Fichier** : `email-monitoring.ts` (existant)
**Fréquence** : Toutes les heures
**Route** : `/api/cron/email-monitoring`

### 3. Deadline Notifications

**Fichier** : `deadline-notifications.ts` (à créer)
**Fréquence** : Tous les jours à 8h
**Route** : `/api/cron/deadline-notifications`

Envoie notifications pour délais proches (J-7, J-3, J-1).

### 4. Backup Database

**Fichier** : `database-backup.ts` (à créer)
**Fréquence** : Tous les jours à 3h
**Route** : `/api/cron/database-backup`

Export PostgreSQL vers Azure Blob Storage.

### 5. Analytics Aggregation

**Fichier** : `analytics-aggregation.ts` (à créer)
**Fréquence** : Tous les dimanches à 4h
**Route** : `/api/cron/analytics-aggregation`

Calcul statistiques hebdomadaires (dossiers, preuves, événements).

---

## 📊 Dashboard CRON

Pour monitorer les tâches CRON :

**Route** : `/admin/cron-jobs`

```typescript
// Afficher statut dernières exécutions
const lastRuns = await prisma.eventLog.findMany({
  where: {
    eventType: {
      in: [
        'LEGAL_PROOF_PURGE_COMPLETED',
        'EMAIL_MONITORING_COMPLETED',
        'DEADLINE_NOTIFICATION_SENT',
      ],
    },
  },
  orderBy: { timestamp: 'desc' },
  take: 50,
});
```

---

## 🧪 Tests

```bash
# Test unitaire purge
npm test -- legal-proof-purge.test.ts

# Test intégration (dry-run)
npx tsx src/lib/cron/legal-proof-purge.ts --dry-run

# Test local API CRON
curl -H "Authorization: Bearer your_secret" \
  http://localhost:3000/api/cron/purge-legal-proofs
```

---

## 📚 Ressources

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [RGPD Art. 5 - Principes](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2#Article5)
- [Azure Blob Storage SDK](https://www.npmjs.com/package/@azure/storage-blob)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
