#!/bin/bash
# Intégration du Dev Tracker dans l'application principale

echo "🔧 Intégration Dev Tracker..."

# 1. Installer dépendances
pip3 install --user flask-sqlalchemy

# 2. Créer le répertoire data si nécessaire
mkdir -p data

# 3. Intégrer le tracker dans l'app principale
cat >> complete_app.py << 'EOF'

# === DEV TRACKER INTEGRATION ===
from dev_tracker_app import DevTracker, DEV_DASHBOARD

# Initialiser le tracker
dev_tracker = DevTracker()

@app.route('/dev')
@require_auth
def dev_dashboard():
    """Dashboard de développement (admin seulement)"""
    if request.current_user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return DEV_DASHBOARD

@app.route('/api/dev/tasks')
@require_auth
def get_dev_tasks():
    """API pour récupérer les tâches de développement"""
    if request.current_user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    conn = sqlite3.connect(dev_tracker.db_path)
    cursor = conn.execute('SELECT * FROM tasks ORDER BY priority DESC, created_at DESC')
    tasks = []
    for row in cursor.fetchall():
        tasks.append({
            'id': row[0], 'title': row[1], 'description': row[2],
            'priority': row[3], 'status': row[4], 'category': row[5],
            'estimated_hours': row[6], 'actual_hours': row[7]
        })
    conn.close()
    return jsonify(tasks)

@app.route('/api/dev/stats')
@require_auth
def get_dev_stats():
    """Statistiques de développement"""
    if request.current_user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    conn = sqlite3.connect(dev_tracker.db_path)
    
    # Stats des tâches
    total_tasks = conn.execute('SELECT COUNT(*) FROM tasks').fetchone()[0]
    completed_tasks = conn.execute('SELECT COUNT(*) FROM tasks WHERE status = "done"').fetchone()[0]
    in_progress = conn.execute('SELECT COUNT(*) FROM tasks WHERE status = "progress"').fetchone()[0]
    
    # Stats des heures
    total_hours = conn.execute('SELECT SUM(hours_worked) FROM daily_logs').fetchone()[0] or 0
    avg_hours = conn.execute('SELECT AVG(hours_worked) FROM daily_logs').fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'tasks': {
            'total': total_tasks,
            'completed': completed_tasks,
            'in_progress': in_progress,
            'completion_rate': f"{(completed_tasks/total_tasks*100):.1f}%" if total_tasks > 0 else "0%"
        },
        'hours': {
            'total': total_hours,
            'average_daily': f"{avg_hours:.1f}",
            'productivity_score': min(100, int(avg_hours * 12.5))  # Score sur 100
        }
    })
EOF

# 4. Mettre à jour le WSGI pour inclure le tracker
cat > /var/www/sidmoro_pythonanywhere_com_wsgi.py << 'EOF'
import sys
sys.path.insert(0, '/home/sidmoro')

from complete_app import app as application

# Initialiser le dev tracker
from dev_tracker_app import DevTracker
tracker = DevTracker()
print("✅ Dev Tracker initialisé")
EOF

# 5. Tester l'intégration
python3 -c "
from complete_app import app
from dev_tracker_app import DevTracker
tracker = DevTracker()
print('✅ Dev Tracker intégré avec succès')
"

echo ""
echo "🎉 Intégration terminée!"
echo "========================"
echo ""
echo "📊 Nouvelles fonctionnalités:"
echo "• Dashboard développeur: /dev"
echo "• API tâches: /api/dev/tasks"
echo "• Statistiques: /api/dev/stats"
echo "• Logs quotidiens: /api/dev/logs"
echo ""
echo "🔐 Accès:"
echo "• Réservé aux admins uniquement"
echo "• Connexion requise"
echo ""
echo "🚀 URL: https://sidmoro.pythonanywhere.com/dev"