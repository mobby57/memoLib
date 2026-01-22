# 🚀 START HERE - Tests Manuels IA Poste Manager

**Date**: 21 janvier 2026  
**Durée estimée**: 20 minutes  
**Objectif**: Valider le Workspace Reasoning Engine en conditions réelles

---

## ✅ PRÉ-REQUIS (Vérifiez d'abord)

```
🟢 Dev Server    : http://localhost:3000      ← DOIT ÊTRE VERT
🟢 Ollama Server : http://localhost:11434     ← DOIT ÊTRE VERT  
🟢 Modèle IA     : llama3.2:3b (2.0 GB)       ← DOIT ÊTRE CHARGÉ
🟢 Database      : prisma/dev.db              ← DOIT EXISTER
```

**Si un service est rouge**: Voir section "Dépannage Rapide" en bas.

---

## 🎯 WORKFLOW SIMPLIFIÉ (5 étapes)

### 1️⃣ OUVRIR LE FORMULAIRE (1 min)

**URL**: http://localhost:3000/lawyer/workspace

*(Un navigateur devrait déjà être ouvert à cette adresse)*

**Actions**:
- Clic: **"Nouveau Workspace"**
- Sélectionner **Source**: EMAIL
- Sélectionner **Type**: OQTF

---

### 2️⃣ COLLER L'EMAIL DE TEST (30 secondes)

**Copier-coller ce texte complet** dans le champ "Contenu":

```
De: ahmed.dubois@email.com
Objet: URGENT - OQTF reçue - Besoin aide juridique
Date: 21 janvier 2026

Bonjour,

J'ai reçu une OQTF il y a 3 jours (18 janvier 2026). Je suis en France depuis 5 ans avec ma famille (épouse + 2 enfants nés ici). 

Je travaille en CDI comme développeur (3200€/mois). Mon titre de séjour est expiré depuis 6 mois mais j'ai fait une demande de renouvellement en août 2025.

La préfecture me demande de quitter le territoire dans 30 jours. Que dois-je faire?

Cordialement,
Ahmed DUBOIS
```

**Puis**: Clic **"Créer Workspace"**

---

### 3️⃣ EXÉCUTER LE RAISONNEMENT IA (15 minutes)

**Instructions**: Cliquer **7 fois** sur le bouton **"🧠 Exécuter Raisonnement IA"**

| Clic | Transition | Durée attendue | Ce que vous devez voir |
|------|------------|----------------|------------------------|
| **1** | RECEIVED → FACTS_EXTRACTED | 10-15s | 10+ faits extraits (dates, famille, emploi) |
| **2** | FACTS_EXTRACTED → CONTEXT_IDENTIFIED | 10-15s | 3-4 contextes CESEDA (Art. L511-1, L313-11) |
| **3** | CONTEXT_IDENTIFIED → OBLIGATIONS_DEDUCED | 10-15s | 2-3 obligations avec deadlines (TA recours) |
| **4** | OBLIGATIONS_DEDUCED → MISSING_IDENTIFIED | 10-15s | 5+ éléments manquants (OQTF, justificatifs) |
| **5** | MISSING_IDENTIFIED → RISK_EVALUATED | 10-15s | 2-3 risques scorés (délai, expulsion) |
| **6** | RISK_EVALUATED → ACTION_PROPOSED | 10-15s | 5+ actions prioritisées (avocat, docs) |
| **7** | ACTION_PROPOSED → READY_FOR_HUMAN | 10-15s | **État final: READY_FOR_HUMAN** ✅ |

**⏱️ Temps total attendu**: ~90 secondes (1.5 minutes)

**📉 Incertitude**: Devrait passer de **100%** → **~15%**

---

### 4️⃣ VALIDER LES RÉSULTATS (3 minutes)

**Ouvrez chaque panel et vérifiez**:

✅ **Panel Faits**:
- Date notification: 2026-01-18 (ou proche)
- Délai: 30 jours
- Famille: épouse + 2 enfants
- Emploi: CDI développeur

✅ **Panel Contextes**:
- Art. L511-1 CESEDA (OQTF avec délai)
- Art. L313-11 CESEDA (vie privée/familiale)

✅ **Panel Obligations**:
- Recours TA dans 30 jours
- Deadline: ~17 février 2026

✅ **Panel Risques**:
- Dépassement délai (HIGH impact)
- Exécution OQTF (irréversible)

✅ **Panel Actions**:
- Contacter avocat CESEDA (CRITICAL)
- Demander OQTF (HIGH)

---

### 5️⃣ DOCUMENTER VOS RÉSULTATS (5 minutes)

**Ouvrir**: TEMPLATE_RESULTATS_TESTS_MANUELS.md

**Remplir**:
- [x] Cocher les transitions réussies (7/7)
- [x] Noter les temps par transition
- [x] Valider la précision des faits extraits
- [x] Confirmer les articles CESEDA corrects
- [x] Vérifier les deadlines calculées

---

## 🧪 TESTS OPTIONNELS (Si temps disponible)

