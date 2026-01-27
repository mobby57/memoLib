# 📘 MASTER DOCUMENT — IA POSTE MANAGER

**Version fondatrice – Workspace unifié (2026-01-27)**

---

## 1️⃣ VISION & INTENTION

### Vision

Créer une **infrastructure intelligente de gestion des communications et documents entrants**, capable de **remplacer une secrétaire de premier niveau**, **sans jamais remplacer la décision humaine**.

### Intention fondatrice

* Réduire la charge cognitive
* Éliminer le chaos informationnel
* Garantir traçabilité, conformité et supervision

> Le système **raisonne**, **classe**, **documente**, **alerte**.
> Il **ne décide jamais**.

---

## 2️⃣ PROBLÈME RÉEL À RÉSOUDRE

* Trop de canaux (email, WhatsApp, documents, messages)
* Perte d'information
* Retards de traitement
* Risques juridiques et organisationnels
* Dépendance humaine non scalable

> L'information arrive de partout, sans structure, sans priorisation, sans mémoire exploitable.

---

## 3️⃣ DÉFINITION DU PRODUIT

### Ce que le produit EST

* Système de traitement intelligent des flux entrants
* Outil d'assistance et de supervision
* Mémoire structurée des communications

### Ce que le produit N'EST PAS

* ❌ IA juridique
* ❌ Moteur de décision
* ❌ Outil de scoring
* ❌ Substitut de responsabilité humaine

---

## 4️⃣ PARCOURS GLOBAL (FONCTIONNEL)

```
Canal entrant
→ Réception sécurisée
→ Normalisation
→ Analyse IA (non décisionnelle)
→ Classification
→ Association dossier
→ Historisation
→ Alerte / supervision humaine
```

### Canaux concernés

* Email (principal)
* Pièces jointes
* WhatsApp / SMS (Twilio)
* Messages futurs (extensibles)

---

## 5️⃣ ARCHITECTURE FONCTIONNELLE

Blocs principaux :

1. Ingestion multicanal
2. Normalisation des contenus
3. Analyse sémantique assistée (IA)
4. Classification & tagging
5. Dossiers & historique
6. Supervision humaine
7. Logs & traçabilité

> Chaque action du système est explicable, traçable et réversible.

---

## 6️⃣ STACK TECHNIQUE & ENVIRONNEMENT

### Frontend + Backend

* **Next.js 16+ (TypeScript)**
* API Routes pour logique métier
* Frontend + backend unifiés

### Base de données

* PostgreSQL + Prisma
* Schéma auditable et versionné

### Authentification & sécurité

* Azure AD + NextAuth
* Secrets dans Azure Key Vault / GitHub Secrets
* CSP stricte, rotation de secrets possible

### Observabilité

* Sentry (logs structurés, erreurs traçables)
* Monitoring email + messages

---

## 7️⃣ SERVICE IA (Python + Docker)

### Rôle

* Classification documents
* Analyse NLP
* OCR (si nécessaire)
* Suggestions (non décisionnelles)

### Isolation

* Service Python séparé
* Docker pour prod / CI
* `venv` local pour dev
* Next.js → Python via API interne

### Exemple structure du service IA

```
ai-service/
├─ app/                # code Python
├─ requirements.txt
├─ Dockerfile
└─ .venv/ (local)
```

### Dockerfile Python minimal

```dockerfile
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ .
CMD ["python", "main.py"]
```

### venv local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> `.venv` **ne va jamais en prod**, ni dans Docker, ni dans Git

---

## 8️⃣ CI/CD & DEPLOIEMENT

* Azure Static Web Apps (Next.js)
* GitHub Actions : build, lint, tests, scan sécurité, deploy
* Coverage informatif (0-30%) initialement
* Pipeline séparé pour IA si nécessaire

### docker-compose.yml exemple

```yaml
version: "3.9"
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  ai-service:
    build: ./ai-service
    ports: ["8000:8000"]
```

---

## 9️⃣ DONNÉES & RGPD

* Données = propriété client
* Pas de décision automatisée
* Conservation limitée, exportable, suppression maîtrisée
* RGPD by design, compatible IA Act et CNIL

---

## 🔟 SÉCURITÉ

