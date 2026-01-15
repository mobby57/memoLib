# 🔑 Configuration PISTE API - Guide Complet

## ❌ Erreur actuelle

```
invalid_client: Client authentication failed
```

**Traduction** : Les credentials (API Key/Secret) ne sont pas valides ou pas associés à une application PISTE.

---

## ✅ Procédure COMPLÈTE (étape par étape)

### 1️⃣ Créer un compte PISTE ✅ (FAIT)

🌐 <https://developer.aife.economie.gouv.fr/>

- Créer compte utilisateur
- Valider email

**Status** : ✅ Vous avez déjà fait cette étape

---

### 2️⃣ Créer une APPLICATION

1. **Se connecter** : <https://developer.aife.economie.gouv.fr/>
2. **Aller dans "Mes Applications"** (menu gauche)
3. **Cliquer "Nouvelle Application"**
4. **Remplir le formulaire** :

```
Nom de l'application : IA Poste Manager - CESEDA
Description : Assistant juridique pour cabinets d'avocats - Consultation CESEDA
Type d'application : Backend/API
Environnement : Production
URL de callback : http://localhost:3000/api/auth/callback/piste
```

5. **Soumettre** → Vous obtenez :
   - ✅ **Client ID** (= API Key)
   - ✅ **Client Secret** (= API Secret)

---

### 3️⃣ Activer l'API Légifrance

1. **Aller dans "Mes Applications"**
2. **Cliquer sur votre application** (IA Poste Manager)
3. **Onglet "APIs"**
4. **Cocher ☑️ "API Légifrance"**
5. **Sauvegarder**

---

### 4️⃣ Accepter les CGU de l'API Légifrance

1. **Toujours dans votre application**
2. **Section "API Légifrance"**
3. **Bouton "Consentement CGU API"**
4. **Lire et Accepter** les Conditions Générales d'Utilisation
5. **Valider**

---

### 5️⃣ Récupérer les VRAIES credentials

1. **Dans votre application PISTE**
2. **Section "Credentials"** ou "Clés d'API"
3. **Copier** :
   - **Client ID** (format : `704d09b0-cf1f-4baa-b628-2026c9de2010`)
   - **Client Secret** (format : `03309b6d-bcc0-46b9-86d8-061c30352419`)

**IMPORTANT** : Ces credentials doivent être associées à l'application qui a l'API Légifrance activée.

---

### 6️⃣ Mettre à jour .env

Remplacer dans `.env` :

```env
# PISTE Production (LÉGIFRANCE)
PISTE_PROD_CLIENT_ID="VOTRE_CLIENT_ID_DEPUIS_APPLICATION_PISTE"
PISTE_PROD_CLIENT_SECRET="VOTRE_CLIENT_SECRET_DEPUIS_APPLICATION_PISTE"
PISTE_PROD_OAUTH_URL="https://oauth.piste.gouv.fr/api/oauth/token"
PISTE_PROD_API_URL="https://api.piste.gouv.fr/dila/legifrance/lf-engine-app"

# Environnement actif
PISTE_ENVIRONMENT="production"
```

---

### 7️⃣ Tester

```bash
npx tsx scripts/test-legifrance.ts
```

**Résultat attendu** :

```
✅ Token OAuth PISTE obtenu (production). Expire dans 3600s
✅ Test recherche simple
   Résultats : 10 articles CESEDA
✅ Test recherche article spécifique
   Article L313-11 trouvé
✅ Cache Prisma
   Entry sauvegardée : xxxxxxx
```

---

## 🔍 Diagnostic des erreurs

### Erreur 400 `invalid_client`

❌ **Problème** : Credentials non reconnus

✅ **Solutions** :

1. Vérifier que vous avez créé une **Application** (pas juste un compte)
2. Vérifier que l'API Légifrance est **cochée** sur cette application
3. Vérifier que vous utilisez les credentials de **cette application**
4. Attendre 2-5 minutes après activation API (propagation)

### Erreur 403 `Forbidden`

❌ **Problème** : Token OK mais accès API refusé

✅ **Solutions** :

1. Accepter les **CGU de l'API Légifrance**
2. Vérifier que l'API Légifrance est **activée** sur l'application
3. Vérifier que vous êtes en environnement **production** (pas sandbox)

---

## 📋 Checklist de validation

- [ ] Compte PISTE créé
- [ ] Application PISTE créée (nom: "IA Poste Manager")
- [ ] API Légifrance cochée sur l'application
- [ ] CGU API Légifrance acceptés
- [ ] Client ID copié depuis l'application
- [ ] Client Secret copié depuis l'application
- [ ] .env mis à jour avec ces credentials
- [ ] Environnement = "production"
- [ ] Test lancé : `npx tsx scripts/test-legifrance.ts`

---

## 💡 Liens utiles

- **Portail PISTE** : <https://developer.aife.economie.gouv.fr/>
- **Documentation API Légifrance** : <https://developer.aife.economie.gouv.fr/apis/legifrance>
- **Catalogue APIs PISTE** : <https://developer.aife.economie.gouv.fr/apis>
- **Support PISTE** : <https://developer.aife.economie.gouv.fr/support>

---

## ❓ Questions fréquentes

### Q: J'ai un Client ID/Secret mais erreur 400 ?

**R**: Vos credentials viennent probablement du compte PISTE général, pas d'une application avec API Légifrance activée. Il faut :

1. Créer une **Application** dans "Mes Applications"
2. Activer **API Légifrance** sur cette application
3. Utiliser les credentials de **cette application**

### Q: Quelle est la différence entre API Key et Client ID ?

**R**: C'est la **même chose** ! PISTE utilise parfois "API Key" mais OAuth utilise "Client ID". Dans le code :

```
PISTE_PROD_CLIENT_ID = Votre API Key
PISTE_PROD_CLIENT_SECRET = Votre API Secret
```

### Q: Sandbox vs Production ?

**R**: 
- **Sandbox** : Environnement de test, credentials exemple non-fonctionnelles
- **Production** : Environnement réel, nécessite compte + application + API activée

Pour IA Poste Manager : utilisez **Production** avec vraie application.

---

**Créé le** : 7 janvier 2026  
**Version** : 1.0
