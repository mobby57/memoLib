# 🎬 SCRIPT DE DÉMONSTRATION - MemoLib v2.0

## 🚀 Lancement de l'Application

```powershell
# Terminal 1 - Lancer l'API
cd c:\Users\moros\Desktop\memolib\MemoLib.Api
dotnet run
```

**Accès:**
- 🌐 Interface principale: http://localhost:5078/demo.html
- 📋 Formulaires intelligents: http://localhost:5078/intake-forms.html
- ❤️ Health check: http://localhost:5078/health

---

## 🎯 DÉMO 1: Formulaires Intelligents

### Étape 1: Créer un Formulaire
1. Ouvrir http://localhost:5078/intake-forms.html
2. Onglet "🛠️ Créer Formulaire"
3. Remplir:
   - **Nom**: "Formulaire Divorce"
   - **Description**: "Formulaire pour dossiers de divorce"
4. Cliquer "➕ Ajouter un Champ" (3 fois):
   - Champ 1: "Nom complet" (text, obligatoire)
   - Champ 2: "Email" (email, obligatoire)
   - Champ 3: "Date de mariage" (text, obligatoire)
5. Cliquer "📎 Ajouter Document Requis" (3 fois):
   - "Pièce d'identité"
   - "Acte de mariage"
   - "Livret de famille"
6. Cliquer "💾 Enregistrer le Formulaire"

**Résultat:** ✅ Formulaire créé avec ID unique

---

## 🎯 DÉMO 2: Espace Partagé Multi-Participants

### Étape 1: Créer un Dossier
```http
POST http://localhost:5078/api/cases
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Divorce Dupont",
  "clientId": null,
  "priority": 5
}
```

### Étape 2: Créer l'Espace Partagé
1. Onglet "👥 Espace Partagé"
2. Remplir:
   - **ID du Dossier**: {caseId du dossier créé}
   - **Nom**: "Dossier Dupont - Divorce"
3. Cliquer "👤 Ajouter Participant" (5 fois):
   - **Client**: jean.dupont@email.com (VIEWER, CLIENT)
   - **Avocat**: avocat@cabinet.fr (OWNER, LAWYER)
   - **Juge**: juge@tribunal.fr (VIEWER, JUDGE)
   - **Secrétaire**: secretaire@cabinet.fr (EDITOR, SECRETARY)
   - **Expert**: expert@expertise.fr (EDITOR, EXPERT)
4. Cliquer "🚀 Créer l'Espace Partagé"

**Résultat:** ✅ Espace créé avec 5 participants

---

## 🎯 DÉMO 3: Design System Unifié

### Voir les Composants
1. Ouvrir http://localhost:5078/intake-forms.html
2. Observer:
   - ✅ Boutons avec style cohérent (hover effect)
   - ✅ Cartes avec ombres
   - ✅ Formulaires avec focus bleu
   - ✅ Badges colorés
   - ✅ Animations fluides

### Tester le Design System
```html
<!-- Ouvrir la console du navigateur -->
<button class="btn btn-primary">Test Bouton</button>
<div class="card">Test Carte</div>
<span class="badge badge-success">Test Badge</span>
```

---

## 🎯 DÉMO 4: Workflow Complet

### Scénario: Nouveau Client Divorce

#### 1. Client Reçoit le Formulaire
```
Lien: http://localhost:5078/form/{formId}
```

#### 2. Client Soumet le Formulaire
```http
POST http://localhost:5078/api/intake/submit
Content-Type: application/json

{
  "formId": "{formId}",
  "clientEmail": "jean.dupont@email.com",
  "clientName": "Jean Dupont",
  "formData": {
    "nom_complet": "Jean Dupont",
    "email": "jean.dupont@email.com",
    "date_mariage": "15/06/2010"
  },
  "uploadedDocumentIds": []
}
```

#### 3. Avocat Voit la Soumission
1. Onglet "📥 Soumissions"
2. Voir la nouvelle soumission
3. Cliquer "📋 Voir Détails"

#### 4. Avocat Crée le Dossier
```http
POST http://localhost:5078/api/cases
{
  "title": "Divorce Dupont",
  "priority": 5
}
```

#### 5. Avocat Crée l'Espace Partagé
- Ajouter tous les participants
- Chacun peut suivre l'évolution

