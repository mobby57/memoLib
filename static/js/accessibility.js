// Module d'accessibilité frontend
class AccessibilityHelper {
    constructor() {
        this.mode = 'standard';
        this.ttsEnabled = false;
        this.voiceEnabled = false;
    }

    setMode(mode) {
        this.mode = mode;
        this.ttsEnabled = ['aveugle', 'complet'].includes(mode);
        this.voiceEnabled = ['sourd_muet', 'complet'].includes(mode);
        this.updateUI();
    }

    updateUI() {
        // Afficher/masquer boutons TTS et vocal
        document.querySelectorAll('.tts-button').forEach(btn => {
            btn.style.display = this.ttsEnabled ? 'inline-block' : 'none';
        });
        document.querySelectorAll('.voice-button').forEach(btn => {
            btn.style.display = this.voiceEnabled ? 'inline-block' : 'none';
        });
    }

    async lireTexte(texte) {
        if (!this.ttsEnabled) return;
        try {
            const response = await fetch('/api/accessibility/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({texte})
            });
            if (response.ok) {
                const blob = await response.blob();
                const audio = new Audio(URL.createObjectURL(blob));
                audio.play();
            }
        } catch (error) {
            console.error('Erreur TTS:', error);
        }
    }

    async transcrireVocal() {
        if (!this.voiceEnabled) return null;
        try {
            const response = await fetch('/api/accessibility/transcribe', {
                method: 'POST'
            });
            const data = await response.json();
            return data.success ? data.texte : null;
        } catch (error) {
            console.error('Erreur transcription:', error);
            return null;
        }
    }

    async feedbackVocal(message) {
        if (!this.ttsEnabled) return;
        await fetch('/api/accessibility/feedback', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message})
        });
    }

    initRaccourcisClavier() {
        // Ctrl+Shift+V: Activer transcription vocale
        document.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                const texte = await this.transcrireVocal();
                if (texte) {
                    document.getElementById('contexte').value = texte;
                    this.feedbackVocal('Transcription terminée');
                }
            }
            // Ctrl+Shift+L: Lire le contenu
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                const texte = document.getElementById('email_genere')?.value || '';
                this.lireTexte(texte);
            }
        });
    }

    ajouterBoutonsTTS() {
        // Ajouter boutons TTS sur tous les emails
        document.querySelectorAll('.email-content').forEach(elem => {
            const btn = document.createElement('button');
            btn.className = 'tts-button btn-sm';
            btn.innerHTML = '🔊 Lire';
            btn.onclick = () => this.lireTexte(elem.textContent);
            elem.parentElement.insertBefore(btn, elem);
        });
    }
}

// Initialisation
const accessibility = new AccessibilityHelper();
document.addEventListener('DOMContentLoaded', () => {
    accessibility.initRaccourcisClavier();
    accessibility.ajouterBoutonsTTS();
});
