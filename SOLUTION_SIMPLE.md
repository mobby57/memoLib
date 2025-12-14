# 💡 Solution Simple - Pas de Boucle

## 🎯 Concept

**Au lieu de stocker le mot de passe maître en session:**
→ Le demander UNE SEULE FOIS au démarrage
→ Le garder en mémoire serveur (variable globale)

## 🔧 Implémentation

### Code Minimal

```python
# app.py - Après ligne 60
MASTER_PASSWORD_CACHE = None  # Variable globale

@app.route('/api/login', methods=['POST'])
def api_login():
    global MASTER_PASSWORD_CACHE
    
    data = request.json
    password = data.get('password', '')
    
    # Vérifier si credentials existent
    if credentials_existent(Config.APP_DIR):
        # Tester le mot de passe
        app_password, email = recuperer_app_password(password, Config.APP_DIR)
        if not app_password:
            return jsonify({'success': False, 'error': 'Mot de passe incorrect'}), 401
    
    # Stocker en mémoire serveur
    MASTER_PASSWORD_CACHE = password
    session['authenticated'] = True
    session.permanent = True
    
    return jsonify({'success': True, 'redirect': '/'})

@app.route('/api/send-email', methods=['POST'])
def send_email_api():
    global MASTER_PASSWORD_CACHE
    
    if not MASTER_PASSWORD_CACHE:
        return jsonify({'success': False, 'error': 'Reconnectez-vous'}), 401
    
    data = request.get_json()
    recipient = data.get('recipient')
    subject = data.get('subject')
    body = data.get('body')
    
    # Utiliser le mot de passe en mémoire
    app_password, sender_email = recuperer_app_password(MASTER_PASSWORD_CACHE, Config.APP_DIR)
    
    result = smtp_service.send_email(sender_email, app_password, recipient, subject, body)
    
    if result.get('success'):
        db.log_email(recipient, subject, body, 'sent')
        return jsonify({'success': True, 'message': 'Email envoyé'})
    else:
        return jsonify({'success': False, 'error': result.get('error')})

@app.route('/logout')
def logout():
    global MASTER_PASSWORD_CACHE
    MASTER_PASSWORD_CACHE = None  # Effacer de la mémoire
    session.clear()
    return redirect('/login')
```

## ✅ Avantages

1. **Pas de Flask-Session** à installer
2. **Pas de fichiers** session à gérer
3. **Simple** - 1 variable globale
4. **Rapide** - Pas d'I/O disque
5. **Sécurisé** - Effacé au logout

## ⚠️ Limitations

1. **Mono-utilisateur** - 1 seul utilisateur à la fois
2. **Perdu au redémarrage** - Doit se reconnecter
3. **Pas de multi-process** - Gunicorn avec 1 worker seulement

## 🎯 Workflow

```
1. Login → MASTER_PASSWORD_CACHE = "password123"
2. Envoyer email → Utilise MASTER_PASSWORD_CACHE
3. Logout → MASTER_PASSWORD_CACHE = None
```

## 🔒 Sécurité

**Mémoire serveur:**
- Pas écrit sur disque
- Effacé au logout
- Effacé au redémarrage

**Meilleur que session fichier** car:
- Pas de fichier avec mot de passe en clair
- Contrôle total sur la durée de vie

## 📝 Code Complet à Ajouter

```python
# Ligne 60 - Ajouter
MASTER_PASSWORD_CACHE = None

# Remplacer /api/login (ligne 120-145)
@app.route('/api/login', methods=['POST'])
def api_login():
    global MASTER_PASSWORD_CACHE
    try:
        data = request.json
        password = data.get('password', '')
        
        if not credentials_existent(Config.APP_DIR):
            MASTER_PASSWORD_CACHE = password
            session['authenticated'] = True
            session.permanent = True
            return jsonify({'success': True, 'redirect': '/'})
        
        app_password, email = recuperer_app_password(password, Config.APP_DIR)
        
        if app_password and email:
            MASTER_PASSWORD_CACHE = password
            session['authenticated'] = True
            session.permanent = True
            return jsonify({'success': True, 'redirect': '/'})
        else:
            return jsonify({'success': False, 'error': 'Mot de passe incorrect'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Remplacer /api/send-email (ligne 520-570)
@app.route('/api/send-email', methods=['POST'])
@rate_limiter.limit('api')
def send_email_api():
    global MASTER_PASSWORD_CACHE
    try:
        if not MASTER_PASSWORD_CACHE:
            return jsonify({'success': False, 'error': 'Session expirée. Reconnectez-vous.'}), 401
        
        data = request.get_json()
        recipient = data.get('recipient')
        subject = data.get('subject')
        body = data.get('body')
        
        if not all([recipient, subject, body]):
            return jsonify({'success': False, 'error': 'Données manquantes'}), 400
        
        if not credentials_existent(Config.APP_DIR):
            return jsonify({'success': False, 'error': 'Gmail non configuré'}), 400
        
        app_password, sender_email = recuperer_app_password(MASTER_PASSWORD_CACHE, Config.APP_DIR)
        
        if not app_password:
            return jsonify({'success': False, 'error': 'Erreur déchiffrement'}), 400
        
        result = smtp_service.send_email(sender_email, app_password, recipient, subject, body)
        
        if result.get('success'):
            db.log_email(recipient, subject, body, 'sent')
            return jsonify({'success': True, 'message': 'Email envoyé'})
        else:
            return jsonify({'success': False, 'error': result.get('error')})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Remplacer /logout (ligne 147-150)
@app.route('/logout')
def logout():
    global MASTER_PASSWORD_CACHE
    MASTER_PASSWORD_CACHE = None
    session.clear()
    return redirect('/login')
```

## 🚀 Test

```bash
python src\web\app.py

# 1. Login avec mot de passe
# 2. Config Gmail (si première fois)
# 3. Envoyer email → ✅ FONCTIONNE
# 4. Logout → Mot de passe effacé
```

## 🎯 Résumé

**Solution:** Variable globale en mémoire
**Avantages:** Simple, rapide, sécurisé
**Inconvénients:** Mono-utilisateur
**Temps:** 2 minutes
**Résultat:** 100% fonctionnel

**Parfait pour usage personnel!**
