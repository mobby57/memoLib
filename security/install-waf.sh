#!/bin/bash
# Installation ModSecurity + OWASP Core Rule Set

echo "🔒 Installation ModSecurity (WAF)..."

# Installation ModSecurity
apt-get update
apt-get install -y libmodsecurity3 modsecurity-crs

# Configuration ModSecurity
mkdir -p /etc/nginx/modsec
cd /etc/nginx/modsec

# Copier fichiers de config
cp /usr/share/modsecurity-crs/modsecurity.conf-recommended modsecurity.conf

# Activer ModSecurity
sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' modsecurity.conf

# Configuration principale
cat > main.conf << 'EOF'
Include modsecurity.conf
Include /usr/share/modsecurity-crs/crs-setup.conf
Include /usr/share/modsecurity-crs/rules/*.conf

# Règles personnalisées
SecRule ARGS "@contains <script" "id:1001,deny,status:403,msg:'XSS Attack Detected'"
SecRule ARGS "@contains ' OR " "id:1002,deny,status:403,msg:'SQL Injection Detected'"
SecRule ARGS "@contains UNION" "id:1003,deny,status:403,msg:'SQL Injection Detected'"

# Log des attaques
SecAuditEngine RelevantOnly
SecAuditLog /var/log/nginx/modsec_audit.log
SecAuditLogFormat JSON
EOF

# Recharger Nginx
systemctl reload nginx

echo "✅ ModSecurity installé et configuré"
echo "📋 Logs: /var/log/nginx/modsec_audit.log"
