# 🎤 Guide de Dépannage - Accès au Microphone

## ❌ Problème: "Impossible d'accéder au microphone"

### 🔍 Causes Possibles

1. **Permissions système non accordées**
2. **Microphone utilisé par une autre application**
3. **Pilotes audio manquants ou obsolètes**
4. **Service de transcription non démarré**

---

## ✅ Solutions

### 1. Vérifier les Permissions Windows

#### Windows 10/11

1. **Ouvrir les Paramètres**
   - Appuyez sur `Win + I`

2. **Aller dans Confidentialité et sécurité**
   - Cliquez sur `Confidentialité et sécurité`
   - Sélectionnez `Microphone`

3. **Activer l'accès au microphone**
   - ✅ "Autoriser les applications à accéder au microphone" → **ON**
   - ✅ "Autoriser les applications de bureau à accéder au microphone" → **ON**

4. **Permissions navigateur**
   - Chrome/Edge: Paramètres → Confidentialité et sécurité → Paramètres des sites → Microphone
   - Autoriser pour `localhost` ou `127.0.0.1`

---

### 2. Vérifier que le Microphone fonctionne

```powershell
# Tester l'enregistrement audio avec PowerShell
$duration = 3
Add-Type -AssemblyName System.Speech
$r = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$r.SetInputToDefaultAudioDevice()
Write-Host "Parlez maintenant pendant $duration secondes..."
Start-Sleep -Seconds $duration
Write-Host "✅ Si vous voyez ce message, le microphone est accessible"
```

---

### 3. Installer les Dépendances Python

```bash
# Installer pyaudio
pip install pyaudio

# Si erreur sur Windows, installer via wheel:
pip install pipwin
pipwin install pyaudio

# OU télécharger depuis:
# https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
```

---

### 4. Vérifier les Périphériques Audio

#### Avec Python

```python
import pyaudio

p = pyaudio.PyAudio()
info = p.get_host_api_info_by_index(0)
numdevices = info.get('deviceCount')

print("🎤 Microphones disponibles:")
for i in range(0, numdevices):
    device = p.get_device_info_by_host_api_device_index(0, i)
    if device.get('maxInputChannels') > 0:
        print(f"  [{i}] {device.get('name')}")

p.terminate()
```

#### Avec Windows

1. **Clic droit sur l'icône son** (barre des tâches)
2. **"Sons"** → Onglet **"Enregistrement"**
3. Vérifier que votre microphone:
   - ✅ Est activé
   - ✅ Est défini comme périphérique par défaut
   - ✅ Montre des barres vertes quand vous parlez

---

### 5. Fermer les Applications utilisant le Microphone

```powershell
# Vérifier les processus audio actifs
Get-Process | Where-Object {
    $_.ProcessName -match "discord|teams|zoom|skype|obs"
} | Select-Object ProcessName, Id
```

**Applications courantes à fermer:**
- Discord
- Microsoft Teams
- Zoom
- Skype
- OBS Studio
- Audacity

---

### 6. Redémarrer le Service Audio Windows

```powershell
# Exécuter en tant qu'Administrateur
Restart-Service Audiosrv
Restart-Service AudioEndpointBuilder
```

---

### 7. Mettre à jour les Pilotes Audio

1. **Gestionnaire de périphériques** (`Win + X` → Gestionnaire de périphériques)
2. **Développer "Entrées et sorties audio"**
3. **Clic droit sur votre microphone** → "Mettre à jour le pilote"
4. **Redémarrer** l'ordinateur

---

## 🧪 Test de l'Application

### Script de Test

Créez `test_microphone.py`:

```python
#!/usr/bin/env python3
"""Test d'accès au microphone"""

import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from src.services.realtime_transcription import RealtimeTranscription
    
    print("🎤 Test du service de transcription...")
    
    service = RealtimeTranscription()
    
    # Lister les microphones
    devices = service.list_microphones()
    
    if not devices:
        print("❌ Aucun microphone trouvé")
        sys.exit(1)
    
    print(f"✅ {len(devices)} microphone(s) trouvé(s):")
    for device in devices:
        print(f"  - [{device['index']}] {device['name']}")
    
    # Tester l'accès au premier microphone
    print("\n🔄 Test d'accès au microphone par défaut...")
    result = service.start_recording(device_index=devices[0]['index'])
    
    if result['success']:
        print("✅ Accès au microphone: OK")
        import time
        time.sleep(1)
        service.stop_recording()
        print("✅ Test terminé avec succès!")
    else:
        print(f"❌ Erreur: {result['error']}")
        sys.exit(1)
        
except ImportError as e:
    print(f"❌ Erreur d'import: {e}")
    print("\n📦 Installer les dépendances:")
    print("  pip install pyaudio SpeechRecognition")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erreur: {e}")
    sys.exit(1)
```

