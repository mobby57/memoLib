# 🧪 Guide de Test Utilisateur - memoLib Production

## ✅ Prérequis Vérifiés

Tous les services sont opérationnels:
- ✅ App accessible: https://memolib.fly.dev
- ✅ Base de données: Neon PostgreSQL connectée
- ✅ Authentification: NextAuth configuré
- ✅ Email: Serveur configuré
- ✅ OAuth GitHub: Client ID et Secret déployés

---

## 🚀 Parcours de Test Complet

### 1. **Page d'Accueil**
📍 **URL:** https://memolib.fly.dev/fr

**Ce que vous verrez:**
- Page d'accueil de l'application
- Navigation principale
- Boutons de connexion/inscription

**Test:**
```
✓ La page charge en moins de 2 secondes
✓ Aucune erreur console
✓ Design responsive
```

---

### 2. **Inscription - Option 1: Par Email** 
📍 **URL:** https://memolib.fly.dev/fr/register

**Étapes:**
1. Cliquez sur "S'inscrire" ou "Register"
2. Entrez votre email
3. Cliquez sur "Envoyer un lien magique" (magic link)
4. Consultez votre boîte email
5. Cliquez sur le lien de connexion

**Attendu:**
- ✅ Email reçu dans les 2-5 minutes
- ✅ Lien de connexion valide 24h
- ✅ Redirection automatique après clic
- ✅ Session créée automatiquement

---

### 3. **Inscription - Option 2: Via GitHub**
📍 **URL:** https://memolib.fly.dev/fr/login

**Étapes:**
1. Cliquez sur "Connexion avec GitHub"
2. Autorisez l'application GitHub (première fois)
3. Redirection automatique vers le dashboard

**Attendu:**
- ✅ OAuth GitHub fonctionne
- ✅ Profil créé automatiquement
- ✅ Avatar GitHub importé
- ✅ Accès au dashboard

---

### 4. **Dashboard Utilisateur**
📍 **URL:** https://memolib.fly.dev/fr/dashboard

**Fonctionnalités à tester:**

#### 📁 Gestion de Dossiers
- [ ] Créer un nouveau dossier
- [ ] Voir la liste des dossiers
- [ ] Rechercher dans les dossiers
- [ ] Modifier un dossier
- [ ] Supprimer un dossier

#### 📄 Documents
- [ ] Upload un document (PDF, DOCX, etc.)
- [ ] Voir les métadonnées du document
- [ ] Télécharger le document
- [ ] Supprimer un document

#### 👤 Gestion du Profil
- [ ] Modifier les informations personnelles
- [ ] Changer la photo de profil
- [ ] Paramètres de confidentialité

#### 💳 Abonnement (si activé)
- [ ] Voir les plans tarifaires
- [ ] Souscrire à un abonnement
- [ ] Gérer le paiement via Stripe

---

## 🧪 Tests Fonctionnels Détaillés

### Test 1: Création de Dossier Client
```
1. Dashboard → "Nouveau Dossier"
2. Remplir le formulaire:
   - Nom du client
   - Type de dossier (civil, pénal, etc.)
   - Date d'ouverture
3. Cliquer sur "Créer"
4. Vérifier:
   ✓ Dossier apparaît dans la liste
   ✓ Numéro de dossier généré automatiquement
   ✓ Statut = "Ouvert"
```

### Test 2: Upload de Document
```
1. Ouvrir un dossier existant
2. Onglet "Documents" → "Ajouter un document"
3. Sélectionner un fichier (PDF de test)
4. Ajouter métadonnées:
   - Type de document (Requête, Jugement, etc.)
   - Date du document
5. Cliquer sur "Télécharger"
6. Vérifier:
   ✓ Document visible dans la liste
   ✓ Prévisualisation disponible
   ✓ Téléchargement fonctionne
```

### Test 3: Recherche et Filtres
```
1. Dashboard → Barre de recherche
2. Taper le nom d'un client ou n° de dossier
3. Appliquer des filtres:
   - Type de dossier
   - Statut
   - Date de création
4. Vérifier:
   ✓ Résultats pertinents
   ✓ Filtres appliqués correctement
   ✓ Pagination fonctionne
```

### Test 4: Calendrier et Échéances
```
1. Navigation → "Calendrier"
2. Voir les événements/audiences planifiés
3. Créer une nouvelle échéance:
   - Titre: "Audience de jugement"
   - Date et heure
   - Lier à un dossier
4. Vérifier:
   ✓ Événement affiché dans le calendrier
   ✓ Notification créée
   ✓ Synchronisation avec le dossier
```

---

## 🔐 Test de Sécurité