### Test Export Markdown (2 min)

1. Sur workspace READY_FOR_HUMAN
2. Clic: **"📥 Exporter (Markdown)"**
3. Vérifier fichier téléchargé complet

### Test Verrouillage (1 min)

1. Clic: **"🔒 Verrouiller et finaliser"**
2. Confirmer modale
3. Vérifier boutons désactivés

### Test Blocage Automatique (3 min)

1. Ouvrir workspace Asile existant (ID: ff61b7a3-d974-4b72-8d8a-9e8235292303)
2. Vérifier état: MISSING_IDENTIFIED
3. Tenter "Exécuter IA" → Doit bloquer si éléments manquants

---

## 📊 MONITORING EN TEMPS RÉEL (Optionnel)

**Prisma Studio**: http://localhost:5555

**Tables à surveiller**:
- `WorkspaceReasoning` → Voir état changer (RECEIVED → READY_FOR_HUMAN)
- `Fact` → Compter les faits extraits (devrait atteindre 10+)
- `ContextHypothesis` → Voir contextes CESEDA
- `Obligation` → Voir deadlines calculées

---

## ✅ CRITÈRES DE SUCCÈS

**Le test est RÉUSSI si**:
- ✅ Les 7 transitions fonctionnent sans erreur
- ✅ Chaque transition prend <30 secondes
- ✅ Au moins 10 faits extraits avec confiance >80%
- ✅ Articles CESEDA corrects (L511-1, L313-11)
- ✅ Deadline TA calculée justement (~17 février)
- ✅ Incertitude finale ~15%
- ✅ Aucune erreur JSON parsing
- ✅ Temps total workflow <2 minutes

---

## 🎯 APRÈS LES TESTS

### Si validation OK ✅:
1. **Compléter**: TEMPLATE_RESULTATS_TESTS_MANUELS.md
2. **Lire**: DEMO_STAKEHOLDER_SCRIPT.md (~500 lignes)
3. **S'entraîner**: Narration démo (2-3 répétitions)
4. **Chronométrer**: Viser 15-20 minutes max
5. **Planifier**: Session démo stakeholder

### Si problèmes rencontrés ❌:
1. **Noter**: Erreurs dans TEMPLATE (section "Problèmes")
2. **Capturer**: Screenshots des erreurs
3. **Consulter**: Section "Dépannage" ci-dessous
4. **Re-tester**: Après corrections

---

## 🛠️ DÉPANNAGE RAPIDE

### ❌ Dev Server (3000) ne répond pas

```powershell
# Relancer dev server
npm run dev
```

### ❌ Ollama (11434) ne répond pas

```powershell
# Démarrer Ollama
ollama serve

# Dans un autre terminal, vérifier modèle
ollama list
# Si llama3.2:3b absent:
ollama pull llama3.2:3b
```

### ❌ Erreur "JSON Parse Error"

**Cause**: L'IA retourne du texte au lieu de JSON

**Solution**: 
1. Vérifier logs du dev server (terminal)
2. Réessayer le clic "Exécuter IA"
3. Si persiste, vérifier Ollama fonctionne: `curl http://localhost:11434`

### ❌ État ne change pas après clic

**Cause**: Transition bloquée par validation

**Solution**:
1. Ouvrir Prisma Studio: http://localhost:5555
2. Table `WorkspaceReasoning` → Trouver votre workspace
3. Vérifier `currentState` et `uncertaintyLevel`
4. Si bloqué sur MISSING_IDENTIFIED, vérifier table `MissingElement` (champ `blocking=true`)

### ❌ Prisma Studio ne lance pas

```powershell
# Relancer manuellement
npx prisma studio
```

---

## 📚 RESSOURCES COMPLÉMENTAIRES

| Document | Usage |
|----------|-------|
| **QUICK_START_MANUAL_TESTS.md** | Guide détaillé (150 lignes) |
| **GUIDE_TESTS_MANUELS.md** | Guide exhaustif (200 lignes) |
| **TEMPLATE_RESULTATS_TESTS_MANUELS.md** | Grille de validation |
| **DEMO_STAKEHOLDER_SCRIPT.md** | Script démo (500 lignes) |
| **RESULTATS_TESTS_DATABASES.md** | Tests automatisés (6/6 OK) |

---

## 🎬 RAPPEL: Rôle de l'IA

> **IA Poste Manager ne prend JAMAIS de décisions juridiques.**

**L'IA**:
- ✅ Trie et structure les informations
- ✅ Extrait les faits et contextes
- ✅ Alerte sur les délais
- ✅ Propose des actions

**L'Avocat**:
- ⚖️ Valide les extractions
- ⚖️ Décide de la stratégie
- ⚖️ Signe les actes juridiques
- ⚖️ Prend la responsabilité finale

---

**Prêt? C'est parti! 🚀**

**Ouvrez**: http://localhost:3000/lawyer/workspace  
**Durée**: 20 minutes chrono ⏱️  
**Objectif**: Valider les 7 transitions ✅
