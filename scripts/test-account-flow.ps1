param(
    [string]$BaseUrl = "http://localhost:5078",
    [string]$Email = "testaccount@test.com",
    [string]$Password = "Test1234!",
    [string]$RegisterName = "Test Account",
    [string]$RegisterCity = "Paris",
    [string]$UpdateName = "Nouveau Nom",
    [string]$UpdateCity = "Lyon"
)

$ErrorActionPreference = "Stop"

function ConvertTo-CompactJson([object]$Data) {
    return ($Data | ConvertTo-Json -Depth 10 -Compress)
}

function Test-BackendReachable([string]$BaseUrl) {
    $candidates = @(
        "$BaseUrl/api/health",
        "$BaseUrl/health",
        "$BaseUrl/"
    )

    foreach ($url in $candidates) {
        try {
            [void](Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8)
            return $true
        } catch {
            if ($_.Exception.Response) {
                # Any HTTP response means the server is reachable, even 4xx/5xx.
                return $true
            }
        }
    }

    return $false
}

function Parse-ErrorResponse([System.Management.Automation.ErrorRecord]$ErrorRecord) {
    $statusCode = $null
    $rawBody = $null

    if ($ErrorRecord.Exception.Response) {
        try {
            $statusCode = [int]$ErrorRecord.Exception.Response.StatusCode
        } catch {
            $statusCode = $null
        }

        try {
            $stream = $ErrorRecord.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $rawBody = $reader.ReadToEnd()
            }
        } catch {
            $rawBody = $null
        }
    }

    if (-not $rawBody -and $ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
        $rawBody = $ErrorRecord.ErrorDetails.Message
    }

    return [PSCustomObject]@{
        StatusCode = $statusCode
        RawBody = $rawBody
    }
}

function Try-InvokeJson {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
    }

    if ($null -ne $Body) {
        $params.Body = (ConvertTo-CompactJson -Data $Body)
    }

    try {
        $response = Invoke-RestMethod @params
        return [PSCustomObject]@{
            Ok = $true
            StatusCode = 200
            Data = $response
            Error = $null
        }
    } catch {
        $errorData = Parse-ErrorResponse -ErrorRecord $_
        $parsed = $null
        if ($errorData.RawBody) {
            try {
                $parsed = $errorData.RawBody | ConvertFrom-Json
            } catch {
                $parsed = $null
            }
        }

        return [PSCustomObject]@{
            Ok = $false
            StatusCode = $errorData.StatusCode
            Data = $null
            Error = [PSCustomObject]@{
                Body = $parsed
                RawBody = $errorData.RawBody
            }
        }
    }
}

