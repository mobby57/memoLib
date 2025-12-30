# Test Complet API v2 - PowerShell
# Tests tous les endpoints de l'API PostgreSQL

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  IA POSTE MANAGER - Test API Complete" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/v2"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "[1/12] Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health"
    if ($health.status -eq "healthy") {
        Write-Host "  ✅ PASS - Database: $($health.database)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ❌ FAIL - Status: $($health.status)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Login (existing user)
Write-Host "`n[2/12] Testing Login (email_system)..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "email_system"
        password = "EmailSystem2025!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.user.token
    $userId = $loginResponse.user.id
    
    Write-Host "  ✅ PASS - Token: $($token.Substring(0,20))..." -ForegroundColor Green
    Write-Host "           User ID: $userId" -ForegroundColor Gray
    $testsPassed++
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
    $token = $null
}

if (-not $token) {
    Write-Host "`n❌ Cannot continue without token. Stopping tests." -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# Test 3: Get Current User
Write-Host "`n[3/12] Testing Get Current User..." -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Headers $headers
    Write-Host "  ✅ PASS - User: $($me.user.username)" -ForegroundColor Green
    Write-Host "           Role: $($me.user.role)" -ForegroundColor Gray
    $testsPassed++
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: List Workspaces
Write-Host "`n[4/12] Testing List Workspaces..." -ForegroundColor Yellow
try {
    $workspaces = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Headers $headers
    $count = $workspaces.workspaces.Count
    Write-Host "  ✅ PASS - Found $count workspaces" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Create Workspace
Write-Host "`n[5/12] Testing Create Workspace..." -ForegroundColor Yellow
try {
    $newWorkspace = @{
        title = "[TEST API] Workspace - $(Get-Date -Format 'HH:mm:ss')"
        source = "api"
        priority = "MEDIUM"
    } | ConvertTo-Json

    $created = Invoke-RestMethod -Uri "$baseUrl/workspaces" `
        -Method POST `
        -Headers $headers `
        -Body $newWorkspace `
        -ContentType "application/json"
    
    $workspaceId = $created.workspace.id
    Write-Host "  ✅ PASS - Created ID: $workspaceId" -ForegroundColor Green
    Write-Host "           Title: $($created.workspace.title)" -ForegroundColor Gray
    $testsPassed++
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
    $workspaceId = $null
}

if (-not $workspaceId) {
    Write-Host "`n⚠️ Cannot test workspace operations without ID" -ForegroundColor Yellow
} else {
    # Test 6: Get Workspace
    Write-Host "`n[6/12] Testing Get Workspace..." -ForegroundColor Yellow
    try {
        $workspace = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId" -Headers $headers
        Write-Host "  ✅ PASS - ID: $($workspace.workspace.id)" -ForegroundColor Green
        Write-Host "           Status: $($workspace.workspace.status)" -ForegroundColor Gray
        $testsPassed++
    } catch {
        Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }

    # Test 7: Update Workspace
    Write-Host "`n[7/12] Testing Update Workspace..." -ForegroundColor Yellow
    try {
        $updateData = @{
            status = "IN_PROGRESS"
            progress = 50.0
        } | ConvertTo-Json

        $updated = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId" `
            -Method PUT `
            -Headers $headers `
            -Body $updateData `
            -ContentType "application/json"
        
        Write-Host "  ✅ PASS - Status: $($updated.workspace.status)" -ForegroundColor Green
        Write-Host "           Progress: $($updated.workspace.progress)%" -ForegroundColor Gray
        $testsPassed++
    } catch {
        Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }

    # Test 8: Add Message
    Write-Host "`n[8/12] Testing Add Message..." -ForegroundColor Yellow
    try {
        $messageData = @{
            role = "USER"
            content = "Message de test API - $(Get-Date -Format 'HH:mm:ss')"
            metadata = @{
                test = $true
            }
        } | ConvertTo-Json

        $message = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId/messages" `
            -Method POST `
            -Headers $headers `
            -Body $messageData `
            -ContentType "application/json"
        
        Write-Host "  ✅ PASS - Message ID: $($message.data.id)" -ForegroundColor Green
        Write-Host "           Role: $($message.data.role)" -ForegroundColor Gray
        $testsPassed++
    } catch {
        Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }

    # Test 9: List Messages
    Write-Host "`n[9/12] Testing List Messages..." -ForegroundColor Yellow
    try {
        $messages = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId/messages" -Headers $headers
        $msgCount = $messages.messages.Count
        Write-Host "  ✅ PASS - Found $msgCount messages" -ForegroundColor Green
        if ($msgCount -gt 0) {
            Write-Host "           Latest: $($messages.messages[0].content.Substring(0,[Math]::Min(50,$messages.messages[0].content.Length)))..." -ForegroundColor Gray
        }
        $testsPassed++
    } catch {
        Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 10: Get Stats
Write-Host "`n[10/12] Testing Get Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/stats" -Headers $headers
    Write-Host "  ✅ PASS - Total Workspaces: $($stats.stats.total_workspaces)" -ForegroundColor Green
    Write-Host "           In Progress: $($stats.stats.in_progress)" -ForegroundColor Gray
    Write-Host "           Completed: $($stats.stats.completed)" -ForegroundColor Gray
    $testsPassed++
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 11: List Workspaces with Filters
Write-Host "`n[11/12] Testing List Workspaces (filtered)..." -ForegroundColor Yellow
try {
    $filtered = Invoke-RestMethod -Uri "$baseUrl/workspaces?status=IN_PROGRESS&limit=5" -Headers $headers
    Write-Host "  ✅ PASS - IN_PROGRESS: $($filtered.workspaces.Count)" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 12: Delete Workspace (cleanup)
if ($workspaceId) {
    Write-Host "`n[12/12] Testing Delete Workspace (cleanup)..." -ForegroundColor Yellow
    try {
        $deleted = Invoke-RestMethod -Uri "$baseUrl/workspaces/$workspaceId" `
            -Method DELETE `
            -Headers $headers
        
        Write-Host "  ✅ PASS - Workspace deleted" -ForegroundColor Green
        $testsPassed++
    } catch {
        Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
} else {
    Write-Host "`n[12/12] Skipping Delete (no workspace created)" -ForegroundColor Gray
}

# Summary
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Tests Passed: $testsPassed" -ForegroundColor Green
if ($testsFailed -gt 0) {
    Write-Host "  Tests Failed: $testsFailed" -ForegroundColor Red
}
Write-Host "  Total: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "ALL TESTS PASSED - API IS PRODUCTION READY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED - REVIEW ERRORS ABOVE" -ForegroundColor Yellow
    exit 1
}
