# 📋 ANALYSE CGU API LÉGIFRANCE - RAPPORT COMPLET

**Date:** 7 janvier 2026  
**Document analysé:** CGU_Legifrance_API_VF_15-12-2022.pdf (9 pages, 21 086 caractères)

---

## 🎯 RÉSULTAT PRINCIPAL : Processus d'Activation Identifié

### ✅ **2 ÉTAPES OBLIGATOIRES POUR ACCÉDER À L'API**

D'après la **section III.3** des CGU :

> **Conditions d'accès à PISTE et à l'API Légifrance**
> 
> Pour accéder à l'API Légifrance, vous devez :
> 
> 1. **S'inscrire sur PISTE et accepter les CGU de PISTE** ✅ (FAIT)
> 2. **Choisir d'utiliser l'API Légifrance dans le catalogue d'API de PISTE et accepter les CGU de l'API Légifrance** ❌ (À FAIRE)

---

## 🚨 DIAGNOSTIC DE VOTRE SITUATION

### Statut Actuel

| Étape | Requis | Votre Statut | Action |
|-------|--------|--------------|--------|
| 1. Inscription PISTE | ✅ Obligatoire | ✅ **COMPLÉTÉE** | Compte créé le 07/01/2026 |
| 2. CGU PISTE | ✅ Obligatoire | ✅ **ACCEPTÉES** | Lors de l'inscription |
| 3. Application créée | ✅ Obligatoire | ✅ **CRÉÉE** | OAuth Client ID : d9b038a6... |
| 4. **Souscription API Légifrance** | ✅ **OBLIGATOIRE** | ❌ **MANQUANTE** | **CRITIQUE** |
| 5. **CGU API Légifrance** | ✅ **OBLIGATOIRE** | ❌ **NON ACCEPTÉES** | **BLOQUANT** |

### 🔴 Problème Identifié

**Vous avez créé une application PISTE avec des identifiants OAuth, mais vous n'avez PAS souscrit à l'API Légifrance depuis le catalogue d'API.**

C'est pourquoi vous obtenez **403 Forbidden** malgré un token OAuth valide :
- ✅ OAuth fonctionne (token obtenu)
- ❌ L'application n'est pas autorisée à utiliser l'API Légifrance

---

## 📝 PROCÉDURE EXACTE POUR ACTIVER L'API

### Étape 1 : Accéder au Catalogue d'API

1. Connectez-vous à : **https://piste.gouv.fr/** ou **https://aife.economie.gouv.fr/**
2. Cliquez sur **"Catalogue d'API"** ou **"Explorer les API"**

### Étape 2 : Trouver l'API Légifrance

3. Recherchez **"API Légifrance"** dans le catalogue
4. Cliquez sur la carte/tuile de l'API Légifrance

### Étape 3 : Souscrire à l'API

5. Sur la page de l'API, trouvez le bouton **"Souscrire"** ou **"S'abonner"** ou **"Demander l'accès"**
6. Sélectionnez votre application : **[Nom de votre application]**
   - Client ID OAuth : `d9b038a6-eeb2-497e-b257-dbeede483962`
7. **IMPORTANT** : Cochez la case **"J'accepte les CGU de l'API Légifrance"**
8. Cliquez sur **"Valider"** ou **"Confirmer la souscription"**

### Étape 4 : Vérification

9. Vous devriez voir un message de confirmation
10. Dans **"Mes Applications"** → Sélectionnez votre application
11. Allez dans l'onglet **"APIs"** ou **"Mes APIs"**
12. **Vérifiez que "API Légifrance" apparaît dans la liste des API autorisées**

---

## 📊 STATISTIQUES DES CGU

### Mots-clés Trouvés

| Terme | Occurrences | Importance |
|-------|-------------|------------|
| API | 88 | ⭐⭐⭐⭐⭐ |
| CGU | 40 | ⭐⭐⭐⭐⭐ |
| accès | 11 | ⭐⭐⭐⭐ |
| droit | 8 | ⭐⭐⭐ |
| conditions | 7 | ⭐⭐⭐ |
| quota | 6 | ⭐⭐ |
| OAuth | 4 | ⭐⭐⭐⭐ |
| acceptation | 3 | ⭐⭐⭐⭐⭐ |
| authentification | 2 | ⭐⭐⭐ |
| délai | 1 | ⭐ |
| limite | 1 | ⭐ |

### Points Clés Extraits

1. **Authentification** : "L'accès à l'API Légifrance est réalisé via PISTE, après authentification par le protocole OAuth 2.0"
   - ✅ Vous avez déjà implémenté cela correctement

2. **Quotas** : "Ces quotas ont pour but de limiter par seconde / minute / jour"
   - ⚠️ L'API a des limites de taux (rate limiting)
   - Vous devrez vérifier ces quotas après activation

3. **Disponibilité** : "Engagement de service de 95% par jour sur l'environnement de production"
   - L'API peut avoir des temps d'arrêt planifiés

