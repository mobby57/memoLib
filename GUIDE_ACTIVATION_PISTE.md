# 🎯 GUIDE RAPIDE : Activer l'API Légifrance sur PISTE

**Date:** 7 janvier 2026  
**Durée estimée:** 5-10 minutes

---

## ✅ URLs CORRECTES

- **Portail principal PISTE** : https://piste.gouv.fr/
- **Portail AIFE (alternatif)** : https://aife.economie.gouv.fr/

⚠️ **NE PAS utiliser** : ~~developer.aife.economie.gouv.fr~~ (n'existe pas)

---

## 📋 PROCÉDURE ÉTAPE PAR ÉTAPE

### 1️⃣ Se Connecter

1. Allez sur **https://piste.gouv.fr/** dans votre navigateur
2. Cherchez le bouton **"Se connecter"**, **"Connexion"** ou **"Mon compte"**
3. Entrez vos identifiants PISTE (email + mot de passe utilisés lors de l'inscription)

### 2️⃣ Accéder à Vos Applications

Une fois connecté, cherchez dans le menu :
- **"Mes Applications"**
- **"Applications"**
- **"Tableau de bord"** → Applications

Vous devriez voir votre application créée le **07/01/2026 à 02:58**.

### 3️⃣ Vérifier Votre Application

Cliquez sur votre application. Vous devriez voir :
- **Nom de l'application** : [Votre nom d'app]
- **OAuth Client ID** : `d9b038a6-eeb2-497e-b257-dbeede483962`
- **Statut** : Actif
- **Date de création** : 07 janv. 2026 02:58

### 4️⃣ Catalogue d'API

Dans le menu principal, cherchez :
- **"Catalogue"**
- **"Catalogue d'API"**
- **"APIs disponibles"**
- **"Explorer les API"**

### 5️⃣ Trouver l'API Légifrance

Dans le catalogue, cherchez :
- **"Légifrance"**
- **"API Légifrance"**
- **"DILA"** (Direction de l'Information Légale et Administrative)

Cliquez sur la carte/tuile de l'API Légifrance.

### 6️⃣ Souscrire à l'API (ÉTAPE CRITIQUE)

Sur la page de l'API Légifrance :

1. **Bouton** : Cherchez **"Souscrire"**, **"S'abonner"**, **"Ajouter à mon application"**
2. **Sélection** : Choisissez votre application dans la liste déroulante
3. **✅ IMPORTANT** : Cochez la case **"J'accepte les CGU de l'API Légifrance"**
4. **Validation** : Cliquez sur **"Valider"**, **"Confirmer"** ou **"Souscrire"**

### 7️⃣ Vérification

Retournez dans **"Mes Applications"** → Votre application → Onglet **"APIs"** :

Vous devriez voir :
- **API Légifrance** listée
- **Statut** : **"Actif"** ou **"Autorisée"**

⚠️ Si le statut est **"En attente"**, l'activation nécessite une validation manuelle (comptez 24-48h).

---

## 🧪 TESTER IMMÉDIATEMENT

Une fois la souscription validée, testez immédiatement :

```bash
npx tsx scripts/diagnose-piste.ts
```

**Résultat attendu** :
```
✅ Environnement: PRODUCTION
✅ Token OAuth: Obtenu avec succès
✅ Connectivité API: API accessible (150+ résultats)
✅ Recherche CESEDA: 150 résultat(s) trouvé(s)
🎉 TOUT FONCTIONNE PARFAITEMENT!
```

---

## 🔍 NAVIGATION ALTERNATIVE

Si vous avez du mal à trouver les sections, voici d'autres chemins possibles :

### Chemin A (Menu classique)
1. Connexion
2. Tableau de bord
3. Applications → [Votre app]
4. Ajouter une API
5. Sélectionner "API Légifrance"

### Chemin B (Catalogue d'abord)
1. Connexion
2. Catalogue d'API
3. API Légifrance
4. Souscrire
5. Sélectionner votre application

### Chemin C (Recherche)
1. Connexion
2. Barre de recherche (si disponible)
3. Chercher "Légifrance"
4. Cliquer sur l'API
5. Souscrire

---

## ❓ PROBLÈMES FRÉQUENTS

### Problème 1 : "Catalogue d'API" introuvable

**Solution** : Le nom peut varier selon la version du portail :
- Essayez "APIs"
- Essayez "Services"
- Essayez "Produits"
- Cherchez une icône de grille/catalogue

### Problème 2 : API Légifrance introuvable

**Solution** :
- Utilisez la barre de recherche dans le catalogue
- Vérifiez les filtres (catégorie "Juridique", "Données publiques")
- Essayez de chercher "DILA"

### Problème 3 : Pas de bouton "Souscrire"

**Solutions possibles** :
- Vous êtes peut-être déjà souscrit → Vérifiez dans "Mes Applications" → "APIs"
- Votre compte n'a peut-être pas les droits → Vérifiez votre rôle (Admin requis)
- L'API nécessite une demande spéciale → Cherchez "Demander l'accès"

### Problème 4 : Statut "En attente" après souscription

**Actions** :
- C'est normal pour certaines APIs → Validation manuelle sous 24-48h
- Vérifiez vos emails (confirmation, validation requise)
- Si > 48h : Contactez le support

### Problème 5 : Erreur 403 après activation

**Vérifications** :
1. Attendez 5-10 minutes (propagation)
2. Vérifiez que le statut est bien "Actif" (pas "En attente")
3. Testez avec `npx tsx scripts/diagnose-piste.ts`
4. Si ça persiste : Contactez le support DILA

---

## 📞 BESOIN D'AIDE ?

### Support PISTE
- **Site** : https://piste.gouv.fr/
- Cherchez "Support", "Aide" ou "Contact" dans le menu
- Créez un ticket avec :
  - Votre nom/email
  - Application ID
  - OAuth Client ID : `d9b038a6-eeb2-497e-b257-dbeede483962`
  - Problème rencontré

### Support DILA (API Légifrance)
- **Email** : retours-legifrance-modernise@dila.gouv.fr
- **Objet** : "Demande d'accès API Légifrance"
- **Inclure** :
  - Cas d'usage : Assistant juridique CESEDA pour avocats
  - OAuth Client ID
  - Erreur rencontrée (403 après token OAuth valide)

---

## 📸 CAPTURES D'ÉCRAN (si besoin d'aide)

Si vous êtes bloqué, faites des captures d'écran de :
1. Page d'accueil après connexion (menu principal)
2. Page "Mes Applications" (liste des apps)
3. Page de votre application (détails)
4. Catalogue d'API (liste des APIs disponibles)

Et partagez-les pour assistance détaillée.

---

## ✅ CHECKLIST FINALE

Avant de dire que c'est terminé :

- [ ] Connecté sur https://piste.gouv.fr/
- [ ] Application visible dans "Mes Applications"
- [ ] OAuth Client ID vérifié : `d9b038a6...`
- [ ] Catalogue d'API accessible
- [ ] API Légifrance trouvée
- [ ] Bouton "Souscrire" cliqué
- [ ] CGU acceptées ✅
- [ ] Confirmation de souscription reçue
- [ ] Statut "Actif" dans "Mes Applications" → "APIs"
- [ ] Test diagnostic : `npx tsx scripts/diagnose-piste.ts`
- [ ] Résultat : ✅ Tous les tests passent

---

**Bonne chance ! 🚀**

Une fois l'activation faite, vous aurez accès à toute la base CESEDA pour votre assistant juridique ! 🎉
