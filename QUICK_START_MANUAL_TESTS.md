# 🚀 QUICK START - Tests Manuels (5 minutes)

**Date**: 21 janvier 2026  
**Status**: ✅ Système 100% opérationnel

---

## ✅ Environnement Prêt

```
✅ Dev Server   : http://localhost:3000
✅ Ollama Server: http://localhost:11434
✅ Modèle IA    : llama3.2:3b (2.0 GB chargé)
✅ Base données : SQLite (dev.db)
✅ Demo data    : 3 workspaces CESEDA prêts
```

---

## 🎯 Test Principal (20 minutes)

### Créer un Workspace OQTF Complet

**1. Ouvrir**: http://localhost:3000/lawyer/workspace

**2. Cliquer**: **"Nouveau Workspace"**

**3. Remplir le formulaire**:
- **Source**: EMAIL
- **Type procédure**: OQTF
- **Contenu** (copier-coller):

```
De: ahmed.dubois@email.com
Objet: URGENT - OQTF reçue - Besoin aide juridique
Date: 2026-01-21

Bonjour Maître,

J'ai reçu une OQTF il y a 3 jours. Je suis en France depuis 5 ans avec ma famille (épouse + 2 enfants nés ici). Je travaille en CDI comme développeur (3200€/mois). Mon titre de séjour est expiré depuis 6 mois mais j'ai fait une demande de renouvellement.

Délai: 30 jours (expire le 20 février). Que dois-je faire?

Ahmed DUBOIS
```

**4. Cliquer**: **"Créer Workspace"**

**5. Exécuter le Raisonnement IA** (7 fois):

Cliquer sur **"🧠 Exécuter Raisonnement IA"** et observer:

| Clic | État → État suivant | Durée attendue | Résultat attendu |
|------|---------------------|----------------|------------------|
| 1️⃣ | RECEIVED → FACTS_EXTRACTED | 5-15s | 10+ faits extraits |
| 2️⃣ | FACTS_EXTRACTED → CONTEXT_IDENTIFIED | 5-15s | 3-4 contextes CESEDA |
| 3️⃣ | CONTEXT_IDENTIFIED → OBLIGATIONS_DEDUCED | 5-15s | 2-3 obligations avec deadlines |
| 4️⃣ | OBLIGATIONS_DEDUCED → MISSING_IDENTIFIED | 5-15s | 5+ éléments manquants |
| 5️⃣ | MISSING_IDENTIFIED → RISK_EVALUATED | 5-15s | 2-3 risques scorés |
| 6️⃣ | RISK_EVALUATED → ACTION_PROPOSED | 5-15s | 3-5 actions prioritisées |
| 7️⃣ | ACTION_PROPOSED → READY_FOR_HUMAN | 5-15s | Incertitude finale ~15% |

**6. Valider les données** dans chaque panel:

✅ **Panel Faits**:
- Date OQTF: "2026-01-15" (ou similaire)
- Délai: "30 jours"
- Famille: épouse + 2 enfants
- Situation pro: CDI 3200€
- Durée France: 5 ans

✅ **Panel Contextes**:
- Art. L511-1 CESEDA (OQTF avec délai)
- Art. L313-11 (vie privée et familiale)

✅ **Panel Obligations**:
- Recours TA dans 30 jours
- Deadline: ~2026-03-15
- Référence: Art. L512-1 CESEDA

✅ **Panel Risques**:
- Dépassement délai (HIGH impact)
- Exécution OQTF (irreversible)

✅ **Panel Actions**:
- Contacter avocat CESEDA
- Préparer recours TA
- Alertes deadline automatiques

---

## 📊 Métriques à Noter

- ⏱️ **Temps par transition**: Noter si <30 secondes
- 📉 **Réduction incertitude**: Vérifier 100% → 15%
- 🎯 **Précision extraction**: Les faits sont-ils corrects?
- ✅ **Taux de succès**: Les 7 transitions fonctionnent?

---

## ✅ Checklist Rapide

Après avoir terminé les 7 clics:

- [ ] Toutes les transitions ont réussi (7/7)
- [ ] L'incertitude a décru progressivement
- [ ] Les faits extraits sont exacts
- [ ] Les contextes identifient le CESEDA
- [ ] Les obligations ont des deadlines réalistes
- [ ] Les risques sont pertinents
- [ ] Les actions sont prioritisées
- [ ] Le temps total est <2 minutes
- [ ] État final: READY_FOR_HUMAN

---

## 🐛 Problèmes Courants

### Ollama ne répond pas

```powershell
# Vérifier
curl http://localhost:11434

# Relancer si besoin
ollama serve
```

### JSON Parse Error

- Vérifier les logs du dev server (terminal)
- L'IA retourne parfois du texte au lieu de JSON
- Réessayer le clic

### État ne change pas

```powershell
# Vérifier la base
npx prisma studio

# Check WorkspaceReasoning.currentState
```

---

## 🎯 Résultat Attendu

À la fin des 7 clics:

```
État: READY_FOR_HUMAN ✅
Incertitude: ~15% ✅
Faits: 10+ extraits ✅
Contextes: 3-4 CESEDA ✅
Obligations: 2-3 avec deadlines ✅
Risques: 2-3 scorés ✅
Actions: 3-5 prioritisées ✅
```

---

## 🚀 Après Validation

Si tous les tests passent:

1. ✅ **Système validé** - Prêt pour démo stakeholder
2. 📝 **Documenter** les résultats dans RESULTATS_TESTS_MANUELS.md
3. 🎯 **Préparer démo** (voir GUIDE_TESTS_MANUELS.md section démo)

---

## 📖 Documentation Complète

Pour plus de détails: **[GUIDE_TESTS_MANUELS.md](GUIDE_TESTS_MANUELS.md)**

Tests supplémentaires:
- Test 3: Blocage automatique (workspace Asile)
- Test 4: Export Markdown et Lock

---

**Temps total estimé**: 20-30 minutes  
**Difficulté**: Facile (suivre les instructions)  
**Prérequis**: Navigateur moderne (Chrome, Firefox, Edge)

🎉 **Bon test!**