### Permissions et Accès
- [ ] Tenter d'accéder au dashboard sans connexion → Redirection vers login ✓
- [ ] Tenter d'accéder au dossier d'un autre utilisateur → 403 Forbidden ✓
- [ ] Déconnexion → Session effacée correctement ✓
- [ ] Token JWT expiré → Re-authentification requise ✓

### RGPD et Données Personnelles
- [ ] Politique de confidentialité visible
- [ ] Consentement cookies demandé
- [ ] Option "Supprimer mon compte" disponible
- [ ] Export de données personnelles

---

## 📊 Tests de Performance

### Temps de Chargement
```
Page d'accueil:     < 2 secondes
Dashboard:          < 3 secondes
Liste dossiers:     < 2 secondes
Upload document:    Dépend de la taille (progress bar visible)
```

### Limites à Tester
```
- Nombre max de dossiers: Illimité (mais pagination par 20)
- Taille max fichier: Vérifier dans settings (probablement 10-50 MB)
- Documents par dossier: Illimité
- Recherche simultanée: Fonctionne avec rate limiting
```

---

## 🐛 Points à Surveiller

### Erreurs Communes Possibles

**1. Email non reçu (Magic Link)**
- Vérifier spam/courrier indésirable
- Attendre jusqu'à 5 minutes
- Vérifier que l'email est correct
- Si problème persiste: Utiliser GitHub OAuth

**2. Erreur lors de l'upload**
- Vérifier la taille du fichier
- Vérifier le format (PDF, DOCX acceptés)
- Vérifier la connexion internet
- Logs: Voir console navigateur (F12)

**3. Dashboard ne charge pas**
- Vérifier que vous êtes connecté
- Recharger la page (Ctrl+F5)
- Vider le cache navigateur
- Vérifier https://memolib.fly.dev/api/health

**4. Session expirée rapidement**
- Normal après 7 jours d'inactivité
- Se reconnecter simplement

---

## 🔍 Vérifications Techniques

### Console Navigateur (F12)
```javascript
// Vérifier qu'il n'y a pas d'erreurs rouges
// Warnings jaunes acceptables

// Vérifier les cookies
document.cookie // Devrait contenir next-auth.session-token

// Vérifier le local storage
localStorage.getItem('theme') // dark ou light
```

### Network Tab
```
✓ API calls en HTTPS
✓ Status 200 pour /api/auth/session
✓ Status 200 pour /api/health
✓ Pas de 500 errors
```

---

## 📝 Rapport de Bug (si nécessaire)

Si vous rencontrez un problème, notez:

```markdown
**Environnement:**
- Navigateur: [Chrome/Firefox/Safari] + Version
- OS: [Windows/Mac/Linux]
- URL exacte: 
- Date/Heure: 

**Étapes pour reproduire:**
1. 
2. 
3. 

**Erreur observée:**
[Screenshot ou message d'erreur]

**Console logs:**
[Copier les erreurs de F12 → Console]

**Network errors:**
[Copier de F12 → Network → Failed requests]
```

---

## ✅ Checklist Finale de Test

### Fonctionnalités Essentielles
- [ ] Inscription fonctionne (email OU GitHub)
- [ ] Connexion fonctionne
- [ ] Dashboard accessible
- [ ] Créer un dossier
- [ ] Upload document
- [ ] Recherche fonctionne
- [ ] Données persistées (recharger la page)
- [ ] Déconnexion fonctionne

### Fonctionnalités Avancées
- [ ] Calendrier/Échéances
- [ ] Notifications
- [ ] Facturation (si abonnement)
- [ ] Export de données
- [ ] Partage de dossiers (si multi-user)
- [ ] Mobile responsive

### Expérience Utilisateur
- [ ] Interface intuitive
- [ ] Pas de bugs bloquants
- [ ] Messages d'erreur clairs
- [ ] Feedbacks visuels (loading, succès, erreur)
- [ ] Navigation fluide

---

## 🆘 Support

**Si vous rencontrez un problème:**

1. Vérifier la section "Points à Surveiller" ci-dessus
2. Consulter les logs Fly.io:
   ```bash
   fly logs -a memolib
   ```
3. Vérifier le status de l'app:
   ```bash
   fly status
   ```
4. Redémarrer les machines si nécessaire:
   ```bash
   fly machines restart <machine-id>
   ```

**URLs utiles:**
- App: https://memolib.fly.dev
- Health Check: https://memolib.fly.dev/api/health
- Monitoring: https://fly.io/apps/memolib/monitoring

---

## 🎉 Bon Test!

L'application est **LIVE** et **PRÊTE** à être utilisée. Vous pouvez vous inscrire et tester toutes les fonctionnalités comme un vrai utilisateur!

**Recommandation:** Commencez par créer un compte test avec un email temporaire (ex: yourname+test@gmail.com) pour ne pas polluer votre compte principal.

**Session de test suggérée:** 30-45 minutes pour tester toutes les fonctionnalités principales.
