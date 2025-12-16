#!/bin/bash
# Audit de sécurité - iaPosteManager
# Scan OWASP ZAP + autres outils

URL="${1:-http://localhost:5000}"
REPORT_DIR="security-reports-$(date +%Y%m%d_%H%M%S)"

mkdir -p $REPORT_DIR

echo "🔒 Audit de sécurité - iaPosteManager"
echo "URL: $URL"
echo ""

# 1. Scan Headers HTTP
echo "[1/5] Analyse headers HTTP..."
curl -I $URL > ${REPORT_DIR}/headers.txt 2>&1
echo "✓ Headers sauvegardés"

# 2. SSL/TLS Test (si HTTPS)
if [[ $URL == https* ]]; then
    echo "[2/5] Test SSL/TLS..."
    if command -v testssl &> /dev/null; then
        testssl --quiet $URL > ${REPORT_DIR}/ssl-test.txt
        echo "✓ SSL testé"
    else
        echo "⚠️  testssl non installé (optionnel)"
    fi
else
    echo "[2/5] URL HTTP, skip SSL test"
fi

# 3. Scan Nikto
echo "[3/5] Scan Nikto..."
if command -v nikto &> /dev/null; then
    nikto -h $URL -output ${REPORT_DIR}/nikto.txt -Format txt
    echo "✓ Scan Nikto terminé"
else
    echo "⚠️  Nikto non installé"
    echo "   Installation: sudo apt-get install nikto"
fi

# 4. Scan Nmap
echo "[4/5] Scan ports..."
if command -v nmap &> /dev/null; then
    host=$(echo $URL | sed 's|.*://||' | sed 's|/.*||')
    nmap -sV $host > ${REPORT_DIR}/nmap.txt
    echo "✓ Scan ports terminé"
else
    echo "⚠️  Nmap non installé"
fi

# 5. Vérifications manuelles
echo "[5/5] Vérifications sécurité..."

cat > ${REPORT_DIR}/checklist.md << EOF
# 🔒 Security Checklist - iaPosteManager

## Headers de Sécurité
- [ ] Strict-Transport-Security (HSTS)
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] X-XSS-Protection
- [ ] Content-Security-Policy
- [ ] Referrer-Policy

## Configuration
- [ ] HTTPS activé
- [ ] Certificat SSL valide
- [ ] TLS 1.2+ uniquement
- [ ] Ciphers modernes uniquement

## Application
- [ ] Rate limiting actif
- [ ] Protection CSRF
- [ ] Validation des entrées
- [ ] Pas de secrets dans le code
- [ ] Logs sécurisés (pas de mots de passe)

## Base de données
- [ ] Parameterized queries
- [ ] Pas d'exposition directe
- [ ] Backups chiffrés

## Dépendances
- [ ] Packages à jour
- [ ] Pas de vulnérabilités connues (npm audit, pip-audit)

## Infrastructure
- [ ] Firewall configuré
- [ ] Ports inutiles fermés
- [ ] SSH avec clés uniquement
- [ ] Fail2ban actif

Date: $(date)
EOF

# Génération rapport HTML
cat > ${REPORT_DIR}/report.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Security Report - iaPosteManager</title>
    <style>
        body { font-family: Arial; margin: 40px; background: #f5f5f5; }
        h1 { color: #c0392b; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .good { color: #27ae60; }
        .warning { color: #f39c12; }
        .critical { color: #e74c3c; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔒 Security Audit Report</h1>
    <p>Date: $(date)</p>
    <p>URL: $URL</p>
    
    <div class="section">
        <h2>HTTP Headers</h2>
        <pre>$(cat ${REPORT_DIR}/headers.txt)</pre>
    </div>
    
    <div class="section">
        <h2>Security Checklist</h2>
        <pre>$(cat ${REPORT_DIR}/checklist.md)</pre>
    </div>
    
    <div class="section">
        <h2>Recommandations</h2>
        <ul>
            <li class="critical">⚠️  Activer HTTPS si pas encore fait</li>
            <li class="warning">⚠️  Configurer tous les security headers</li>
            <li class="good">✓ Scanner régulièrement (hebdomadaire)</li>
            <li class="good">✓ Maintenir les dépendances à jour</li>
        </ul>
    </div>
</body>
</html>
EOF

echo ""
echo "✅ Audit terminé!"
echo "📁 Rapports: $REPORT_DIR/"
echo "📄 Rapport HTML: $REPORT_DIR/report.html"
echo ""
