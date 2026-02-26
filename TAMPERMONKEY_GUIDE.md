# 🎬 Installation Script Démo Automatique

## 📦 Installation Tampermonkey

### 1. Installer l'Extension Tampermonkey

**Chrome/Edge:**
- Aller sur https://www.tampermonkey.net/
- Cliquer sur "Download" pour Chrome/Edge
- Installer l'extension

**Firefox:**
- Aller sur https://addons.mozilla.org/firefox/addon/tampermonkey/
- Cliquer sur "Ajouter à Firefox"

### 2. Installer le Script de Démo

**Méthode 1 - Depuis le fichier:**
1. Ouvrir Tampermonkey dans le navigateur (icône en haut à droite)
2. Cliquer sur "Dashboard"
3. Cliquer sur l'onglet "Utilities"
4. Dans "Import from file", choisir `tampermonkey-demo.user.js`
5. Cliquer sur "Install"

**Méthode 2 - Copier/Coller:**
1. Ouvrir `tampermonkey-demo.user.js` dans un éditeur
2. Copier tout le contenu
3. Ouvrir Tampermonkey Dashboard
4. Cliquer sur l'icône "+" (Create a new script)
5. Coller le contenu
6. Cliquer sur "File" → "Save" (ou Ctrl+S)

### 3. Utiliser la Démo

1. Ouvrir http://localhost:5078/demo.html
2. Un bouton **"🎬 DÉMO AUTOMATIQUE"** apparaît en haut à droite
3. Cliquer sur le bouton pour lancer la démo complète

## 🎯 Fonctionnalités de la Démo

La démo automatique effectue les actions suivantes:

1. **🔐 Connexion automatique**
   - Remplit les identifiants
   - Se connecte automatiquement

2. **📧 Ingestion d'emails de test**
   - Crée 3 emails de démonstration:
     - Divorce urgent
     - Licenciement abusif
     - Litige immobilier

3. **📊 Dashboard Avancé**
   - Affiche les métriques temps réel
   - Montre les graphiques de tendances

4. **🔍 Recherche intelligente**
   - Recherche "divorce urgent"
   - Affiche les résultats

5. **📝 Génération template IA**
   - Ouvre un email
   - Montre la génération de réponse

6. **📁 Affichage dossiers**
   - Liste tous les dossiers créés
   - Montre la timeline

7. **👥 Gestion clients**
   - Affiche la liste des clients
   - Montre les détails

8. **📊 Statistiques**
   - Affiche les stats complètes
   - Graphiques et KPIs

## 🎨 Personnalisation

Pour modifier la démo, éditer le fichier `tampermonkey-demo.user.js`:

```javascript
// Modifier les emails de test
const emails = [
    { from: 'votre-email@example.com', subject: 'Votre sujet', body: 'Votre message', type: 'type' }
];

// Modifier les délais (en millisecondes)
await wait(2000); // 2 secondes
```

## 🚀 Avantages

- ✅ Démo complète en un clic
- ✅ Présentation professionnelle
- ✅ Progression visuelle
- ✅ Notifications élégantes
- ✅ Automatisation totale

## 🔧 Dépannage

**Le bouton n'apparaît pas:**
- Vérifier que Tampermonkey est activé
- Vérifier que le script est activé dans le Dashboard
- Rafraîchir la page (F5)

**La démo ne fonctionne pas:**
- Vérifier que l'API est démarrée (http://localhost:5078/health)
- Ouvrir la console (F12) pour voir les erreurs
- Vérifier que vous êtes sur http://localhost:5078/demo.html

**Erreur de connexion:**
- Vérifier que le compte existe
- Utiliser les identifiants par défaut: sarraboudjellal57@gmail.com / SecurePass123!

## 📝 Notes

- La démo prend environ 30-40 secondes
- Chaque étape est affichée avec progression
- Les notifications apparaissent automatiquement
- La démo peut être relancée à tout moment

Profitez de la démo automatique de MemoLib ! 🎉