\# PRD — MemoLibDev



\---

projet: MemoLibDev

document: 01-PRD

version: 0.1.0

date: 2026-11-01

statut: brouillon

sources: \[session-locale, github:memolibdev-legacy, audit-nov-2025]

base\_canonique: Desktop\\DEV-PYTHON\\memolibdev (D18=A)

\---



\## S1 — Vision, mission, personas, principes



\### Vision

MemoLibDev est un outil de contrôle et d'encadrement des agents de développement IA. Il permet d'analyser un dépôt de code, de proposer des modifications, de les vérifier, et — sous autorisation humaine explicite — de les appliquer de manière traçable et réversible.



`\[confirmé:github]` README : « Outil d'analyse et de modification assistée par IA pour dépôts de code, avec confinement, validation humaine et sandbox. \*\*Promesse\*\* : MemoLibDev analyse votre code, propose des modifications, mais n'écrit jamais sans autorisation humaine explicite et vérifiable. »



\*\*Nature\*\* : outil local-first (desktop), cible développeurs et équipes techniques utilisant des agents IA.



\*\*Base canonique\*\* : `Desktop\\DEV-PYTHON\\memolibdev` (D18=A) — produit packagé (`src/memolibdev/core/`, CI, `pip install -e .`).

\*\*Labo historique\*\* : `\~/MemoLibDev/v3` (200+ fichiers racine, à archiver).



\### Mission

Empêcher un agent IA de modifier du code sans que l'humain puisse : \*\*voir\*\* (avant), \*\*comprendre\*\* (pourquoi), \*\*autoriser\*\* (explicitement), \*\*revenir\*\* (rollback).



3 piliers :

\- \*\*Modes de confinement\*\* : READ\_ONLY, PROPOSE, SANDBOX, SUPERVISED\_APPLY

\- \*\*Chaîne de preuve\*\* : SHA-256, snapshots, certificats D5.8/D5.9

\- \*\*Validation humaine\*\* : `REQUIRE\_DIFF\_BINDING = True` (fail-closed)



\### Personas

\- \*\*P1 Développeur solo\*\* — utiliser agent IA sans casser son code. Feature clé : mode PROPOSE

\- \*\*P2 Équipe technique / Lead dev\*\* — traçabilité modifications IA. Feature clé : SUPERVISED\_APPLY + certificat

\- \*\*P3 Auditeur / Intégrateur sécurité\*\* `\[à clarifier]` — preuves cryptographiques (D5.8/D5.9)



\### Principes produit

1\. \*\*Lecture d'abord, écriture jamais sans permission\*\* — mode READ\_ONLY par défaut

2\. \*\*Chaque fait sourcé\*\* — `(sha\_fichier, ligne, contenu)`

3\. \*\*Fail-closed par défaut\*\* — `REQUIRE\_DIFF\_BINDING = True`

4\. \*\*Sandbox isole l'application\*\* — worktree isolé

5\. \*\*Approbation liée au diff\*\* — `canonical\_diff\_bytes`

6\. \*\*Séparation lecture/proposition/application\*\* — 4 modes distincts

7\. \*\*Snapshot avant modification\*\* `\[AUDIT:FAILLE]` — partiel actuellement



\### Ce que MemoLibDev n'est pas

\- Pas un module de MemoLib

\- Pas un agent autonome (aucune décision sans humain)

\- Pas concurrent de Cursor/Copilot (encadre, complète)

\- Pas livré en SaaS (local-first)



\### Deux dépôts

\- `mobby57/memolibdev` (public) — cité dans README

\- `mobby57/memolibdev-legacy` (privé) — remote de v3 (42 ahead, 6 behind)



\*\*À clarifier\*\* : dépôt canonique ?



\---



\## S2 — Périmètre fonctionnel (4 modes + MSAFE)



\### Mode READ\_ONLY

Analyse sans modification. Étapes : résolution cible → classification mission → sélection contexte → extraction faits → rapport. Aucune écriture. `\[OK]`



\### Mode PROPOSE

Génération patch sans application. Étapes : prompt → LLM Ollama → parser → diff → workspace. Diff écrit dans `workspace/proposals/\*.diff`, jamais dans cible. `\[\~]`

\*\*Faille\*\* : `extract\_targets()` ne matche que `+++ b/...` `\[AUDIT:FAILLE]`



\### Mode SANDBOX

Test isolé. Étapes : worktree → apply → tests → cleanup → rapport. `\[OK]`

\*\*Faille\*\* : `run\_controlled\_apply` sans try/catch snapshot `\[AUDIT:FAILLE]`



\### Mode SUPERVISED\_APPLY

Application contrôlée. Étapes : verify binding → verify TTL → snapshot → apply → cert D5.9 → rollback si erreur → log. `\[\~]`

\*\*Failles\*\* : `snapshot()` partiel (cert only) · `memolib\_safe\_apply.py` bloque conservatoirement · `d59\_controlled\_apply.py` à auditer `\[AUDIT:FAILLE]`



\### Chaîne MSAFE

\- SHA-256 cible/diff `\[OK]`

\- Certificat D5.8 (autorisation) `\[OK]` structure

\- Certificat D5.9 (application) `\[\~]`

\- Evidence resolver v2 `\[OK]`

\- Evidence gate `\[OK]`



\### Composants support

