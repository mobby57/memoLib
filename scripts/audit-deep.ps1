```powershell
# ============================================================
# MEMOLIB - DEEP AUDIT
# READ ONLY
# ============================================================

$ErrorActionPreference = "Continue"

$Root = (Get-Location).Path
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Report = Join-Path $Root "audit-$Stamp.txt"

$Critical = [System.Collections.Generic.List[string]]::new()
$Warnings = [System.Collections.Generic.List[string]]::new()
$Info = [System.Collections.Generic.List[string]]::new()

function Write-Section {
    param([string]$Title)

    Add-Content $Report ""
    Add-Content $Report "================================================================"
    Add-Content $Report $Title
    Add-Content $Report "================================================================"
}

function Write-Report {
    param([string]$Text)

    Add-Content $Report $Text
}

function Add-Critical {
    param([string]$Text)

    $Critical.Add($Text)
    Write-Report "[CRITICAL] $Text"
}

function Add-Warning {
    param([string]$Text)

    $Warnings.Add($Text)
    Write-Report "[WARNING] $Text"
}

function Add-Info {
    param([string]$Text)

    $Info.Add($Text)
    Write-Report "[OK] $Text"
}

function Invoke-CommandAudit {
    param(
        [string]$Name,
        [string]$Command
    )

    Write-Report ""
    Write-Report ">>> $Name"
    Write-Report ">>> $Command"

    try {
        $output = Invoke-Expression "$Command 2>&1"

        if ($null -ne $output) {
            $output | ForEach-Object {
                Write-Report ([string]$_)
            }
        }
    }
    catch {
        Add-Warning "$Name failed: $($_.Exception.Message)"
    }
}

# ============================================================
# INIT
# ============================================================

@"
MEMOLIB DEEP AUDIT
Date : $(Get-Date)
Root : $Root

READ ONLY AUDIT
No project source files are modified by this audit.

"@ | Out-File $Report -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host " MEMOLIB DEEP AUDIT"
Write-Host "============================================================"
Write-Host ""

# ============================================================
# 1 - PROJECT
# ============================================================

Write-Section "1. PROJECT"

if (Test-Path "package.json") {
    Add-Info "package.json present"
}
else {
    Add-Critical "package.json missing"
}

if (Test-Path "tsconfig.json") {
    Add-Info "tsconfig.json present"
}
else {
    Add-Critical "tsconfig.json missing"
}

if (Test-Path "next.config.js") {
    Add-Info "next.config.js present"
}
elseif (Test-Path "next.config.mjs") {
    Add-Info "next.config.mjs present"
}
elseif (Test-Path "next.config.ts") {
    Add-Info "next.config.ts present"
}
else {
    Add-Warning "No Next.js config file detected"
}

if (Test-Path "prisma/schema.prisma") {
    Add-Info "prisma/schema.prisma present"
}
else {
    Add-Warning "prisma/schema.prisma missing"
}

# ============================================================
# 2 - VERSIONS
# ============================================================

Write-Section "2. INSTALLED VERSIONS"

Invoke-CommandAudit `
    "Versions principales" `
    "npm list next react react-dom typescript @clerk/nextjs next-auth @prisma/client prisma @sentry/nextjs --depth=0"

# ============================================================
# 3 - PACKAGE JSON
# ============================================================

Write-Section "3. PACKAGE.JSON"

if (Test-Path "package.json") {

    try {
        $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json

        Write-Report "name    = $($pkg.name)"
        Write-Report "version = $($pkg.version)"

        Write-Report ""
        Write-Report "AUTH PACKAGES"

        if ($pkg.dependencies.'@clerk/nextjs') {
            Write-Report "Clerk = $($pkg.dependencies.'@clerk/nextjs')"
        }
        else {
            Add-Warning "@clerk/nextjs not declared"
        }

        if ($pkg.dependencies.'next-auth') {
            Add-Warning "next-auth is still declared"
            Write-Report "NextAuth = $($pkg.dependencies.'next-auth')"
        }
        else {
            Write-Report "NextAuth = absent"
        }

        Write-Report ""
        Write-Report "MAIN DEPENDENCIES"

        foreach ($name in @(
            "next",
            "react",
            "react-dom",
            "typescript",
            "prisma",
            "@prisma/client",
            "@sentry/nextjs",
            "stripe",
            "redis",
            "zod",
            "tailwindcss"
        )) {

            $value = $null

            if ($pkg.dependencies.$name) {
                $value = $pkg.dependencies.$name
            }
            elseif ($pkg.devDependencies.$name) {
                $value = $pkg.devDependencies.$name
            }

            if ($value) {
                Write-Report "$name = $value"
            }
        }
    }
    catch {
        Add-Critical "Cannot parse package.json: $($_.Exception.Message)"
    }
}

# ============================================================
# 4 - SOURCE FILES
# ============================================================

Write-Section "4. SOURCE FILE INVENTORY"

$Files = Get-ChildItem `
    -Path . `
    -Recurse `
    -File `
    -Include *.ts,*.tsx,*.js,*.jsx,*.mjs,*.cjs `
    -Exclude node_modules,.next,.git,dist,build

