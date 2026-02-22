# Déploiement rapide MemoLib.Api

## Variables d'environnement obligatoires (Production)

- `ASPNETCORE_ENVIRONMENT=Production`
- `JwtSettings__SecretKey=<clé_forte_32+_caractères>`

## Variable fortement recommandée

- `ConnectionStrings__Default=Data Source=/data/memolib.db`

## Build et run local Docker

```bash
docker build -t memolib-api:latest .
docker run --rm -p 8080:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e JwtSettings__SecretKey="REMPLACE_PAR_UN_SECRET_TRES_FORT_32+" \
  -e ConnectionStrings__Default="Data Source=/data/memolib.db" \
  -v memolib_data:/data \
  memolib-api:latest
```

## Smoke test

```bash
curl -i http://localhost:8080/api/auth/me
```

Réponse attendue: `401 Unauthorized` (API vivante + auth active).

## Notes importantes

- Les migrations EF sont appliquées automatiquement au démarrage.
- Ne stocke jamais le secret JWT dans `appsettings.json` en production.
- Utilise un volume persistant pour SQLite (`/data`) afin de conserver les données.

## Publication GitHub Release (optionnel)

Après génération locale (`scripts/go-demo.ps1`), tu peux publier le zip `latest` sur GitHub:

```powershell
$env:GITHUB_TOKEN="<ton_token_repo>"
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github-release.ps1 -Owner "mobby57" -Repo "memoLib"
```

Comportement par défaut:

- Tag propre journalier: `vYYYY.MM.DD`
- Si la release du tag existe déjà: elle est mise à jour (pas de duplication)
- Les assets homonymes sont remplacés automatiquement

Assets publiés:

- `memolib-local-demo-latest.zip`
- `memolib-local-demo-latest.sha256.txt` (si présent)

## Go en une commande (build + smoke + package + publish)

Commande complète:

```powershell
$env:GITHUB_TOKEN="<ton_token_repo>"
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -Owner "mobby57" -Repo "memoLib"
```

Le script `go-all.ps1` applique aussi automatiquement les migrations EF (`dotnet ef database update`) avant le build/smoke/package.

Options utiles:

```powershell
# Forcer un secret JWT pour l'étape migrations
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -JwtSecret "<secret_32+>" -SkipPublish

# Ignorer explicitement l'étape migrations
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -SkipMigrations -SkipPublish
```

Mode local seulement (sans publication GitHub):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -SkipPublish
```

Canal stable (en plus du tag journalier):

```powershell
$env:GITHUB_TOKEN="<ton_token_repo>"
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -Owner "mobby57" -Repo "memoLib" -PublishStable
```

Promotion des release notes du tag journalier vers `stable`:

```powershell
$env:GITHUB_TOKEN="<ton_token_repo>"
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -Owner "mobby57" -Repo "memoLib" -PromoteStableFromDaily
```

Ce mode met à jour `stable` avec les notes du tag source (ex: `v2026.02.21`) et remplace les assets `latest`.

Tag stable personnalisé:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\go-all.ps1 -Owner "mobby57" -Repo "memoLib" -PublishStable -StableTag "stable"
```
