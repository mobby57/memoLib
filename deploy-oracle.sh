#!/bin/bash
# MemoLib - Deploiement Oracle Cloud Free Tier
# Usage: ./deploy-oracle.sh <IP> <CLE_SSH>

set -e
IP=$1; KEY=$2

if [ -z "$IP" ] || [ -z "$KEY" ]; then
    echo "Usage: ./deploy-oracle.sh <IP> <CLE_SSH>"
    exit 1
fi

SSH="ssh -i $KEY -o StrictHostKeyChecking=no ubuntu@$IP"
SCP="scp -i $KEY -o StrictHostKeyChecking=no"

echo "🚀 Deploiement sur $IP..."

$SSH "mkdir -p ~/memolib"

echo "📤 Envoi des fichiers..."
$SCP Dockerfile docker-compose.oracle.yml MemoLib.Api.csproj Program.cs appsettings.json ubuntu@$IP:~/memolib/
$SSH "mv ~/memolib/docker-compose.oracle.yml ~/memolib/docker-compose.yml"

for dir in Controllers Models Data Services Migrations Middleware Authorization Hubs Validators Extensions Configuration Contracts Properties wwwroot; do
    [ -d "$dir" ] && $SCP -r $dir ubuntu@$IP:~/memolib/
done

$SSH "cd ~/memolib && [ ! -f .env ] && echo 'JWT_SECRET_KEY='$(openssl rand -base64 48) > .env || true"
$SSH "cd ~/memolib && docker compose down 2>/dev/null; docker compose build && docker compose up -d"

sleep 10
$SSH "curl -sf http://localhost:5078/health && echo ' ✅ En ligne!' || echo ' ❌ Erreur'"

echo "🌐 http://$IP:5078/demo.html"
