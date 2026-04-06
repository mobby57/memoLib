# Demo client dediee au compte sarraboudjellal57

## Objectif

Activer une demo live avec de vrais emails, sans modifier les modules existants ni casser le flux actuel.

## Ce qui a ete ajoute (non intrusif)

- Script de validation config: `npm run demo:client:sarrab:check`
- Script de lancement orchestration: `npm run demo:client:sarrab:run`
- Script de monitoring direct: `npm run demo:client:sarrab:monitor`

## Pre-requis

1. `credentials.json` present a la racine du projet.
2. `.env.local` contient au minimum:
   - `DEFAULT_TENANT_ID=<tenant-id-valide>`
3. Optionnel (utile seulement pour le helper OAuth):
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`

## Premiere connexion Gmail (si token absent)

1. Lancez: `npm run gmail:auth`
2. Ouvrez l'URL affichee.
3. Autorisez le compte Google cible.
4. Recuperez le code et finalisez.
5. Verifiez que `token.json` est genere.

### Depannage: Erreur 400 `invalid_request` / `Missing required parameter: client_id`

Cause: les credentials OAuth ne sont pas charges (client_id/client_secret absents).

Resolution rapide:

1. Placez `credentials.json` a la racine du projet (recommande),
2. Ou renseignez `.env.local`:
   - `GMAIL_CLIENT_ID=...`
   - `GMAIL_CLIENT_SECRET=...`
3. Relancez `npm run gmail:auth`.

## Lancement demo client

1. Validation config:
   - `npm run demo:client:sarrab:check`
2. Orchestration complete:
   - `npm run demo:client:sarrab:run`

Le script:

- demarre le frontend (sauf si deja lance),
- lance le monitoring Gmail integre,
- ouvre la page de demo,
- affiche les actions a faire en live.

## Scenario recommande en rendez-vous

1. Envoyer un vrai email vers `sarraboudjellal57@gmail.com` depuis une autre adresse.
2. Sujet conseille: `[DEMO CLIENT] Nouveau dossier urgent`.
3. Attendre 30 a 60 secondes.
4. Montrer dans MemoLib:
   - detection du nouvel email,
   - classification,
   - rattachement dossier,
   - statistiques (`npm run email:stats`).

## Commandes de support

- `npm run email:monitor:integrated`
- `npm run email:stats`
- `npm run email:export`
- `npm run demo:all`

## Garantie non-regression

Aucune route API metier ni module core n'a ete modifie.
L'integration est ajoutee par scripts et runbook uniquement.
