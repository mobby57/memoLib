$email = "moro.sidibe@cabinet.fr"
$password = "MoroPass123!"
$name = "Moro Sidibe"

$body = @{
    email = $email
    password = $password
    name = $name
    role = "AVOCAT"
    plan = "CABINET"
} | ConvertTo-Json

Write-Host "Tentative de création de l'utilisateur: $email" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Utilisateur créé avec succès!" -ForegroundColor Green
    Write-Host "ID: $($response.id)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 409) {
        Write-Host "❌ L'utilisateur existe déjà - La gestion des doublons fonctionne correctement!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erreur HTTP $statusCode" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Message: $($errorBody.message)" -ForegroundColor Red
        }
    }
}

Write-Host "`nInformations de connexion:" -ForegroundColor Cyan
Write-Host "Email: $email"
Write-Host "Mot de passe: $password"
