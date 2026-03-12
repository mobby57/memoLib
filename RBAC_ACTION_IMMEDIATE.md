# ⚡ PLAN D'ACTION IMMÉDIAT - RBAC

## 🎯 OBJECTIF: Démarrer le développement optimisé par rôle

---

## ✅ ÉTAPE 1: LECTURE (15 minutes)

### Action:
```bash
# Ouvrir et lire dans l'ordre:
1. RBAC_RESUME_1_PAGE.md (2 min)
2. RBAC_GUIDE_DECISION.md (10 min)
3. RBAC_INDEX.md (3 min)
```

### Résultat attendu:
- ✅ Comprendre les 4 rôles (CLIENT, AGENT, JURISTE, OWNER)
- ✅ Comprendre l'ordre optimal (CLIENT → AGENT → JURISTE → OWNER)
- ✅ Comprendre le ROI (12.8x, break-even 0.9 mois)

---

## ✅ ÉTAPE 2: DÉCISION (5 minutes)

### Question:
**Suivre l'ordre RBAC optimisé ou garder le backlog actuel?**

### Option A - RBAC Optimisé ✅ RECOMMANDÉ
**Avantages:**
- ROI 12.8x (vs 3.2x actuel)
- Quick wins 2 semaines
- Équipe libérée progressivement

**Inconvénients:**
- Réorganiser backlog (30 min)
- Changer plan Sprint 1

### Option B - Backlog Actuel
**Avantages:**
- Pas de changement
- US2 (Notes) déjà commencé

**Inconvénients:**
- ROI sous-optimal
- Pas de quick wins
- Équipe pas libérée

### Décision:
```
[ ] Option A - RBAC Optimisé
[ ] Option B - Backlog Actuel
```

---

## ✅ ÉTAPE 3: SI OPTION A - RÉORGANISER BACKLOG (30 minutes)

### 3.1 Mettre à jour JIRA_IMPORT_BACKLOG_S1_S3.csv

**Nouvel ordre Sprint 1:**
```csv
# Lot 1.1: CLIENT (Semaine 1-2, 18 pts)
US10,Portail client suivi,8,Highest,sprint1,p0,role-client
US11,Upload client guidé,5,Highest,sprint1,p0,role-client
US19,Paiement en ligne,5,High,sprint1,p1,role-client

# Lot 1.2: AGENT (Semaine 3-4, 18 pts)
US12,Triage assistant,8,Highest,sprint1,p0,role-agent
US13,Checklist passation,5,Highest,sprint1,p0,role-agent
US1,Ingestion multi-canaux,5,High,sprint1,p1,role-agent

# Lot 1.3: JURISTE (Semaine 5-7, 19 pts)
US14,Vue 360 consolidée,8,Highest,sprint2,p0,role-juriste
US6,Calendrier SLA,8,Highest,sprint2,p0,role-juriste
US2,Notes collaboratives,3,High,sprint2,p1,role-juriste
```

### 3.2 Mettre à jour PLAN_EXECUTION_FINAL_13_SEMAINES.md

Remplacer l'ordre des lots selon RBAC_ANALYSE_OPTIMALE.md

---

## ✅ ÉTAPE 4: DÉVELOPPER US10 (2 semaines)

### 4.1 Vérifier fichiers créés
```bash
# Fichiers déjà créés:
✅ Models/ClientPortal.cs
✅ Controllers/ClientPortalController.cs
✅ Configuration/RbacConfig.cs

# À faire:
❌ Migration UpdatedAt
❌ Tests unitaires
❌ Interface client
```

### 4.2 Créer migration
```bash
cd MemoLib.Api

# Nettoyer si erreur
rmdir /s /q obj
rmdir /s /q bin

# Restaurer et migrer
dotnet restore
dotnet ef migrations add AddCaseUpdatedAt
dotnet ef database update
```

### 4.3 Tester API
```bash
# Lancer app
dotnet run

# Tester endpoints (dans test-all-features.http):
GET http://localhost:5078/api/client/portal/my-cases
GET http://localhost:5078/api/client/portal/case/{id}
GET http://localhost:5078/api/client/portal/case/{id}/next-actions
```

