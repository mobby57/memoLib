#!/usr/bin/env python3
"""Debug du chargement app_factory"""

try:
    print("=" * 60)
    print("Test import src.backend.app_factory...")
    from src.backend.app_factory import create_app
    print("✅ Import réussi")
    
    print("\nTest create_app()...")
    app = create_app()
    print("✅ App créée")
    
    print("\nTest routes enregistrées:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} -> {rule.endpoint}")
    
    print("\n✅ TOUT FONCTIONNE!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERREUR: {e}")
    import traceback
    traceback.print_exc()
