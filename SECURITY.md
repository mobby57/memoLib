# Politique de Sécurité — MemoLib

## Versions supportées
Seule la branche `main` reçoit des correctifs de sécurité.

## Signalement de vulnérabilités
Envoyez un email à `security@memolib.space`. Ne créez pas d'issue publique.

## Vulnérabilités acceptées (Build-time ou non-exploitables)

### Dépendances build-time (jamais dans le bundle Vercel)
- `npm`, `semantic-release`, `sigstore`, `@npmcli/*`, `brace-expansion`, `picomatch`, `http-cache-semantics`, `ip-address`
- **Raison** : ces packages n'existent qu'au moment du `npm install`. Ils ne sont jamais déployés dans le bundle runtime.

### Dépendances runtime documentées
- `zod@3.24.1` : v4 est un breaking change majeur. Migration planifiée Q2 2027.
- `undici@5.29.0` : Bundlé par `@vercel/blob@0.27.3`. Forcer v7 casse `@vercel/blob`. Les CVE concernent le parsing Set-Cookie/CRLF. Non exploitables : MemoLib n'utilise pas `@vercel/blob` pour parser des réponses HTTP non fiables contenant Set-Cookie.

## Historique des audits
- **Session 2026-10-26** : Migration complète NextAuth → Clerk (247 routes). 0 erreur TypeScript. 4443/4443 tests verts. 0 vulnérabilité critique.
