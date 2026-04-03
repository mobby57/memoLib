# Expert Resolution TODO

Date: 2026-04-03
Branch: chore/python-deps-2026
Scope: stabilisation post-push + nettoyage des residus locaux

## P0 - Corriger les regressions d'encodage (mojibake)

Contexte:

- Les fichiers ci-dessous contiennent des caracteres deteriorees (`�`, `??`) introduits par conversion d'encodage.
- Ces changements doivent etre traites avant nouveau release tag.

Fichiers cibles:

1. src/lib/billing/cost-alerts.ts
2. src/lib/monitoring/system-monitor.ts
3. src/lib/services/information-unit.service.ts
4. src/lib/workflows/advanced-workflow-engine.ts

Actions:

1. Restaurer UTF-8 propre sur chaque fichier (commentaires, logs, templates HTML email).
2. Conserver uniquement les changements metier voulus (ex: passage `memoLib.com` -> `memoLib.space`).
3. Verifier qu'aucun emoji n'a ete converti en `??` dans les sujets/messages.
4. Re-lancer tests integration.

Commandes:

1. `git diff -- src/lib/billing/cost-alerts.ts`
2. `git diff -- src/lib/monitoring/system-monitor.ts`
3. `git diff -- src/lib/services/information-unit.service.ts`
4. `git diff -- src/lib/workflows/advanced-workflow-engine.ts`
5. `npm run test:integration`

Definition of done:

1. Plus aucune occurence de `�` ou `??` dans ces 4 fichiers.
2. Un commit atomique `fix(encoding): restore utf8 in monitoring and workflow services`.

## P1 - Nettoyage hygiene git (artefacts locaux)

Contexte:

- Presence d'artefacts locaux dans le working tree.
- Necessite de stabiliser le repo pour eviter bruit recurrent.

Residus identifies:

1. .cache_ggshield (non tracke)
2. tsconfig.tsbuildinfo (modifie)
3. src/app/api/deployment/final-report/route.ts (EOL-only, `w/crlf`)

Actions:

1. Ignorer `.cache_ggshield` via `.gitignore`.
2. Ignorer `*.tsbuildinfo` via `.gitignore`.
3. Normaliser EOL de `src/app/api/deployment/final-report/route.ts` sans changer son contenu.
4. Option recommande: ajouter `.gitattributes` minimal pour `.ts`, `.tsx`, `.js`, `.md` en LF.

Commandes:

1. `git ls-files --eol src/app/api/deployment/final-report/route.ts`
2. `git diff --numstat -- src/app/api/deployment/final-report/route.ts`
3. `git status --short`

Definition of done:

1. `git status --short` ne montre plus `.cache_ggshield`, `tsconfig.tsbuildinfo`, ni le faux diff EOL.
2. Un commit atomique `chore(git): ignore local artifacts and normalize eol`.

## P1 - Triage securite dependances

Contexte:

- GitHub signale 33 vulnerabilites sur la branche `main` (2 critical, 14 high).

Actions:

1. Exporter la liste dependabot (critical/high d'abord).
2. Categoriser par:
   - exploitable en runtime prod
   - dev-only
   - transitive only
3. Corriger par lots (petits commits) avec tests apres chaque lot.

Commandes:

1. `npm audit --audit-level=high`
2. `npm outdated`
3. `npm run test:integration`

Definition of done:

1. Critical = 0.
2. High reduit au minimum ou documente avec mitigation.

## P2 - Cloture operationnelle

1. Ouvrir PR de consolidation depuis `chore/python-deps-2026` vers `main`.
2. Ajouter dans la description PR:
   - commits deja pousses
   - risques residuels
   - plan de rollback
3. Faire validation finale (build + integration + smoke run API local).

Checklist finale:

- [ ] Encoding restaure
- [ ] Artefacts ignores
- [ ] EOL normalise
- [ ] Securite triagee
- [ ] PR prete pour merge
