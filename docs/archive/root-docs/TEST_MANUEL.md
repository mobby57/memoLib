# ✅ TEST MANUEL - Parcours Premier Client

## 🚀 DÉMARRAGE (2 min)

### 1. Vérifier que l'API fonctionne
```bash
# Ouvrir un navigateur
http://localhost:5078/health

# Résultat attendu: "Healthy"
```

---

## 📝 INSCRIPTION (1 min)

### Méthode 1: Interface Web
```
1. Ouvrir: http://localhost:5078
2. Cliquer sur "S'inscrire"
3. Remplir:
   - Email: premier@test.com
   - Mot de passe: Test123!@#
   - Nom: Premier Client
   - Cabinet: Cabinet Test
4. Cliquer "Créer mon compte"
```

### Méthode 2: API (curl)
```bash
curl -X POST http://localhost:5078/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"premier@test.com\",\"password\":\"Test123!@#\",\"name\":\"Premier Client\",\"plan\":\"CABINET\"}"
```

✅ **Résultat:** Compte créé avec succès

---

## 🔐 CONNEXION (1 min)

### Interface Web
```
1. Aller sur: http://localhost:5078
2. Entrer:
   - Email: premier@test.com
   - Mot de passe: Test123!@#
3. Cliquer "Se connecter"
```

### API (curl)
```bash
curl -X POST http://localhost:5078/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"premier@test.com\",\"password\":\"Test123!@#\"}"
```

✅ **Résultat:** Token JWT reçu

---

## 👤 CRÉER PREMIER CLIENT (2 min)

### Interface Web
```
1. Menu > Clients
2. Cliquer "+ Nouveau client"
3. Remplir:
   - Nom: Sophie Dubois
   - Email: sophie.dubois@email.com
   - Téléphone: +33612345678
   - Adresse: 123 Rue Test
   - Ville: Paris
   - Code postal: 75001
4. Cliquer "Créer"
```

### API (curl)
```bash
# Remplacer YOUR_TOKEN par le token reçu lors du login
curl -X POST http://localhost:5078/api/client \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"sophie.dubois@email.com\",\"name\":\"Sophie Dubois\",\"phone\":\"+33612345678\",\"address\":\"123 Rue Test\",\"city\":\"Paris\",\"postalCode\":\"75001\"}"
```

✅ **Résultat:** Premier client créé

---

## 📧 RECEVOIR PREMIER EMAIL (2 min)

### Simulateur (Recommandé)
```
1. Aller sur: http://localhost:5078/demo/email-simulator
2. Sélectionner "Sophie Dubois"
3. Cliquer sur template "OQTF notifiée"
4. Cliquer "Envoyer l'email"
```

### API (curl)
```bash
curl -X POST http://localhost:5078/api/ingest/email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"sophie.dubois@email.com\",\"to\":\"avocat@cabinet.fr\",\"subject\":\"URGENT - OQTF notifiee\",\"body\":\"Bonjour Maitre, J'ai recu une OQTF le 15/01/2026.\",\"messageId\":\"test-123@test.local\"}"
```

✅ **Résultat:** Email reçu et analysé

---

## 📁 CRÉER PREMIER DOSSIER (2 min)

### Interface Web
```
1. Menu > Dossiers
2. Cliquer "+ Nouveau dossier"
3. Remplir:
   - Titre: Dossier OQTF - Sophie Dubois
   - Client: Sophie Dubois
   - Email: sophie.dubois@email.com
   - Statut: OUVERT
   - Priorité: 5 (Urgent)
   - Tags: OQTF, urgent
4. Cliquer "Créer"
```

### API (curl)
```bash
curl -X POST http://localhost:5078/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Dossier OQTF - Sophie Dubois\",\"description\":\"OQTF notifiee\",\"clientEmail\":\"sophie.dubois@email.com\",\"clientName\":\"Sophie Dubois\",\"status\":\"OPEN\",\"priority\":5,\"tags\":[\"OQTF\",\"urgent\"]}"
```

✅ **Résultat:** Premier dossier créé

---

## 🎯 TESTER LA DÉMO INTERACTIVE (5 min)

### Parcours Complet
```
1. Aller sur: http://localhost:5078/demo

2. Étape 1 - Email entrant:
   - Sélectionner template "OQTF"
   - Envoyer l'email
   - Observer l'analyse automatique

3. Étape 2 - Raisonnement dossier:
   - Cliquer "Lancer l'analyse IA"
   - Observer les risques détectés
   - Voir le plan d'action

4. Étape 3 - Preuve légale:
   - Cliquer "Générer documents"
   - Observer les documents créés
   - Voir la traçabilité
```

✅ **Résultat:** Démo complète testée

---

## 📊 VÉRIFIER LE DASHBOARD (1 min)

### Interface Web
```
1. Aller sur: http://localhost:5078/dashboard
2. Observer:
   - Nombre de clients: 1
   - Nombre de dossiers: 1
   - Emails reçus: 1
   - Statistiques
```

### API (curl)
```bash
curl -X GET http://localhost:5078/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **Résultat:** Dashboard fonctionnel

---

## ✅ CHECKLIST COMPLÈTE

### Tests Réussis
- [ ] API fonctionne (health check)
- [ ] Inscription réussie
- [ ] Connexion réussie
- [ ] Premier client créé
- [ ] Premier email reçu
- [ ] Premier dossier créé
- [ ] Démo interactive testée
- [ ] Dashboard consulté

### Fonctionnalités Validées
- [ ] Authentication (JWT)
- [ ] Gestion clients
- [ ] Gestion emails
- [ ] Gestion dossiers
- [ ] Analyse IA
- [ ] Génération documents
- [ ] Dashboard

---

## 🎉 RÉSULTAT ATTENDU

Après ces tests, vous devriez avoir:

✅ **1 compte utilisateur** (premier@test.com)  
✅ **1 client** (Sophie Dubois)  
✅ **1 email** (OQTF urgent)  
✅ **1 dossier** (Dossier OQTF)  
✅ **Dashboard** avec statistiques

---

## 🐛 DÉPANNAGE

### Problème: API ne répond pas
```bash
# Vérifier que l'API tourne
netstat -ano | findstr :5078

# Si rien, lancer l'API
cd MemoLib.Api
dotnet run
```

### Problème: Erreur 401 (Non autorisé)
```
Cause: Token expiré ou invalide
Solution: Se reconnecter pour obtenir un nouveau token
```

### Problème: Erreur 500 (Serveur)
```
Cause: Erreur interne
Solution: Vérifier les logs de l'API
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes:

1. Vérifier les logs: `MemoLib.Api/logs/`
2. Consulter la documentation: `README.md`
3. Tester avec curl pour isoler le problème
4. Vérifier que la base de données existe: `memolib.db`

---

**Temps total:** ~15 minutes  
**Difficulté:** Facile  
**Prérequis:** API lancée sur port 5078
