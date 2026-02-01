#!/bin/bash
# Fix Flask health endpoints
# Ajoute automatiquement les routes manquantes au Flask backend

FILE="backend-python/app.py"
BACKUP="${FILE}.backup"

echo "📝 Adding Flask health endpoints..."

# Backup original
cp "$FILE" "$BACKUP"
echo "✓ Backup created: $BACKUP"

# Insert health routes after CORS configuration (après line 11)
cat > /tmp/flask_health.py << 'EOF'

@app.route('/', methods=['GET'])
def index():
    """Root health check endpoint"""
    return jsonify({
        'status': 'OK',
        'service': 'MemoLib Backend',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'CESEDA AI predictions',
            'Legal deadline management',
            'Billing & invoicing',
            'Document generation',
            'Email & SMS integration'
        ]
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'healthy': True,
        'service': 'api',
        'timestamp': datetime.now().isoformat()
    })

EOF

# Créer nouveau fichier avec health routes insérées
awk '
/^CORS\(app\)/ {
    print $0
    getline < "/tmp/flask_health.py"
    while ((getline line < "/tmp/flask_health.py") > 0) {
        print line
    }
    next
}
{ print }
' "$FILE" > /tmp/app_new.py

mv /tmp/app_new.py "$FILE"
echo "✓ Health endpoints added to $FILE"
echo ""
echo "Testing endpoints:"
echo "  curl http://localhost:5000/"
echo "  curl http://localhost:5000/api/health"