#### 6. Upload de Documents
```http
POST http://localhost:5078/api/workspace/{workspaceId}/documents
{
  "fileName": "acte_mariage.pdf",
  "filePath": "/uploads/acte_mariage.pdf",
  "fileSize": 245678,
  "uploadedBy": "avocat@cabinet.fr",
  "category": "CONTRACT",
  "visibleToRoles": ["LAWYER", "CLIENT"]
}
```

#### 7. Journal d'Activité
```http
GET http://localhost:5078/api/workspace/{workspaceId}/activities
```

**Résultat:** ✅ Workflow complet de A à Z

---

## 🎯 DÉMO 5: Architecture Harmonisée

### Voir la Structure
```powershell
# Ouvrir l'explorateur
explorer c:\Users\moros\Desktop\memolib\MemoLib.Api
```

**Observer:**
- ✅ `.github/workflows/` - CI/CD
- ✅ `wwwroot/css/design-system.css` - Design System
- ✅ `.editorconfig` - Standards de code
- ✅ `ARCHITECTURE_HARMONISEE.md` - Documentation
- ✅ `CONTRIBUTING.md` - Guide contribution
- ✅ `DEPLOYMENT.md` - Guide déploiement

---

## 🎯 DÉMO 6: CI/CD Pipeline

### Voir le Workflow
```powershell
# Ouvrir le fichier
code .github/workflows/ci.yml
```

**Contenu:**
- ✅ Build automatique
- ✅ Tests automatiques
- ✅ Déploiement auto (dev/prod)

### Tester le Pipeline
```bash
# Créer une feature
git checkout -b feature/demo
git add .
git commit -m "feat: demo harmonisation"
git push origin feature/demo

# → GitHub Actions se déclenche automatiquement
```

---

## 🎯 DÉMO 7: Git Workflow

### Conventions de Commit
```bash
# Exemples
git commit -m "feat(intake): ajout formulaires intelligents"
git commit -m "fix(auth): correction validation JWT"
git commit -m "docs(api): mise à jour endpoints"
git commit -m "refactor(services): simplification code"
```

### Workflow Git Flow
```bash
# Feature
git checkout develop
git checkout -b feature/nouvelle-feature
# ... développement ...
git commit -m "feat: description"
git push origin feature/nouvelle-feature
# → Créer Pull Request vers develop

# Hotfix
git checkout main
git checkout -b hotfix/urgent
git commit -m "hotfix: correction critique"
git push origin hotfix/urgent
# → Merge vers main ET develop
```

---

## 🎯 DÉMO 8: Tests API

### Tester les Endpoints

#### 1. Health Check
```http
GET http://localhost:5078/health
```
**Réponse:** `{ "status": "healthy" }`

#### 2. Créer Formulaire
```http
POST http://localhost:5078/api/intake/forms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Test Form",
  "description": "Test",
  "fields": [],
  "requiredDocuments": []
}
```

#### 3. Créer Workspace
```http
POST http://localhost:5078/api/workspace/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "{caseId}",
  "name": "Test Workspace",
  "participants": []
}
```

---

## 📊 Résultats Attendus

### ✅ Fonctionnalités
- [x] Formulaires intelligents créés
- [x] Espaces partagés fonctionnels
- [x] Design System appliqué
- [x] CI/CD configuré
- [x] Git workflow standardisé
- [x] Documentation complète

### ✅ Qualité
- [x] Code compilé sans erreur
- [x] Interface responsive
- [x] Animations fluides
- [x] API REST fonctionnelle
- [x] Base de données à jour

### ✅ Architecture
- [x] Structure harmonisée
- [x] Standards de code définis
- [x] Pipeline automatisé
- [x] Documentation exhaustive

---

## 🎬 Ordre de Démonstration Recommandé

1. **Lancer l'API** (5 min)
2. **Démo Formulaires** (10 min)
3. **Démo Espace Partagé** (10 min)
4. **Démo Design System** (5 min)
5. **Démo Workflow Complet** (15 min)
6. **Démo Architecture** (5 min)
7. **Démo CI/CD** (5 min)
8. **Démo Git** (5 min)

**Durée totale:** ~60 minutes

---

## 📞 Support

En cas de problème:
1. Vérifier que l'API tourne: http://localhost:5078/health
2. Consulter les logs: `logs/memolib-*.txt`
3. Redémarrer l'API: `Ctrl+C` puis `dotnet run`

---

**🎉 Bonne démonstration !**
