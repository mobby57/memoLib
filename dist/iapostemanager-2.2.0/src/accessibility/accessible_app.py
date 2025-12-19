"""
SecureVault Accessible - Interface universelle pour illettrés, sourds, muets, aveugles
Application plug-and-play avec 3 boutons maximum
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import pyttsx3
import speech_recognition as sr
import threading
import json
import os
from datetime import datetime
import sqlite3

app = Flask(__name__)
app.secret_key = "accessible_vault_2024"

# Configuration TTS
tts_engine = pyttsx3.init()
tts_engine.setProperty('rate', 150)  # Vitesse lente pour accessibilité
tts_engine.setProperty('volume', 0.9)

# Configuration reconnaissance vocale
recognizer = sr.Recognizer()
microphone = sr.Microphone()

class AccessibleDatabase:
    def __init__(self):
        self.db_path = "data/accessible_users.db"
        self.init_db()
    
    def init_db(self):
        os.makedirs("data", exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                nom TEXT NOT NULL,
                prenom TEXT NOT NULL,
                email_personnel TEXT NOT NULL,
                email_auto TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                contenu_vocal TEXT,
                contenu_genere TEXT,
                destinataire TEXT,
                envoye BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_user(self, nom, prenom, email_personnel):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Générer email automatique
        email_auto = f"{prenom.lower()}.{nom.lower()}@securevault.app"
        
        cursor.execute('''
            INSERT INTO users (nom, prenom, email_personnel, email_auto)
            VALUES (?, ?, ?, ?)
        ''', (nom, prenom, email_personnel, email_auto))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return user_id, email_auto

db = AccessibleDatabase()

def speak_text(text):
    """Synthèse vocale pour accessibilité"""
    def _speak():
        tts_engine.say(text)
        tts_engine.runAndWait()
    
    thread = threading.Thread(target=_speak)
    thread.daemon = True
    thread.start()

def listen_voice():
    """Reconnaissance vocale"""
    try:
        with microphone as source:
            recognizer.adjust_for_ambient_noise(source)
        
        with microphone as source:
            audio = recognizer.listen(source, timeout=10)
        
        text = recognizer.recognize_google(audio, language='fr-FR')
        return text
    except:
        return None

@app.route('/')
def index():
    """Page d'accueil accessible"""
    if 'user_id' not in session:
        return redirect(url_for('inscription'))
    
    # Message de bienvenue vocal
    speak_text("Bienvenue dans SecureVault Accessible. Trois boutons disponibles : Créer un message, Joindre un document, ou Envoyer.")
    
    return render_template('accessible/index.html')

@app.route('/inscription', methods=['GET', 'POST'])
def inscription():
    """Inscription ultra simple"""
    if request.method == 'GET':
        speak_text("Inscription. Dites votre nom, prénom et email.")
        return render_template('accessible/inscription.html')
    
    if request.method == 'POST':
        data = request.get_json()
        
        if data.get('mode') == 'vocal':
            # Mode vocal pour illettrés/aveugles
            speak_text("Dites votre nom")
            nom = listen_voice()
            
            speak_text("Dites votre prénom")
            prenom = listen_voice()
            
            speak_text("Dites votre adresse email")
            email = listen_voice()
            
        else:
            # Mode texte pour sourds/muets
            nom = data.get('nom')
            prenom = data.get('prenom')
            email = data.get('email')
        
        if nom and prenom and email:
            user_id, email_auto = db.create_user(nom, prenom, email)
            session['user_id'] = user_id
            session['nom'] = nom
            session['prenom'] = prenom
            session['email_auto'] = email_auto
            
            speak_text(f"Inscription réussie. Votre adresse automatique est {email_auto}")
            
            return jsonify({
                'success': True,
                'message': f'Inscription réussie ! Votre email automatique : {email_auto}'
            })
        
        return jsonify({'success': False, 'message': 'Informations manquantes'})

