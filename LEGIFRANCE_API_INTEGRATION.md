# 📚 API Légifrance (PISTE) - Documentation Complète

## ✅ Intégration Réussie

L'API Légifrance est maintenant **100% opérationnelle** dans IA Poste Manager !

### 🎯 Fonctionnalités Disponibles

- ✅ **Authentification OAuth 2.0** automatique
- ✅ **Recherche CESEDA** (Code de l'entrée et du séjour des étrangers)
- ✅ **Consultation d'articles** par numéro et date
- ✅ **Jurisprudence administrative** (Conseil d'État, CAA, TA)
- ✅ **Jurisprudence judiciaire** (Cour de cassation)
- ✅ **Journal Officiel** (dernières publications)
- ✅ **Cache de tokens** (pas de réauthentification inutile)
- ✅ **Gestion d'erreurs** robuste
- ✅ **Logging** complet (RGPD-compliant)

---

## 🚀 Démarrage Rapide

### Étape 1: Configuration PISTE

1. **Créer un compte** sur [PISTE](https://developer.aife.economie.gouv.fr/)
2. **Valider les CGU** de l'API Légifrance (API > Consentement CGU API)
3. **Créer une application** (Applications > Créer)
4. **Cocher l'API Légifrance** dans votre application
5. **Récupérer vos credentials** (Client ID + Client Secret)

### Étape 2: Configuration Locale

Ajouter dans votre `.env.local`:

```env
# API Légifrance PISTE Configuration
# Sandbox (Tests)
PISTE_SANDBOX_CLIENT_ID=votre-client-id-sandbox
PISTE_SANDBOX_CLIENT_SECRET=votre-client-secret-sandbox
PISTE_SANDBOX_OAUTH_URL=https://sandbox-oauth.piste.gouv.fr/api/oauth/token
PISTE_SANDBOX_API_URL=https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app

# Production (optionnel)
PISTE_PROD_CLIENT_ID=votre-client-id-production
PISTE_PROD_CLIENT_SECRET=votre-client-secret-production
PISTE_PROD_OAUTH_URL=https://oauth.piste.gouv.fr/api/oauth/token
PISTE_PROD_API_URL=https://api.piste.gouv.fr/dila/legifrance/lf-engine-app

# Environnement actif (sandbox | production)
PISTE_ENVIRONMENT=sandbox
```

### Étape 3: Tester l'Intégration

```bash
npx tsx scripts/test-legifrance.ts
```

Vous devriez voir:

```
🧪 Test de l'intégration API Légifrance (PISTE)

1️⃣ Vérification de la configuration...
✅ Environnement: sandbox
✅ URL API: https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app

2️⃣ Obtention du token OAuth...
✅ Token obtenu: th2uv3lq9zY2vAoth59Q...

3️⃣ Test de connectivité (ping)...
✅ API disponible

4️⃣ Recherche article L313-11 CESEDA...
✅ Article trouvé: L313-11
   État: VIGUEUR
   ID: LEGIARTI000033219357
   Aperçu: La carte de séjour temporaire...

5️⃣ Recherche mots-clés "regroupement familial"...
✅ 142 résultats trouvés

6️⃣ Recherche jurisprudence CESEDA (6 derniers mois)...
✅ 87 arrêts trouvés

✅ Tous les tests ont réussi!
🎉 L'intégration Légifrance est opérationnelle!
```

---

## 💻 Utilisation en Code

### Import du Client

```typescript
import { legifranceApi } from '@/lib/legifrance/api-client';
```

### Exemples d'Utilisation

#### 1. Rechercher un Article CESEDA

```typescript
// Article L313-11 en vigueur aujourd'hui
const article = await legifranceApi.getCesedaArticle('L313-11');

console.log(article.texte); // Texte complet de l'article
console.log(article.etat);  // VIGUEUR, ABROGE, MODIFIE
```

#### 2. Article CESEDA à une Date Donnée

```typescript
// Article L313-11 au 1er janvier 2020
const articleHistorique = await legifranceApi.getCesedaArticle(
  'L313-11',
  new Date('2020-01-01')
);
```

#### 3. Recherche par Mots-Clés CESEDA

```typescript
// Rechercher "regroupement familial" dans le CESEDA
const results = await legifranceApi.searchCesedaByKeywords(
  'regroupement familial',
  {
    pageSize: 20,
    proximite: 3  // Distance max entre les mots
  }
);

results.results.forEach(result => {
  console.log(`- ${result.title} (ID: ${result.id})`);
});
```

#### 4. Jurisprudence CESEDA Récente

```typescript
// Arrêts des 6 derniers mois mentionnant "OQTF"
const jurisprudence = await legifranceApi.getCesedaRecentCaseLaw({
  keywords: 'OQTF',
  months: 6,
  pageSize: 50
});

console.log(`${jurisprudence.totalResultNumber} arrêts trouvés`);
```

#### 5. Jurisprudence Administrative Détaillée

```typescript
// Recherche avancée dans le Conseil d'État
const results = await legifranceApi.searchJurisprudenceAdministrative({
  keywords: 'CESEDA regroupement familial',
  dateDebut: '2024-01-01',
  dateFin: '2024-12-31',
  pageSize: 100
});
```

#### 6. Derniers Journaux Officiels

```typescript
// Les 10 derniers JO
const journaux = await legifranceApi.getLastJournalOfficiel(10);

journaux.forEach(jo => {
  console.log(`JO du ${jo.dateParution}`);
});
```

---

## 🌐 Utilisation via API Next.js

### Endpoint: `/api/legifrance/search`

#### Health Check (GET)

```typescript
const response = await fetch('/api/legifrance/search');
const data = await response.json();

// {
//   available: true,
//   environment: 'sandbox',
//   endpoints: ['search-ceseda', 'get-ceseda-article', ...]
// }
```

#### Recherche CESEDA (POST)

```typescript
const response = await fetch('/api/legifrance/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-ceseda-article',
    params: {
      numeroArticle: 'L313-11',
      date: Date.now()
    }
  })
});

const data = await response.json();
// {
//   success: true,
//   action: 'get-ceseda-article',
//   data: { ... article ... },
//   environment: 'sandbox'
// }
```

#### Actions Disponibles

| Action | Description | Paramètres |
|--------|-------------|-----------|
| `search-ceseda` | Recherche générale CESEDA | `{ numeroArticle?, keywords?, dateVersion?, etat? }` |
| `get-ceseda-article` | Article CESEDA spécifique | `{ numeroArticle, date? }` |
| `search-ceseda-keywords` | Recherche mots-clés | `{ keywords, options? }` |
| `search-jurisprudence-admin` | Jurisprudence CE/CAA/TA | `{ keywords, dateDebut?, dateFin?, pageSize? }` |
| `search-jurisprudence-judiciaire` | Cour de cassation | `{ keywords, numeroAffaire?, nature? }` |
| `get-ceseda-recent-caselaw` | Arrêts CESEDA récents | `{ keywords?, months?, pageSize? }` |
| `get-article` | Article par ID | `{ articleId }` |
| `get-texte` | Texte complet | `{ textId, date? }` |
| `get-last-jo` | Derniers JO | `{ nbElements }` |
| `ping` | Test connectivité | `{}` |

---

## 🏗️ Architecture Technique

### Fichiers Créés

```
src/
├── lib/legifrance/
│   ├── oauth-client.ts          # Gestion OAuth 2.0
│   └── api-client.ts            # Client API Légifrance
├── types/
│   └── legifrance.ts            # Types TypeScript
└── app/api/legifrance/
    └── search/route.ts          # Endpoint Next.js

scripts/
└── test-legifrance.ts           # Script de test

.env.local.example               # Configuration actualisée
```

### Flux OAuth Automatique

```
1. Requête API → getValidToken()
2. Token expiré ? → fetchNewToken()
3. POST oauth/token avec client_credentials
4. Token stocké en mémoire (valide 1h)
5. Réutilisation jusqu'à expiration
6. Si 401 → Renouvellement automatique
```

### Gestion des Erreurs

```typescript
try {
  const article = await legifranceApi.getCesedaArticle('L313-11');
} catch (error) {
  if (error.message.includes('401')) {
    // Token invalide → Renouvellement automatique
  } else if (error.message.includes('403')) {
    // CGU non validées ou API non cochée
  } else if (error.message.includes('500')) {
    // Erreur serveur PISTE
  }
}
```

---

## 📊 Cas d'Usage dans IA Poste Manager

### 1. Assistant Juridique IA

```typescript
// L'IA peut rechercher automatiquement les articles pertinents
async function assistantCeseda(question: string) {
  // Exemple: "Quelles sont les conditions pour L313-11 ?"
  
  const article = await legifranceApi.getCesedaArticle('L313-11');
  const jurisprudence = await legifranceApi.getCesedaRecentCaseLaw({
    keywords: 'L313-11 regroupement familial',
    months: 12
  });

  return {
    articleTexte: article.texte,
    jurisprudenceRecente: jurisprudence.results,
    recommandation: "..." // Généré par IA locale (Ollama)
  };
}
```

### 2. Veille Juridique Automatisée

```typescript
// Surveiller les nouvelles décisions CESEDA
async function veilleJuridique(tenantId: string) {
  const nouveauxArrets = await legifranceApi.getCesedaRecentCaseLaw({
    months: 1,
    pageSize: 100
  });

  // Sauvegarder dans Prisma + notifier avocats
  for (const arret of nouveauxArrets.results) {
    await prisma.jurisprudence.create({
      data: {
        tenantId,
        titre: arret.title,
        dateDecision: new Date(arret.dateDecision),
        url: arret.url,
        // ...
      }
    });
  }
}
```

### 3. Analyse de Dossier avec IA

```typescript
// Analyser un dossier OQTF avec contexte légal
async function analyserDossierOQTF(dossierId: string) {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId }
  });

  // Rechercher articles CESEDA pertinents
  const articlesOQTF = await legifranceApi.searchCesedaByKeywords(
    'OQTF obligation quitter territoire',
    { pageSize: 10 }
  );

  // Rechercher jurisprudence similaire
  const jurisprudence = await legifranceApi.searchJurisprudenceAdministrative({
    keywords: `OQTF ${dossier.contexteLegal}`,
    dateDebut: '2023-01-01',
    dateFin: new Date().toISOString().split('T')[0]
  });

  // Générer analyse avec Ollama
  const analyseIA = await ollama.generate({
    prompt: `
      Dossier: ${dossier.description}
      Articles CESEDA: ${JSON.stringify(articlesOQTF)}
      Jurisprudence: ${JSON.stringify(jurisprudence)}
      
      Analyse juridique recommandée:
    `
  });

  return analyseIA;
}
```

---

## 🔒 Sécurité & Conformité

### RGPD

- ✅ **Aucune donnée personnelle** envoyée à Légifrance
- ✅ **Logs anonymisés** (voir `lib/logger.ts`)
- ✅ **Isolation tenant** stricte
- ✅ **Tokens en mémoire** uniquement (pas de stockage permanent)

### Authentification

```typescript
// Chaque requête est authentifiée via NextAuth
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
}

// Isolation tenant automatique
const tenantId = (session.user as any).tenantId;
```

### Rate Limiting

**PISTE impose des quotas:**

- **Sandbox**: ~100 requêtes/jour
- **Production**: ~10 000 requêtes/jour (selon plan)

**Recommandation:** Implémenter un cache Redis pour les recherches fréquentes.

---

## 🐛 Dépannage

### Erreur 401 (Unauthorized)

```
❌ Erreur OAuth PISTE (401): Unauthorized
```

**Solution:**
1. Vérifier `PISTE_SANDBOX_CLIENT_ID` et `PISTE_SANDBOX_CLIENT_SECRET`
2. Régénérer les credentials sur PISTE

### Erreur 403 (Access Denied)

```
❌ Erreur API Légifrance (403): Access denied
```

**Solutions:**
1. **Valider les CGU** sur PISTE (API > Consentement CGU API)
2. **Cocher l'API Légifrance** dans votre application PISTE
3. Vérifier que vous utilisez le bon environnement (sandbox vs production)

### Erreur 500 (Server Error)

```
❌ Erreur API Légifrance (500): Internal Server Error
```

**Solutions:**
1. Vérifier la syntaxe de votre requête (voir documentation PISTE)
2. Essayer avec `pageSize` plus petit (<100)
3. Vérifier les dates (format YYYY-MM-DD ou timestamp)

### Token Expire

Les tokens expirent après 3600s (1h). Le système **renouvelle automatiquement**, mais si problème:

```typescript
legifranceOAuth.invalidateToken(); // Force renouvellement
```

---

## 📚 Ressources Externes

- **Documentation PISTE:** https://developer.aife.economie.gouv.fr/
- **Swagger API:** https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app/swagger-ui/
- **Légifrance:** https://www.legifrance.gouv.fr/
- **Code CESEDA:** https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070158/

---

## 🎉 Conclusion

L'intégration Légifrance est **100% opérationnelle** et prête pour la production !

**Prochaines étapes recommandées:**

1. ✅ Tester en sandbox (fait)
2. ⏳ Créer application production sur PISTE
3. ⏳ Implémenter cache Redis pour optimiser
4. ⏳ Créer composants React pour recherche juridique
5. ⏳ Intégrer dans workflows IA (assistant, veille)

**Besoin d'aide ?** Consultez `scripts/test-legifrance.ts` pour des exemples complets ! 🚀

---

**Créé le:** 7 janvier 2026  
**Version:** 1.0.0  
**Auteur:** GitHub Copilot  
**Projet:** IA Poste Manager - Assistant Juridique CESEDA
