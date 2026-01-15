# 🚀 PISTE API - Quick Reference

## 🔗 URLs Essentielles

| Environnement | OAuth Token | API Base |
|---------------|-------------|----------|
| **Sandbox** | `https://sandbox-oauth.piste.gouv.fr/api/oauth/token` | `https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app` |
| **Production** | `https://oauth.piste.gouv.fr/api/oauth/token` | `https://api.piste.gouv.fr/dila/legifrance/lf-engine-app` |

## 🔑 Authentification Rapide

### Obtenir un Token (cURL)

```bash
curl -X POST https://sandbox-oauth.piste.gouv.fr/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=openid"
```

### Réponse

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid"
}
```

## 🔍 Recherche CESEDA

### Endpoint

```
POST /dila/legifrance/lf-engine-app/consult/ceseda
```

### Headers

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body (Recherche par Article)

```json
{
  "query": "L313-11",
  "filters": {
    "code": "CESEDA"
  }
}
```

### Body (Recherche par Mots-Clés)

```json
{
  "query": "regroupement familial",
  "filters": {
    "code": "CESEDA",
    "section": "LIVRE IV"
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

## 📊 Endpoints Principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/consult/ceseda` | POST | Recherche dans le CESEDA |
| `/consult/code_civil` | POST | Code civil |
| `/consult/jurisprudence` | POST | Jurisprudence |
| `/article/{id}` | GET | Article par ID |
| `/search/full_text` | POST | Recherche plein texte |

## 🎯 Exemples TypeScript

### Client Simple

```typescript
const token = await getToken();
const response = await fetch(
  'https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app/consult/ceseda',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'L313-11',
      filters: { code: 'CESEDA' },
    }),
  }
);
const data = await response.json();
```

### Avec Cache

```typescript
// 1. Vérifier cache local
const cached = await getCachedArticle('L313-11');
if (cached) return cached;

// 2. Requête API si pas en cache
const results = await searchCESEDA({ articleNumber: 'L313-11' });

// 3. Mettre en cache
await cacheArticle(results[0]);

return results[0];
```

## ⚡ Articles CESEDA Fréquents

| Article | Sujet | Type Dossier |
|---------|-------|--------------|
| **L313-11** | Carte de résident | Titre de séjour |
| **L511-1** | OQTF | Éloignement |
| **L314-8** | Titre de séjour temporaire | Titre de séjour |
| **L411-1 à L411-5** | Regroupement familial | Regroupement |
| **L721-1 à L721-7** | Asile politique | Asile |
| **L423-1** | Naturalisation | Nationalité |

## 🔒 Variables d'Environnement

```env
# .env.local

# Sandbox (Tests)
PISTE_SANDBOX_CLIENT_ID=votre-client-id
PISTE_SANDBOX_CLIENT_SECRET=votre-client-secret
PISTE_SANDBOX_OAUTH_URL=https://sandbox-oauth.piste.gouv.fr/api/oauth/token
PISTE_SANDBOX_API_URL=https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app

# Production
PISTE_PROD_CLIENT_ID=prod-client-id
PISTE_PROD_CLIENT_SECRET=prod-client-secret
PISTE_PROD_OAUTH_URL=https://oauth.piste.gouv.fr/api/oauth/token
PISTE_PROD_API_URL=https://api.piste.gouv.fr/dila/legifrance/lf-engine-app

# Environnement actif
PISTE_ENVIRONMENT=sandbox
```

## ⚠️ Limites & Bonnes Pratiques

| Limite | Valeur | Recommandation |
|--------|--------|----------------|
| Rate limit | 100 req/min | Implémenter cache local |
| Token expiry | 1 heure | Rafraîchir automatiquement |
| Timeout | 30 secondes | Gérer timeouts |
| Cache recommandé | 30 jours | Articles peu modifiés |

## 🐛 Codes d'Erreur Courants

| Code | Signification | Solution |
|------|---------------|----------|
| **401** | Token invalide/expiré | Redemander un token |
| **403** | Accès refusé | Vérifier credentials |
| **404** | Ressource non trouvée | Vérifier l'ID article |
| **429** | Rate limit dépassé | Attendre ou utiliser cache |
| **500** | Erreur serveur | Réessayer après délai |

## 📝 Checklist Démarrage Rapide

- [ ] Créer compte sur https://piste.gouv.fr/
- [ ] Demander credentials Sandbox
- [ ] Configurer `.env.local`
- [ ] Tester authentification (cURL)
- [ ] Tester recherche article (L313-11)
- [ ] Implémenter cache Prisma
- [ ] Créer route API Next.js
- [ ] Tester dans l'interface

## 📚 Ressources

- **Site PISTE** : https://piste.gouv.fr/
- **Guide PDF** : `PISTE-Guide_Utilisateur.pdf`
- **Guide implémentation** : [PISTE_IMPLEMENTATION_GUIDE.md](./PISTE_IMPLEMENTATION_GUIDE.md)
- **Résumé analyse** : [PISTE_ANALYSIS_SUMMARY.md](./PISTE_ANALYSIS_SUMMARY.md)

---

**Dernière mise à jour :** 7 janvier 2026  
**Version :** 1.0