4. **Identifiants** : "Les Utilisateurs sont responsables des identifiants utilisés pour accéder à l'API"
   - Sécurité de vos OAuth credentials importante

5. **Acceptation en deux temps** : "Information de l'Utilisateur et son acceptation des CGU, celle-ci est faite en deux temps"
   - Confirme le processus en 2 étapes : CGU PISTE + CGU API

---

## 🎯 ACTIONS IMMÉDIATES

### 1️⃣ Priorité Absolue : Souscrire à l'API

```
🔗 URL : https://piste.gouv.fr/ (ou https://aife.economie.gouv.fr/)
📋 Action : Catalogue → API Légifrance → Souscrire
✅ Sélectionner : Votre application (d9b038a6...)
☑️  Accepter : CGU API Légifrance
```

### 2️⃣ Après Souscription : Re-tester

```bash
npx tsx scripts/test-legifrance.ts
```

**Résultat attendu :**
```
✅ Token OAuth obtenu : eyJ...
✅ Recherche CESEDA réussie
✅ 15 résultats trouvés
✅ Cache mis à jour
```

### 3️⃣ Si Toujours 403 : Vérifier dans le Portail

- Allez dans **Mes Applications** → **[Votre app]** → **Onglet "APIs"**
- **API Légifrance** doit être listée avec statut **"Actif"** ou **"Autorisée"**
- Si statut **"En attente"** → Approbation manuelle nécessaire (contacter support)

---

## 📞 SUPPORT SI PROBLÈME PERSISTE

### Contact DILA (Direction de l'Information Légale et Administrative)

- **Email** : retours-legifrance-modernise@dila.gouv.fr
- **Objet** : "Demande d'accès API Légifrance - Application [Votre ID]"
- **Inclure** :
  - Votre nom/société
  - Application ID/Nom
  - OAuth Client ID : `d9b038a6-eeb2-497e-b257-dbeede483962`
  - Description cas d'usage : "Assistant juridique pour avocats CESEDA"
  - Erreur rencontrée : "403 Forbidden malgré token OAuth valide"

### Portail PISTE

- **Site principal** : https://piste.gouv.fr/ ou https://aife.economie.gouv.fr/
- **Section Support** : Chercher "Support" ou "Aide" dans le menu
- Créer un ticket avec les mêmes informations

---

## 🔐 INFORMATIONS COMPLÉMENTAIRES DES CGU

### Sécurité Requise

D'après **Section III.3** :
> "Les identifiants doivent respecter l'état de l'art en matière de sécurité informatique et en particulier, les recommandations de la CNIL et de l'ANSSI."

✅ Vos credentials OAuth sont déjà sécurisées (stockées dans .env)

### Compromission d'Identifiants

**Section V.3** :
> "Compromission de vos identifiants OAuth ou d'accès à PISTE"

En cas de fuite :
1. Révoquer immédiatement dans le portail
2. Générer de nouveaux credentials
3. Mettre à jour votre .env

### Quotas et Limites

L'API impose des quotas **par seconde / minute / jour**.

Après activation, vérifiez :
- Limite de requêtes/seconde
- Limite de requêtes/minute  
- Limite de requêtes/jour

Dans votre code, implémentez :
- Retry avec backoff exponentiel
- Cache (déjà fait avec `LegifranceCache`)
- Rate limiting côté client

---

## ✅ CHECKLIST FINALE

Avant de re-tester, vérifiez :

- [ ] Connecté à https://piste.gouv.fr/ (ou https://aife.economie.gouv.fr/)
- [ ] Catalogue d'API accessible
- [ ] API Légifrance trouvée
- [ ] Bouton "Souscrire" cliqué
- [ ] Application sélectionnée (d9b038a6...)
- [ ] **CGU API Légifrance cochées** ✅
- [ ] Confirmation de souscription reçue
- [ ] API visible dans "Mes Applications" → "APIs"
- [ ] Statut = "Actif" (pas "En attente")

---

## 🎉 PROCHAINES ÉTAPES (APRÈS ACTIVATION)

Une fois l'accès accordé :

1. **Tester avec le script** :
   ```bash
   npx tsx scripts/test-legifrance.ts
   ```

2. **Intégrer dans l'interface** :
   - Page : `/lawyer/veille-juridique`
   - Recherche CESEDA fonctionnelle
   - Cache opérationnel

3. **Documenter les quotas** :
   - Noter les limites découvertes
   - Adapter le code si nécessaire

4. **Monitoring** :
   - Logs des requêtes API
   - Alertes si quota proche
   - Métriques d'utilisation

---

## 📌 RÉSUMÉ EN 3 POINTS

1. **Vous avez OAuth ✅** mais **pas la souscription API ❌**
2. **Action requise** : Aller dans le **Catalogue d'API PISTE** → Souscrire à **API Légifrance** → **Accepter les CGU**
3. **Résultat attendu** : 403 disparaît → Recherches CESEDA fonctionnelles

---

**Créé le 7 janvier 2026 à partir de l'analyse officielle des CGU API Légifrance v15-12-2022**
