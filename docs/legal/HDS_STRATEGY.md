# Stratégie Hébergement HDS — MemoLib

## Contexte

La certification **HDS** (Hébergeur de Données de Santé) est obligatoire en France pour tout hébergeur traitant des données de santé à caractère personnel (article L.1111-8 du Code de la santé publique).

Dans le contexte d'un cabinet d'avocats en droit des étrangers, des **certificats médicaux** (OFII, OFPRA) transitent fréquemment dans les dossiers.

---

## Architecture actuelle vs cible

### Actuelle (non-HDS)
```
Client → Vercel (cdg1 Paris) → PostgreSQL (Vercel/Neon)
                              → Vercel Blob (fichiers)
```

### Cible HDS (si données de santé)
```
Client → Vercel (cdg1 Paris) → PostgreSQL sur OVHcloud HDS
                              → OVH Object Storage HDS (fichiers)
                              → Chiffrement E2E (clé côté client)
```

---

## Options d'hébergeurs HDS certifiés

| Hébergeur | Certification | PostgreSQL managé | Object Storage | Coût estimé/mois |
|---|---|---|---|---|
| **OVHcloud** | HDS + ISO 27001 | ✅ (Public Cloud DB) | ✅ (Object Storage) | ~50-150€ |
| **Scaleway** | HDS + ISO 27001 | ✅ (Managed DB) | ✅ (Object Storage) | ~40-120€ |
| **Outscale (3DS)** | HDS + SecNumCloud | ✅ | ✅ | ~100-300€ |
| **AWS (Paris)** | HDS via BAA | ✅ (RDS) | ✅ (S3) | ~80-200€ |

### Recommandation : OVHcloud

- Français, souverain
- Certification HDS native
- PostgreSQL managé compatible Prisma
- Object Storage S3-compatible (remplacement Vercel Blob)
- Bon rapport qualité/prix

---

## Plan de migration

### Phase 1 — Séparation des données sensibles (immédiat)
- Taguer les documents contenant des données de santé dans la DB
- Le chiffrement E2E est déjà en place → les données sont illisibles côté serveur

### Phase 2 — Migration DB vers OVHcloud HDS (quand nécessaire)
1. Provisionner PostgreSQL sur OVHcloud Public Cloud
2. Migrer avec `pg_dump` / `pg_restore`
3. Mettre à jour `DATABASE_URL` dans Vercel
4. Tester les migrations Prisma

### Phase 3 — Migration stockage fichiers
1. Remplacer Vercel Blob par OVH Object Storage (API S3-compatible)
2. Adapter `storageService.ts` pour utiliser le SDK S3
3. Migrer les fichiers existants

---

## Configuration OVHcloud PostgreSQL

```env
# .env.production (HDS)
DATABASE_URL="postgresql://user:password@postgresql-xxx.database.cloud.ovh.net:5432/memolib?sslmode=require"
```

## Configuration OVH Object Storage

```env
# S3-compatible
S3_ENDPOINT="https://s3.gra.cloud.ovh.net"
S3_REGION="gra"
S3_BUCKET="memolib-documents-hds"
S3_ACCESS_KEY="<access_key>"
S3_SECRET_KEY="<secret_key>"
```

---

## Double chiffrement (défense en profondeur)

```
Document original
    ↓
Chiffrement E2E côté client (AES-256-GCM, clé cabinet)
    ↓
Upload vers OVH Object Storage (TLS en transit)
    ↓
Chiffrement au repos par OVH (SSE)
```

Le document est chiffré **3 fois** : E2E + TLS + SSE. Même en cas de compromission du serveur, les données restent illisibles.

---

## Checklist conformité HDS

- [ ] Contrat HDS signé avec l'hébergeur
- [ ] Chiffrement E2E activé pour tous les documents de santé
- [ ] Politique de rétention configurée (durée légale)
- [ ] Logs d'accès aux données de santé (audit trail)
- [ ] DPA mis à jour avec mention HDS
- [ ] Information des cabinets clients
- [ ] Test de restauration des backups
