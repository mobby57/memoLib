# Test API Complete - Version Améliorée
# Test tous les endpoints sans stopper le serveur

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "IA POSTE MANAGER - API Test Suite v2.0" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/v2"
$testsPassed = 0
$testsFailed = 0
$token = ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        Write-Host "[$($testsPassed + $testsFailed + 1)] Testing: $Name... " -NoNewline
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "PASS" -ForegroundColor Green
        $script:testsPassed++
        return $response
    }
    catch {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:testsFailed++
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n=== Phase 1: System Health ===" -ForegroundColor Cyan
$health = Test-Endpoint -Name "Health Check" -Method "GET" -Url "$baseUrl/health"

if ($health) {
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor Green
}

# Test 2: Login
Write-Host "`n=== Phase 2: Authentication ===" -ForegroundColor Cyan
$loginBody = @{
    username = "email_system"
    password = "EmailSystem2025!"
}

$loginResponse = Test-Endpoint -Name "Login" -Method "POST" -Url "$baseUrl/auth/login" -Body $loginBody

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    Write-Host "   Token received: $($token.Substring(0, 20))..." -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.username)" -ForegroundColor Green
}

# Test 3: Get Current User
if ($token) {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "`n=== Phase 3: User Info ===" -ForegroundColor Cyan
    $me = Test-Endpoint -Name "Get Current User" -Method "GET" -Url "$baseUrl/auth/me" -Headers $authHeaders
    
    if ($me) {
        Write-Host "   User ID: $($me.id)" -ForegroundColor Green
        Write-Host "   Email: $($me.email)" -ForegroundColor Green
    }
}

# Test 4: List Workspaces
if ($token) {
    Write-Host "`n=== Phase 4: Workspace Operations ===" -ForegroundColor Cyan
    $workspaces = Test-Endpoint -Name "List Workspaces" -Method "GET" -Url "$baseUrl/workspaces" -Headers $authHeaders
    
    if ($workspaces) {
        Write-Host "   Total workspaces: $($workspaces.total)" -ForegroundColor Green
    }
}

# Test 5: Create New Workspace
if ($token) {
    $newWorkspace = @{
        subject = "Test API v2 - $(Get-Date -Format 'HH:mm:ss')"
        sender_email = "test@example.com"
        sender_name = "API Tester"
        priority = "normal"
        status = "pending"
        workspace_metadata = @{
            source = "api_test"
            test_run = $true
        }
    }
    
    $created = Test-Endpoint -Name "Create Workspace" -Method "POST" -Url "$baseUrl/workspaces" -Body $newWorkspace -Headers $authHeaders
    
    if ($created) {
        Write-Host "   Created ID: $($created.id)" -ForegroundColor Green
        $workspaceId = $created.id
        
        # Test 6: Get Workspace Detail
        $detail = Test-Endpoint -Name "Get Workspace Detail" -Method "GET" -Url "$baseUrl/workspaces/$workspaceId" -Headers $authHeaders
        
        # Test 7: Update Workspace
        $update = @{
            status = "processing"
            priority = "high"
        }
        
        $updated = Test-Endpoint -Name "Update Workspace" -Method "PUT" -Url "$baseUrl/workspaces/$workspaceId" -Body $update -Headers $authHeaders
        
        # Test 8: Add Message
        Write-Host "`n=== Phase 5: Message Operations ===" -ForegroundColor Cyan
        $message = @{
            role = "user"
            content = "Message de test automatique"
        }
        
        $addedMsg = Test-Endpoint -Name "Add Message" -Method "POST" -Url "$baseUrl/workspaces/$workspaceId/messages" -Body $message -Headers $authHeaders
        
        if ($addedMsg) {
            Write-Host "   Message ID: $($addedMsg.id)" -ForegroundColor Green
        }
        
        # Test 9: List Messages
        $messages = Test-Endpoint -Name "List Messages" -Method "GET" -Url "$baseUrl/workspaces/$workspaceId/messages" -Headers $authHeaders
        
        if ($messages) {
            Write-Host "   Total messages: $($messages.total)" -ForegroundColor Green
        }
        
        # Test 10: Get Stats
        Write-Host "`n=== Phase 6: Statistics ===" -ForegroundColor Cyan
        $stats = Test-Endpoint -Name "Get User Stats" -Method "GET" -Url "$baseUrl/stats" -Headers $authHeaders
        
        if ($stats) {
            Write-Host "   Total workspaces: $($stats.total_workspaces)" -ForegroundColor Green
            Write-Host "   Pending: $($stats.by_status.pending)" -ForegroundColor Yellow
            Write-Host "   Processing: $($stats.by_status.processing)" -ForegroundColor Cyan
        }
        
        # Test 11: Filtered List
        $filtered = Test-Endpoint -Name "Filter by Status" -Method "GET" -Url "$baseUrl/workspaces?status=processing" -Headers $authHeaders
        
        # Test 12: Delete Workspace (Cleanup)
        Write-Host "`n=== Phase 7: Cleanup ===" -ForegroundColor Cyan
        $deleted = Test-Endpoint -Name "Delete Workspace" -Method "DELETE" -Url "$baseUrl/workspaces/$workspaceId" -Headers $authHeaders
        
        if ($deleted) {
            Write-Host "   Cleanup successful" -ForegroundColor Green
        }
    }
}

# Final Report
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host "Total:  $($testsPassed + $testsFailed)" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSOME TESTS FAILED - Check errors above" -ForegroundColor Red
    exit 1
}