Write-Report "Source files: $($Files.Count)"

# ============================================================
# 5 - CLERK
# ============================================================

Write-Section "5. CLERK AUDIT"

$ClerkMatches = $Files | Select-String `
    -Pattern "@clerk/nextjs|clerkMiddleware|currentUser\s*\(|\bauth\s*\(|useAuth|useUser|ClerkProvider"

Write-Report "Clerk/auth references: $($ClerkMatches.Count)"

foreach ($m in $ClerkMatches) {
    Write-Report "$($m.Path):$($m.LineNumber): $($m.Line.Trim())"
}

# ============================================================
# 6 - AUTH WITHOUT IMPORT
# ============================================================

Write-Section "6. AUTH() WITHOUT CLERK IMPORT"

foreach ($file in $Files) {

    $content = Get-Content $file.FullName -Raw

    if ($content -match "\bauth\s*\(") {

        $HasClerkServerImport =
            $content -match "from\s+['""]@clerk/nextjs/server['""]"

        $HasClerkMainImport =
            $content -match "from\s+['""]@clerk/nextjs['""]"

        $HasNextAuthImport =
            $content -match "from\s+['""]next-auth"

        if (
            -not $HasClerkServerImport -and
            -not $HasClerkMainImport -and
            -not $HasNextAuthImport
        ) {
            Add-Critical "auth() detected without obvious auth import -> $($file.FullName)"
        }
    }
}

# ============================================================
# 7 - CLERK / NEXTAUTH MIX
# ============================================================

Write-Section "7. CLERK / NEXTAUTH MIX"

foreach ($file in $Files) {

    $content = Get-Content $file.FullName -Raw

    $UsesClerk =
        $content -match "@clerk/nextjs" -or
        $content -match "\bauth\s*\("

    $UsesNextAuth =
        $content -match "next-auth" -or
        $content -match "getServerSession" -or
        $content -match "getSession" -or
        $content -match "useSession" -or
        $content -match "SessionProvider"

    if ($UsesClerk -and $UsesNextAuth) {
        Add-Critical "Clerk + NextAuth mixed in same file -> $($file.FullName)"
    }
}

# ============================================================
# 8 - NEXTAUTH LEGACY
# ============================================================

Write-Section "8. NEXTAUTH LEGACY REFERENCES"

$NextAuthMatches = $Files | Select-String `
    -Pattern "next-auth|getServerSession|getSession|useSession|SessionProvider|NextAuthOptions"

Write-Report "NextAuth references: $($NextAuthMatches.Count)"

foreach ($m in $NextAuthMatches) {
    Write-Report "$($m.Path):$($m.LineNumber): $($m.Line.Trim())"
}

if ($NextAuthMatches.Count -gt 0) {
    Add-Warning "NextAuth legacy references detected"
}

# ============================================================
# 9 - SESSION.USER
# ============================================================

Write-Section "9. SESSION.USER PATTERNS"

