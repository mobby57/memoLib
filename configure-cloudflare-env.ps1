# 🔧 Configuration Variables Cloudflare Pages
# Script PowerShell pour configurer automatiquement les variables d'environnement

Write-Host "`n=== CONFIGURATION CLOUDFLARE PAGES ===" -ForegroundColor Cyan
Write-Host "Projet: iapostemanager`n" -ForegroundColor White

# Variables à configurer (Production)
$variables = @{
    # Database
    "DATABASE_URL" = "file:./prisma/dev.db"  # À remplacer par PostgreSQL en prod
    
    # NextAuth
    "NEXTAUTH_URL" = "https://iapostemanager.pages.dev"
    "NEXTAUTH_SECRET" = "vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA="
    
    # Node.js
    "NODE_VERSION" = "20"
    
    # Ollama IA (Désactivé en prod - utiliser API externe)
    "OLLAMA_BASE_URL" = "https://api.ollama.com"  # ou API OpenAI
    "OLLAMA_MODEL" = "llama3.2:latest"
    
    # Upstash Redis
    "UPSTASH_REDIS_REST_URL" = "https://intimate-bull-28349.upstash.io"
    "UPSTASH_REDIS_REST_TOKEN" = "YOUR_TOKEN_HERE"  # À remplir
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

Write-Host "📋 Variables à configurer: $($variables.Count)`n" -ForegroundColor Yellow

# Option 1: Configuration via Dashboard Web (Recommandé)
Write-Host "=== OPTION 1: DASHBOARD WEB (RECOMMANDÉ) ===" -ForegroundColor Green
Write-Host "`n1. Ouvrez le dashboard Cloudflare Pages:" -ForegroundColor White
Write-Host "   https://dash.cloudflare.com/`n" -ForegroundColor Cyan

Write-Host "2. Naviguez vers:" -ForegroundColor White
Write-Host "   Workers and Pages -> iapostemanager -> Settings -> Environment variables`n" -ForegroundColor Gray

Write-Host "3. Cliquez sur 'Add variable' pour chaque variable:" -ForegroundColor White
Write-Host ""

foreach ($key in $variables.Keys | Sort-Object) {
    $value = $variables[$key]
    $isSecret = $key -match "SECRET|TOKEN|KEY|PASSWORD"
    $type = if ($isSecret) { "[SECRET]" } else { "[PLAIN]" }
    
    Write-Host "   - $type $key" -ForegroundColor $(if($isSecret){"Red"}else{"Green"})
    if ($value -eq "YOUR_TOKEN_HERE") {
        Write-Host "     A REMPLIR MANUELLEMENT" -ForegroundColor Yellow
    } else {
        Write-Host "     Value: $value" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "`n4. Sélectionnez 'Production' environment" -ForegroundColor White
Write-Host "5. Cliquez 'Save'`n" -ForegroundColor White

# Option 2: Configuration via Wrangler CLI
Write-Host "`n=== OPTION 2: WRANGLER CLI ===" -ForegroundColor Green
Write-Host "`nCommandes à exécuter (une par une):`n" -ForegroundColor White

foreach ($key in $variables.Keys | Sort-Object) {
    $value = $variables[$key]
    if ($value -ne "YOUR_TOKEN_HERE") {
        Write-Host "wrangler pages secret put $key --project-name=iapostemanager" -ForegroundColor Gray
    }
}

Write-Host "`nNOTE: Pour les secrets, vous serez invite a entrer la valeur de maniere securisee" -ForegroundColor Yellow

# Export des variables pour copier-coller
Write-Host "`n=== EXPORT POUR COPIER-COLLER ===" -ForegroundColor Green
Write-Host "`nVariables au format KEY=VALUE:`n" -ForegroundColor White

$output = ""
foreach ($key in $variables.Keys | Sort-Object) {
    $value = $variables[$key]
    $output += "$key=$value`n"
}

Write-Host $output -ForegroundColor Gray

# Sauvegarder dans un fichier
$outputFile = ".env.cloudflare"
$output | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "`n✅ Variables exportées dans: $outputFile" -ForegroundColor Green

# Instructions finales
Write-Host "`n=== PROCHAINES ÉTAPES ===" -ForegroundColor Cyan
Write-Host "`n1. Configurez les variables dans Cloudflare Pages" -ForegroundColor White
Write-Host "2. Redéployez (automatique ou manuel):" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host "`n3. Testez le site:" -ForegroundColor White
Write-Host "   https://iapostemanager.pages.dev`n" -ForegroundColor Cyan

Write-Host "=== VARIABLES CRITIQUES A VERIFIER ===" -ForegroundColor Yellow
Write-Host "`nUPSTASH_REDIS_REST_TOKEN - A remplir avec votre token Upstash" -ForegroundColor Red
Write-Host "DATABASE_URL - Remplacer par PostgreSQL en production" -ForegroundColor Red
Write-Host "NEXTAUTH_SECRET - Generer une nouvelle cle pour la production" -ForegroundColor Yellow
Write-Host ""
