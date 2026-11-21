[CmdletBinding()]
param([switch]$ConfirmDisposableAudit)

$ErrorActionPreference = 'Stop'
$containerName = 'memolib-audit-pg16'
$networkName = 'memolib-audit-net'
$port = '55433'
$root = Split-Path -Parent $PSScriptRoot

if (-not $ConfirmDisposableAudit) {
    throw 'Confirmation explicite requise : -ConfirmDisposableAudit.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI est requis.'
}

$json = & docker inspect $containerName 2>&1
if ($LASTEXITCODE -ne 0) { throw "Inspection du conteneur impossible : $($json -join "`n")" }
$container = (($json -join "`n") | ConvertFrom-Json)[0]
if (-not $container.State.Running -or $container.Config.Image -ne 'postgres:16-alpine') {
    throw 'Cible refusee : image ou etat inattendu.'
}
foreach ($required in @('POSTGRES_USER=memolib_audit', 'POSTGRES_DB=memolib_audit', 'POSTGRES_HOST_AUTH_METHOD=trust')) {
    if ($container.Config.Env -notcontains $required) { throw "Configuration manquante : $required" }
}
if (@($container.HostConfig.Tmpfs.PSObject.Properties.Name) -notcontains '/var/lib/postgresql/data') {
    throw 'Cible refusee : stockage PostgreSQL non temporaire.'
}
if (@($container.Mounts | Where-Object {
    $_.Destination -eq '/var/lib/postgresql/data' -and $_.Type -ne 'tmpfs'
}).Count -ne 0) {
    throw 'Cible refusee : montage persistant sur le repertoire des donnees.'
}
$networks = @($container.NetworkSettings.Networks.PSObject.Properties.Name)
if ($networks.Count -ne 1 -or $networks[0] -ne $networkName) {
    throw 'Cible refusee : le conteneur doit etre exclusivement sur le reseau interne d audit.'
}
$json = & docker network inspect $networkName 2>&1
if ($LASTEXITCODE -ne 0) { throw "Inspection reseau impossible : $($json -join "`n")" }
$network = (($json -join "`n") | ConvertFrom-Json)[0]
if (-not $network.Internal) { throw 'Cible refusee : reseau non interne.' }
$ports = @($container.NetworkSettings.Ports.'5432/tcp')
if ($ports.Count -ne 1 -or $ports[0].HostIp -ne '127.0.0.1' -or $ports[0].HostPort -ne $port) {
    throw 'Cible refusee : port PostgreSQL inattendu ou non limite a localhost.'
}

$query = "SELECT system_identifier::text FROM pg_control_system();"
$systemIdOutput = & docker exec $containerName psql -X -v ON_ERROR_STOP=1 -At `
    -U memolib_audit -d memolib_audit -c $query 2>&1
if ($LASTEXITCODE -ne 0) { throw "Identification PostgreSQL impossible : $($systemIdOutput -join "`n")" }
$systemId = ($systemIdOutput -join '').Trim()
if ($systemId -notmatch '^\d+$') { throw 'Identifiant PostgreSQL invalide.' }

$oldFlag = [Environment]::GetEnvironmentVariable('MEMOLIB_DISPOSABLE_RLS_TEST', 'Process')
$oldId = [Environment]::GetEnvironmentVariable('MEMOLIB_AUDIT_SYSTEM_ID', 'Process')
$oldUrl = [Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
$oldDirectUrl = [Environment]::GetEnvironmentVariable('DIRECT_URL', 'Process')
try {
    [Environment]::SetEnvironmentVariable('MEMOLIB_DISPOSABLE_RLS_TEST', '1', 'Process')
    [Environment]::SetEnvironmentVariable('MEMOLIB_AUDIT_SYSTEM_ID', $systemId, 'Process')
    $auditUrl = 'postgresql://memolib_audit@127.0.0.1:55433/memolib_audit?schema=public'
    [Environment]::SetEnvironmentVariable('DATABASE_URL', $auditUrl, 'Process')
    [Environment]::SetEnvironmentVariable('DIRECT_URL', $auditUrl, 'Process')
    Push-Location $root
    try {
        & npm.cmd run test -- --config tests/integration/vitest-disposable.config.ts
        if ($LASTEXITCODE -ne 0) { throw "Test applicatif echoue (code $LASTEXITCODE)." }
    } finally {
        Pop-Location
    }
} finally {
    [Environment]::SetEnvironmentVariable('MEMOLIB_DISPOSABLE_RLS_TEST', $oldFlag, 'Process')
    [Environment]::SetEnvironmentVariable('MEMOLIB_AUDIT_SYSTEM_ID', $oldId, 'Process')
    [Environment]::SetEnvironmentVariable('DATABASE_URL', $oldUrl, 'Process')
    [Environment]::SetEnvironmentVariable('DIRECT_URL', $oldDirectUrl, 'Process')
}
