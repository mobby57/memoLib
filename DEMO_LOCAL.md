# Demo locale (PC utilisateur)

Objectif: permettre à chaque utilisateur de lancer l'API localement sur son propre PC avant le déploiement internet.

## 1) Préparer le package une fois (sur ton poste)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-local-demo.ps1
```

Le dossier généré est: `dist/local-demo`.

## 2) Distribuer aux utilisateurs

- Zippe le dossier `dist/local-demo`.
- Envoie le zip à l'utilisateur.
- L'utilisateur dézippe puis choisit:
  - mode portable: `run-demo.bat`
  - mode installation locale: `install-demo.bat`

## 3) Vérifier que ça tourne

- Le script choisit automatiquement un port libre entre `8091` et `8100`.
- Vérifie l'URL affichée dans la console (`/health`).

## 4) Test API automatique (register/login/ingest/search/case/audit)

Depuis le repo, tu peux lancer un test end-to-end local:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1
```

Options utiles:

```powershell
# URL personnalisée
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1 -BaseUrl "http://localhost:8091"

# Email de test forcé
powershell -ExecutionPolicy Bypass -File .\scripts\auto-local-flow.ps1 -Email "manuel.user@memolib.local"
```

Résultat attendu: JSON avec `"Status": "PASS"`.

## Désinstallation

- Exécuter `uninstall-demo.bat`.

## Données locales utilisateur

Chaque utilisateur garde ses données sur son PC:

- `%LOCALAPPDATA%\MemoLib\memolib.demo.db`

## Notes

- Pas besoin d'installer .NET sur le PC cible (publish self-contained).
- En cas de conflit de ports, le script prend automatiquement un autre port libre.
- La redirection HTTPS est désactivée uniquement pour la démo locale.
