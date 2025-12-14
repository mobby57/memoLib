# 🎯 SecureVault Accessible v1.0

**Interface universelle pour illettrés, sourds, muets, aveugles**

Application plug-and-play d'envoi d'emails avec navigation vocale intégrée et interface 3 boutons maximum.

---

## 🚀 Démarrage Ultra-Rapide

```bash
python run_accessible.py
```

**C'est tout !** L'application s'ouvre automatiquement dans votre navigateur à l'adresse http://127.0.0.1:5001

---

## 🎯 Public Cible

### ✅ Personnes illettrées
- Navigation 100% vocale
- Aucun texte obligatoire à lire
- Instructions audio automatiques
- Gros boutons avec icônes

### ✅ Personnes sourdes  
- Interface visuelle claire
- Sous-titres et textes simples
- Icônes explicites (📨, 🎙️, 📎)
- Modèles de messages pré-écrits

### ✅ Personnes muettes
- Saisie par modèles rapides
- Clavier virtuel simplifié
- Options pré-structurées
- Validation par boutons

### ✅ Personnes aveugles
- Compatible lecteurs d'écran
- Navigation clavier complète
- Synthèse vocale intégrée
- Feedback audio permanent

---

## 🎮 Interface Ultra-Simple

### 3 Boutons Maximum

1. **📝 Créer un message**
   - Mode vocal : Parlez → IA génère → Validation
   - Mode modèles : Choisir parmi 3 types prédéfinis

2. **📎 Joindre un document**
   - Sélection fichier simplifiée
   - Support PDF, images, documents

3. **📤 Envoyer**
   - Validation vocale ou visuelle
   - Envoi automatique sécurisé

### Navigation Vocale

- **🎤 "Créer message"** → Ouvre le compositeur
- **🎤 "Joindre fichier"** → Sélection de document  
- **🎤 "Envoyer"** → Finalise l'envoi
- **🎤 "Aide"** → Instructions complètes

---

## ⚡ Fonctionnement Plug-and-Play

### 1. Inscription (1 fois seulement)
- **Mode vocal** : Dites nom, prénom, email
- **Mode texte** : 3 champs simples
- **Auto-configuration** : Email automatique créé

### 2. Utilisation quotidienne
- **Parler** → L'IA comprend et structure
- **Écouter** → Validation du message généré  
- **Valider** → Envoi automatique
- **Terminé** → Aucune configuration

### 3. Gestion automatique
- ✅ Création adresse email automatique
- ✅ Configuration SMTP invisible
- ✅ Sécurisation des credentials
- ✅ Redirection des réponses

---

## 🎤 Commandes Vocales

| Commande | Action |
|----------|--------|
| "Créer message" | Ouvre le compositeur |
| "Parler maintenant" | Active l'enregistrement |
| "Joindre fichier" | Sélection document |
| "Envoyer message" | Finalise l'envoi |
| "Écouter" | Lit le contenu |
| "Aide" | Instructions complètes |
| "Répéter" | Relit la page |

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
|--------|--------|
| `1` | Créer message |
| `2` | Joindre fichier |
| `3` | Envoyer |
| `H` | Aide |
| `Ctrl + Espace` | Commande vocale |
| `Échap` | Fermer modal |

---

## 📋 Modèles de Messages

### 📌 Demande d'information
```
Bonjour,

Je souhaiterais obtenir des informations concernant...

Pouvez-vous me renseigner ?

Cordialement,
```

### ⚠️ Signaler un problème  
```
Madame, Monsieur,

Je vous écris pour signaler le problème suivant...

Merci de votre attention.

Cordialement,
```

### ✅ Confirmer une prestation
```
Bonjour,

Je confirme que la prestation a été effectuée...

Bonne journée,
```

---

## 🔧 Installation Technique

### Prérequis
- Python 3.8+
- Microphone (pour vocal)
- Haut-parleurs (pour synthèse)

### Dépendances Auto-Installées
- Flask (interface web)
- pyttsx3 (synthèse vocale)
- SpeechRecognition (reconnaissance vocale)
- pyaudio (audio)

### Structure des Fichiers
```
iaPostemanage/
├── run_accessible.py           # 🚀 Lanceur principal
├── src/accessibility/
│   └── accessible_app.py       # 🎯 Application accessible
├── templates/accessible/
│   ├── index.html             # 🏠 Interface principale
│   └── inscription.html       # 📝 Page inscription
├── static/
│   ├── css/accessible.css     # 🎨 Styles accessibles
│   └── js/accessible.js       # 🎤 Navigation vocale
└── data/
    └── accessible_users.db    # 💾 Base utilisateurs
```

---

## 🔐 Sécurité Intégrée

- **Chiffrement** : Credentials sécurisés
- **Auto-config** : Aucune saisie manuelle
- **Isolation** : Base de données séparée
- **Sessions** : Gestion automatique

---

## 🌐 Compatibilité

### Navigateurs
- ✅ Chrome (recommandé pour vocal)
- ✅ Firefox  
- ✅ Edge
- ✅ Safari

### Systèmes
- ✅ Windows 10/11
- ✅ macOS
- ✅ Linux Ubuntu/Debian

### Accessibilité
- ✅ NVDA (Windows)
- ✅ JAWS (Windows)  
- ✅ VoiceOver (macOS)
- ✅ Orca (Linux)

---

## 🆘 Support & Aide

### Problèmes Courants

**🎤 Microphone non détecté**
```bash
# Windows : Vérifier autorisations microphone
# Paramètres > Confidentialité > Microphone
```

**🔊 Pas de synthèse vocale**
```bash
# Vérifier haut-parleurs système
# Tester avec autre application
```

**📧 Erreur envoi email**
```bash
# Vérifier connexion internet
# Réessayer dans quelques minutes
```

### Aide Intégrée
- Bouton **❓ Aide** sur chaque page
- Commande vocale **"Aide"**
- Instructions audio automatiques

---

## 🎯 Philosophie du Projet

> **"3 boutons maximum, navigation vocale, zéro configuration"**

Cette application transforme l'envoi d'emails en action simple et universelle :

1. **Parler** → L'IA comprend
2. **Écouter** → Validation du contenu  
3. **Valider** → Envoi automatique

**Objectif** : Rendre l'email accessible à tous, sans exception.

---

## 📞 Contact & Contribution

- **Issues** : Signaler un problème
- **Suggestions** : Proposer des améliorations
- **Tests** : Tester avec différents profils d'accessibilité

**Vision** : Une application email vraiment universelle. 🌍