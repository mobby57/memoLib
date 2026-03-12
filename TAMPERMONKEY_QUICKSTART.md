# 🚀 DÉMARRAGE RAPIDE - Scripts Tampermonkey

## ⚡ Installation en 3 Minutes

### 1️⃣ Installer Tampermonkey (30 secondes)
- **Chrome/Edge**: https://www.tampermonkey.net/
- **Firefox**: https://addons.mozilla.org/firefox/addon/tampermonkey/

### 2️⃣ Installer les Scripts (1 minute)
1. Cliquer sur l'icône Tampermonkey
2. Cliquer sur "Dashboard"
3. Onglet "Utilities"
4. Glisser les 6 fichiers `.user.js` depuis `tampermonkey/`
5. Cliquer "Install" pour chaque script

### 3️⃣ Tester (30 secondes)
1. Ouvrir http://localhost:5078/demo.html
2. Voir les nouveaux boutons et icônes
3. Cliquer sur "🎬 DÉMO AUTOMATIQUE"

## ✅ Vérification

Vous devriez voir:
- 🎬 Bouton "DÉMO AUTOMATIQUE" (en haut à droite)
- ⌨️ Icône clavier (en bas à droite)
- 📅 Bouton "Sync Calendar" (en bas à droite)
- 📄 Zone "Glisser PDF ici pour OCR" (en bas à droite)
- ✨ Icône UX (en bas à droite)

## 🎯 Utilisation

### Demo Automation
Cliquer sur "🎬 DÉMO AUTOMATIQUE" → Démo complète en 30s

### Raccourcis Clavier
- **?** : Afficher l'aide
- **Ctrl+N** : Nouveau dossier
- **Ctrl+F** : Recherche
- **Ctrl+S** : Sauvegarder
- **Esc** : Fermer

### OCR
Glisser un PDF sur la zone → Texte extrait automatiquement

### Calendar Sync
Cliquer sur "📅 Sync Calendar" → Export événements

### Gmail Integration
Ouvrir Gmail → Bouton "📧 → MemoLib" dans la barre d'outils

## 🐛 Problème ?

**Rien ne s'affiche ?**
1. Vérifier que Tampermonkey est installé
2. Ouvrir Dashboard → Vérifier que les scripts sont activés
3. Rafraîchir la page (F5)

**Erreur API ?**
1. Vérifier que MemoLib est démarré: `dotnet run`
2. Vérifier l'URL: http://localhost:5078

## 📚 Documentation

- **README complet**: `tampermonkey/README.md`
- **Stratégie**: `TAMPERMONKEY_STRATEGY.md`
- **Support**: support@memolib.com

---

**C'est parti ! 🚀**
