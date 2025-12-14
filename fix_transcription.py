#!/usr/bin/env python3
"""Script pour corriger les erreurs de transcription"""

import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(__file__))

def test_microphone():
    """Teste l'accès au microphone"""
    try:
        import pyaudio
        audio = pyaudio.PyAudio()
        
        print("=== TEST MICROPHONE ===")
        
        # Lister les périphériques
        devices = []
        for i in range(audio.get_device_count()):
            info = audio.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                devices.append({
                    'index': i,
                    'name': info['name'],
                    'channels': info['maxInputChannels']
                })
                print(f"Microphone {i}: {info['name']}")
        
        if not devices:
            print("ERREUR: Aucun microphone détecté")
            return False
        
        # Tester l'accès au microphone par défaut
        try:
            stream = audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=1024
            )
            stream.close()
            print("OK: Accès microphone réussi")
            return True
        except Exception as e:
            print(f"ERREUR: Impossible d'accéder au microphone: {e}")
            return False
        finally:
            audio.terminate()
            
    except ImportError:
        print("ERREUR: pyaudio non installé")
        return False

def test_speech_recognition():
    """Teste la reconnaissance vocale"""
    try:
        import speech_recognition as sr
        
        print("\n=== TEST RECONNAISSANCE VOCALE ===")
        
        recognizer = sr.Recognizer()
        
        # Test avec microphone
        try:
            with sr.Microphone() as source:
                print("Ajustement bruit ambiant...")
                recognizer.adjust_for_ambient_noise(source, duration=1)
                print("OK: Microphone accessible")
                return True
        except Exception as e:
            print(f"ERREUR: {e}")
            return False
            
    except ImportError:
        print("ERREUR: SpeechRecognition non installé")
        return False

def install_missing_deps():
    """Installe les dépendances manquantes"""
    print("\n=== INSTALLATION DEPENDANCES ===")
    
    try:
        import subprocess
        
        deps = ['pyaudio', 'SpeechRecognition']
        
        for dep in deps:
            try:
                __import__(dep.lower().replace('-', '_'))
                print(f"OK: {dep} déjà installé")
            except ImportError:
                print(f"Installation de {dep}...")
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', dep])
                print(f"OK: {dep} installé")
        
        return True
    except Exception as e:
        print(f"ERREUR installation: {e}")
        return False

def fix_permissions():
    """Suggestions pour corriger les permissions"""
    print("\n=== PERMISSIONS MICROPHONE ===")
    print("Si l'erreur persiste, vérifiez:")
    print("1. Paramètres Windows > Confidentialité > Microphone")
    print("2. Autoriser les applications à accéder au microphone")
    print("3. Redémarrer l'application")
    print("4. Essayer avec un autre navigateur")

def main():
    """Fonction principale de diagnostic"""
    print("IAPosteManager - Diagnostic Transcription")
    print("=" * 50)
    
    # Test des dépendances
    deps_ok = install_missing_deps()
    
    # Test microphone
    mic_ok = test_microphone()
    
    # Test reconnaissance vocale
    sr_ok = test_speech_recognition()
    
    # Résumé
    print("\n" + "=" * 50)
    print("RÉSUMÉ DIAGNOSTIC")
    print("=" * 50)
    
    if deps_ok and mic_ok and sr_ok:
        print("✅ TOUT EST OK - La transcription devrait fonctionner")
    else:
        print("❌ PROBLÈMES DÉTECTÉS:")
        if not deps_ok:
            print("  - Dépendances manquantes")
        if not mic_ok:
            print("  - Problème d'accès microphone")
        if not sr_ok:
            print("  - Problème reconnaissance vocale")
        
        fix_permissions()
    
    print("=" * 50)

if __name__ == '__main__':
    main()