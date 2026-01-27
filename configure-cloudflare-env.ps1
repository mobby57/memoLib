# Configuration Variables Cloudflare Pages
# Script PowerShell pour configurer automatiquement les variables d'environnement
# ⚠️ IMPORTANT: Ne jamais commiter de vrais secrets - utiliser des placeholders

Write-Output ""
Write-Output "=== CONFIGURATION CLOUDFLARE PAGES ==="
Write-Output "Projet: iapostemanager"
Write-Output ""

# Variables a configurer (Production)
# ⚠️ Remplacer les valeurs par vos vrais secrets via le Dashboard Cloudflare
$variables = @{
    # Database
    "DATABASE_URL" = "YOUR_DATABASE_URL_HERE"  # PostgreSQL connection string

    # NextAuth
    "NEXTAUTH_URL" = "https://iapostemanager.pages.dev"
    "NEXTAUTH_SECRET" = "YOUR_NEXTAUTH_SECRET_HERE"  # Générer avec: openssl rand -base64 32

    # Node.js
    "NODE_VERSION" = "20"

    # Ollama IA
    "OLLAMA_BASE_URL" = "https://api.ollama.com"
    "OLLAMA_MODEL" = "llama3.2:latest"

    # Upstash Redis
    "UPSTASH_REDIS_REST_URL" = "YOUR_UPSTASH_URL_HERE"
    "UPSTASH_REDIS_REST_TOKEN" = "YOUR_UPSTASH_TOKEN_HERE"
    "REDIS_ENABLED" = "true"

    # Push Notifications (Générer avec: npx web-push generate-vapid-keys)
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY" = "YOUR_VAPID_PUBLIC_KEY_HERE"
    "VAPID_PRIVATE_KEY" = "YOUR_VAPID_PRIVATE_KEY_HERE"

    # Azure AD (optionnel - configurer dans Azure Portal)
    "AZURE_AD_CLIENT_ID" = "YOUR_AZURE_AD_CLIENT_ID_HERE"
    "AZURE_AD_TENANT_ID" = "YOUR_AZURE_AD_TENANT_ID_HERE"
    "AZURE_AD_CLIENT_SECRET" = "YOUR_AZURE_AD_CLIENT_SECRET_HERE"
    "NEXT_PUBLIC_AZURE_AD_ENABLED" = "false"

    # JIT Provisioning
    "JIT_PROVISIONING" = "true"
    "ALLOWED_DOMAIN" = "YOUR_ALLOWED_DOMAINS_HERE"
}

Write-Output "[INFO] Variables a configurer: $($variables.Count)"
Write-Output ""

# Option 1: Configuration via Dashboard Web (Recommande)
Write-Output "=== OPTION 1: DASHBOARD WEB (RECOMMANDE) ==="
Write-Output ""
Write-Output "1. Ouvrez le dashboard Cloudflare Pages:"
Write-Output "   https://dash.cloudflare.com/"
Write-Output ""
Write-Output "2. Naviguez vers:"
Write-Output "   Pages > iapostemanager > Settings > Environment Variables"
Write-Output ""
Write-Output "3. Ajoutez chaque variable avec sa valeur"
Write-Output ""

# Option 2: Via wrangler.toml
Write-Output "=== OPTION 2: wrangler.toml ==="
Write-Output ""
Write-Output "Ajoutez dans wrangler.toml:"
Write-Output ""
Write-Output "[vars]"
foreach ($key in $variables.Keys) {
    $value = $variables[$key]
    if ($value -match "YOUR_|TO_BE_") {
        Write-Output "# $key = `"$value`"  # A configurer"
    } else {
        Write-Output "$key = `"$value`""
    }
}

Write-Output ""
Write-Output "=== VARIABLES SENSIBLES (secrets) ==="
Write-Output ""
Write-Output "Pour les secrets, utilisez:"
Write-Output "   wrangler secret put <NOM_VARIABLE>"
Write-Output ""
Write-Output "Exemple:"
Write-Output "   wrangler secret put DATABASE_URL"
Write-Output "   wrangler secret put NEXTAUTH_SECRET"
Write-Output ""
Write-Output "[OK] Configuration terminee. Suivez les instructions ci-dessus."
Write-Output ""
