"""Script de test pour vérifier que les routes sont bien enregistrées"""
import sys
sys.path.insert(0, 'src/backend')

from app import app

print("\n🔍 ANALYSE DES ROUTES FLASK\n")
print("="*60)

all_routes = []
for rule in app.url_map.iter_rules():
    all_routes.append({
        'endpoint': rule.endpoint,
        'methods': ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'})),
        'path': rule.rule
    })

# Trier par path
all_routes.sort(key=lambda x: x['path'])

print(f"\n📊 Total routes: {len(all_routes)}\n")

# Rechercher routes email
email_routes = [r for r in all_routes if 'email' in r['path'].lower()]

if email_routes:
    print("✅ ROUTES EMAIL PROVISIONING TROUVÉES:\n")
    for route in email_routes:
        print(f"  {route['methods']:8} {route['path']:50} → {route['endpoint']}")
else:
    print("❌ AUCUNE ROUTE EMAIL PROVISIONING TROUVÉE!\n")
    print("Routes disponibles avec 'api':")
    api_routes = [r for r in all_routes if '/api/' in r['path']]
    for route in api_routes[:10]:
        print(f"  {route['methods']:8} {route['path']:50}")

print("\n" + "="*60)
