[CmdletBinding()]
param(
    [switch]$ApplyMigrations,
    [string]$ContainerName = 'memolib-audit-pg16',
    [string]$NetworkName = 'memolib-audit-net',
    [int]$HostPort = 55433
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$databaseName = 'memolib_audit'
$databaseUser = 'memolib_audit'
$databaseUrl = "postgresql://${databaseUser}@127.0.0.1:${HostPort}/${databaseName}?schema=public"

function Invoke-DockerChecked {
    param([string[]]$Arguments)

    $output = & docker @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed: docker $($Arguments -join ' ')`n$($output -join "`n")"
    }

    return $output
}

function Invoke-PsqlReadOnly {
    param([string]$Sql)

    Invoke-DockerChecked @(
        'exec', $ContainerName, 'psql',
        '-X', '-v', 'ON_ERROR_STOP=1', '-U', $databaseUser,
        '-d', $databaseName, '-A', '-t', '-F', '|', '-c', $Sql
    )
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is required.'
}

$containerJson = Invoke-DockerChecked @('inspect', $ContainerName)
$container = ($containerJson -join "`n") | ConvertFrom-Json
if (@($container).Count -ne 1) {
    throw "Expected exactly one container named $ContainerName."
}

if (-not $container.State.Running) {
    throw "Container $ContainerName is not running."
}
if ($container.Config.Image -ne 'postgres:16-alpine') {
    throw "Unexpected image '$($container.Config.Image)'; expected postgres:16-alpine."
}

$expectedEnv = @(
    "POSTGRES_USER=$databaseUser",
    "POSTGRES_DB=$databaseName",
    'POSTGRES_HOST_AUTH_METHOD=trust'
)
foreach ($entry in $expectedEnv) {
    if ($container.Config.Env -notcontains $entry) {
        throw "Container environment does not match the approved disposable target ($entry missing)."
    }
}

$tmpfsPath = '/var/lib/postgresql/data'
$tmpfsProperties = @($container.HostConfig.Tmpfs.PSObject.Properties.Name)
if ($tmpfsProperties -notcontains $tmpfsPath) {
    throw "Container does not use the expected temporary filesystem at $tmpfsPath."
}

$unexpectedMounts = @(
    $container.Mounts | Where-Object {
        $_.Destination -eq $tmpfsPath -and $_.Type -ne 'tmpfs'
    }
)
if ($unexpectedMounts.Count -gt 0) {
    throw 'A persistent mount is attached to the PostgreSQL data directory; refusing to continue.'
}

$publishedPorts = @($container.NetworkSettings.Ports.'5432/tcp')
if ($publishedPorts.Count -ne 1 -or
    $publishedPorts[0].HostIp -ne '127.0.0.1' -or
    $publishedPorts[0].HostPort -ne "$HostPort") {
    throw "Port binding is not restricted to 127.0.0.1:$HostPort."
}

$networkJson = Invoke-DockerChecked @('network', 'inspect', $NetworkName)
$network = ($networkJson -join "`n") | ConvertFrom-Json
if (@($network).Count -ne 1 -or -not $network[0].Internal) {
    throw "Network $NetworkName is missing or is not internal."
}
$containerNetworks = @($container.NetworkSettings.Networks.PSObject.Properties.Name)
if ($containerNetworks.Count -ne 1 -or $containerNetworks[0] -ne $NetworkName) {
    throw "Container must be attached exclusively to $NetworkName. Found: $($containerNetworks -join ', ')."
}

Write-Host "[PASS] Target verified: $ContainerName (postgres:16-alpine), loopback port $HostPort, tmpfs storage, internal network."

$readyOutput = Invoke-DockerChecked @(
    'exec', $ContainerName, 'pg_isready', '-U', $databaseUser, '-d', $databaseName
)
Write-Host "[PASS] PostgreSQL is accepting connections: $($readyOutput -join ' ')"

$identityOutput = Invoke-PsqlReadOnly @"
SELECT current_database(), current_user, split_part(current_setting('server_version'), '.', 1),
       pg_is_in_recovery();
