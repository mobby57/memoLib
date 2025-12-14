class VoiceInterface {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.init();
    }
    
    init() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'fr-FR';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceCommand(transcript);
            };
        }
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            this.isListening = true;
            this.recognition.start();
            this.speak("Je vous écoute");
        }
    }
    
    speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        this.synthesis.speak(utterance);
    }
    
    processVoiceCommand(command) {
        const lower = command.toLowerCase();
        
        if (lower.includes('composer') || lower.includes('écrire')) {
            window.location.href = '/composer';
            this.speak("Ouverture du compositeur");
        } else if (lower.includes('historique')) {
            window.location.href = '/history';
            this.speak("Ouverture de l'historique");
        } else if (lower.includes('aide')) {
            this.speak("Dites composer pour écrire un email, historique pour voir les emails envoyés");
        }
        
        this.isListening = false;
    }
}

const voice = new VoiceInterface();