$SessionUser = $Files | Select-String `
    -Pattern "session\?\.user|session\.user|session\[['""]user['""]\]"

Write-Report "session.user references: $($SessionUser.Count)"

foreach ($m in $SessionUser) {
    Write-Report "$($m.Path):$($m.LineNumber): $($m.Line.Trim())"
}

if ($SessionUser.Count -gt 0) {
    Add-Warning "session.user patterns detected"
}

# ============================================================
# 10 - POSSIBLE UNDEFINED USER
# ============================================================

Write-Section "10. POSSIBLE UNDEFINED VARIABLES"

foreach ($file in $Files) {

    $lines = Get-Content $file.FullName

    for ($i = 0; $i -lt $lines.Count; $i++) {

        $line = $lines[$i]

        if ($line -match "\buser\.email\b") {

            $before = ($lines[0..$i] -join "`n")

            $declared =
                $before -match "\bconst\s+user\b" -or
                $before -match "\blet\s+user\b" -or
                $before -match "\bvar\s+user\b" -or
                $before -match "\buser\s*="

            if (-not $declared) {
                Add-Critical "Possible undefined user variable -> $($file.FullName):$($i + 1)"
            }
        }
    }
}

# ============================================================
# 11 - API ROUTES
# ============================================================

Write-Section "11. API ROUTES"

$Routes = Get-ChildItem `
    -Path . `
    -Recurse `
    -File `
    -Include route.ts,route.js `
    -Exclude node_modules,.next,.git,dist,build

Write-Report "API routes: $($Routes.Count)"

foreach ($route in $Routes) {

    $content = Get-Content $route.FullName -Raw

    Write-Report ""
    Write-Report "ROUTE: $($route.FullName)"

    foreach ($method in @(
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE"
    )) {

        if ($content -match "export\s+(async\s+)?function\s+$method") {
            Write-Report "  $method"
        }
    }

    $HasAuth =
        $content -match "\bauth\s*\(" -or
        $content -match "currentUser\s*\(" -or
        $content -match "getServerSession" -or
        $content -match "clerkMiddleware"

    if ($HasAuth) {
        Write-Report "  Auth reference: YES"
    }
    else {
        Add-Warning "API route has no obvious auth check -> $($route.FullName)"
    }
}

# ============================================================
# 12 - DANGEROUS CODE
# ============================================================

Write-Section "12. DANGEROUS CODE PATTERNS"

$DangerPatterns = @(
    "eval\s*\(",
    "new\s+Function\s*\(",
    "dangerouslySetInnerHTML",
    "\.innerHTML\s*=",
    "child_process",
    "exec\s*\(",
    "execSync\s*\(",
    "spawn\s*\(",
    "spawnSync\s*\("
)

foreach ($pattern in $DangerPatterns) {

    $matches = $Files | Select-String -Pattern $pattern

    if ($matches) {

        Add-Warning "Pattern detected: $pattern"

        foreach ($m in $matches) {
            Write-Report "$($m.Path):$($m.LineNumber): $($m.Line.Trim())"
        }
    }
}

# ============================================================
# 13 - TYPESCRIPT ANY
# ============================================================

Write-Section "13. TYPESCRIPT ANY"

$AnyMatches = $Files | Select-String -Pattern "\bany\b"

Write-Report "any occurrences: $($AnyMatches.Count)"

$AnyMatches |
    Select-Object -First 500 |
    ForEach-Object {
        Write-Report "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

if ($AnyMatches.Count -gt 100) {
    Add-Warning "High number of 'any' usages"
}

# ============================================================
# 14 - ENV FILES
# ============================================================

Write-Section "14. ENVIRONMENT FILES"

foreach ($envFile in @(
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test"
)) {

    if (Test-Path $envFile) {

        Write-Report ""
        Write-Report "FILE: $envFile"

        Get-Content $envFile |
            ForEach-Object {

                if ($_ -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=") {
                    Write-Report "  $($matches[1])=<REDACTED>"
                }
            }
    }
}

# ============================================================
# 15 - NEXT_PUBLIC SECRETS
# ============================================================

Write-Section "15. NEXT_PUBLIC POTENTIAL SECRETS"

foreach ($file in $Files) {

    $matches = Select-String `
        -Path $file.FullName `
        -Pattern "NEXT_PUBLIC_[A-Za-z0-9_]+"

    foreach ($m in $matches) {

        $name = $m.Matches.Value

        if (
            $name -match "SECRET" -or
            $name -match "PRIVATE" -or
            $name -match "PASSWORD" -or
            $name -match "TOKEN" -or
            $name -match "API_KEY"
        ) {
            Add-Critical "Potential secret in NEXT_PUBLIC -> $($file.FullName):$($m.LineNumber)"
        }
    }
}

# ============================================================
# 16 - SECRET PATTERNS
# ============================================================

Write-Section "16. HARDCODED SECRET PATTERNS"

$SecretPatterns = @(
    "sk-[A-Za-z0-9]{20,}",
    "AKIA[0-9A-Z]{16}",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "ghp_[A-Za-z0-9]{20,}",
    "xoxb-[A-Za-z0-9-]+"
)

foreach ($pattern in $SecretPatterns) {

    $matches = $Files | Select-String -Pattern $pattern

    foreach ($m in $matches) {
        Add-Critical "Possible hardcoded secret -> $($m.Path):$($m.LineNumber)"
    }
}

# ============================================================
# 17 - SENTRY
# ============================================================

Write-Section "17. SENTRY"

foreach ($f in @(
    "sentry.client.config.ts",
    "sentry.server.config.ts",
    "sentry.edge.config.ts",
    "instrumentation.ts",
    "instrumentation-client.ts",
    "src/instrumentation.ts",
    "src/instrumentation-client.ts"
)) {

    if (Test-Path $f) {
        Write-Report "FOUND: $f"
    }
}

$SentryUsage = $Files | Select-String `
    -Pattern "@sentry/nextjs|withSentryConfig|Sentry\.capture|Sentry\.init"

