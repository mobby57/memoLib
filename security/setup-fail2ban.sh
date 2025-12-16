#!/bin/bash
# Configuration Fail2Ban pour iaPosteManager

echo "🛡️ Installation et configuration Fail2Ban..."

# Installation
apt-get install -y fail2ban

# Configuration jail personnalisé
cat > /etc/fail2ban/jail.d/iapostemanager.conf << 'EOF'
[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/iapostemanager-error.log
findtime = 600
bantime = 3600
maxretry = 10

[nginx-login]
enabled = true
filter = nginx-login
action = iptables-multiport[name=LoginLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/iapostemanager-access.log
findtime = 300
bantime = 7200
maxretry = 5

[nginx-badbots]
enabled = true
filter = nginx-badbots
action = iptables-multiport[name=BadBots, port="http,https", protocol=tcp]
logpath = /var/log/nginx/iapostemanager-access.log
findtime = 86400
bantime = 86400
maxretry = 2
EOF

# Filtre pour tentatives de login
cat > /etc/fail2ban/filter.d/nginx-login.conf << 'EOF'
[Definition]
failregex = ^<HOST> .* "POST /api/auth/login HTTP.*" (401|403|500)
ignoreregex =
EOF

# Filtre pour rate limiting
cat > /etc/fail2ban/filter.d/nginx-req-limit.conf << 'EOF'
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
EOF

# Démarrer Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

echo "✅ Fail2Ban configuré"
echo "📊 Status: fail2ban-client status"
