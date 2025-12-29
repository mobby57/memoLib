"""
Dashboard Simple MVP IA Poste Manager
======================================

Interface web basique pour :
- Visualiser les workspaces actifs
- Voir les statistiques
- Tester l'API
"""

from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import json
import os
from pathlib import Path

app = Flask(__name__)

# Chemins des données
DATA_DIR = Path(__file__).parent.parent.parent / "data"
AUDIT_TRAIL_FILE = DATA_DIR / "audit_trail.json"


def load_audit_trail():
    """Charge l'audit trail"""
    try:
        if AUDIT_TRAIL_FILE.exists():
            with open(AUDIT_TRAIL_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('events', [])
    except Exception as e:
        print(f"Error loading audit trail: {e}")
    return []


def get_statistics():
    """Calcule les statistiques depuis l'audit trail"""
    
    events = load_audit_trail()
    
    # Stats par type d'événement
    event_types = {}
    for event in events:
        event_type = event.get('event_type', 'unknown')
        event_types[event_type] = event_types.get(event_type, 0) + 1
    
    # Stats par jour (derniers 7 jours)
    now = datetime.utcnow()
    daily_stats = {}
    for i in range(7):
        date = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        daily_stats[date] = 0
    
    for event in events:
        timestamp = event.get('timestamp', '')
        if timestamp:
            date = timestamp.split('T')[0]
            if date in daily_stats:
                daily_stats[date] += 1
    
    return {
        'total_events': len(events),
        'event_types': event_types,
        'daily_stats': daily_stats,
        'last_event': events[-1] if events else None
    }


@app.route('/')
def dashboard():
    """Page principale du dashboard"""
    return render_template('dashboard.html')


@app.route('/api/dashboard/stats')
def api_stats():
    """API : Statistiques pour le dashboard"""
    
    stats = get_statistics()
    
    return jsonify({
        'success': True,
        'stats': stats,
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/dashboard/events')
def api_events():
    """API : Liste des événements récents"""
    
    limit = int(request.args.get('limit', 50))
    events = load_audit_trail()
    
    # Retourner les N derniers événements
    recent_events = events[-limit:] if len(events) > limit else events
    recent_events.reverse()  # Plus récent en premier
    
    return jsonify({
        'success': True,
        'events': recent_events,
        'total': len(events)
    })


@app.route('/api/dashboard/health')
def api_health():
    """API : Health check"""
    
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0-mvp'
    })


if __name__ == '__main__':
    port = int(os.getenv('DASHBOARD_PORT', 8080))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🎯 Dashboard démarré sur http://localhost:{port}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
