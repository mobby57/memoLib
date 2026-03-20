param(
    [switch]$Configure,
    [switch]$CreateVM
)

$ErrorActionPreference = "Stop"

# --- ETAPE 1: Configurer OCI CLI ---
if ($Configure) {
    Write-Host "Configuration OCI CLI..." -ForegroundColor Cyan
    Write-Host "Tu auras besoin de :" -ForegroundColor Yellow
    Write-Host "  - Ton OCID utilisateur (Profile, User Settings, OCID)" -ForegroundColor Yellow
    Write-Host "  - Ton OCID tenancy (Administration, Tenancy Details, OCID)" -ForegroundColor Yellow
    Write-Host "  - Ta region (ex: eu-marseille-1 ou eu-frankfurt-1)" -ForegroundColor Yellow
    Write-Host ""
    oci setup config
    Write-Host "Configuration terminee." -ForegroundColor Green
    Write-Host "Upload la cle API dans Oracle Cloud :" -ForegroundColor Yellow
    Write-Host "  Console - Profile - API Keys - Add API Key - Paste Public Key" -ForegroundColor Yellow
    $pubKeyPath = "$env:USERPROFILE\.oci\oci_api_key_public.pem"
    if (Test-Path $pubKeyPath) {
        Get-Content $pubKeyPath -Raw | Write-Host
    }
    Write-Host ""
    Write-Host "Puis relance avec -CreateVM" -ForegroundColor Green
    exit
}

# --- ETAPE 2: Creer la VM ---
if ($CreateVM) {
    Write-Host "Creation de la VM MemoLib..." -ForegroundColor Cyan

    $tenancy = oci iam tenancy get --query "data.id" --raw-output
    Write-Host "Compartment: $tenancy"

    $region = oci iam region-subscription list --query "data[0].`"region-name`"" --raw-output
    Write-Host "Region: $region"

    Write-Host "Recherche image Ubuntu 22.04 ARM..."
    $imageId = oci compute image list --compartment-id $tenancy --operating-system "Canonical Ubuntu" --operating-system-version "22.04" --shape "VM.Standard.A1.Flex" --sort-by TIMECREATED --sort-order DESC --query "data[0].id" --raw-output
    Write-Host "Image: $imageId"

    $vcnId = oci network vcn list --compartment-id $tenancy --query "data[0].id" --raw-output

    if ([string]::IsNullOrWhiteSpace($vcnId)) {
        Write-Host "Creation VCN..."
        $vcnId = oci network vcn create --compartment-id $tenancy --cidr-block "10.0.0.0/16" --display-name "memolib-vcn" --query "data.id" --raw-output

        $igwId = oci network internet-gateway create --compartment-id $tenancy --vcn-id $vcnId --is-enabled true --display-name "memolib-igw" --query "data.id" --raw-output

        $rtId = oci network route-table list --compartment-id $tenancy --vcn-id $vcnId --query "data[0].id" --raw-output
        $routeRules = '[{\"destination\":\"0.0.0.0/0\",\"networkEntityId\":\"' + $igwId + '\"}]'
        oci network route-table update --rt-id $rtId --route-rules $routeRules --force

        $subnetId = oci network subnet create --compartment-id $tenancy --vcn-id $vcnId --cidr-block "10.0.1.0/24" --display-name "memolib-subnet" --query "data.id" --raw-output
    }
    else {
        $subnetId = oci network subnet list --compartment-id $tenancy --vcn-id $vcnId --query "data[0].id" --raw-output
    }
    Write-Host "Subnet: $subnetId"

    $sshDir = "$env:USERPROFILE\.ssh"
    $sshKey = "$sshDir\memolib-oracle"
    if (-not (Test-Path $sshKey)) {
        Write-Host "Generation cle SSH..."
        if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir -Force | Out-Null }
        ssh-keygen -t rsa -b 4096 -f $sshKey -N "" -q
    }

    $ad = oci iam availability-domain list --compartment-id $tenancy --query "data[0].name" --raw-output
    Write-Host "Availability Domain: $ad"

    Write-Host "Creation VM (VM.Standard.A1.Flex - 2 OCPU, 4Go RAM)..." -ForegroundColor Cyan
    $shapeConfig = '{\"ocpus\":2,\"memoryInGBs\":4}'
    $instanceId = oci compute instance launch --compartment-id $tenancy --availability-domain $ad --shape "VM.Standard.A1.Flex" --shape-config $shapeConfig --image-id $imageId --subnet-id $subnetId --display-name "memolib" --ssh-authorized-keys-file "$sshKey.pub" --assign-public-ip true --query "data.id" --raw-output

    Write-Host "Attente demarrage VM..."
    oci compute instance get --instance-id $instanceId --wait-for-state RUNNING | Out-Null

    $vnicId = oci compute instance list-vnics --instance-id $instanceId --query "data[0].id" --raw-output
    $publicIp = oci network vnic get --vnic-id $vnicId --query "data.`"public-ip`"" --raw-output

    Write-Host "Ouverture port 5078..."
    $slId = oci network security-list list --compartment-id $tenancy --vcn-id $vcnId --query "data[0].id" --raw-output
    $ingressRules = '[{\"protocol\":\"6\",\"source\":\"0.0.0.0/0\",\"tcpOptions\":{\"destinationPortRange\":{\"min\":5078,\"max\":5078}}}]'
    oci network security-list update --security-list-id $slId --ingress-security-rules $ingressRules --force | Out-Null

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "VM CREEE AVEC SUCCES!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "IP Publique : $publicIp" -ForegroundColor Cyan
    Write-Host "Cle SSH     : $sshKey" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaine etape :" -ForegroundColor Yellow
    Write-Host "  ssh -i $sshKey ubuntu@$publicIp" -ForegroundColor White

    @{ IP = $publicIp; SSHKey = $sshKey; InstanceId = $instanceId } | ConvertTo-Json | Set-Content "oracle-vm-info.json"
    Write-Host "Infos sauvegardees dans oracle-vm-info.json"
    exit
}

# --- Aide ---
Write-Host "MemoLib - Deploiement Oracle Cloud Free Tier" -ForegroundColor Cyan
Write-Host ""
Write-Host "Utilisation (dans cet ordre) :" -ForegroundColor Yellow
Write-Host "  .\setup-oracle.ps1 -Configure      # 1. Configurer OCI CLI"
Write-Host "  .\setup-oracle.ps1 -CreateVM        # 2. Creer la VM gratuite"
Write-Host ""
Write-Host "Ensuite, deployer MemoLib :"
Write-Host "  bash deploy-oracle.sh <IP> <CLE_SSH>"
