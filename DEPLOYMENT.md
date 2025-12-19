# 🚀 Deployment Setup Instructions

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

### Required Secrets:
```
HOST = your-server-ip-address (e.g., 192.168.1.100)
USERNAME = your-server-username (e.g., ubuntu, root)
SSH_KEY = your-private-ssh-key-content
```

### SSH Key Generation:
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "deployment@iapostemanager"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub username@your-server-ip

# Copy private key content for GitHub secret
cat ~/.ssh/id_rsa
```

## Server Requirements:
- Ubuntu 20.04+ or similar Linux distribution
- Docker and docker-compose installed
- SSH access enabled
- Port 5000 open for the application

## Manual Deployment (Alternative):
```bash
# On your server
cd /opt
sudo mkdir iapostemanager
sudo chown $USER:$USER iapostemanager
cd iapostemanager

# Clone repository
git clone https://github.com/mobby57/iapm.com.git .

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
curl http://localhost:5000/api/health
```

## Troubleshooting:
- Ensure SSH key has correct permissions (600)
- Verify server firewall allows SSH (port 22)
- Check Docker is installed and running
- Confirm port 5000 is available

## Production URLs:
- Application: http://your-server-ip:5000
- Health Check: http://your-server-ip:5000/api/health
- API Documentation: http://your-server-ip:5000/api