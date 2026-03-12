# 📊 Guide des Diagrammes MemoLib

## 🎯 Vue d'Ensemble

Ce document liste **tous les diagrammes architecturaux** disponibles dans le projet MemoLib et explique comment les visualiser et les utiliser.

---

## 📁 Fichiers de Diagrammes

### 1. **DIAGRAMMES_ARCHITECTURE.md** ⭐
**Contenu:** 10 diagrammes techniques complets
- ✅ Architecture Globale (Frontend + Backend + Data + Services)
- ✅ Flux de Données Principal (Séquence complète)
- ✅ Structure des Controllers (65 controllers organisés)
- ✅ Sécurité & Authentification (JWT, RBAC, Policies)
- ✅ Modèle de Données (15+ entités relationnelles)
- ✅ Workflow Email Monitoring (Machine à états)
- ✅ Déploiement Production (CI/CD, Vercel, Fly.io)
- ✅ Scalabilité 3 Phases (0-1K, 1K-10K, 10K+ users)
- ✅ Monitoring & Observabilité (Logs, Metrics, Errors)
- ✅ Performance Optimization (Caching, DB, Code)

**Format:** Mermaid (rendu automatique GitHub)

---

### 2. **DIAGRAMMES_VISUELS.md** 🎨
**Contenu:** 12 diagrammes orientés métier
- ✅ Architecture Globale (Vue simplifiée)
- ✅ Hiérarchie des Rôles (SuperAdmin → Avocat → Client)
- ✅ Flux Gestion Dossier (Séquence complète)
- ✅ Modèle de Données (ERD détaillé)
- ✅ Workflow Complet (State Machine)
- ✅ Navigation Pages (Toutes les routes)
- ✅ Sécurité & Permissions (Multi-couches)
- ✅ Stack Technologique (Frontend + Backend + Services)
- ✅ Métriques & KPIs (Dashboard)
- ✅ Communication Temps Réel (WebSocket)
- ✅ Facturation & Paiement (Stripe)
- ✅ Gestion Documents (Lifecycle)

**Format:** Mermaid avec emojis et couleurs

---

### 3. **MAPPING_DIAGRAMMES_CODE.md** 🗺️
**Contenu:** Mapping diagrammes → code source
- ✅ Chaque élément de diagramme → fichier(s) correspondant(s)
- ✅ Exemples de code TypeScript/C#
- ✅ Liens vers fichiers sources
- ✅ Explication de l'implémentation

**Utilité:** Comprendre comment les diagrammes se traduisent en code réel

---

### 4. **docs/SYSTEM_DIAGRAMS.md** 📐
**Contenu:** Diagrammes système additionnels
- Architecture système
- Diagrammes de déploiement
- Diagrammes de composants

---

## 🌐 Visualisation Interactive

### Option 1: Page Web Interactive (Recommandé) ⭐
**Fichier:** `wwwroot/diagrammes.html`

**Accès:**
```
http://localhost:5078/diagrammes.html
```

**Fonctionnalités:**
- ✅ Rendu Mermaid.js en temps réel
- ✅ Navigation par onglets
- ✅ Design moderne et responsive
- ✅ 8 diagrammes principaux
- ✅ Légendes explicatives

**Diagrammes disponibles:**
1. 🏗️ Architecture Globale
2. 🔄 Flux de Données
3. 🗂️ Structure Controllers
4. 🔐 Sécurité & Auth
5. 📦 Modèle de Données
6. 📧 Workflow Email
7. 🚀 Déploiement
8. 📊 Scalabilité

---

### Option 2: GitHub (Rendu Automatique)
**Accès:** Ouvrir les fichiers `.md` directement sur GitHub

**Avantages:**
- ✅ Rendu automatique Mermaid
- ✅ Pas d'installation requise
- ✅ Partage facile (URL)

**Fichiers:**
- `DIAGRAMMES_ARCHITECTURE.md`
- `DIAGRAMMES_VISUELS.md`
- `MAPPING_DIAGRAMMES_CODE.md`

---

### Option 3: VS Code (Extension Mermaid)
**Installation:**
```bash
# Installer l'extension Mermaid Preview
code --install-extension bierner.markdown-mermaid
```

**Utilisation:**
1. Ouvrir un fichier `.md` avec diagrammes
2. Clic droit → "Open Preview"
3. Les diagrammes Mermaid s'affichent

---

### Option 4: Mermaid Live Editor
**URL:** https://mermaid.live

**Utilisation:**
1. Copier le code Mermaid depuis les fichiers `.md`
2. Coller dans l'éditeur en ligne
3. Visualiser et exporter (PNG, SVG, PDF)

---

## 📤 Export des Diagrammes

### Export PNG/SVG (Mermaid CLI)

**Installation:**
```bash
npm install -g @mermaid-js/mermaid-cli
```

**Export PNG:**
```bash
mmdc -i DIAGRAMMES_ARCHITECTURE.md -o diagrams/architecture.png
```

**Export SVG:**
```bash
mmdc -i DIAGRAMMES_ARCHITECTURE.md -o diagrams/architecture.svg
```

**Export PDF:**
```bash
mmdc -i DIAGRAMMES_ARCHITECTURE.md -o diagrams/architecture.pdf
```

**Export tous les diagrammes:**
```bash
mmdc -i DIAGRAMMES_ARCHITECTURE.md -o diagrams/
mmdc -i DIAGRAMMES_VISUELS.md -o diagrams/
```

---

## 🎯 Utilisation par Cas d'Usage

