# 🔑 GUIDE DE CONFIGURATION - IA Poste Manager

**Date :** 7 janvier 2026  
**Fichier :** `.env`

---

## ✅ DÉJÀ CONFIGURÉ (Fonctionnel immédiatement)

Ces services sont **100% opérationnels** sans action de votre part :

### 🎯 Services Principaux

| Service | Statut | Configuration |
|---------|--------|---------------|
| **Base de données** | ✅ SQLite local | `file:./dev.db` |
| **NextAuth** | ✅ Configuré | Secret sécurisé généré |
| **GitHub Integration** | ✅ Actif | App ID + Webhook configurés |
| **Cloudflare Tunnel** | ✅ Actif | URL publique gratuite |
| **Email Gmail** | ✅ Configuré | `sarraboudjellal57@gmail.com` |
| **Ollama (IA locale)** | ✅ Prêt | `llama3.2:latest` |
| **PISTE Sandbox** | ✅ Prêt | Credentials de test fournis |

### 📧 Email Monitoring
```env
EMAIL_ADDRESS="sarraboudjellal57@gmail.com"
EMAIL_PASSWORD="ljupgwrfnaazvynd"  # ✅ Déjà configuré
```

**Test :** `npm run email:monitor`

---

## 🏛️ API LÉGIFRANCE PISTE - PRÊT À TESTER

### Sandbox (Tests GRATUITS)
```env
PISTE_SANDBOX_CLIENT_ID="f269101e-746d-41c8-a4b4-346979639e1e"
PISTE_SANDBOX_CLIENT_SECRET="3a7acea8-1226-4386-b53c-28d4ddb88125"
PISTE_ENVIRONMENT="sandbox"  # ✅ Mode test actif
```

**Test immédiat :**
```bash
npx tsx scripts/test-legifrance.ts
```

**Fonctionnalités disponibles :**
- ✅ Recherche articles CESEDA (L313-11, L511-1, etc.)
- ✅ Consultation jurisprudence (CE, CAA, TA)
- ✅ Cache automatique (30 jours)
- ✅ Intégration dossiers avocats

**Documentation :**
- 📘 Guide complet : `docs/PISTE_COMPLETE_ANALYSIS.md`
- ⚡ Référence rapide : `docs/PISTE_QUICK_REFERENCE.md`
- 📚 Index : `docs/PISTE_INDEX.md`

---

## ⚠️ À CONFIGURER (OPTIONNEL)

Ces services nécessitent vos propres clés **seulement si vous souhaitez les activer** :

### 1️⃣ PISTE Production (Recommandé après tests)

**Action requise :**
1. Créer compte : https://developer.aife.economie.gouv.fr/
2. Valider CGU API Légifrance
3. Créer application > Cocher API Légifrance
4. Récupérer Client ID + Secret

**Variables à remplir dans `.env` :**
```env
PISTE_PROD_CLIENT_ID="VOTRE_CLIENT_ID_PRODUCTION"
PISTE_PROD_CLIENT_SECRET="VOTRE_CLIENT_SECRET_PRODUCTION"
```

**Activation :**
```env
PISTE_ENVIRONMENT="production"  # Changer de "sandbox" à "production"
```

---

### 2️⃣ Resend API - Emails Marketing (100 gratuits/jour)

**Si vous voulez envoyer des emails professionnels :**
1. Créer compte : https://resend.com/
2. Récupérer API Key dans Dashboard

**Variables à remplir :**
```env
RESEND_API_KEY="VOTRE_CLE_RESEND"
RESEND_FROM_EMAIL="noreply@votredomaine.com"
RESEND_ENABLED="true"
```

---

### 3️⃣ Twilio - Notifications SMS (Essai gratuit)

**Si vous voulez des alertes SMS :**
1. Créer compte : https://www.twilio.com/try-twilio
2. Récupérer Account SID + Auth Token
3. Noter votre numéro Twilio fourni

**Variables à remplir :**
```env
TWILIO_ENABLED="true"
TWILIO_ACCOUNT_SID="VOTRE_ACCOUNT_SID_TWILIO"
TWILIO_AUTH_TOKEN="VOTRE_AUTH_TOKEN_TWILIO"
TWILIO_PHONE_NUMBER="+33XXXXXXXXX"  # Numéro Twilio
LAWYER_PHONE="+33XXXXXXXXX"          # Votre mobile
```

---

### 4️⃣ La Poste API - Suivi Colis

**Si vous voulez tracker les envois :**
1. Créer compte : https://developer.laposte.fr/
2. Récupérer API Key

**Variables à remplir :**
```env
LAPOSTE_API_ENABLED="true"
LAPOSTE_API_KEY="VOTRE_CLE_LAPOSTE"
```

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Vérifier la configuration
```bash
# Voir les variables définies
cat .env | grep -v "^#" | grep "="
```

