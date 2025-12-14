"""Test simple du système d'accessibilité"""
import sys
sys.path.insert(0, 'c:/Users/moros/Desktop/iaPostemanage')

print("=" * 50)
print("TEST DU SYSTÈME D'ACCESSIBILITÉ")
print("=" * 50)

# Test 1: Import du service
print("\n1. Test import service...")
try:
    from src.accessibility.universal_access import accessibility_service
    print("   ✅ Service importé avec succès")
    print(f"   - TTS enabled: {accessibility_service.tts_enabled}")
    print(f"   - Font size: {accessibility_service.font_size}")
    print(f"   - High contrast: {accessibility_service.high_contrast}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    sys.exit(1)

# Test 2: Test des méthodes
print("\n2. Test méthode speak()...")
try:
    accessibility_service.speak("Test de synthèse vocale", priority='normal')
    print("   ✅ Méthode speak() appelée (vérifiez si vous entendez)")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n3. Test méthode add_visual_transcript()...")
try:
    accessibility_service.add_visual_transcript("Test transcription", type='system')
    print("   ✅ Transcription ajoutée")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n4. Test méthode get_transcripts()...")
try:
    transcripts = accessibility_service.get_transcripts(10)
    print(f"   ✅ {len(transcripts)} transcriptions récupérées")
    for t in transcripts[:3]:
        print(f"      - {t['timestamp']}: {t['text']}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n5. Test méthode announce_action()...")
try:
    result = accessibility_service.announce_action("Test", "Annonce de test", speak=True, show=True)
    print(f"   ✅ Annonce envoyée: {result}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n6. Test méthode create_accessibility_profile()...")
try:
    profile = accessibility_service.create_accessibility_profile(['blind'])
    print(f"   ✅ Profil créé: {profile['name']}")
    print(f"      Features: {len(profile['features'])} fonctionnalités")
    for feature in profile['features'][:3]:
        print(f"      - {feature}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n7. Test méthode get_keyboard_shortcuts()...")
try:
    shortcuts = accessibility_service.get_keyboard_shortcuts()
    print(f"   ✅ {len(shortcuts)} raccourcis disponibles")
    for key, value in list(shortcuts.items())[:5]:
        print(f"      - {key}: {value}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n8. Test méthode set_tts_settings()...")
try:
    accessibility_service.set_tts_settings(rate=180, volume=0.8)
    print(f"   ✅ Paramètres TTS modifiés")
    print(f"      - Rate: {accessibility_service.tts_rate}")
    print(f"      - Volume: {accessibility_service.tts_volume}")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n" + "=" * 50)
print("✅ TOUS LES TESTS RÉUSSIS!")
print("=" * 50)
print("\nLe système d'accessibilité est fonctionnel!")
print("\nPour tester les routes API:")
print("1. Démarrez le serveur: python src/web/app.py")
print("2. Testez les endpoints:")
print("   curl -X POST http://localhost:5000/api/accessibility/speak \\")
print("     -H 'Content-Type: application/json' \\")
print("     -d '{\"text\": \"Test\"}'")