### 📚 Documentation Technique
**Fichiers recommandés:**
- `DIAGRAMMES_ARCHITECTURE.md` (architecture complète)
- `MAPPING_DIAGRAMMES_CODE.md` (code mapping)

**Visualisation:** GitHub ou VS Code

---

### 🎨 Présentation Client/Management
**Fichiers recommandés:**
- `DIAGRAMMES_VISUELS.md` (diagrammes colorés avec emojis)
- `wwwroot/diagrammes.html` (interface interactive)

**Visualisation:** Page web interactive

---

### 👨‍💻 Développement
**Fichiers recommandés:**
- `MAPPING_DIAGRAMMES_CODE.md` (comprendre le code)
- `DIAGRAMMES_ARCHITECTURE.md` (architecture technique)

**Visualisation:** VS Code avec extension Mermaid

---

### 📊 Analyse & Audit
**Fichiers recommandés:**
- `DIAGRAMMES_ARCHITECTURE.md` (sécurité, monitoring)
- `DIAGRAMMES_VISUELS.md` (flux métier)

**Visualisation:** Export PNG/PDF pour rapports

---

## 🔄 Mise à Jour des Diagrammes

### Quand mettre à jour ?
- ✅ Ajout de nouveaux controllers
- ✅ Modification de l'architecture
- ✅ Nouveaux services externes
- ✅ Changement de flux métier
- ✅ Évolution du modèle de données

### Comment mettre à jour ?

**1. Modifier le fichier Markdown:**
```markdown
# Éditer DIAGRAMMES_ARCHITECTURE.md
# Modifier le code Mermaid dans les blocs ```mermaid
```

**2. Vérifier le rendu:**
- GitHub (push et visualiser)
- VS Code (Preview)
- Mermaid Live Editor (copier/coller)

**3. Mettre à jour la page web:**
```html
<!-- Éditer wwwroot/diagrammes.html -->
<!-- Modifier les blocs <div class="mermaid"> -->
```

**4. Tester localement:**
```bash
dotnet run
# Ouvrir http://localhost:5078/diagrammes.html
```

---

## 📋 Checklist Complétude

### ✅ Diagrammes Disponibles
- [x] Architecture Globale
- [x] Flux de Données
- [x] Structure Controllers
- [x] Sécurité & Auth
- [x] Modèle de Données (ERD)
- [x] Workflow Email
- [x] Déploiement Production
- [x] Scalabilité 3 Phases
- [x] Monitoring & Observabilité
- [x] Performance Optimization
- [x] Hiérarchie Rôles
- [x] Navigation Pages
- [x] Stack Technologique
- [x] Communication Temps Réel
- [x] Facturation & Paiement
- [x] Gestion Documents

### ✅ Formats de Visualisation
- [x] Page web interactive (`diagrammes.html`)
- [x] Fichiers Markdown (GitHub)
- [x] VS Code (Extension Mermaid)
- [x] Mermaid Live Editor
- [x] Export PNG/SVG/PDF

### ✅ Documentation
- [x] DIAGRAMMES_ARCHITECTURE.md
- [x] DIAGRAMMES_VISUELS.md
- [x] MAPPING_DIAGRAMMES_CODE.md
- [x] GUIDE_DIAGRAMMES.md (ce fichier)

---

## 🎓 Ressources

### Syntaxe Mermaid
- **Documentation officielle:** https://mermaid.js.org/
- **Exemples:** https://mermaid.js.org/syntax/examples.html
- **Live Editor:** https://mermaid.live

### Types de Diagrammes Supportés
- ✅ **Flowchart** (graph TB/LR) - Flux et architecture
- ✅ **Sequence Diagram** - Interactions temporelles
- ✅ **Entity Relationship** (erDiagram) - Modèle de données
- ✅ **State Diagram** - Machines à états
- ✅ **Class Diagram** - Structure orientée objet
- ✅ **Gantt** - Planning projet
- ✅ **Pie Chart** - Statistiques
- ✅ **Git Graph** - Historique Git

---

## 🚀 Accès Rapide

### Liens Locaux (Serveur démarré)
- 🌐 **Page interactive:** http://localhost:5078/diagrammes.html
- 🏠 **Accueil:** http://localhost:5078/index.html
- 📊 **Demo complète:** http://localhost:5078/demo.html

### Fichiers Sources
- 📄 `DIAGRAMMES_ARCHITECTURE.md` - Diagrammes techniques
- 📄 `DIAGRAMMES_VISUELS.md` - Diagrammes métier
- 📄 `MAPPING_DIAGRAMMES_CODE.md` - Code mapping
- 📄 `wwwroot/diagrammes.html` - Page interactive

---

## 💡 Conseils

### Pour les Développeurs
1. Utilisez VS Code avec l'extension Mermaid
2. Consultez `MAPPING_DIAGRAMMES_CODE.md` pour comprendre le code
3. Mettez à jour les diagrammes lors de modifications architecturales

### Pour les Chefs de Projet
1. Utilisez `wwwroot/diagrammes.html` pour les présentations
2. Exportez en PDF pour les rapports
3. Partagez les liens GitHub pour la documentation

### Pour les Clients
1. Montrez `DIAGRAMMES_VISUELS.md` (plus accessible)
2. Utilisez la page web interactive
3. Expliquez avec les légendes fournies

---

## 📞 Support

**Questions sur les diagrammes ?**
- Consultez la documentation Mermaid: https://mermaid.js.org/
- Ouvrez une issue GitHub
- Contactez l'équipe technique

---

**Dernière mise à jour:** 27 février 2026  
**Version:** 2.1.0  
**Auteur:** Équipe MemoLib