"@
$identity = (($identityOutput -join '').Trim()).Split('|')
if ($identity.Count -lt 4 -or
    $identity[0] -ne $databaseName -or
    $identity[1] -ne $databaseUser -or
    $identity[2] -ne '16' -or
    $identity[3] -ne 'f') {
    throw "Database identity check failed; no migration was attempted. Result: $($identity -join '|')"
}
Write-Host "[PASS] Database identity verified: PostgreSQL 16, database/user $databaseName/$databaseUser, primary server."

if (-not $ApplyMigrations) {
    Write-Host '[INFO] Read-only preflight completed. No migration was run.'
    Write-Host 'To apply migrations to this verified disposable database, rerun with -ApplyMigrations.'
    exit 0
}

$prismaCli = Join-Path $projectRoot 'node_modules\.bin\prisma.cmd'
$schemaPath = Join-Path $projectRoot 'prisma\schema.prisma'
if (-not (Test-Path -LiteralPath $prismaCli -PathType Leaf)) {
    throw 'Local Prisma CLI was not found at node_modules\.bin\prisma.cmd.'
}

$previousDatabaseUrl = [Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
try {
    [Environment]::SetEnvironmentVariable('DATABASE_URL', $databaseUrl, 'Process')
    Push-Location $projectRoot
    try {
        Write-Host '[INFO] Applying pending Prisma migrations only to the verified temporary PostgreSQL 16 database.'
        & $prismaCli migrate deploy --schema $schemaPath
        if ($LASTEXITCODE -ne 0) {
            throw "prisma migrate deploy failed with exit code $LASTEXITCODE. The database was not reset or cleaned up."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    [Environment]::SetEnvironmentVariable('DATABASE_URL', $previousDatabaseUrl, 'Process')
}

$rlsQuery = @"
WITH expected(table_name) AS (
    VALUES
      ('Client'), ('Dossier'), ('Email'), ('Document'), ('LegalDeadline'), ('Facture'),
      ('Ecriture'), ('AuditLog'), ('CompteComptable'), ('Journal'), ('LigneEcriture'),
      ('MouvementBancaire'), ('DeclarationTVA'), ('MouvementCARPA'),
      ('Invitation'), ('AccessGrant'), ('UserConsent')
)
SELECT e.table_name,
       (c.oid IS NOT NULL),
       COALESCE(c.relrowsecurity, false),
       COALESCE(c.relforcerowsecurity, false),
       COUNT(p.oid),
       replace(encode(convert_to(
           COALESCE(string_agg(
               p.polname || ': ' || COALESCE(pg_get_expr(p.polqual, p.polrelid), '')
               || ' / ' || COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), ''),
               '; ' ORDER BY p.polname
           ), ''),
           'UTF8'
       ), 'base64'), E'\n', '')
FROM expected e
LEFT JOIN pg_class c ON c.relname = e.table_name AND c.relkind IN ('r', 'p')
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.oid IS NULL OR n.oid IS NOT NULL
GROUP BY e.table_name, c.oid, c.relrowsecurity, c.relforcerowsecurity
ORDER BY e.table_name;
"@

Write-Host ''
Write-Host 'RLS / schema inventory (table | exists | RLS | FORCE RLS | policy count | policy expressions):'
$rlsRows = Invoke-PsqlReadOnly $rlsQuery
$rlsFailures = @()
foreach ($row in $rlsRows) {
    $parts = "$row".Split('|', 6)
    if ($parts.Count -lt 6) {
        Write-Host "[WARN] Could not parse catalog row: $row"
        $rlsFailures += "$row"
        continue
    }

    $policyText = [Text.Encoding]::UTF8.GetString(
        [Convert]::FromBase64String($parts[5])
    )
    $parts[5] = $policyText
    Write-Host ($parts -join ' | ')
    if ($parts[1] -ne 't' -or $parts[2] -ne 't' -or $parts[3] -ne 't' -or [int]$parts[4] -eq 0) {
        $rlsFailures += $parts[0]
    }
}

if ($rlsFailures.Count -gt 0) {
    Write-Host "[NO-GO] Missing table/RLS/policy evidence: $($rlsFailures -join ', ')" -ForegroundColor Red
    exit 2
}

Write-Host '[PASS] All listed tables exist and have RLS enabled with at least one policy.'
Write-Host '[LIMIT] Catalog inspection does not prove cross-tenant isolation; test it using a non-owner runtime role and dedicated fixtures before production.'
exit 0
