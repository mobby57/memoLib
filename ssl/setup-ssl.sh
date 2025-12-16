#!/bin/bash
# Script d'installation SSL/HTTPS avec Let's Encrypt
# Usage: ./setup-ssl.sh votre-domaine.com

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

if [ -z "$DOMAIN" ]; then
    echo "❌ Usage: ./setup-ssl.sh votre-domaine.com"
    exit 1
fi

echo "🔒 Configuration SSL pour ${DOMAIN}"

# 1. Installation Certbot
echo "📦 Installation Certbot..."
if [ -f /etc/debian_version ]; then
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
elif [ -f /etc/redhat-release ]; then
    sudo yum install -y certbot python3-certbot-nginx
fi

# 2. Arrêt temporaire de Nginx si actif
echo "⏸️  Arrêt temporaire des services..."
docker-compose -f docker-compose.prod.yml --profile with-nginx down 2>/dev/null || true

# 3. Obtention du certificat
echo "📜 Obtention du certificat SSL..."
sudo certbot certonly --standalone \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    --preferred-challenges http

# 4. Copie des certificats pour Docker
echo "📋 Copie des certificats..."
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# 5. Configuration Nginx avec HTTPS
echo "⚙️  Configuration Nginx..."
cat > nginx/nginx-https.conf << EOF
events {
    worker_connections 1024;
}

http {
    # Redirection HTTP -> HTTPS
    server {
        listen 80;
        server_name ${DOMAIN} www.${DOMAIN};
        return 301 https://\$server_name\$request_uri;
    }

    # Configuration HTTPS
    server {
        listen 443 ssl http2;
        server_name ${DOMAIN} www.${DOMAIN};

        # Certificats SSL
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        # Configuration SSL moderne
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Gzip
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/json application/javascript;

        # Rate limiting
        limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;

        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend:5000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location / {
            proxy_pass http://backend:5000;
            proxy_set_header Host \$host;
        }
    }
}
EOF

# 6. Renouvellement automatique
echo "🔄 Configuration renouvellement automatique..."
sudo crontab -l 2>/dev/null | grep -v certbot > /tmp/crontab.tmp || true
echo "0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/${DOMAIN}/*.pem $(pwd)/nginx/ssl/ && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx'" >> /tmp/crontab.tmp
sudo crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp

# 7. Démarrage avec HTTPS
echo "🚀 Démarrage avec HTTPS..."
cp nginx/nginx-https.conf nginx/nginx.conf
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d

echo ""
echo "✅ Configuration SSL terminée!"
echo "🌐 Votre site est accessible sur: https://${DOMAIN}"
echo "🔒 Certificat valide 90 jours (renouvellement automatique)"
