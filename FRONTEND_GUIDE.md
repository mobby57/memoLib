# Guide d'intégration Frontend - MemoLib

## 🎯 Démonstration avec interface web

### Accès rapide

1. **Démarrer l'API**
```powershell
dotnet run
```

2. **Ouvrir le navigateur**
```
http://localhost:8080/demo.html
```

## 📱 Interface de démonstration

L'interface web fournie (`wwwroot/demo.html`) permet de :

### 🔐 Authentification
- **Inscription** : Créer un compte avec validation stricte
- **Connexion** : Obtenir un token JWT
- Validation en temps réel des mots de passe

### 📧 Ingestion d'emails
- Formulaire simple pour ingérer des emails
- Création automatique de dossiers
- Retour immédiat avec ID de l'event

### 🔍 Recherche
- **Recherche textuelle** : Mots-clés dans le contenu
- **Recherche IA** : Recherche sémantique avec score de similarité
- Affichage des résultats en temps réel

### 📁 Gestion de dossiers
- Liste de tous les dossiers
- Affichage chronologique

### 📊 Statistiques
- Total d'emails
- Jours actifs
- Types d'events
- Sévérité moyenne

## 🔌 Intégration dans votre frontend

### Exemple React/Vue/Angular

```javascript
// Configuration
const API_URL = 'http://localhost:8080';
let token = null;

// 1. Inscription
async function register(email, password, name) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            password, 
            name, 
            role: 'AVOCAT', 
            plan: 'CABINET' 
        })
    });
    return await response.json();
}

// 2. Connexion
async function login(email, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    token = data.token; // Stocker le token
    return data;
}

// 3. Ingérer un email
async function ingestEmail(from, subject, body, externalId) {
    const response = await fetch(`${API_URL}/api/ingest/email`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            from, 
            subject, 
            body, 
            externalId,
            occurredAt: new Date().toISOString()
        })
    });
    return await response.json();
}

// 4. Rechercher
async function searchEvents(text) {
    const response = await fetch(`${API_URL}/api/search/events`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
    });
    return await response.json();
}

// 5. Recherche sémantique
async function semanticSearch(query) {
    const response = await fetch(`${API_URL}/api/semantic/search`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
    });
    return await response.json();
}

// 6. Liste des dossiers
async function listCases() {
    const response = await fetch(`${API_URL}/api/cases`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
}

// 7. Statistiques
async function getStats() {
    const [perDay, byType, avgSev] = await Promise.all([
        fetch(`${API_URL}/api/stats/events-per-day`, { 
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${API_URL}/api/stats/events-by-type`, { 
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${API_URL}/api/stats/average-severity`, { 
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
    ]);
    
    return { perDay, byType, avgSev };
}
```

## 🎨 Exemple d'utilisation React

```jsx
import { useState } from 'react';

function MemoLibApp() {
    const [token, setToken] = useState(null);
    const [results, setResults] = useState([]);

    const handleLogin = async (email, password) => {
        const data = await login(email, password);
        setToken(data.token);
    };

    const handleSearch = async (query) => {
        const data = await searchEvents(query);
        setResults(data);
    };

    return (
        <div>
            {!token ? (
                <LoginForm onLogin={handleLogin} />
            ) : (
                <>
                    <SearchBar onSearch={handleSearch} />
                    <ResultsList results={results} />
                </>
            )}
        </div>
    );
}
```

## 🎯 Démonstration client avec frontend

### Scénario complet

1. **Ouvrir l'interface** : `http://localhost:8080/demo.html`

2. **Onglet Authentification**
   - Créer un compte : `demo@cabinet.fr` / `SecurePass123!` / `Jean Dupont`
   - Se connecter avec les mêmes identifiants
   - ✅ Token reçu

3. **Onglet Ingestion**
   - De : `client@example.com`
   - Sujet : `Demande urgente`
   - Corps : `Besoin d'aide pour mon dossier...`
   - ID externe : `DOSSIER-2024-001`
   - ✅ Email ingéré, dossier créé

4. **Onglet Recherche**
   - Recherche : `urgente`
   - Cliquer "Rechercher"
   - ✅ Résultats affichés
   - Cliquer "Recherche IA"
   - ✅ Résultats avec score de similarité

5. **Onglet Dossiers**
   - Cliquer "Afficher mes dossiers"
   - ✅ Liste des dossiers avec dates

6. **Onglet Statistiques**
   - Cliquer "Charger les statistiques"
   - ✅ Tableaux de bord affichés

### Timing : 5 minutes pour une démo complète

## 🚀 Déploiement frontend

### Option 1 : Intégré dans l'API (actuel)
```
wwwroot/
├── index.html (page d'accueil)
└── demo.html (interface de démo)
```

Accessible via : `http://localhost:8080/demo.html`

### Option 2 : Frontend séparé (React/Vue/Angular)

```bash
# Créer un projet React
npx create-react-app memolib-frontend
cd memolib-frontend

# Installer axios pour les requêtes
npm install axios

# Configurer CORS dans l'API (déjà fait)
# Développer les composants
# Build et déployer
npm run build
```

### Option 3 : Application mobile (React Native)

```bash
npx react-native init MemoLibMobile
# Utiliser les mêmes endpoints API
# Ajouter authentification biométrique
# Notifications push pour nouveaux emails
```

## 📊 Endpoints disponibles

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/api/auth/register` | POST | Non | Inscription |
| `/api/auth/login` | POST | Non | Connexion |
| `/api/auth/me` | GET | Oui | Profil utilisateur |
| `/api/ingest/email` | POST | Oui | Ingérer email |
| `/api/search/events` | POST | Oui | Recherche textuelle |
| `/api/semantic/search` | POST | Oui | Recherche IA |
| `/api/cases` | GET | Oui | Liste dossiers |
| `/api/cases` | POST | Oui | Créer dossier |
| `/api/cases/{id}/timeline` | GET | Oui | Timeline dossier |
| `/api/client` | GET | Oui | Liste clients |
| `/api/client` | POST | Oui | Créer client |
| `/api/stats/events-per-day` | GET | Oui | Stats par jour |
| `/api/stats/events-by-type` | GET | Oui | Stats par type |
| `/api/stats/average-severity` | GET | Oui | Sévérité moyenne |
| `/api/audit` | GET | Oui | Audit trail |

## 🎓 Conseils pour la démo client

### Préparation
1. Tester l'interface avant la démo
2. Préparer des données de test réalistes
3. Avoir un navigateur propre (pas d'extensions)
4. Tester la connexion internet

### Pendant la démo
1. Montrer l'inscription avec validation
2. Ingérer 2-3 emails réalistes
3. Faire une recherche textuelle
4. Faire une recherche IA pour impressionner
5. Montrer les statistiques

### Arguments de vente
- **Interface simple** : "Pas besoin de formation"
- **Temps réel** : "Résultats instantanés"
- **IA intégrée** : "Recherche intelligente"
- **Sécurisé** : "Validation stricte, audit trail"

## 📱 Responsive design

L'interface fournie est responsive et fonctionne sur :
- 💻 Desktop (1920x1080)
- 💻 Laptop (1366x768)
- 📱 Tablette (768x1024)
- 📱 Mobile (375x667)

## 🔒 Sécurité frontend

- ✅ Token JWT stocké en mémoire (pas de localStorage)
- ✅ HTTPS recommandé en production
- ✅ Validation côté client + serveur
- ✅ Pas de données sensibles dans l'URL

---

**Prêt pour impressionner vos clients avec une interface professionnelle !** 🚀