@app.route('/creer_message', methods=['GET', 'POST'])
def creer_message():
    """Bouton 1: Créer un message"""
    if request.method == 'GET':
        speak_text("Création de message. Parlez ou choisissez un modèle.")
        return render_template('accessible/creer_message.html')
    
    data = request.get_json()
    mode = data.get('mode')
    
    if mode == 'vocal':
        speak_text("Parlez maintenant. Décrivez votre message.")
        contenu_vocal = listen_voice()
        
        if contenu_vocal:
            # IA génère le message structuré
            contenu_genere = generer_message_ia(contenu_vocal)
            
            # Lecture du message généré
            speak_text(f"Message généré : {contenu_genere}")
            
            session['message_actuel'] = {
                'vocal': contenu_vocal,
                'genere': contenu_genere
            }
            
            return jsonify({
                'success': True,
                'contenu_vocal': contenu_vocal,
                'contenu_genere': contenu_genere
            })
    
    elif mode == 'modele':
        modele = data.get('modele')
        modeles = {
            'demande': "Bonjour,\n\nJe souhaiterais obtenir des informations concernant...\n\nCordialement,",
            'plainte': "Madame, Monsieur,\n\nJe vous écris pour signaler un problème...\n\nEn attente de votre retour,",
            'confirmation': "Bonjour,\n\nJe confirme que la prestation a été effectuée...\n\nBonne journée,"
        }
        
        contenu = modeles.get(modele, "")
        speak_text(f"Modèle sélectionné : {modele}")
        
        session['message_actuel'] = {
            'vocal': f"Modèle {modele}",
            'genere': contenu
        }
        
        return jsonify({
            'success': True,
            'contenu_genere': contenu
        })
    
    return jsonify({'success': False})

def generer_message_ia(contenu_vocal):
    """Génération IA simplifiée du message"""
    # Simulation IA - remplacer par vraie IA
    templates = {
        'demande': f"Bonjour,\n\nJe souhaiterais obtenir des informations concernant : {contenu_vocal}\n\nPouvez-vous me renseigner ?\n\nCordialement,",
        'probleme': f"Madame, Monsieur,\n\nJe vous écris pour signaler le problème suivant : {contenu_vocal}\n\nMerci de votre attention.\n\nCordialement,",
        'merci': f"Bonjour,\n\n{contenu_vocal}\n\nJe vous remercie.\n\nBonne journée,"
    }
    
    # Détection simple du type
    if any(word in contenu_vocal.lower() for word in ['problème', 'plainte', 'dysfonctionnement']):
        return templates['probleme']
    elif any(word in contenu_vocal.lower() for word in ['merci', 'remercie', 'parfait']):
        return templates['merci']
    else:
        return templates['demande']

@app.route('/joindre_document', methods=['POST'])
def joindre_document():
    """Bouton 2: Joindre un document"""
    speak_text("Sélectionnez un document à joindre")
    
    if 'document' in request.files:
        file = request.files['document']
        if file.filename:
            # Sauvegarde simple
            filename = f"uploads/{session['user_id']}_{file.filename}"
            os.makedirs("uploads", exist_ok=True)
            file.save(filename)
            
            session['document_joint'] = filename
            speak_text("Document joint avec succès")
            
            return jsonify({'success': True, 'filename': file.filename})
    
    return jsonify({'success': False})

@app.route('/envoyer', methods=['POST'])
def envoyer():
    """Bouton 3: Envoyer le message"""
    data = request.get_json()
    destinataire = data.get('destinataire')
    
    if not destinataire:
        speak_text("Veuillez indiquer le destinataire")
        return jsonify({'success': False, 'message': 'Destinataire manquant'})
    
    message = session.get('message_actuel')
    if not message:
        speak_text("Aucun message à envoyer")
        return jsonify({'success': False, 'message': 'Aucun message créé'})
    
    # Validation vocale
    speak_text(f"Envoyer le message à {destinataire} ? Dites oui ou non.")
    
    if data.get('mode') == 'vocal':
        confirmation = listen_voice()
        if confirmation and 'oui' not in confirmation.lower():
            speak_text("Envoi annulé")
            return jsonify({'success': False, 'message': 'Envoi annulé'})
    
    # Simulation envoi email
    success = simuler_envoi_email(
        destinataire=destinataire,
        contenu=message['genere'],
        expediteur=session['email_auto']
    )
    
    if success:
        speak_text("Message envoyé avec succès")
        # Nettoyer la session
        session.pop('message_actuel', None)
        session.pop('document_joint', None)
        
        return jsonify({'success': True, 'message': 'Message envoyé !'})
    else:
        speak_text("Erreur lors de l'envoi")
        return jsonify({'success': False, 'message': 'Erreur envoi'})

def simuler_envoi_email(destinataire, contenu, expediteur):
    """Simulation envoi email - remplacer par vraie fonction"""
    # Log dans la base
    conn = sqlite3.connect(db.db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO messages (user_id, contenu_genere, destinataire, envoye)
        VALUES (?, ?, ?, ?)
    ''', (session['user_id'], contenu, destinataire, True))
    
    conn.commit()
    conn.close()
    
    return True

@app.route('/api/speak', methods=['POST'])
def api_speak():
    """API pour synthèse vocale"""
    data = request.get_json()
    text = data.get('text', '')
    speak_text(text)
    return jsonify({'success': True})

@app.route('/api/listen', methods=['POST'])
def api_listen():
    """API pour reconnaissance vocale"""
    text = listen_voice()
    return jsonify({'success': bool(text), 'text': text or ''})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)