* Accès fondateur auditable
* Séparation dev / prod
* Secrets côté serveur uniquement
* Logs détaillés

---

## 1️⃣1️⃣ IA — RÔLE & LIMITES

* Aide à la compréhension, classification et synthèse
* Limites : aucune décision, aucune garantie de résultat, aucune interprétation juridique

---

## 1️⃣2️⃣ BUSINESS MODEL

* SaaS B2B
* Abonnement + usage
* Plafond coûts IA
* Peu de clients, bons clients, forte confiance

---

## 1️⃣3️⃣ ROADMAP STRATÉGIQUE

1. Stabilisation : CI/CD stable, email monitoring fiable, client pilote
2. Intelligence augmentée : recherche historique, dossiers intelligents, suggestions
3. Plateforme : multi-tenant, plugins métiers, intégrations institutionnelles

---

## 1️⃣4️⃣ RÈGLES MÉTIER (NON NÉGOCIABLES)

* Pas de décision automatisée
* Supervision humaine obligatoire
* Traçabilité totale
* Exportabilité garantie
* Toute action doit être explicable

---

## 1️⃣5️⃣ ENVIRONNEMENT DEV RECOMMANDÉ

* IDE : VS Code (extensions ESLint, Prettier, GitLens, Azure Tools, REST Client)
* Écran principal + secondaire (logs / navigateur)
* `.env.local` uniquement, pas versionné

---

## 1️⃣6️⃣ CADRE LÉGAL & CONFORMITÉ

### RGPD (Règlement Général sur la Protection des Données)

* **Base légale** : Intérêt légitime ou contrat (jamais consentement seul pour B2B)
* **Minimisation** : Collecte uniquement des données nécessaires au traitement
* **Droits des personnes** : Accès, rectification, effacement, portabilité garantis
* **DPO** : Désignation si traitement à grande échelle

### IA Act (Règlement européen sur l'IA)

* **Classification** : Système à risque limité (outil d'assistance, pas de décision autonome)
* **Transparence** : L'utilisateur sait qu'il interagit avec une IA
* **Supervision humaine** : Obligatoire et documentée
* **Documentation technique** : Maintenue à jour

### CNIL – Recommandations IA

* Pas de profilage automatisé
* Explicabilité des suggestions IA
* Logs conservés pour audit (durée limitée)
* Analyse d'impact (AIPD) si données sensibles

### Responsabilités

| Rôle | Responsabilité |
|------|----------------|
| Éditeur (nous) | Sécurité technique, conformité RGPD, documentation |
| Client (utilisateur) | Validation des actions, décisions finales, usage conforme |
| Sous-traitant IA | Contrat DPA, localisation données UE |

### Contrats requis

* **CGU/CGV** : Conditions d'utilisation claires
* **DPA** (Data Processing Agreement) : Avec chaque sous-traitant
* **Mentions légales** : Identification éditeur, hébergeur
* **Politique de confidentialité** : Accessible et à jour

---

## 🧠 SYNTHÈSE FINALE

> IA Poste Manager = infrastructure de confiance qui transforme les flux de communication en information exploitable, **sans jamais retirer le contrôle à l'humain**, et avec un **socle technique stable, hybride TS + Python, Dockerisé, auditable et sécurisé**.

---

## 📎 ANNEXES

### A. Diagramme d'architecture (à générer)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                   TypeScript + React + Prisma                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API Routes
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Next.js API)                      │
│              Auth (NextAuth) │ Business Logic                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌───────────────┐ ┌───────────────────┐
│   PostgreSQL    │ │  AI Service   │ │   External APIs   │
│    (Prisma)     │ │   (Python)    │ │  (Twilio, Email)  │
└─────────────────┘ └───────────────┘ └───────────────────┘
```

### B. Arborescence cible du repo

```
iapostemanager/
├── frontend/                    # Next.js 16+ (TypeScript)
│   ├── src/
│   │   ├── app/                 # App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── ai-service/                  # Service IA Python
│   ├── app/
│   │   ├── main.py
│   │   ├── classifier.py
│   │   └── nlp/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .venv/                   # Local uniquement (gitignore)
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── MASTER_DOCUMENT.md           # Ce document
├── .env.example
├── .gitignore
└── README.md
```

---

*Document mis à jour le 2026-01-27*