\- LLM : Ollama (Qwen 2.5 Coder 7B) `\[OK]`, Gemini/Groq untracked

\- Interface : CLI, GUI Tkinter, API FastAPI

\- Outils : benchmark, doctor, index, metering



\### Points d'écriture (audit)

\- `assistant\_v2.py` `\[BLOQUÉ]`

\- `tool\_use.py` `\[BLOQUÉ]`

\- `memolib\_safe\_apply.py` `\[BLOQUÉ conservatoire]`

\- `agent\_loop.py` `\[contrôlé]`

\- `d59\_controlled\_apply.py` `\[à auditer]`



\### Hors périmètre

Auto-commit/push, multi-dépôts, interface web multi-users, marketplace, apprentissage préférences, support dépôts distants, mise à jour auto .exe



\---



\## S3 — Parcours



\### Cycle nominal (SUPERVISED\_APPLY) `\[\~]`

1\. Mission (CLI) → 2. Résolution cible → 3. Classification → 4. Contexte → 5. Faits → 6. Proposition LLM → 7. Parser → 8. Sandbox + tests → 9. Présentation → 10. \*\*Approbation humaine\*\* (TTL) → 11. Application + D5.9 → 12. Snapshot → 13. Preuve



\### Autres parcours

\- Proposition rejetée → archivée, aucun impact

\- Application échoue → \*\*rollback\*\* `\[AUDIT:FAILLE]` (snapshot partiel)

\- Audit post-mortem → consulte `reports/` + certificat D5.9



\---



\## S4 — Exigences non-fonctionnelles



\### Sécurité (cœur du produit)

\- Aucune écriture hors sandbox par défaut `\[OK]`

\- Approbation liée au hash diff `\[OK]`

\- Fail-closed si binding cassé `\[OK]`

\- TTL approbation `\[OK]`

\- Isolation écritures directes `\[OK]` (partiel)

\- Application réelle bloquée `\[OK]` conservatoire

\- \*\*Rollback complet\*\* `\[AUDIT:FAILLE]` — partiel

\- \*\*Extraction chemins robuste\*\* `\[AUDIT:FAILLE]`

\- Timeout LLM `\[OK]`

\- Pas de `sys.exit()` module-level `\[OK]`



\### Traçabilité

Chaque fait = `(sha, ligne, contenu)` `\[OK]` · D5.8 `\[OK]` · D5.9 `\[\~]` · Rapport mission `\[OK]` · Logs `\[OK]` · Provenance `\[\~]`



\### Confiance / provenance

SHA-256 cible `\[OK]` · SHA-256 diff `\[OK]` · Vérification fichier inchangé `\[\~]` · Evidence resolver `\[OK]` · Evidence gate `\[OK]` · Tests adverses `\[OK]`



\### Performance (cibles)

Analyse 500 fichiers < 10s `\[PLAN]` · Génération LLM 7B < 30s `\[\~]` · Application 3 fichiers + tests < 60s `\[PLAN]`



\### Distribution

Exécutable Windows `.exe` `\[\~]` · Dépendances Python packagées `\[\~]` · Sans Python requis `\[HYP]` · Mise à jour auto `\[PLAN]` · Linux/macOS `\[HYP]`



\### Confidentialité

Aucune télémétrie `\[HYP]` · Ollama local `\[OK]` · Gemini/Groq opt-in `\[\~]` · Sandbox effacée `\[\~]` · Secret scanner `\[\~]`



\---



\## S5 — Risques et inconnues



\### Risques critiques 🔴

\- \*\*R1 Rollback partiel\*\* — `snapshot()` sauvegarde certificat seul, pas fichiers modifiés. Modification irréversible multi-fichiers possible.

\- \*\*R2 extract\_targets fragile\*\* — ne matche que `+++ b/...`. Autres formats ignorés/mauvais path.

\- \*\*R3 run\_controlled\_apply sans try/catch\*\* — exception non gérée → état indéterminé.

\- \*\*R4 200+ fichiers Python racine\*\* — dette, impossible certifier aucune voie d'écriture oubliée.

\- \*\*R5 Traçabilité D5.9 partielle\*\* — écriture fiable à démontrer.



\### Risques importants 🟠

\- Tests adverses partiels (5 modules)

\- Persona P3 auditeur peut ne pas exister

\- `.exe` non certifié

\- 42 commits locaux ahead de `legacy`

\- Gemini/Groq non-committés

\- README pointe chemin inexistant



\### Dépendances externes

Ollama, Faster Whisper, Piper TTS, Tkinter, FastAPI, Python 3.10+



\### Inconnues

U11 : nb tests pytest réels · U12 : modes = 4 CLI ou 1 flag · U13 : distribution .exe · U14 : GUI production ? · U15 : Gemini/Groq intégrés ? · U16 : v3 vs DEV-PYTHON ✅ · U17 : dépôt canonique · U18 : D5.9 écrit ? · U19 : rollback multi-fichiers testé ? · U20 : 5 formats diff couverts ?



\### Décisions ouvertes

D1 : Corriger rollback avant commercialisation ? (bloquant) · D2 : Nettoyer 200+ fichiers ? · D3 : v3 + DEV-PYTHON fusionner ? · D4 : dépôt canonique · D5 : garder persona P3 ?



\---



\*\*FIN PRD MemoLibDev — version 0.1.0\*\*

