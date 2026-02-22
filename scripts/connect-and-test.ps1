param(
    [string]$BaseUrl = '',
    [string]$Email = '',
    [string]$Password = 'MemoLib!2026',
    [string]$Name = 'Utilisateur MemoLib',
    [switch]$Interactive,
    [switch]$SkipRegister
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $sessionPath = Join-Path $projectDir 'dist\local-preview-session.json'
    if (Test-Path $sessionPath) {
        try {
            $session = Get-Content -Raw -Path $sessionPath | ConvertFrom-Json
            if ($session.baseUrl) {
                $BaseUrl = [string]$session.baseUrl
            }
        }
        catch {
        }
    }
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:8091'
}

if ($Interactive) {
    if ([string]::IsNullOrWhiteSpace($Email)) {
        $Email = Read-Host 'Email (ex: prenom.nom@domaine.com)'
    }

    if ([string]::IsNullOrWhiteSpace($Name)) {
        $Name = Read-Host 'Nom affiché'
    }

    if (-not $PSBoundParameters.ContainsKey('Password')) {
        $securePassword = Read-Host -Prompt 'Mot de passe' -AsSecureString
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        try {
            $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
        }
        finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = "user.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@memolib.local"
}

$registerBody = @{
    email = $Email
    password = $Password
    name = $Name
    role = 'AVOCAT'
    plan = 'CABINET'
} | ConvertTo-Json

$registerStatus = 0
$loginStatus = 0
$tokenPresent = $false
$ingestStatus = 0
$searchHits = 0
$searchFound = $false
$errorStep = ''
$errorMessage = ''

if (-not $SkipRegister) {
    try {
        $registerResp = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method Post -ContentType 'application/json' -Body $registerBody
        $registerStatus = $registerResp.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $registerStatus = $_.Exception.Response.StatusCode.value__
        }
        else {
            $errorStep = 'register'
            $errorMessage = $_.Exception.Message
        }
    }
}
else {
    $registerStatus = -1
}

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
try {
    $loginResp = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody
    $loginStatus = $loginResp.StatusCode
    $loginObj = $loginResp.Content | ConvertFrom-Json
    $token = $loginObj.token
    $tokenPresent = -not [string]::IsNullOrWhiteSpace($token)
}
catch {
    if ($_.Exception.Response) {
        $loginStatus = $_.Exception.Response.StatusCode.value__
    }
    $errorStep = 'login'
    $errorMessage = $_.Exception.Message
}

if (-not $tokenPresent) {
    if ([string]::IsNullOrWhiteSpace($errorMessage)) {
        $errorStep = 'login'
        $errorMessage = 'Token absent après login.'
    }
}

$headers = @{}
if ($tokenPresent) {
    $headers = @{ Authorization = "Bearer $token" }
}

$externalId = 'msg-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$ingestBody = @{
    externalId = $externalId
    from = 'client@test.com'
    subject = 'Test connexion'
    body = 'Email de test de connexion'
    occurredAt = '2026-02-21T10:00:00Z'
} | ConvertTo-Json

if ($tokenPresent) {
    try {
        $ingestResp = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ingest/email" -Method Post -ContentType 'application/json' -Headers $headers -Body $ingestBody
        $ingestStatus = $ingestResp.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $ingestStatus = $_.Exception.Response.StatusCode.value__
        }
        if ([string]::IsNullOrWhiteSpace($errorMessage)) {
            $errorStep = 'ingest'
            $errorMessage = $_.Exception.Message
        }
    }
}

$searchBody = @{ text = 'Test connexion' } | ConvertTo-Json
if ($tokenPresent -and $ingestStatus -eq 200) {
    try {
        $search = Invoke-RestMethod -Uri "$BaseUrl/api/search/events" -Method Post -ContentType 'application/json' -Headers $headers -Body $searchBody
        $searchHits = ($search | Measure-Object).Count
        $searchFound = (($search | Where-Object { $_.externalId -eq $externalId } | Measure-Object).Count -ge 1)
    }
    catch {
        if ([string]::IsNullOrWhiteSpace($errorMessage)) {
            $errorStep = 'search'
            $errorMessage = $_.Exception.Message
        }
    }
}

$ok =
    ($SkipRegister -or ($registerStatus -eq 200) -or ($registerStatus -eq 409)) -and
    ($loginStatus -eq 200) -and
    $tokenPresent -and
    ($ingestStatus -eq 200) -and
    $searchFound

$result = [pscustomobject]@{
    Status = if ($ok) { 'PASS' } else { 'FAIL' }
    BaseUrl = $BaseUrl
    Email = $Email
    Name = $Name
    RegisterStatus = $registerStatus
    LoginStatus = $loginStatus
    TokenPresent = $tokenPresent
    IngestStatus = $ingestStatus
    SearchHits = $searchHits
    SearchFoundExternalId = $searchFound
    ErrorStep = $errorStep
    Error = $errorMessage
}

$result | ConvertTo-Json -Depth 4

if (-not $ok) {
    exit 1
}
