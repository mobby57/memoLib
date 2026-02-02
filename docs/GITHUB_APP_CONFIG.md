# MemoLib Guardian - GitHub App Configuration

## App Details

- **App ID**: 2782101
- **Client ID**: Iv23li1esofvkxLzxiD1
- **Name**: MemoLib Guardian
- **Homepage**: https://app.memolib.fr
- **Callback URL**: https://app.memolib.fr/api/github/callback
- **Webhook URL**: https://app.memolib.fr/api/github/webhook

## Permissions (Read-only)

### Repository

- Contents: Read
- Issues: Read
- Pull requests: Read
- Actions: Read
- Metadata: Read

### Account

- Email addresses: Read
- Profile: Read

## Events Subscribed

- push
- pull_request
- issues
- issue_comment
- workflow_run
- check_run
- repository
- member

## Environment Variables Required

```bash
# GitHub App Authentication
GITHUB_APP_ID=2782101
GITHUB_APP_CLIENT_ID=Iv23li1esofvkxLzxiD1
GITHUB_APP_CLIENT_SECRET=<à générer sur GitHub>
GITHUB_APP_PRIVATE_KEY=<à télécharger depuis GitHub>
GITHUB_APP_WEBHOOK_SECRET=<à créer>

# Installation
GITHUB_APP_INSTALLATION_ID=<sera obtenu après installation>
```

## Next Steps

1. **Generate Private Key**
   - Go to: https://github.com/settings/apps/memolib-guardian
   - Scroll to "Private keys"
   - Click "Generate a private key"
   - Save as: `memolib-guardian.pem`

2. **Generate Client Secret**
   - On same page, scroll to "Client secrets"
   - Click "Generate a new client secret"
   - Copy and save securely

3. **Set Webhook Secret**
   - Scroll to "Webhook secret"
   - Click "Edit"
   - Generate strong secret (32+ chars)
   - Save securely

4. **Install App**
   - Go to: https://github.com/settings/apps/memolib-guardian/installations
   - Click "Install App"
   - Select repositories
   - Note the Installation ID from URL

## Security Notes

- ✅ Read-only permissions minimize risk
- ✅ No write access to code
- ✅ RGPD compliant (audit trail only)
- ✅ Private app (not public marketplace)
- ⚠️ Keep private key secure
- ⚠️ Never commit secrets to git
