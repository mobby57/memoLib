#!/usr/bin/env python3
"""
Test Rapide du Microphone
Diagnostique les problèmes d'accès au microphone
"""

import sys
import os

def test_imports():
    """Teste les imports nécessaires"""
    print("📦 Test des dépendances...")
    
    try:
        import pyaudio
        print("  ✅ pyaudio installé")
    except ImportError:
        print("  ❌ pyaudio manquant")
        print("     → pip install pyaudio")
        return False
    
    try:
        import speech_recognition as sr
        print("  ✅ speech_recognition installé")
    except ImportError:
        print("  ❌ speech_recognition manquant")
        print("     → pip install SpeechRecognition")
        return False
    
    return True

def test_microphone_access():
    """Teste l'accès au microphone"""
    print("\n🎤 Test d'accès au microphone...")
    
    try:
        import pyaudio
        
        p = pyaudio.PyAudio()
        info = p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        
        devices = []
        for i in range(0, numdevices):
            device_info = p.get_device_info_by_host_api_device_index(0, i)
            if device_info.get('maxInputChannels') > 0:
                devices.append({
                    'index': i,
                    'name': device_info.get('name'),
                    'channels': device_info.get('maxInputChannels')
                })
        
        if not devices:
            print("  ❌ Aucun microphone détecté")
            print("\n🔧 Solutions:")
            print("  1. Vérifiez que votre microphone est branché")
            print("  2. Allez dans Paramètres Windows → Son → Entrée")
            print("  3. Vérifiez que le microphone est activé")
            return False
        
        print(f"  ✅ {len(devices)} microphone(s) trouvé(s):")
        for device in devices:
            print(f"     [{device['index']}] {device['name']} ({device['channels']} canaux)")
        
        # Test d'ouverture du stream
        print("\n🔄 Test d'ouverture du stream audio...")
        try:
            test_stream = p.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                input_device_index=devices[0]['index'],
                frames_per_buffer=1024
            )
            print("  ✅ Stream audio ouvert avec succès")
            test_stream.close()
        except OSError as e:
            print(f"  ❌ Impossible d'ouvrir le stream: {e}")
            print("\n🔧 Solutions:")
            print("  1. Fermez les applications utilisant le micro (Discord, Teams, etc.)")
            print("  2. Vérifiez les permissions Windows:")
            print("     Paramètres → Confidentialité → Microphone → Autoriser les applications")
            print("  3. Redémarrez le service audio:")
            print("     Restart-Service Audiosrv (en admin)")
            return False
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
            return False
        
        p.terminate()
        return True
        
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False

def test_realtime_service():
    """Teste le service de transcription"""
    print("\n🎙️ Test du service de transcription...")
    
    try:
        # Ajouter le chemin du projet
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        
        from src.services.realtime_transcription import RealtimeTranscription
        
        service = RealtimeTranscription()
        print("  ✅ Service de transcription initialisé")
        
        devices = service.list_microphones()
        if devices:
            print(f"  ✅ {len(devices)} périphérique(s) détecté(s)")
            
            # Test de démarrage
            result = service.start_recording(device_index=devices[0]['index'])
            if result.get('success'):
                print("  ✅ Enregistrement démarré avec succès")
                import time
                time.sleep(1)
                service.stop_recording()
                print("  ✅ Enregistrement arrêté avec succès")
                return True
            else:
                print(f"  ❌ Erreur: {result.get('error')}")
                return False
        else:
            print("  ❌ Aucun périphérique détecté par le service")
            return False
            
    except ImportError as e:
        print(f"  ⚠️ Service non disponible: {e}")
        print("     (Ceci est normal si le module n'est pas installé)")
        return True  # Ne pas bloquer
    except Exception as e:
        print(f"  ❌ Erreur: {e}")
        return False

def check_permissions():
    """Vérifie les permissions Windows"""
    print("\n🔐 Vérification des permissions...")
    
    try:
        import winreg
        
        # Vérifier la clé de registre des permissions micro
        key_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone"
        
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path)
            value, _ = winreg.QueryValueEx(key, "Value")
            winreg.CloseKey(key)
            
            if value == "Allow":
                print("  ✅ Permissions microphone: Autorisées")
            else:
                print("  ⚠️ Permissions microphone: Limitées")
                print("\n🔧 Solution:")
                print("  1. Win + I → Confidentialité et sécurité")
                print("  2. Microphone → Activer l'accès")
        except:
            print("  ⚠️ Impossible de vérifier les permissions")
            
    except ImportError:
        print("  ⚠️ Module winreg non disponible (non-Windows)")

def main():
    """Fonction principale"""
    print("=" * 60)
    print("🎤 DIAGNOSTIC MICROPHONE - IAPosteManager")
    print("=" * 60)
    
    success = True
    
    # Test 1: Imports
    if not test_imports():
        success = False
    
    # Test 2: Accès microphone
    if not test_microphone_access():
        success = False
    
    # Test 3: Permissions
    check_permissions()
    
    # Test 4: Service de transcription
    if not test_realtime_service():
        success = False
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TOUS LES TESTS RÉUSSIS")
        print("Le microphone devrait fonctionner correctement!")
    else:
        print("❌ CERTAINS TESTS ONT ÉCHOUÉ")
        print("Consultez GUIDE_MICROPHONE.md pour plus d'aide")
    print("=" * 60)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