### 4.4 Créer interface client (wwwroot/client-portal.html)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Mon Espace Client - MemoLib</title>
</head>
<body>
    <h1>Mes Dossiers</h1>
    <div id="cases-list"></div>
    
    <script>
        // Charger dossiers client
        fetch('/api/client/portal/my-cases', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(r => r.json())
        .then(cases => {
            // Afficher liste dossiers
        });
    </script>
</body>
</html>
```

---

## ✅ ÉTAPE 5: MESURER GAINS (Après 2 semaines)

### KPIs à mesurer:

**Avant US10:**
- Appels support: _____ appels/jour
- Satisfaction client: _____ /5
- Temps réponse: _____ heures

**Après US10:**
- Appels support: _____ appels/jour (objectif: -70%)
- Satisfaction client: _____ /5 (objectif: +40%)
- Temps réponse: _____ heures (objectif: 0h, self-service)

### Validation:
```
[ ] -70% appels support atteint
[ ] +40% satisfaction atteinte
[ ] Clients utilisent portail (>80%)
```

---

## ✅ ÉTAPE 6: CONTINUER AVEC US11 (1 semaine)

### Développer Upload Client Guidé
```
1. Créer checklist documents par type dossier
2. Validation format/taille côté client
3. Upload avec barre progression
4. Confirmation réception traçable
```

### KPIs:
- Erreurs upload: -60% (de 5 à 2 erreurs/dossier)
- Documents complets: +80%

---

## ✅ ÉTAPE 7: SPRINT 1 COMPLET (4 semaines)

### Semaine 1-2: CLIENT (US10, US11, US19)
- US10: Portail client ✅
- US11: Upload guidé ✅
- US19: Paiement CB ✅

### Semaine 3-4: AGENT (US12, US13, US1)
- US12: Triage priorisé
- US13: Checklist passation
- US1: Ingestion multi-canaux

### Résultat Sprint 1:
- 55 points livrés
- Clients autonomes (-70% appels)
- Agents productifs (+200%)

---

## 📋 CHECKLIST COMPLÈTE

### Aujourd'hui (1h):
- [ ] Lire RBAC_RESUME_1_PAGE.md
- [ ] Lire RBAC_GUIDE_DECISION.md
- [ ] Décider Option A ou B
- [ ] Si Option A: réorganiser backlog

### Cette semaine (5 jours):
- [ ] Créer migration UpdatedAt
- [ ] Tester ClientPortalController
- [ ] Créer interface client-portal.html
- [ ] Tests unitaires US10
- [ ] Déployer en staging

### Semaine prochaine:
- [ ] Mesurer KPIs US10
- [ ] Valider avec utilisateurs CLIENT
- [ ] Commencer US11 (Upload guidé)

### Semaine 3-4:
- [ ] Finir US11 + US19
- [ ] Commencer US12 (Triage AGENT)

---

## 🚨 POINTS D'ATTENTION

### Erreurs à éviter:
- ❌ Développer US14 (Vue 360) avant US1 (Ingestion)
- ❌ Oublier US17 (RGPD) → risque amende
- ❌ Négliger US10/11 (CLIENT) → appels saturent équipe

### Bonnes pratiques:
- ✅ Tester avec utilisateur final de chaque rôle
- ✅ Mesurer KPIs après chaque US
- ✅ Valider permissions (401/403)
- ✅ Documenter retours utilisateurs

---

## 🎯 RÉSUMÉ ACTION IMMÉDIATE

**MAINTENANT (5 min):**
```bash
# Lire résumé
cat RBAC_RESUME_1_PAGE.md

# Décider
echo "Je choisis Option A (RBAC Optimisé)"
```

**AUJOURD'HUI (1h):**
```bash
# Réorganiser backlog
# Mettre US10, US11, US19 en tête Sprint 1
```

**CETTE SEMAINE (5 jours):**
```bash
# Développer US10
cd MemoLib.Api
dotnet ef migrations add AddCaseUpdatedAt
dotnet ef database update
dotnet run

# Tester
curl http://localhost:5078/api/client/portal/my-cases
```

**DANS 2 SEMAINES:**
```bash
# Mesurer gains
# -70% appels support?
# +40% satisfaction?
# → Si oui, continuer US11
```

---

**🚀 PRÊT? Commence par: cat RBAC_RESUME_1_PAGE.md**
