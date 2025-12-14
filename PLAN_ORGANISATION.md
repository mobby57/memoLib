# Plan d'Organisation - SecureVault v2.2

## 📊 État Actuel

### ✅ Fonctionnel
- Navigation moderne
- Pages principales (composer, send, history, templates, admin, agent)
- Génération IA basique
- Design responsive
- Mode sombre

### ⚠️ Problèmes Identifiés
1. **Session expirée** - Pas de persistance du mot de passe maître
2. **Base de données** - Erreurs SQLAlchemy (colonne user_id manquante)
3. **Envoi email** - Erreur 401 (session)
4. **Configuration** - Pas de vérification au démarrage

## 🎯 Priorités

### 1. **Authentification & Session** (URGENT)
```
Problème: Session expirée après configuration
Solution:
- Ajouter page de login simple
- Stocker session avec timeout
- Vérifier session avant chaque action
```

### 2. **Base de Données** (IMPORTANT)
```
Problème: Erreurs SQLAlchemy
Solution:
- Utiliser uniquement database.py (simple)
- Supprimer dépendances SQLAlchemy
- Créer schéma simple
```

### 3. **Workflow Utilisateur** (IMPORTANT)
```
Flux actuel: Confus
Flux proposé:
1. Login → Mot de passe maître
2. Configuration → Gmail + OpenAI (si première fois)
3. Utilisation → Composer/Envoyer
```

## 📋 Actions Immédiates

### Phase 1: Authentification (30 min)
- [ ] Créer page `/login` simple
- [ ] Middleware de vérification session
- [ ] Redirection auto si non connecté
- [ ] Timeout session 1h

### Phase 2: Simplification DB (20 min)
- [ ] Supprimer imports SQLAlchemy dans app.py
- [ ] Utiliser uniquement database.py
- [ ] Créer tables simples (emails, templates)

### Phase 3: Workflow (15 min)
- [ ] Vérifier credentials au démarrage
- [ ] Rediriger vers setup si manquant
- [ ] Message clair sur chaque page

### Phase 4: Tests (15 min)
- [ ] Test login
- [ ] Test configuration Gmail
- [ ] Test envoi email
- [ ] Test génération IA

## 🗂️ Structure Proposée

```
Flux Utilisateur:
┌─────────────┐
│   /login    │ ← Première visite
└──────┬──────┘
       │ Mot de passe maître
       ↓
┌─────────────┐
│   /setup    │ ← Si credentials manquants
└──────┬──────┘
       │ Configure Gmail/OpenAI
       ↓
┌─────────────┐
│     /       │ ← Navigation principale
└──────┬──────┘
       │
       ├→ /composer (Génération IA)
       ├→ /send (Envoi simple)
       ├→ /history (Historique)
       ├→ /templates (Modèles)
       └→ /agent (Assistant)
```

## 🔧 Fichiers à Modifier

### Priorité 1
1. `src/web/app.py`
   - Ajouter middleware session
   - Simplifier DB
   - Route /login

2. `templates/login.html`
   - Créer page login simple

3. `src/core/session_manager.py`
   - Améliorer gestion session

### Priorité 2
4. `templates/index.html`
   - Vérifier si connecté
   - Rediriger si besoin

5. Toutes les pages
   - Ajouter vérification session

## 📝 Code à Implémenter

### 1. Middleware Session
```python
@app.before_request
def check_session():
    public_routes = ['/login', '/static', '/favicon.ico']
    if not any(request.path.startswith(r) for r in public_routes):
        if not session.get('authenticated'):
            return redirect('/login')
```

### 2. Page Login
```html
<form action="/login" method="POST">
    <input type="password" name="master_password" required>
    <button type="submit">Se connecter</button>
</form>
```

### 3. Simplification DB
```python
# Supprimer
from src.models import get_session, Email

# Utiliser
db.log_email(recipient, subject, body, 'sent')
emails = db.get_email_history()
```

## 🎯 Résultat Attendu

### Après Phase 1-4
- ✅ Login fonctionnel
- ✅ Session persistante (1h)
- ✅ Envoi email sans erreur 401
- ✅ Workflow clair
- ✅ Messages d'erreur explicites

## ⏱️ Timeline

```
Maintenant → +30min : Phase 1 (Auth)
+30min → +50min : Phase 2 (DB)
+50min → +65min : Phase 3 (Workflow)
+65min → +80min : Phase 4 (Tests)
```

## 🚀 Commencer Par

**Action immédiate:**
```bash
# 1. Créer page login
# 2. Ajouter middleware
# 3. Tester
```

**Voulez-vous que je commence par:**
- A) Créer le système de login complet
- B) Simplifier la base de données
- C) Corriger uniquement l'erreur 401
- D) Tout refaire proprement (1h30)