```bash
# Lancer le test
python test_microphone.py
```

---

## 🌐 Permissions Navigateur

### Chrome / Edge

1. **Cliquer sur l'icône de cadenas** (à gauche de l'URL)
2. **Paramètres du site**
3. **Microphone** → **Autoriser**

### Ou via les Paramètres

1. `chrome://settings/content/microphone`
2. Ajouter `http://localhost:3000` à la liste des sites autorisés
3. Ajouter `http://localhost:5000` à la liste des sites autorisés

---

## 🔧 Configuration Vite.js (Frontend React)

Assurez-vous que `vite.config.js` permet HTTPS en local:

```javascript
// vite.config.js
export default {
  server: {
    https: false, // Mettre true si nécessaire
    host: 'localhost',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
}
```

---

## 📋 Checklist de Dépannage

- [ ] Permissions Windows activées
- [ ] Permissions navigateur accordées
- [ ] Microphone par défaut configuré
- [ ] Aucune autre application n'utilise le micro
- [ ] PyAudio installé correctement
- [ ] Service audio Windows actif
- [ ] Backend Flask démarré (`python src/web/app.py`)
- [ ] Frontend démarré (`npm run dev`)
- [ ] Connexion WebSocket établie

---

## 🆘 Commandes de Diagnostic

### Vérifier l'installation PyAudio

```bash
python -c "import pyaudio; print('✅ PyAudio OK')"
```

### Vérifier SpeechRecognition

```bash
python -c "import speech_recognition; print('✅ SpeechRecognition OK')"
```

### Tester l'API Backend

```bash
# Backend doit être démarré
curl http://localhost:5000/api/voice/devices
```

### Logs Backend

```bash
# Démarrer avec logs verbeux
$env:FLASK_DEBUG="1"
python src/web/app.py
```

---

## ⚠️ Erreurs Courantes

### 1. "OSError: [Errno -9996] Invalid input device"

**Cause:** Microphone non trouvé ou index incorrect

**Solution:**
```python
# Lister tous les devices et utiliser le bon index
python -c "import pyaudio; p = pyaudio.PyAudio(); [print(f'{i}: {p.get_device_info_by_host_api_device_index(0,i).get(\"name\")}') for i in range(p.get_device_count())]"
```

### 2. "ModuleNotFoundError: No module named 'pyaudio'"

**Solution:**
```bash
pip install pyaudio
# OU
pipwin install pyaudio
```

### 3. "Permission denied" ou "Access denied"

**Solution:**
- Lancer PowerShell en **Administrateur**
- Vérifier les permissions Windows (voir section 1)

### 4. WebSocket non connecté

**Solution:**
```bash
# Vérifier que Flask-SocketIO est installé
pip install flask-socketio python-socketio

# Dans le terminal backend, chercher:
# "WebSocket connection established"
```

---

## 🎯 Configuration Recommandée

### Backend (`src/web/app.py`)

```python
# Vérifier que ces lignes sont présentes:
from flask_socketio import SocketIO

socketio = SocketIO(app, cors_allowed_origins="*")

if HAS_REALTIME_TRANSCRIPTION:
    from src.services.realtime_transcription import RealtimeTranscriptionWebSocket
    realtime_transcription = RealtimeTranscriptionWebSocket(socketio)
```

### Frontend (`VoiceTranscription.jsx`)

```javascript
// Vérifier la connexion WebSocket
const socketRef = useRef(null);

useEffect(() => {
  socketRef.current = io(window.location.origin, {
    transports: ['websocket', 'polling']
  });

  socketRef.current.on('connect', () => {
    console.log('✅ WebSocket connecté');
  });
}, []);
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide:

1. **Vérifier les logs** dans la console du navigateur (F12)
2. **Vérifier les logs** du backend Python
3. **Créer un rapport** avec:
   - Version Windows
   - Version Python (`python --version`)
   - Résultat de `test_microphone.py`
   - Screenshots des erreurs

---

## ✅ Configuration Qui Fonctionne

```
Windows 10/11 ✅
Python 3.8+ ✅
PyAudio 0.2.11+ ✅
SpeechRecognition 3.8+ ✅
Flask-SocketIO 5.0+ ✅
Microphone USB/Intégré ✅
Chrome/Edge (dernière version) ✅
```

---

**Date de création:** 11 Décembre 2025
**Testé sur:** Windows 10/11, Python 3.11
