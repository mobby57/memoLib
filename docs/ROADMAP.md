# MemoLib — Roadmap Complète

> Dernière mise à jour : 7 juin 2026

---

## ✅ LIVRÉ (Juin 2026)

### Core
- [x] Multi-tenant RBAC complet (9 rôles)
- [x] Gestion dossiers + clients + emails
- [x] Email → Dossier en 1 clic
- [x] Timeline automatique
- [x] Webhook email inbound (Gmail/Outlook/SendGrid)
- [x] Facturation Stripe + usage billing
- [x] Onboarding wizard
- [x] Landing page beta
- [x] CI/CD (8 workflows GitHub Actions)
- [x] Tests (4463 — Jest + Vitest + Playwright)

### IA
- [x] Résumé email IA (Ollama) + fallback regex
- [x] Brouillon de réponse IA contextualisé
- [x] Classification automatique emails
- [x] Recherche jurisprudence (Légifrance/PISTE)
- [x] **Base de connaissances CESEDA** (délais, articles, documents, jurisprudence)
- [x] **Prompts enrichis spécialisés droit des étrangers**
- [x] Moteur de raisonnement 8 états (RECEIVED → READY_FOR_HUMAN)

### Documents
- [x] Génération documents juridiques (6 templates)
- [x] **Checklist contextuelle** (personnalisée par situation client)
- [x] **Formulaire contexte client** (famille, médical, emploi, ancienneté)
- [x] Inbox email par dossier (classification auto des pièces)
- [x] Relance automatique pièces manquantes (cron)
- [x] **Barre de progression partagée avocat/client**
- [x] **Notifications temps réel** (pièce reçue, dossier complet)

### Sécurité & Conformité
- [x] RGPD : anonymisation, droit à l'oubli, audit trail chaîné
- [x] Rate limiting (Upstash Redis + brute force)
- [x] Antivirus uploads (ClamAV)
- [x] Scan sécurité (Semgrep, Trivy, TruffleHog)

---

## 🔥 SPRINT 1 — Juillet 2026 (Quick wins, impact max)

**Objectif : rendre le produit utilisable en pilote réel**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | OCR intelligent (photo courrier → extraction) | 3j | ⭐⭐⭐ |
| 2 | Notification SMS urgences (OQTF 48h, audience) | 2j | ⭐⭐⭐ |
| 3 | Espace client : upload + suivi progression (page dédiée) | 3j | ⭐⭐⭐ |
| 4 | Signature électronique intégrée (Yousign ou DocuSign) | 3j | ⭐⭐⭐ |
| 5 | Calcul automatique honoraires (temps × taux) | 2j | ⭐⭐ |
| 6 | Plugin Gmail natif (extension Chrome) | 5j | ⭐⭐⭐ |

### Détail technique

**OCR intelligent :**
- Tesseract.js (local) ou Google Vision API (cloud)
- Photo/scan → extraction texte → parsing dates, noms, numéros
- Auto-fill dans le formulaire de dossier
- Détection type document (OQTF, convocation, récépissé)

**Plugin Gmail :**
- Extension Chrome avec sidebar MemoLib
- Bouton "Créer dossier" depuis un email Gmail
- Affiche le résumé IA directement dans Gmail
- Sync bidirectionnelle des labels

---

## 📱 SPRINT 2 — Août-Sept 2026 (Mobile & Communication)

**Objectif : accessible en mobilité (audiences, rendez-vous)**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | App mobile React Native (iOS/Android) | 15j | ⭐⭐⭐ |
| 2 | Mode hors-ligne (consultation dossiers) | 5j | ⭐⭐ |
| 3 | Prise de RDV en ligne (client → avocat) | 3j | ⭐⭐⭐ |
| 4 | Chat client intégré (messagerie sécurisée) | 5j | ⭐⭐ |
| 5 | Sync Google Calendar bidirectionnel | 3j | ⭐⭐ |
| 6 | Rappel audience J-1 avec résumé dossier | 2j | ⭐⭐⭐ |
| 7 | Dictée vocale → notes structurées | 5j | ⭐⭐ |
| 8 | Questionnaire d'intake client (onboarding client) | 3j | ⭐⭐ |

### Architecture mobile
```
React Native (Expo)
├── Écrans : Dashboard, Dossiers, Messages, Agenda
├── Push notifications (Firebase)
├── Offline-first (WatermelonDB local + sync)
├── Biométrie (FaceID/fingerprint)
└── Partage API avec le web (même backend Next.js)
```

---

## 🧠 SPRINT 3 — Oct-Nov 2026 (IA avancée)

