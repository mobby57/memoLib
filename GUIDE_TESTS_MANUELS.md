# 🧪 GUIDE DE TESTS MANUELS - IA POSTE MANAGER

**Date:** 21 janvier 2026  
**Phase:** Validation End-to-End avec Ollama  
**Durée estimée:** 30-45 minutes

---

## ✅ ÉTAT ACTUEL DU SYSTÈME

### Serveurs Actifs

✅ **Dev Server Next.js:** http://localhost:3000 (EN COURS)  
⚠️ **Ollama Server:** À DÉMARRER - `ollama run llama3.2:3b`

### Données Disponibles

Les 3 workspaces démo sont déjà créés:
- **OQTF:** `7cfedfbc-78e9-4779-9cad-9e4043f49b46` (READY_FOR_HUMAN)
- **Asile:** `ff61b7a3-d974-4b72-8d8a-9e8235292303` (MISSING_IDENTIFIED - bloqué)
- **Regroupement:** `c39e9c2a-89fb-4bcf-b8ee-a0edbabcee4b` (ACTION_PROPOSED)

---

## 🎯 TESTS PRIORITAIRES

### TEST 1: Démarrer Ollama et Vérifier Connectivité (2 min)

**Action:**
```powershell
# Dans un nouveau terminal PowerShell
ollama run llama3.2:3b
```

**Résultat attendu:**
- Ollama démarre et charge le modèle
- Affiche: ">>> Send a message (/? for help)"

**Vérification:**
```powershell
# Dans un autre terminal
curl http://localhost:11434
# Devrait retourner: "Ollama is running"
```

---

### TEST 2: Créer et Tester un Nouveau Workspace OQTF (20 min)

**Étape 1: Créer le workspace**

1. Aller sur http://localhost:3000/lawyer/workspace
2. Cliquer **"Nouveau Workspace"**
3. Source: **EMAIL**
4. Coller ce contenu:
```
De: ahmed.dubois@email.com
Objet: URGENT - OQTF reçue - Besoin aide juridique
Date: 2026-01-21

Bonjour Maître,

J'ai reçu une OQTF il y a 3 jours. Je suis en France depuis 5 ans avec ma famille (épouse + 2 enfants nés ici). Je travaille en CDI comme développeur (3200€/mois). Mon titre de séjour est expiré depuis 6 mois mais j'ai fait une demande de renouvellement.

Délai: 30 jours (expire le 20 février). Que dois-je faire?

Ahmed DUBOIS
```

5. Cliquer **"Créer Workspace"**
6. **Noter l'ID généré** (vous serez redirigé automatiquement)

**Étape 2: Exécuter le raisonnement complet (7 clics)**

Pour chaque clic sur **"🧠 Exécuter Raisonnement IA"**, vérifier:

| Clic | État avant → après | Résultat attendu | Temps |
|------|-------------------|------------------|-------|
| 1 | RECEIVED → FACTS_EXTRACTED | 10+ faits extraits, incertitude ~80% | 5-15s |
| 2 | FACTS_EXTRACTED → CONTEXT_IDENTIFIED | 3-4 contextes CESEDA | 5-15s |
| 3 | CONTEXT_IDENTIFIED → OBLIGATIONS_DEDUCED | 2-3 obligations avec deadlines | 5-15s |
| 4 | OBLIGATIONS_DEDUCED → MISSING_IDENTIFIED | 5+ éléments manquants | 5-15s |
| 5 | MISSING_IDENTIFIED → RISK_EVALUATED | 2-3 risques scorés | 5-15s |
| 6 | RISK_EVALUATED → ACTION_PROPOSED | 3-5 actions prioritisées | 5-15s |
| 7 | ACTION_PROPOSED → READY_FOR_HUMAN | Incertitude finale ~15% | 5-15s |

**Total:** 60-90 secondes

**Étape 3: Valider la qualité des données**

Vérifier dans chaque panel:

- ✅ **Faits:** Date OQTF, durée France (5 ans), famille (marié + 2 enfants), emploi (CDI 3200€), délai (30j)
- ✅ **Contextes:** Art. L511-4 CESEDA (vie privée familiale), délai TA 2 mois
- ✅ **Obligations:** Recours TA avant ~20/03, Référé-suspension avant 20/02
- ✅ **Risques:** Dépassement délai (HIGH impact), Exécution OQTF (irreversible)
- ✅ **Actions:** Contact avocat CESEDA, Préparer recours TA, Alertes deadlines

