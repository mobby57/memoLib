# Documentation MemoLib & MemoLibDev

Documentation en **12 documents** répartis sur **2 projets**.

## Structure
documents/
├── REGISTRE.md ← décisions datées + actions
├── README.md ← ce fichier
├── memolib/ ← produit commercial
│ ├── 01-PRD.md Vision, mission, personas, périmètre, parcours, risques
│ ├── 02-TRD.md Architecture, stack, auth, multi-tenant, IA, API, sécurité
│ ├── 03-AppFlow.md Parcours utilisateurs (email→dossier, échéances, jurisprudence)
│ ├── 04-UIUX.md Design system, écrans, navigation, accessibilité
│ ├── 05-BackendSchema.md Prisma 40 modèles, 30 enums, RGPD, multi-tenant
│ └── 06-ImplementationPlan.md Roadmap 4 phases, dette, critères de sortie
└── memolibdev/ ← outil de développement contrôlé
├── 01-PRD.md
├── 02-TRD.md
├── 03-AppFlow.md
├── 04-UIUX.md
├── 05-BackendSchema.md
└── 06-ImplementationPlan.md

text

## Convention de statut

Chaque affirmation est marquée d'un **statut** :

| Marqueur | Signification |
|---|---|
| ✅ `[OK]` / `[confirmé:session]` | Vérifié dans cette session |
| `[confirmé:github]` | Vérifié dans le dépôt GitHub |
| `[confirmé:audit-nov]` | Vérifié dans l'audit de novembre |
| `[HYP]` | Hypothèse de rédaction, à valider |
| `[~]` | Partiellement implémenté |
| `[STUB]` | Route existe, non utilisable |
| `[PLAN]` | Annoncé, non codé |
| `[AUDIT:FAILLE]` | Faille signalée par audit, non corrigée |
| `[non vérifié]` | Déclaré mais pas certifié |

## Périmètre

- **MemoLib** = plateforme SaaS LegalTech (Next.js 16, Prisma, Clerk v5 en migration)
- **MemoLibDev** = outil local-first de contrôle d'agents IA (Python, FastAPI, Tkinter)

Les deux projets sont **strictement séparés** et documentés indépendamment.

## Sources

Voir `REGISTRE.md` section "Sources documentaires".

## Comment reprendre

1. Lire **`REGISTRE.md`** pour les décisions
2. Lire le **PRD** du projet concerné (01) pour la vision
3. Lire le **TRD** (02) pour l'architecture
4. Pour intervenir sur le code : les actions prioritaires sont dans **`06-ImplementationPlan.md`**
