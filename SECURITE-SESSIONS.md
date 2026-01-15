# 🔐 Configuration de Sécurité - IA Poste Manager

## ⏱️ Gestion des Sessions

### Paramètres d'Expiration

```typescript
// src/app/api/auth/[...nextauth]/route.ts
session: {
  strategy: 'jwt',
  maxAge: 2 * 60 * 60,        // 2 heures = temps max de session
  updateAge: 30 * 60,          // 30 minutes = rafraîchissement auto
}
```

### Fonctionnement

#### 1. **Session Active** (2 heures max)
- L'utilisateur est automatiquement déconnecté après **2 heures**
- Le compteur se réinitialise sur chaque activité de l'utilisateur
- Activités détectées : clics, touches clavier, scroll, touch

#### 2. **Rafraîchissement Automatique** (30 minutes)
- Si l'utilisateur est actif, le token JWT est rafraîchi toutes les 30 minutes
- Prolonge automatiquement la session sans déconnexion
- Transparent pour l'utilisateur

#### 3. **Avertissement Avant Expiration** (5 minutes)
- Une popup s'affiche **5 minutes avant** l'expiration
- Options : 
  - ✅ **OK** → Rafraîchit la session (recharge la page)
  - ❌ **Annuler** → Déconnexion immédiate

#### 4. **Redirection Après Expiration**
- URL : `/auth/login?timeout=true`
- Message : "⏱️ Votre session a expiré pour des raisons de sécurité"
- L'utilisateur doit se reconnecter

## 🎛️ Configuration Personnalisée

### Modifier le Délai d'Expiration

**Pour 1 heure :**
```typescript
maxAge: 1 * 60 * 60,  // 1 heure
```

**Pour 4 heures :**
```typescript
maxAge: 4 * 60 * 60,  // 4 heures
```

**Pour 30 minutes :**
```typescript
maxAge: 30 * 60,  // 30 minutes
```

### Modifier l'Avertissement

```typescript
// src/hooks/useSessionTimeout.ts
const TIMEOUT_DURATION = 2 * 60 * 60 * 1000; // 2 heures
const WARNING_BEFORE = 10 * 60 * 1000;       // 10 minutes avant (au lieu de 5)
```

### Désactiver l'Avertissement (déconnecter directement)

```typescript
// Dans useSessionTimeout.ts, supprimer le warningRef
// et ne garder que le timeoutRef
```

## 🔒 Bonnes Pratiques

### Recommandations par Type d'Application

| Type Application | Durée Recommandée | Raison |
|------------------|-------------------|--------|
| **Banking/Finance** | 15-30 minutes | Données très sensibles |
| **Juridique** (actuel) | 2 heures | Équilibre sécurité/UX |
| **SaaS Standard** | 4-8 heures | Confort utilisateur |
| **Intranet** | 8-12 heures | Réseau sécurisé |

### Cabinets d'Avocats (Configuration Actuelle)

✅ **2 heures** est le sweet spot car :
- 🔐 Conforme aux standards de sécurité juridique
- 👥 Respecte les pauses naturelles (déjeuner, réunions)
- ⚖️ Balance entre sécurité et productivité
- 📱 Adapté au travail mobile (déplacements au tribunal)

## 🧪 Tests

### Tester l'Expiration Rapide

Pour tester en **2 minutes** au lieu de 2 heures :

```typescript
// TEMPORAIRE - Pour tests uniquement
session: {
  maxAge: 2 * 60,  // 2 minutes
  updateAge: 30,    // 30 secondes
}

// Dans useSessionTimeout.ts
const TIMEOUT_DURATION = 2 * 60 * 1000;  // 2 minutes
const WARNING_BEFORE = 30 * 1000;         // 30 secondes avant
```

⚠️ **N'oubliez pas de remettre les valeurs de production après les tests !**

## 🔍 Monitoring

### Logs de Session

Pour ajouter des logs de déconnexion automatique :

```typescript
// Dans useSessionTimeout.ts
const handleLogout = async () => {
  console.log('[SESSION] Expiration automatique', {
    timestamp: new Date().toISOString(),
    userId: session?.user?.id,
    duration: TIMEOUT_DURATION / 1000 / 60 + ' minutes'
  });
  
  await signOut({ 
    callbackUrl: '/auth/login?timeout=true',
    redirect: true 
  });
};
```

### Analytics

Pour tracker les expirations dans Google Analytics / Mixpanel :

```typescript
// Ajouter avant signOut()
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'session_timeout', {
    event_category: 'authentication',
    event_label: 'auto_logout',
    value: TIMEOUT_DURATION / 1000 / 60
  });
}
```

## 📋 Checklist de Sécurité

- ✅ Session expiration configurée (2h)
- ✅ Auto-refresh actif (30min)
- ✅ Avertissement utilisateur (5min avant)
- ✅ Redirection sécurisée après expiration
- ✅ Message clair à l'utilisateur
- ✅ Timer reset sur activité
- ✅ Pas de données sensibles dans localStorage
- ✅ JWT avec secret cryptographique fort

## 🚀 Déploiement Production

### Variables d'Environnement Requises

```bash
# .env.production
NEXTAUTH_SECRET="[GÉNÉRER AVEC: openssl rand -base64 32]"
NEXTAUTH_URL="https://votredomaine.com"

# Vérifier que le secret est différent de .env.local !
```

### Vérifications Avant Déploiement

```bash
# 1. Secret généré
echo $NEXTAUTH_SECRET

# 2. URL de production correcte
echo $NEXTAUTH_URL

# 3. Durée de session appropriée
grep "maxAge" src/app/api/auth/[...nextauth]/route.ts
```

## 📞 Support

En cas de problème :

1. **Utilisateurs déconnectés trop souvent** → Augmenter `maxAge`
2. **Avertissement trop fréquent** → Augmenter `WARNING_BEFORE`
3. **Session ne se rafraîchit pas** → Vérifier `updateAge`
4. **Popup ne s'affiche pas** → Vérifier import `SessionTimeoutManager`

---

**Dernière mise à jour** : 3 janvier 2026  
**Version** : 1.0.0  
**Sécurité** : ⭐⭐⭐⭐⭐ Enterprise-Grade