---

### TEST 3: Tester le Blocage Automatique (Workspace Asile) (10 min)

**Action:**
1. Aller sur http://localhost:3000/lawyer/workspace/ff61b7a3-d974-4b72-8d8a-9e8235292303
2. Vérifier l'état: **MISSING_IDENTIFIED** (bloqué)
3. Panel "Éléments Manquants": 7 éléments dont **3 BLOCKING non résolus**
4. Cliquer **"🧠 Exécuter Raisonnement IA"**

**Résultat attendu:**
- ❌ Erreur: "Impossible de progresser: 3 éléments bloquants non résolus"
- ✅ État reste MISSING_IDENTIFIED
- ✅ Message d'avertissement affiché

**Résoudre les blocages:**
1. Cliquer sur chaque élément BLOCKING
2. Bouton "Marquer comme résolu"
3. Ajouter note: "Récit détaillé reçu et validé"
4. Répéter pour les 3 éléments

**Reprendre:**
5. Re-cliquer **"🧠 Exécuter Raisonnement IA"**

**Résultat attendu:**
- ✅ État passe à RISK_EVALUATED
- ✅ Workflow continue normalement

---

### TEST 4: Export et Verrouillage (5 min)

**Action:**
1. Utiliser n'importe quel workspace à l'état READY_FOR_HUMAN
2. Cliquer **"📥 Exporter (Markdown)"**

**Résultat attendu:**
- ✅ Fichier `workspace-reasoning-[id].md` téléchargé
- ✅ Contenu structuré: Source, Faits, Contextes, Obligations, Risques, Actions, Historique
- ✅ Format lisible et imprimable

**Verrouillage:**
3. Cliquer **"🔒 Verrouiller et finaliser"**
4. Confirmer la modal

**Résultat attendu:**
- ✅ Badge "🔒 VERROUILLÉ" affiché
- ✅ Tous les boutons d'action désactivés
- ✅ Export reste possible (lecture seule)

---

## 📊 MÉTRIQUES À MESURER

Pendant les tests, noter:

- ⏱️ **Temps par transition:** 5-15s (bon) | 15-30s (acceptable) | >30s (problème)
- 📉 **Réduction incertitude:** 100% → ~15% (excellent)
- 🎯 **Précision extraction:** 8-12 faits extraits (bon)
- ✅ **Taux de succès:** 7/7 transitions (100%)

---

## 🐛 PROBLÈMES COURANTS

### Ollama ne répond pas
```powershell
# Vérifier
ollama list

# Redémarrer
ollama serve
ollama run llama3.2:3b
```

### JSON Parse Error
- Vérifier les prompts dans `lib/prompts/state-transitions.ts`
- Ollama retourne parfois du texte au lieu de JSON

### État ne change pas
```powershell
# Vérifier logs backend (terminal npm run dev)
# Vérifier base de données
npx prisma studio
```

---

## ✅ CHECKLIST RAPIDE

Après les tests:

- [ ] Ollama démarre correctement
- [ ] Les 7 états se succèdent sans erreur
- [ ] L'incertitude décroît progressivement (100% → 15%)
- [ ] Les faits extraits sont exacts
- [ ] Les contextes identifient le CESEDA
- [ ] Les obligations ont des deadlines réalistes
- [ ] Le blocage automatique fonctionne (Asile)
- [ ] L'export Markdown est lisible
- [ ] Le verrouillage empêche les modifications
- [ ] Temps total < 2 minutes par workflow

---

## 🎉 CONCLUSION

Si tous les tests passent:
- ✅ Système validé et prêt pour démo stakeholders
- ✅ IA fonctionne correctement avec Ollama
- ✅ Règles structurelles respectées
- ✅ Audit trail complet

**Prochaine étape:** Démonstration stakeholders (script de 10-15 min dans SYNTHESE_SESSION_AI_INTEGRATION.md)

---

**Créé le:** 21 janvier 2026  
**Status:** ✅ Dev server actif | ⚠️ Ollama à démarrer