Write-Host "[STEP] Health check on $BaseUrl" -ForegroundColor Cyan
if (-not (Test-BackendReachable -BaseUrl $BaseUrl)) {
    Write-Host "[FAIL] Backend unreachable on $BaseUrl" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Backend reachable" -ForegroundColor Green

$registerPayload = @{
    email = $Email
    password = $Password
    name = $RegisterName
    phone = "0612345678"
    firmName = "Cabinet Test"
    barNumber = "BAR123"
    address = "10 rue Test"
    city = $RegisterCity
    postalCode = "75001"
}

Write-Host "[STEP] Register account: $Email" -ForegroundColor Cyan
$register = Try-InvokeJson -Method "POST" -Uri "$BaseUrl/api/auth/register" -Body $registerPayload
if ($register.Ok) {
    Write-Host "[OK] Register succeeded" -ForegroundColor Green
} elseif ($register.StatusCode -eq 409) {
    Write-Host "[WARN] Account already exists, continue" -ForegroundColor Yellow
} else {
    Write-Host "[FAIL] Register failed (HTTP $($register.StatusCode))" -ForegroundColor Red
    if ($register.Error.RawBody) {
        Write-Host $register.Error.RawBody -ForegroundColor DarkRed
    }
    exit 1
}

Write-Host "[STEP] Login" -ForegroundColor Cyan
$login = Try-InvokeJson -Method "POST" -Uri "$BaseUrl/api/auth/login" -Body @{ email = $Email; password = $Password }

if (-not $login.Ok -and $login.StatusCode -eq 403 -and $login.Error.Body -and $login.Error.Body.code -eq "EMAIL_NOT_VERIFIED") {
    Write-Host "[WARN] Email not verified, calling debug verify endpoint" -ForegroundColor Yellow
    $verify = Try-InvokeJson -Method "POST" -Uri "$BaseUrl/api/debug/verify-email" -Body @{ email = $Email }
    if (-not $verify.Ok) {
        Write-Host "[FAIL] Debug verify failed (HTTP $($verify.StatusCode))" -ForegroundColor Red
        if ($verify.Error.RawBody) {
            Write-Host $verify.Error.RawBody -ForegroundColor DarkRed
        }
        exit 1
    }

    $login = Try-InvokeJson -Method "POST" -Uri "$BaseUrl/api/auth/login" -Body @{ email = $Email; password = $Password }
}

if (-not $login.Ok -or -not $login.Data.token) {
    Write-Host "[FAIL] Login failed (HTTP $($login.StatusCode))" -ForegroundColor Red
    if ($login.Error.RawBody) {
        Write-Host $login.Error.RawBody -ForegroundColor DarkRed
    }
    exit 1
}

$token = $login.Data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "[OK] Login succeeded" -ForegroundColor Green

Write-Host "[STEP] GET profile" -ForegroundColor Cyan
$profileBefore = Try-InvokeJson -Method "GET" -Uri "$BaseUrl/api/account/profile" -Headers $headers
if (-not $profileBefore.Ok) {
    Write-Host "[FAIL] GET profile failed (HTTP $($profileBefore.StatusCode))" -ForegroundColor Red
    if ($profileBefore.Error.RawBody) {
        Write-Host $profileBefore.Error.RawBody -ForegroundColor DarkRed
    }
    exit 1
}
Write-Host "[OK] GET profile succeeded" -ForegroundColor Green

Write-Host "[STEP] PUT profile" -ForegroundColor Cyan
$updatePayload = @{ name = $UpdateName; city = $UpdateCity }
$profileUpdate = Try-InvokeJson -Method "PUT" -Uri "$BaseUrl/api/account/profile" -Body $updatePayload -Headers $headers
if (-not $profileUpdate.Ok) {
    Write-Host "[FAIL] PUT profile failed (HTTP $($profileUpdate.StatusCode))" -ForegroundColor Red
    if ($profileUpdate.Error.RawBody) {
        Write-Host $profileUpdate.Error.RawBody -ForegroundColor DarkRed
    }
    exit 1
}
Write-Host "[OK] PUT profile succeeded" -ForegroundColor Green

Write-Host "[STEP] GET profile after update" -ForegroundColor Cyan
$profileAfter = Try-InvokeJson -Method "GET" -Uri "$BaseUrl/api/account/profile" -Headers $headers
if (-not $profileAfter.Ok) {
    Write-Host "[FAIL] GET profile after update failed (HTTP $($profileAfter.StatusCode))" -ForegroundColor Red
    if ($profileAfter.Error.RawBody) {
        Write-Host $profileAfter.Error.RawBody -ForegroundColor DarkRed
    }
    exit 1
}

$summary = [PSCustomObject]@{
    Email = $Email
    BeforeName = $profileBefore.Data.name
    BeforeCity = $profileBefore.Data.city
    AfterName = $profileAfter.Data.name
    AfterCity = $profileAfter.Data.city
    Updated = (($profileAfter.Data.name -eq $UpdateName) -and ($profileAfter.Data.city -eq $UpdateCity))
}

Write-Host "[DONE] Account flow test completed" -ForegroundColor Green
$summary | ConvertTo-Json -Depth 5

if (-not $summary.Updated) {
    exit 1
}
