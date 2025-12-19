#!/bin/bash
# Quick deployment script for IAPosteManager

echo "🚀 IAPosteManager Quick Deploy"
echo "=============================="

# Check if we're on the server
if [ ! -f "/etc/os-release" ]; then
    echo "❌ This script should run on the server"
    exit 1
fi

# Create directory
sudo mkdir -p /opt/iapostemanager
sudo chown $USER:$USER /opt/iapostemanager
cd /opt/iapostemanager

# Clone or update
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/mobby57/iapm.com.git .
else
    echo "🔄 Updating code..."
    git pull origin main
fi

# Install Docker if needed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Install docker-compose if needed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Deploy
echo "🚀 Deploying application..."
sudo docker-compose -f docker-compose.prod.yml down || true
sudo docker-compose -f docker-compose.prod.yml up -d --build

# Wait and check
echo "⏳ Waiting for application to start..."
sleep 20

# Health check
echo "✅ Health check..."
if curl -f http://localhost:5000/api/health; then
    echo "🎉 Deployment successful!"
    echo "🌐 Application available at: http://$(curl -s ifconfig.me):5000"
else
    echo "❌ Health check failed"
    sudo docker-compose -f docker-compose.prod.yml logs
fi