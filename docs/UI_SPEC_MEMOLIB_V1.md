# UI spec MemoLib v1 (Inbox + Validation + Dashboard)

Date: 2026-04-03

## Objectif UX

- Comprendre l'etat d'un dossier en moins de 10 secondes.
- Valider une suggestion IA en moins de 3 clics.
- Donner une preuve visuelle de controle humain.

## Ecran 1 - Inbox intelligente

But:
- Prioriser les messages a traiter.

Widgets:
- Filtres: source, urgence, statut, date
- Liste: from, subject, category, urgency, confidence, age
- Actions rapides: ouvrir, approuver, rejeter

Regles:
- Urgence high en tete
- Badge "human review required" visible
- Tri par recence par defaut

## Ecran 2 - Validation decisionnelle

But:
- Approuver ou corriger la suggestion IA.

Zones:
- Colonne gauche: email brut et pieces jointes
- Colonne droite: analyse IA (resume, categorie, urgence, actions suggerees)
- Footer fixe: boutons APPROVE / REJECT + note obligatoire en reject

Regles:
- Afficher confidence score
- Exiger raison en cas de rejet
- Montrer impact metier (dossier cree/mis a jour)

## Ecran 3 - Dashboard operationnel

But:
- Piloter la qualite et les SLA.

KPIs:
- Emails recus aujourd'hui
- En attente de validation
- Temps moyen email -> decision
- Taux d'acceptation des suggestions IA
- Incidents workflow (24h)

Graphiques:
- Volume par jour
- Repartition categories
- Pipeline funnel (received -> analyzed -> approved -> executed)

## Ecran 4 - Recherche transverse

But:
- Retrouver une information instantanement.

Fonctionnalites:
- Barre unique de recherche
- Filtres par source (email, dossier, document)
- Highlights du texte pertinent

Regles:
- Reponse < 300 ms sur corpus cible
- Afficher le type de source et la date

## Design system minimal

- Typo: lisible, orientee productivite
- Couleurs:
  - success: green
  - warning: amber
  - danger: red
  - info: blue
- Composants critiques:
  - table inbox
  - badge urgence
  - timeline workflow
  - drawer details
  - modal confirmation

## Script demo commercial (7 minutes)

Minute 1:
- Arrivee d'un email dans inbox

Minute 2:
- Analyse IA visible (resume + categorie + urgence)

Minute 3:
- Validation humaine avec note

Minute 4:
- Creation ou mise a jour dossier

Minute 5:
- Recherche instantanee d'un element

Minute 6:
- Affichage audit trail

Minute 7:
- Dashboard KPI + valeur business (gain de temps)

## Checklist UX go-live

- Tous les etats ont un feedback visuel
- Tous les appels critiques ont gestion d'erreur claire
- Accessibilite clavier sur actions principales
- Temps de chargement < 2s sur ecrans coeur