**Objectif : l'IA devient un vrai co-pilote juridique**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | RAG sur documents du cabinet (mémoires, jurisprudence locale) | 7j | ⭐⭐⭐ |
| 2 | Rédaction complète de recours (brouillon structuré) | 10j | ⭐⭐⭐ |
| 3 | Analyse de risque par dossier (scoring) | 5j | ⭐⭐⭐ |
| 4 | Simulateur de chances (stats tribunal par type) | 7j | ⭐⭐ |
| 5 | Veille juridique personnalisée (alertes CESEDA) | 5j | ⭐⭐ |
| 6 | Traduction automatique documents (arabe, turc, chinois) | 3j | ⭐⭐⭐ |
| 7 | Préparation entretien OFPRA (guide interactif) | 5j | ⭐⭐⭐ |
| 8 | Agents IA autonomes (suivi procédure automatique) | 10j | ⭐⭐ |

### Architecture RAG
```
Documents cabinet (PDF, Word, emails)
       ↓
Indexation (nomic-embed-text → vecteurs)
       ↓
Base vectorielle (pgvector dans PostgreSQL)
       ↓
Requête IA = prompt + contexte récupéré
       ↓
Réponse enrichie par l'historique du cabinet
```

### Rédaction de recours
```
Données dossier + checklist + analyse IA
       ↓
Template structuré par type (OQTF, asile, titre)
       ↓
Remplissage IA des arguments (faits + droit + jurisprudence)
       ↓
Brouillon éditable par l'avocat
       ↓
Export Word/PDF final
```

---

## 🔗 SPRINT 4 — Déc 2026-Janv 2027 (Intégrations métier)

**Objectif : connecter MemoLib à l'écosystème judiciaire français**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | Intégration Télérecours (suivi TA/CAA) | 7j | ⭐⭐⭐ |
| 2 | Intégration ANTS (suivi titres séjour en ligne) | 5j | ⭐⭐ |
| 3 | Aide juridictionnelle (calcul éligibilité + formulaire) | 3j | ⭐⭐⭐ |
| 4 | Convention d'honoraires auto-générée | 2j | ⭐⭐ |
| 5 | Export comptable FEC | 3j | ⭐⭐ |
| 6 | 2FA obligatoire (TOTP) | 2j | ⭐⭐ |
| 7 | Plugin Outlook natif | 5j | ⭐⭐ |
| 8 | Intégration RPVA (dépôt conclusions) | 10j | ⭐⭐⭐ |

---

## 📊 SPRINT 5 — Fév-Mars 2027 (Pilotage & Scale)

**Objectif : outils de gestion de cabinet**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | Dashboard financier (CA, marges, prévisions) | 5j | ⭐⭐⭐ |
| 2 | Rentabilité par type de dossier | 3j | ⭐⭐⭐ |
| 3 | Rapport mensuel auto-généré (PDF) | 3j | ⭐⭐ |
| 4 | Benchmark anonymisé inter-cabinets | 5j | ⭐⭐ |
| 5 | Dossier partagé inter-cabinets | 7j | ⭐⭐ |
| 6 | Recherche full-text tous documents | 3j | ⭐⭐ |
| 7 | Facturation récurrente (provisions) | 3j | ⭐⭐ |
| 8 | Relance impayés automatique | 2j | ⭐⭐ |
| 9 | Paiement en ligne client | 3j | ⭐⭐ |
| 10 | Backup chiffré quotidien | 2j | ⭐⭐ |

---

## 🏢 SPRINT 6 — Q2 2027 (Marketplace & Certification)

**Objectif : devenir la plateforme de référence**

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1 | Marketplace d'intégrations (API publique) | 15j | ⭐⭐⭐ |
| 2 | Certification ISO 27001 | 30j | ⭐⭐⭐ |
| 3 | Transcription audio audiences | 7j | ⭐⭐ |
| 4 | Collaboration inter-cabinets (réseau) | 10j | ⭐⭐ |
| 5 | White-label pour barreaux | 10j | ⭐⭐ |
| 6 | Alerte préfecture temps réel (scraping délais) | 5j | ⭐⭐⭐ |

---

## Métriques de succès par sprint

| Sprint | KPI principal | Cible |
|--------|--------------|-------|
| Sprint 1 | Cabinets pilotes actifs | 5 |
| Sprint 2 | Utilisateurs mobiles quotidiens | 50% des avocats |
| Sprint 3 | Temps moyen traitement dossier | -40% |
| Sprint 4 | Dossiers traités sans saisie manuelle | 60% |
| Sprint 5 | CA moyen par cabinet | +25% |
| Sprint 6 | Cabinets payants | 50 |

---

## Principes de priorisation

1. **Impact utilisateur** > complexité technique
2. **Revenu** : ce qui débloque des clients payants passe en premier
3. **Différenciation** : IA juridique = moat compétitif, toujours investir
4. **Conformité** : jamais de dette sur la sécurité/RGPD
5. **Feedback pilote** : adapter la roadmap selon les retours des 5 premiers cabinets