Write-Report "Sentry references: $($SentryUsage.Count)"

foreach ($m in $SentryUsage) {
    Write-Report "$($m.Path):$($m.LineNumber): $($m.Line.Trim())"
}

# ============================================================
# 18 - EDGE RUNTIME
# ============================================================

Write-Section "18. EDGE RUNTIME"

$EdgeMatches = $Files | Select-String `
    -Pattern "runtime\s*=\s*['""]edge['""]"

foreach ($m in $EdgeMatches) {
    Add-Warning "Edge runtime detected -> $($m.Path):$($m.LineNumber)"
}

# ============================================================
# 19 - MIDDLEWARE / PROXY
# ============================================================

Write-Section "19. MIDDLEWARE / PROXY"

$MiddlewareFound = $false
$ProxyFound = $false

foreach ($f in @(
    "middleware.ts",
    "middleware.js",
    "src/middleware.ts",
    "src/middleware.js"
)) {

    if (Test-Path $f) {
        $MiddlewareFound = $true
        Add-Warning "middleware convention detected -> $f"
    }
}

foreach ($f in @(
    "proxy.ts",
    "proxy.js",
    "src/proxy.ts",
    "src/proxy.js"
)) {

    if (Test-Path $f) {
        $ProxyFound = $true
        Add-Info "proxy convention detected -> $f"
    }
}

if ($MiddlewareFound -and -not $ProxyFound) {
    Add-Warning "middleware.ts detected without proxy.ts"
}

# ============================================================
# 20 - PRISMA
# ============================================================

Write-Section "20. PRISMA"

if (Test-Path "prisma/schema.prisma") {

    Invoke-CommandAudit `
        "Prisma validate" `
        "npx prisma validate"

    $Models = Select-String `
        -Path "prisma/schema.prisma" `
        -Pattern "^model "

    Write-Report ""
    Write-Report "Models:"

    foreach ($m in $Models) {
        Write-Report "  $($m.Line.Trim())"
    }

    $Indexes = Select-String `
        -Path "prisma/schema.prisma" `
        -Pattern "@relation|@@index|@@unique|@unique"

    Write-Report ""
    Write-Report "Relations / indexes: $($Indexes.Count)"
}

# ============================================================
# 21 - PRISMA CLIENT
# ============================================================

Write-Section "21. PRISMA CLIENT INSTANCES"

$PrismaClients = $Files | Select-String `
    -Pattern "new\s+PrismaClient\s*\("

Write-Report "new PrismaClient() occurrences: $($PrismaClients.Count)"

