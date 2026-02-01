# 🖼️ Gestion des doublons et regroupement — memoLib

Ce document décrit le flux de déduplication et de regroupement des informations (clients, dossiers, documents) afin de garantir une base propre, traçable et auditée.

---

## Diagramme (opérationnel)

```
Incoming Email / Document
          │
          ▼
 ┌──────────────────────┐
 │ Identifier client     │
 │ - Email exact ?       │
 │ - Prénom/nom fuzzy ? │
 └─────────┬────────────┘
           │
   ┌───────┴────────┐
   ▼                ▼
Client existant   Nouveau client
   │                 │
   │                 ▼
   │           Créer client
   │                 │
   └───────┬─────────┘
           ▼
 ┌─────────────────────┐
 │ Associer à Dossier   │
 │ - Vérifier doublon   │
 │ - Si nouveau, créer  │
 └─────────┬───────────┘
           ▼
 ┌─────────────────────┐
 │ Associer Document /  │
 │ Email / Pièce jointe │
 │ - Hash déjà existant?│
 │   → oui : ne pas dupliquer │
 │   → non : stocker           │
 └─────────┬───────────┘
           ▼
 ┌─────────────────────┐
 │ EventLog             │
 │ - Horodatage         │
 │ - Action humaine     │
 │ - Validation doublon │
 └─────────────────────┘
```

---

## Règles clés
- Identité client : recherche par email exact, puis rapprochement fuzzy Prénom/Nom + méta (seuil configurable).
- Dossiers : vérifier l’existence pour le client (normalisation du titre) avant création.
- Documents : calcul de hash (SHA-256) pour éviter tout doublon byte‑à‑byte.
- EventLog : tracer les décisions (auto/humain), avec horodatage et justification.

---

## Pseudo‑code Python (fonctionnel, stdlib uniquement)

Ce script de démonstration illustre l’algorithme sans dépendances externes. Voir [scripts/dedup_demo.py](../scripts/dedup_demo.py).

Points d’extension :
- Remplacer les stores en mémoire par la base (Prisma/PostgreSQL).
- Brancher un score fuzzy plus robuste (trigrammes) si nécessaire.
- Enrichir EventLog (acteur, corrélation, IP, etc.).

---

## Avantages
- Un client unique et propre (pas de fiches dupliquées).
- Dossiers structurés, informations regroupées au bon endroit.
- Zéro perte/écrasement : décision conservée dans l’EventLog.
- Contrôle humain pour les cas ambigus, auditabilité renforcée.

---

Dernière mise à jour : 2026-01-30
