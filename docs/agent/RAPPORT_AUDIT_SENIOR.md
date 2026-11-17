# 🛡️ Rapport d'Audit Senior - Qualité & Sécurité
*Généré le 02/11/2026 à 18:24*

Ce rapport utilise des outils d'analyse statique professionnels (Bandit, Pytest-Cov, NPM Audit, TypeScript) pour évaluer la sécurité et la qualité du code.

---

## 1. MemoLib (Next.js/TypeScript)

### 🟦 Compilation TypeScript
❌ **Erreurs de compilation détectées :**
```

<--- Last few GCs --->

[6212:0000022CEB9D0080]    56639 ms: Scavenge 2045.0 (2082.9) -> 2044.9 (2084.2) MB, 8.16 / 0.00 ms  (average mu = 0.272, current mu = 0.204) allocation failure; 
[6212:0000022CEB9D0080]    57736 ms: Mark-Compact (reduce) 2045.2 (2084.2) -> 2044.9 (2081.9) MB, 827.05 / 0.00 ms  (+ 8.7 ms in 4 steps since start of marking, biggest step 5.0 ms, walltime since start of marking 852 ms) (average mu = 0.273, current mu =

<--- JS stacktrace --->

FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
----- Native stack trace -----

 1: 00007FF71F40BC9B node::SetCppgcReference+19867
 2: 00007FF71F37AD78 DSA_meth_get_flags+92952
 3: 00007FF71FDF4BB1 v8::Isolate::ReportExternalAllocationLimitReached+65
 4: 00007FF71FDDE308 v8::Function::Experimental_IsNopFunction+1336
 5: 00007FF71FC3FCE0 v8::Platform::SystemClockTimeMillis+659328
 6: 00007FF71FC4BF53 v8::Platform::SystemClockTimeMillis+709107
 7: 00007FF71FC498B4 v8::Pl
```

### 🟨 Sécurité des dépendances (NPM Audit)
⚠️ **101 vulnérabilités détectées** (dont 0 critiques et 14 hautes).
**Action requise** : Lancer `npm audit fix` pour corriger.

## MemoLibDev (Python)

### 🐍 Sécurité du code (Bandit)
⚠️ **694 problèmes de sécurité détectés.**
- `B404` : Consider possible security implications associated with the subprocess module. (Ligne 12)
- `B603` : subprocess call - check for execution of untrusted input. (Ligne 26)
- `B404` : Consider possible security implications associated with the subprocess module. (Ligne 12)

### 🧪 Couverture de tests
🔴 **Couverture faible : 6%**. Risque élevé de régression.

## App Maman (Python)

❌ Projet introuvable au chemin /home/moros/memolib.bak.