foreach ($m in $PrismaClients) {
    Write-Report "$($m.Path):$($m.LineNumber): $($m.Line.Trim())"
}

if ($PrismaClients.Count -gt 3) {
    Add-Warning "Multiple PrismaClient instances detected"
}

# ============================================================
# 22 - CONSOLE
# ============================================================

Write-Section "22. CONSOLE USAGE"

$ConsoleMatches = $Files | Select-String `
    -Pattern "console\.(log|debug|info|warn|error)"

Write-Report "Console calls: $($ConsoleMatches.Count)"

$ConsoleMatches |
    Select-Object -First 500 |
    ForEach-Object {
        Write-Report "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

# ============================================================
# 23 - TODO
# ============================================================

Write-Section "23. TODO / FIXME"

$TodoMatches = $Files | Select-String `
    -Pattern "TODO|FIXME|HACK|XXX"

Write-Report "TODO/FIXME/HACK/XXX: $($TodoMatches.Count)"

$TodoMatches |
    Select-Object -First 500 |
    ForEach-Object {
        Write-Report "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

# ============================================================
# 24 - TESTS
# ============================================================

Write-Section "24. TEST INFRASTRUCTURE"

$Tests = Get-ChildItem `
    -Path . `
    -Recurse `
    -File `
    -Include *.test.ts,*.test.tsx,*.spec.ts,*.spec.tsx `
    -Exclude node_modules,.next,.git,dist,build

Write-Report "Test files: $($Tests.Count)"

if ($Tests.Count -eq 0) {
    Add-Warning "No tests detected"
}

# ============================================================
# 25 - GITIGNORE
# ============================================================

Write-Section "25. GITIGNORE"

if (Test-Path ".gitignore") {

    $Gitignore = Get-Content ".gitignore" -Raw

    foreach ($required in @(
        ".env",
        "node_modules",
        ".next"
    )) {

        if ($Gitignore -notmatch [regex]::Escape($required)) {
            Add-Warning ".gitignore may be missing: $required"
        }
    }

}
else {
    Add-Critical ".gitignore missing"
}

# ============================================================
# 26 - NPM AUDIT
# ============================================================

Write-Section "26. NPM SECURITY AUDIT"

Invoke-CommandAudit `
    "npm audit production" `
    "npm audit --omit=dev"

# ============================================================
# 27 - TYPESCRIPT
# ============================================================

Write-Section "27. TYPESCRIPT"

Invoke-CommandAudit `
    "TypeScript check" `
    "npm run type-check"

# ============================================================
# 28 - ESLINT
# ============================================================

Write-Section "28. ESLINT"

Invoke-CommandAudit `
    "ESLint" `
    "npm run lint"

# ============================================================
# 29 - FINAL SUMMARY
# ============================================================

Write-Section "29. FINAL SUMMARY"

Write-Report ""
Write-Report "CRITICAL ISSUES : $($Critical.Count)"
Write-Report "WARNINGS        : $($Warnings.Count)"
Write-Report "INFO / OK       : $($Info.Count)"
Write-Report ""

Write-Report "---------------- CRITICAL ----------------"

if ($Critical.Count -eq 0) {
    Write-Report "None detected."
}
else {
    $n = 1

    foreach ($item in $Critical) {
        Write-Report "$n. $item"
        $n++
    }
}

Write-Report ""
Write-Report "---------------- WARNINGS ----------------"

if ($Warnings.Count -eq 0) {
    Write-Report "None detected."
}
else {
    $n = 1

    foreach ($item in $Warnings) {
        Write-Report "$n. $item"
        $n++
    }
}

Write-Report ""
Write-Report "Report: $Report"

# ============================================================
# CONSOLE SUMMARY
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " MEMOLIB DEEP AUDIT FINISHED"
Write-Host "============================================================"
Write-Host ""
Write-Host "CRITICAL : $($Critical.Count)"
Write-Host "WARNINGS : $($Warnings.Count)"
Write-Host "OK/INFO  : $($Info.Count)"
Write-Host ""
Write-Host "REPORT:"
Write-Host $Report
Write-Host ""
Write-Host "To open:"
Write-Host "notepad `"$Report`""
Write-Host ""
```
