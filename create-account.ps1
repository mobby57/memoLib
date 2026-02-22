$email = "sarraboudjellal57@gmail.com"
$password = "SecurePass123!"
$name = "Sarra Boudjellal"

$body = @{
    email = $email
    password = $password
    name = $name
    role = "AVOCAT"
    plan = "CABINET"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Compte créé avec succès!" -ForegroundColor Green
    Write-Host "Email: $email"
    Write-Host "ID: $($response.id)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️ Compte déjà existant - connexion..." -ForegroundColor Yellow
        $loginBody = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        Write-Host "✅ Connecté avec succès!" -ForegroundColor Green
        Write-Host "Token: $($loginResponse.token.Substring(0,50))..."
    } else {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}
