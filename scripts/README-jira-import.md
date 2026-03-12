# Import Jira automatique (CSV -> Epic/Story)

Script: `scripts/import-jira-backlog.ps1`

## 1) Variables requises

```powershell
$env:JIRA_BASE_URL = 'https://<ton-tenant>.atlassian.net'
$env:JIRA_EMAIL = '<ton-email-jira>'
$env:JIRA_API_TOKEN = '<ton-api-token-jira>'
$env:JIRA_PROJECT_KEY = '<clé-projet>'
```

## 2) Test sans création (dry-run)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-jira-backlog.ps1 -CsvPath .\JIRA_IMPORT_BACKLOG_S1_S3.csv -DryRun
```

## 3) Import réel (Epic + Story)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-jira-backlog.ps1 -CsvPath .\JIRA_IMPORT_BACKLOG_S1_S3.csv
```

## 4) Créer seulement les Epics

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\import-jira-backlog.ps1 -CsvPath .\JIRA_IMPORT_BACKLOG_S1_S3.csv -SkipStories
```

## Notes

- Le script tente de détecter automatiquement les champs Jira:
  - `Epic Name`
  - `Epic Link`
  - `Story Points` / `Story point estimate`
- Si `Epic Link` n'est pas trouvé dans ton Jira, les stories seront créées sans rattachement automatique à l'epic.
- Aucune credential n'est stockée dans le code; tout passe par variables d'environnement.
