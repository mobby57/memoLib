# Validation des diagrammes app pour review threat model

Date: 2026-04-03
Scope: diagrammes Mermaid du repo applicatif canonique
Methode: verification syntaxique + revue STRIDE + controles existants/gaps

## 1. Perimetre valide

Diagrammes valides dans le scope canonique:

1. Vue globale du workflow
2. Machine a etats de communication
3. Architecture logique cible
4. Sequence convocation urgente

Source unique analysee: docs/WORKFLOW_COMMUNICATION.md

Hors scope de cette review:

- dossiers de copie/archivage (ex: MemoLib.Api-cleanpush)

## 2. Validation syntaxique Mermaid

Resultat: 4/4 diagrammes syntaxiquement valides.

Statut:

- Workflow global: PASS
- State machine: PASS
- Architecture logique: PASS
- Sequence urgente: PASS

## 3. Threat model STRIDE (par zones)

## 3.1 Ingestion et pre-traitement

Menaces:

- Spoofing: usurpation de source email/provider
- Tampering: alteration payload/PJ pendant transit
- Repudiation: contestation d'origine/message recu
- Information Disclosure: extraction OCR de donnees sensibles non masquees
- DoS: flood d'entrees malicieuses
- Elevation of Privilege: contournement ACL sur correlation dossier

Controles presents dans la spec:

- dedup/idempotence
- validation humaine avant envoi externe
- EventLog append-only
- ACL/ABAC mentionnees

Gaps a traiter:

- authentification forte des connecteurs (signature DKIM/DMARC ou equivalent)
- quotas/rate-limit explicites par source
- controles anti-malware PJ explicites

## 3.2 Analyse IA et standardisation

Menaces:

- Tampering: prompt/data poisoning
- Information Disclosure: fuite de PII vers model/provider
- Repudiation: absence de preuve de rationale/version modele
- DoS: saturation file IA
- Elevation of Privilege: templates sensibles utilises sans droits

Controles presents:

- seuil de confiance + revue manuelle
- fallback en cas indisponibilite IA
- gouvernance templates

Gaps:

- journaliser model version, prompt hash, policy version
- politique explicite de minimisation/redaction avant IA
- allowlist des templates par role + double approbation pour sensibles

## 3.3 Validation humaine et diffusion

Menaces:

- Spoofing: faux validateur
- Tampering: modification contenu apres validation
- Repudiation: contestation de qui a valide
- Information Disclosure: mauvais destinataire
- DoS: provider indisponible
- Elevation of Privilege: bypass validation obligatoire

Controles presents:

- human-in-the-loop obligatoire
- retries/backoff
- accusés de reception

Gaps:

- signature du contenu valide (hash verrouille avant dispatch)
- separation stricte des permissions valider/escalader/overrider
- prevention d'envoi externe si EventLog indisponible (fail-closed)

## 3.4 EventLog, audit et observabilite

Menaces:

- Tampering: alteration historique
- Repudiation: evenements incomplets
- Information Disclosure: exposition excessive logs
- DoS: indisponibilite journal

Controles presents:

- append-only annonce
- exigence 100% tracabilite

Gaps:

- WORM/immutabilite technique verifiable (retention lock)
- chaînage cryptographique des evenements critiques
- politique de masquage PII dans logs techniques

## 4. Verdict review

Verdict global: VALIDE AVEC RESERVES (go review).

Motif:

- Les diagrammes sont coherents et exploitables pour revue architecture.
- Le threat model de haut niveau est couvert.
- Des precisions de controle securite sont encore necessaires avant go-live.

## 5. Actions P0 avant approbation finale

1. Ajouter les trust boundaries directement dans les diagrammes (externes vs internes, data plane vs control plane).
2. Ajouter un noeud explicite de secrets management et KMS dans l'architecture logique.
3. Ajouter une etape de malware scan et content policy avant OCR/IA.
4. Ajouter une contrainte fail-closed: pas de dispatch si audit/EventLog indisponible.
5. Ajouter l'evidence d'integrite du message valide (hash signe pre-dispatch).

## 6. Actions P1 recommandees

1. Ajouter un mini-DFD dedie securite avec flux de donnees sensibles.
2. Ajouter une matrice STRIDE par composant en annexe.
3. Ajouter tests de securite relies aux menaces (abuse cases) dans la checklist de release.

## 7. Decision de passage en review

Decision: OUI, le package diagrammes peut partir en review threat model.
Condition: suivi des actions P0 avant validation finale de production.
