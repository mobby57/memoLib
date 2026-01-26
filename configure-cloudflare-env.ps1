# Configuration Variables Cloudflare Pages
# Script PowerShell pour configurer automatiquement les variables d'environnement

Write-Output ""
Write-Output "=== CONFIGURATION CLOUDFLARE PAGES ==="
Write-Output "Projet: iapostemanager"
Write-Output ""

# Variables a configurer (Production)
$variables = @{
    # Database
    "DATABASE_URL" = "file:./prisma/dev.db"  # A remplacer par PostgreSQL en prod
    
    # NextAuth
    "NEXTAUTH_URL" = "https://iapostemanager.pages.dev"
    "NEXTAUTH_SECRET" = "vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA="
    
    # Node.js
    "NODE_VERSION" = "20"
    
    # Ollama IA
    "OLLAMA_BASE_URL" = "https://api.ollama.com"
    "OLLAMA_MODEL" = "llama3.2:latest"
    
    # Upstash Redis
    "UPSTASH_REDIS_REST_URL" = "https://intimate-bull-28349.upstash.io"
    "UPSTASH_REDIS_REST_TOKEN" = "YOUR_TOKEN_HERE"
    "REDIS_ENABLED" = "true"
    
    # Push Notifications
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY" = "BOHhFbSY-KGfgPGMuyq_jv1qhQysJ4QlbZGfaxiDFQMxFWhDc0_FBlGRWJ--_wjw2Mbo-YnUNQU7hhOO5vMmH7E"
    "VAPID_PRIVATE_KEY" = "Fu-CvQXhZpFknNf1WGE6EL3LhXXufXiZ5OvqxH8OK-w"
    
    # Azure AD
    "AZURE_AD_CLIENT_ID" = "db09cb06-7111-4981-9bd4-cbaf914ad908"
    "AZURE_AD_TENANT_ID" = "e918e8cf-5b1e-4faa-a9ee-32c3a542a18d"
    "AZURE_AD_CLIENT_SECRET" = "797810c1-98af-4248-b432-5c033e178c0f"
    "NEXT_PUBLIC_AZURE_AD_ENABLED" = "true"
    
    # JIT Provisioning
    "JIT_PROVISIONING" = "true"
    "ALLOWED_DOMAIN" = "cabinetmartin.com,cabinetdupont.fr"
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
