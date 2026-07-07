# 📋 Registre des sous-traitants et DPA (Data Processing Agreements)

## Obligation légale

Conformément à l'article 28 du RGPD, tout sous-traitant traitant des données personnelles pour le compte de MemoLib doit avoir signé un DPA (accord de traitement des données).

## Sous-traitants actifs

| Sous-traitant | Service | Données traitées | Localisation | DPA | Statut |
|---------------|---------|-----------------|--------------|-----|--------|
| **Neon** | Base de données PostgreSQL | Toutes les données métier (dossiers, clients, emails) | EU (Frankfurt) | [DPA Neon](https://neon.tech/dpa) | ⚠️ À signer |
| **Vercel** | Hébergement application | Requêtes HTTP, logs, sessions | EU (cdg1/arn1) | [DPA Vercel](https://vercel.com/legal/dpa) | ⚠️ À signer |
| **Upstash** | Cache Redis, Rate limiting | Sessions, identifiants IP | EU (Frankfurt) | [DPA Upstash](https://upstash.com/trust/dpa) | ⚠️ À signer |
| **Stripe** | Paiements | Données de facturation, emails | EU + US (bouclier) | [DPA Stripe](https://stripe.com/fr/legal/dpa) | ⚠️ À signer |
| **Sentry** | Monitoring erreurs | Stack traces (PII scrubbed) | EU (Frankfurt) | [DPA Sentry](https://sentry.io/legal/dpa/) | ⚠️ À signer |
| **Cloudflare** | CDN, WAF, DNS | Requêtes HTTP, IP | Global (transit) | [DPA Cloudflare](https://www.cloudflare.com/cloudflare-customer-dpa/) | ⚠️ À signer |

## Configuration requise pour conformité EU

### Neon (Base de données)
```
Région obligatoire : aws-eu-central-1 (Frankfurt)
Variable d'environnement : DATABASE_URL doit contenir un endpoint .eu.neon.tech
```

### Vercel (Hébergement)
```
Région function : cdg1 (Paris) ou arn1 (Stockholm)
Configuration dans vercel.json : "regions": ["cdg1"]
```

### Upstash (Redis)
```
Région obligatoire : eu-central-1 (Frankfurt)
Vérifier dans le dashboard Upstash que la base est EU
```

### Sentry (Monitoring)
```
Data residency : EU (Frankfurt)  
Configurer dans Organization Settings → Data Residency → EU
```

## Actions requises

- [ ] Signer le DPA avec chaque sous-traitant (lien ci-dessus)
- [ ] Conserver une copie signée dans `docs/legal/dpa/`
- [ ] Vérifier la localisation EU de chaque service
- [ ] Documenter dans le registre CNIL (si applicable)
- [ ] Renouveler les DPA à chaque changement de sous-traitant
- [ ] Informer les clients via la politique de confidentialité (fait dans CGU Art. 10)

## Transferts hors UE

**Aucun transfert hors UE autorisé** pour les données de dossiers clients.

Exceptions (données non-sensibles uniquement) :
- Stripe : données de facturation SaaS (pas de données client avocat)
- Cloudflare : transit uniquement, pas de stockage persistant

Si un sous-traitant ne garantit pas l'hébergement EU, il doit être remplacé.

## Mise à jour

Dernière revue : 2026-07-07
Prochaine revue obligatoire : 2026-10-07 (trimestrielle)
