# 🔒 Guide de Sécurité MemoLib - Protection contre le Phishing et Tabnabbing

## Vue d'ensemble

MemoLib a été renforcé avec des protections complètes contre les attaques de phishing et de tabnabbing. Ce document détaille les mesures de sécurité implémentées.

## 🛡️ Protections Implémentées

### 1. Protection contre le Tabnabbing

**Problème** : Les liens externes peuvent utiliser `window.opener` pour rediriger la page parent vers un site malveillant.

**Solutions** :
- ✅ Tous les liens externes utilisent `rel="noopener noreferrer"`
- ✅ Validation stricte des URLs avant ouverture
- ✅ Fonction `secureExternalLink()` pour tous les liens dynamiques

```javascript
// Exemple de protection
function secureExternalLink(url) {
    if (!isUrlSafe(url)) {
        console.warn('URL bloquée pour sécurité:', url);
        return false;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    link.click();
    return true;
}
```

### 2. Protection contre le Phishing

**Problème** : Redirection vers des sites malveillants imitant l'interface légitime.

**Solutions** :
- ✅ Liste blanche de domaines autorisés
- ✅ Validation côté client et serveur des URLs
- ✅ Service `UrlValidationService` pour validation centralisée
- ✅ Sanitisation de toutes les URLs

```csharp
// Validation côté serveur
public bool IsUrlSafe(string url)
{
    if (string.IsNullOrWhiteSpace(url))
        return false;

    // URLs relatives sont sûres
    if (url.StartsWith("/") && !url.StartsWith("//"))
        return true;

    var match = UrlPattern.Match(url);
    if (!match.Success)
        return false;

    var domain = match.Groups[1].Value.ToLowerInvariant();
    return AllowedDomains.Contains(domain) || IsLocalhost(domain);
}
```

### 3. En-têtes de Sécurité HTTP

**Middleware `SecurityHeadersMiddleware`** ajoute automatiquement :

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains (si HTTPS)
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

### 4. Protection CSRF

**Problème** : Attaques Cross-Site Request Forgery.

**Solutions** :
- ✅ Tokens CSRF générés cryptographiquement
- ✅ Validation côté serveur via `SecurityController`
- ✅ Régénération automatique des tokens
- ✅ Sessions sécurisées avec cookies HttpOnly

```javascript
// Génération de token CSRF côté client
function generateCSRFToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
```

### 5. Validation des Formulaires

**Protection** :
- ✅ Validation côté client ET serveur
- ✅ Sanitisation de toutes les entrées
- ✅ Limites de longueur strictes
- ✅ Validation des formats d'email
- ✅ Détection de domaines suspects

```javascript
// Sanitisation des entrées
function sanitizeInput(input, maxLength = 1000) {
    if (!input) return '';
    
    return input
        .toString()
        .trim()
        .substring(0, maxLength)
        .replace(/[<>]/g, '') // Supprime les balises HTML
        .replace(/javascript:/gi, '') // Supprime les URLs javascript
        .replace(/data:/gi, ''); // Supprime les URLs data
}
```

## 📁 Fichiers Sécurisés

### Nouveaux Fichiers Créés

1. **`SecurityHeadersMiddleware.cs`** - Middleware pour en-têtes de sécurité
2. **`UrlValidationService.cs`** - Service de validation des URLs
3. **`SecurityController.cs`** - API pour validation et tokens CSRF
4. **`demo-secure.html`** - Version sécurisée de l'interface principale
5. **`contact-secure.html`** - Version sécurisée du formulaire de contact

### Fichiers Modifiés

1. **`Program.cs`** - Ajout du middleware de sécurité et sessions
2. **Configuration des sessions** - Cookies sécurisés avec SameSite=Strict

## 🔧 Configuration

### Domaines Autorisés

```csharp
private static readonly HashSet<string> AllowedDomains = new()
{
    "localhost",
    "127.0.0.1", 
    "memolib.local"
};
```

### Content Security Policy

```
default-src 'self'; 
script-src 'self' 'unsafe-inline'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data:; 
font-src 'self'; 
connect-src 'self'; 
frame-ancestors 'none'; 
base-uri 'self'; 
form-action 'self'
```

## 🚀 Utilisation

### Pour les Développeurs

1. **Utilisez les fichiers sécurisés** :
   - `demo-secure.html` au lieu de `demo.html`
   - `contact-secure.html` au lieu de `contact.html`

2. **Validez toutes les URLs** :
   ```javascript
   if (!isUrlSafe(url)) {
       console.warn('URL bloquée:', url);
       return;
   }
   ```

3. **Utilisez les tokens CSRF** :
   ```javascript
   const response = await fetch('/api/endpoint', {
       headers: {
           'X-CSRF-Token': csrfToken
       }
   });
   ```

### Pour les Utilisateurs

- ✅ **Navigation sécurisée** : Tous les liens externes sont protégés
- ✅ **Formulaires sécurisés** : Protection CSRF automatique
- ✅ **Validation en temps réel** : Vérification des URLs et emails
- ✅ **Alertes de sécurité** : Notifications en cas de tentative d'attaque

## 🔍 Tests de Sécurité

### Test de Tabnabbing

```javascript
// Test : ce lien ne peut plus exploiter window.opener
<a href="https://malicious-site.com" target="_blank">Lien externe</a>
// ✅ Automatiquement transformé avec rel="noopener noreferrer"
```

### Test de Validation d'URL

```javascript
// Test : URLs malveillantes bloquées
isUrlSafe('javascript:alert(1)'); // false
isUrlSafe('data:text/html,<script>alert(1)</script>'); // false
isUrlSafe('http://malicious-site.com'); // false
isUrlSafe('http://localhost:5078/api/test'); // true
```

### Test CSRF

```bash
# Test : requête sans token CSRF rejetée
curl -X POST http://localhost:5078/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# ❌ Rejeté sans X-CSRF-Token
```

## 📊 Monitoring de Sécurité

### Logs de Sécurité

Le système log automatiquement :
- Tentatives d'accès à des URLs non autorisées
- Échecs de validation CSRF
- Incidents de sécurité signalés

### Métriques

- Nombre de URLs bloquées
- Tentatives d'attaques détectées
- Tokens CSRF générés/validés

## 🔄 Maintenance

### Mise à Jour des Domaines Autorisés

Modifiez `UrlValidationService.cs` :

```csharp
private static readonly HashSet<string> AllowedDomains = new()
{
    "localhost",
    "127.0.0.1",
    "memolib.local",
    "votre-nouveau-domaine.com" // Ajoutez ici
};
```

### Rotation des Secrets

- Tokens CSRF : Régénérés automatiquement toutes les 5 minutes
- Clés JWT : À faire manuellement selon votre politique de sécurité

## ⚠️ Avertissements

1. **Ne désactivez jamais** les validations d'URL en production
2. **Testez toujours** les nouvelles fonctionnalités avec les protections activées
3. **Surveillez les logs** pour détecter les tentatives d'attaque
4. **Mettez à jour régulièrement** la liste des domaines autorisés

## 📞 Support

En cas de problème de sécurité :
1. Consultez les logs de l'application
2. Vérifiez la configuration des domaines autorisés
3. Testez avec les outils de développement du navigateur
4. Contactez l'équipe de développement si nécessaire

---

**✅ MemoLib est maintenant protégé contre le phishing et le tabnabbing !**