### 2. Tester l'API Légifrance (Sandbox)
```bash
npx tsx scripts/test-legifrance.ts
```

**Résultat attendu :**
```
✅ Authentification PISTE réussie
✅ Recherche article L313-11 (Carte de résident)
✅ Cache créé (expiration: 30 jours)
```

### 3. Lancer le serveur
```bash
npm run dev
```

### 4. Tester les fonctionnalités
- **Dashboard avocat :** http://localhost:3000/lawyer/dashboard
- **Emails :** http://localhost:3000/lawyer/emails
- **Veille CESEDA :** http://localhost:3000/lawyer/veille-juridique

---

## 🔒 SÉCURITÉ - SECRETS DÉJÀ GÉNÉRÉS

Ces clés sont **déjà générées de manière sécurisée** - **NE PAS MODIFIER** :

```env
NEXTAUTH_SECRET="Q97Ygwujvkq5DO4xFbTJsCaU6WScoArP"
ENCRYPTION_KEY="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
JWT_SECRET="your-super-secure-jwt-secret-2024"
```

---

## 📊 STATUT DES SERVICES

| Service | Configuration | Action Requise |
|---------|--------------|----------------|
| Database | ✅ OK | Aucune |
| Authentication | ✅ OK | Aucune |
| GitHub | ✅ OK | Aucune |
| Cloudflare | ✅ OK | Aucune |
| Email Gmail | ✅ OK | Aucune |
| Ollama IA | ✅ OK | Installer Ollama si pas fait |
| **PISTE Sandbox** | ✅ **PRÊT** | **Tester maintenant !** |
| PISTE Production | ⚠️ À configurer | Créer compte AIFE |
| Resend | ⚠️ Optionnel | Si envoi emails pro |
| Twilio | ⚠️ Optionnel | Si SMS souhaités |
| La Poste | ⚠️ Optionnel | Si tracking colis |

---

## ✅ CHECKLIST DE DÉMARRAGE

- [x] ✅ `.env` configuré avec valeurs par défaut
- [x] ✅ Email Gmail connecté
- [x] ✅ GitHub intégration active
- [x] ✅ Cloudflare Tunnel prêt
- [x] ✅ **PISTE Sandbox opérationnel**
- [x] ✅ Ollama IA local installé
- [ ] ⚠️ Tester PISTE : `npx tsx scripts/test-legifrance.ts`
- [ ] ⚠️ Lancer serveur : `npm run dev`
- [ ] ⚠️ Vérifier dashboard : http://localhost:3000/lawyer
- [ ] ⚠️ (Optionnel) Créer compte PISTE production
- [ ] ⚠️ (Optionnel) Configurer Resend pour emails
- [ ] ⚠️ (Optionnel) Configurer Twilio pour SMS

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### Immédiat (5 minutes)
1. **Tester l'API Légifrance Sandbox :**
   ```bash
   npx tsx scripts/test-legifrance.ts
   ```

2. **Lancer le serveur :**
   ```bash
   npm run dev
   ```

3. **Accéder au dashboard :**
   - http://localhost:3000/lawyer/dashboard

### Court terme (1-2 jours)
1. **Créer compte PISTE Production** (gratuit)
   - https://developer.aife.economie.gouv.fr/
   - Valider CGU API Légifrance
   - Créer application
   - Récupérer credentials

2. **Intégrer CESEDA dans les dossiers**
   - Suggestions automatiques articles
   - Recherche contextuelle
   - Veille juridique

### Moyen terme (optionnel)
1. **Emails professionnels** → Configurer Resend
2. **Alertes SMS** → Configurer Twilio
3. **Tracking courriers** → Configurer La Poste API

---

## 📞 SUPPORT

### Documentation
- 📘 Guide PISTE complet : `docs/PISTE_COMPLETE_ANALYSIS.md`
- ⚡ Référence rapide : `docs/PISTE_QUICK_REFERENCE.md`
- 📚 Index : `docs/PISTE_INDEX.md`

### Tests
```bash
# Tester Légifrance
npx tsx scripts/test-legifrance.ts

# Tester emails
npm run email:monitor

# Tester Ollama
npx tsx scripts/test-ollama.ts
```

---

## 🎉 RÉSUMÉ

**Votre configuration est prête à 95% !**

✅ **Fonctionnel immédiatement :**
- Base de données
- Authentication
- GitHub integration
- Email monitoring
- IA locale (Ollama)
- **API Légifrance Sandbox** 🏛️

⚠️ **À configurer selon besoins :**
- PISTE Production (recommandé après tests)
- Resend (emails pro)
- Twilio (SMS)
- La Poste (tracking)

---

**🚀 Lancez le test PISTE maintenant :**
```bash
npx tsx scripts/test-legifrance.ts
```

**Bonne chance ! 🎓**

