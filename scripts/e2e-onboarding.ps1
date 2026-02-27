param(
  [string]$BaseUrl
)

$ErrorActionPreference = 'Stop'

$base = $BaseUrl
if ([string]::IsNullOrWhiteSpace($base)) {
  $candidates = @('http://localhost:8091', 'http://localhost:5078')
  foreach ($candidate in $candidates) {
    try {
      $health = Invoke-RestMethod -Uri "$candidate/health" -Method Get -TimeoutSec 5
      if ($health -and $health.status -eq 'healthy') {
        $base = $candidate
        break
      }
    }
    catch {
      # ignore candidate
    }
  }
}

if ([string]::IsNullOrWhiteSpace($base)) {
  throw "API locale introuvable. Demarrez l'API sur http://localhost:8091 ou http://localhost:5078."
}
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "e2e.onboarding.$stamp@example.com"
$pwd = 'Test1234!'
$name = 'E2E Onboarding'

$registerBody = @{ email = $email; password = $pwd; name = $name; role = 'AVOCAT'; plan = 'CABINET' } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body $registerBody -TimeoutSec 20

$loginBody = @{ email = $email; password = $pwd } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 20
$token = $login.token
if ([string]::IsNullOrWhiteSpace($token)) { throw 'Token login manquant' }
$headers = @{ Authorization = "Bearer $token" }

$templateBody = @{
  name = "Template E2E $stamp"
  description = 'Formulaire intelligent e2e'
  needOptions = @('Litige civil','Conseil contrat')
  requiredDocuments = @('CNI','Contrat','Courriers')
  participantRoles = @('CLIENT','AVOCAT','SECRETAIRE','JUGE')
  extraFields = @(
    @{ key = 'jurisdiction'; label = 'Juridiction'; required = $true; type = 'SELECT'; options = @('TJ Paris','TJ Lyon') },
    @{ key = 'budget'; label = 'Budget estimé'; required = $false; type = 'TEXT'; options = @() }
  )
} | ConvertTo-Json -Depth 10
$template = Invoke-RestMethod -Uri "$base/api/onboarding/templates" -Method Post -Headers $headers -ContentType 'application/json' -Body $templateBody -TimeoutSec 20
$templateId = $template.id
if ([string]::IsNullOrWhiteSpace($templateId)) { throw 'TemplateId manquant' }

$inviteBody = @{ clientName = 'Client Final'; clientEmail = 'client.final@example.com'; expiresInDays = 7; sendEmail = $false } | ConvertTo-Json
$invite = Invoke-RestMethod -Uri "$base/api/onboarding/templates/$templateId/invite" -Method Post -Headers $headers -ContentType 'application/json' -Body $inviteBody -TimeoutSec 20
$link = $invite.link
if ([string]::IsNullOrWhiteSpace($link)) { throw 'Lien onboarding manquant' }

$tokenParam = ([uri]$link).Query.TrimStart('?').Split('&') | Where-Object { $_ -like 'token=*' } | ForEach-Object { $_.Substring(6) }
if ([string]::IsNullOrWhiteSpace($tokenParam)) { throw 'Token onboarding non extrait' }

$publicForm = Invoke-RestMethod -Uri "$base/api/onboarding/public/$tokenParam" -Method Get -TimeoutSec 20

$submitBody = @{
  selectedNeed = 'Litige civil'
  phone = '0601020304'
  answers = @{ jurisdiction = 'TJ Paris'; budget = '5000 EUR' }
  providedDocuments = @('CNI','Contrat')
  participants = @(
    @{ name = 'Maître Dupont'; email = 'avocat.participant@example.com'; role = 'AVOCAT' },
    @{ name = 'Mme Martin'; email = 'secretaire.participant@example.com'; role = 'SECRETAIRE' },
    @{ name = 'M. Juge'; email = 'juge.participant@example.com'; role = 'JUGE' }
  )
} | ConvertTo-Json -Depth 10
$submit = Invoke-RestMethod -Uri "$base/api/onboarding/public/$tokenParam/submit" -Method Post -ContentType 'application/json' -Body $submitBody -TimeoutSec 20

$requests = Invoke-RestMethod -Uri "$base/api/onboarding/requests" -Method Get -Headers $headers -TimeoutSec 20
$created = $requests | Where-Object { $_.id -eq $invite.id } | Select-Object -First 1

[pscustomobject]@{
  baseUrl = $base
  registerEmail = $email
  loginTokenPresent = (-not [string]::IsNullOrWhiteSpace($token))
  templateId = $templateId
  inviteId = $invite.id
  publicClient = $publicForm.clientName
  submitMessage = $submit.message
  submitCaseId = $submit.caseId
  participantsAdded = $submit.participantsAdded
  requestStatus = $created.status
  requestCreatedCaseId = $created.createdCaseId
} | ConvertTo-Json -Depth 8
