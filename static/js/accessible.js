/**
 * SecureVault Accessible - JavaScript pour interface universelle
 * Navigation vocale et interactions simplifiées
 */

// Variables globales
let currentMessage = null;
let isListening = false;
let speechSynthesis = window.speechSynthesis;
let speechRecognition = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeSpeechRecognition();
    setupKeyboardNavigation();
    setupAccessibilityFeatures();
});

// Configuration reconnaissance vocale
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        speechRecognition = new webkitSpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = false;
        speechRecognition.lang = 'fr-FR';
    } else if ('SpeechRecognition' in window) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = false;
        speechRecognition.lang = 'fr-FR';
    }
}

// Synthèse vocale
async function speakText(text) {
    return new Promise((resolve) => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.9;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        speechSynthesis.speak(utterance);
    });
}

// Reconnaissance vocale
function listenForSpeech() {
    return new Promise((resolve, reject) => {
        if (!speechRecognition) {
            reject('Reconnaissance vocale non supportée');
            return;
        }
        
        speechRecognition.onresult = function(event) {
            const result = event.results[0][0].transcript;
            resolve(result);
        };
        
        speechRecognition.onerror = function(event) {
            reject('Erreur reconnaissance vocale: ' + event.error);
        };
        
        speechRecognition.onend = function() {
            isListening = false;
        };
        
        isListening = true;
        speechRecognition.start();
    });
}

// Navigation principale
function speakPage() {
    const pageTitle = document.querySelector('h1').textContent;
    const statusText = document.getElementById('statusText')?.textContent || '';
    speakText(`${pageTitle}. ${statusText}. Utilisez les boutons ou dites "aide" pour obtenir de l'aide.`);
}

// Bouton 1: Créer message
async function creerMessage() {
    await speakText("Création d'un nouveau message. Choisissez le mode vocal ou un modèle.");
    updateStatus("Création de message en cours...");
    showModal('messageModal');
}

// Bouton 2: Joindre fichier
async function joindreFichier() {
    await speakText("Sélection d'un fichier à joindre.");
    updateStatus("Sélection de fichier...");
    
    // Créer input file invisible
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            await uploadFile(file);
        }
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Bouton 3: Envoyer
async function envoyerMessage() {
    if (!currentMessage) {
        await speakText("Aucun message à envoyer. Créez d'abord un message.");
        updateStatus("Aucun message créé");
        return;
    }
    
    await speakText("Préparation de l'envoi du message.");
    updateStatus("Préparation envoi...");
    showModal('sendModal');
    
    // Afficher l'aperçu du message
    document.getElementById('finalPreview').innerHTML = `
        <h3>📄 Votre message :</h3>
        <div class="preview-text">${currentMessage.contenu_genere}</div>
    `;
}

// Gestion des modales
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}

function closeSendModal() {
    document.getElementById('sendModal').style.display = 'none';
}

// Création de message vocal
async function startVoiceMessage() {
    try {
        await speakText("Parlez maintenant. Décrivez votre message.");
        updateStatus("Écoute en cours...");
        
        const voiceText = await listenForSpeech();
        
        if (voiceText) {
            document.getElementById('voiceResult').textContent = `Vous avez dit: "${voiceText}"`;
            
            await speakText("Message reçu. Génération du texte en cours.");
            updateStatus("Génération IA...");
            
            // Appel API pour génération IA
            const response = await fetch('/creer_message', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    mode: 'vocal',
                    contenu: voiceText
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                currentMessage = {
                    contenu_vocal: result.contenu_vocal,
                    contenu_genere: result.contenu_genere
                };
                
                showMessagePreview(result.contenu_genere);
                await speakText("Message généré avec succès. Voulez-vous l'écouter ?");
            } else {
                await speakText("Erreur lors de la génération du message.");
            }
        }
    } catch (error) {
        console.error('Erreur message vocal:', error);
        await speakText("Erreur lors de l'enregistrement vocal.");
    }
}

// Utilisation de modèles
async function useTemplate(templateType) {
    await speakText(`Modèle ${templateType} sélectionné.`);
    updateStatus("Application du modèle...");
    
    try {
        const response = await fetch('/creer_message', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                mode: 'modele',
                modele: templateType
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentMessage = {
                contenu_vocal: `Modèle ${templateType}`,
                contenu_genere: result.contenu_genere
            };
            
            showMessagePreview(result.contenu_genere);
            await speakText("Modèle appliqué. Voulez-vous l'écouter ?");
        }
    } catch (error) {
        console.error('Erreur modèle:', error);
        await speakText("Erreur lors de l'application du modèle.");
    }
}

// Affichage aperçu message
function showMessagePreview(content) {
    document.getElementById('messagePreview').style.display = 'block';
    document.getElementById('previewText').textContent = content;
    updateStatus("Message prêt à être envoyé");
}

// Lecture du message
async function readMessage() {
    if (currentMessage) {
        await speakText("Lecture du message: " + currentMessage.contenu_genere);
    }
}

// Validation du message
async function validateMessage() {
    if (currentMessage) {
        await speakText("Message validé et prêt à être envoyé.");
        closeModal();
        updateStatus("Message validé - Prêt à envoyer");
    }
}

// Upload de fichier
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('document', file);
    
    try {
        const response = await fetch('/joindre_document', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            await speakText(`Fichier ${result.filename} joint avec succès.`);
            updateStatus(`Fichier joint: ${result.filename}`);
        } else {
            await speakText("Erreur lors du téléchargement du fichier.");
        }
    } catch (error) {
        console.error('Erreur upload:', error);
        await speakText("Erreur lors du téléchargement.");
    }
}

// Dictée du destinataire
async function speakRecipient() {
    try {
        await speakText("Dites l'adresse email du destinataire.");
        const email = await listenForSpeech();
        
        if (email) {
            document.getElementById('recipient').value = email;
            await speakText(`Destinataire: ${email}`);
        }
    } catch (error) {
        console.error('Erreur dictée destinataire:', error);
        await speakText("Erreur lors de la dictée.");
    }
}

// Envoi final
async function sendFinalMessage() {
    const recipient = document.getElementById('recipient').value;
    
    if (!recipient) {
        await speakText("Veuillez indiquer un destinataire.");
        return;
    }
    
    if (!currentMessage) {
        await speakText("Aucun message à envoyer.");
        return;
    }
    
    try {
        await speakText("Confirmation d'envoi. Dites oui pour confirmer ou non pour annuler.");
        
        const confirmation = await listenForSpeech();
        
        if (confirmation && confirmation.toLowerCase().includes('oui')) {
            updateStatus("Envoi en cours...");
            
            const response = await fetch('/envoyer', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    destinataire: recipient,
                    mode: 'vocal'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await speakText("Message envoyé avec succès !");
                updateStatus("Message envoyé ✅");
                closeSendModal();
                currentMessage = null;
            } else {
                await speakText("Erreur lors de l'envoi du message.");
                updateStatus("Erreur envoi ❌");
            }
        } else {
            await speakText("Envoi annulé.");
        }
    } catch (error) {
        console.error('Erreur envoi:', error);
        await speakText("Erreur lors de l'envoi.");
    }
}

// Commande vocale générale
async function startListening() {
    try {
        await speakText("Commande vocale activée. Que voulez-vous faire ?");
        const command = await listenForSpeech();
        
        if (command) {
            await processVoiceCommand(command.toLowerCase());
        }
    } catch (error) {
        console.error('Erreur commande vocale:', error);
        await speakText("Erreur de reconnaissance vocale.");
    }
}

// Traitement des commandes vocales
async function processVoiceCommand(command) {
    if (command.includes('message') || command.includes('écrire')) {
        await creerMessage();
    } else if (command.includes('fichier') || command.includes('document')) {
        await joindreFichier();
    } else if (command.includes('envoyer') || command.includes('envoi')) {
        await envoyerMessage();
    } else if (command.includes('aide') || command.includes('help')) {
        await toggleHelp();
    } else if (command.includes('répéter') || command.includes('relire')) {
        await speakPage();
    } else {
        await speakText("Commande non reconnue. Dites aide pour obtenir de l'aide.");
    }
}

// Gestion de l'aide
async function toggleHelp() {
    const helpZone = document.getElementById('helpZone');
    const isVisible = helpZone.style.display !== 'none';
    
    helpZone.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        await speakText("Zone d'aide affichée.");
    }
}

async function readHelp() {
    const helpText = `
        Comment utiliser SecureVault Accessible:
        1. Cliquez sur Créer un message ou dites "message" pour commencer
        2. Parlez ou choisissez un modèle pour votre message
        3. Joignez des fichiers si nécessaire
        4. Cliquez sur Envoyer pour finaliser
        Vous pouvez utiliser les commandes vocales à tout moment.
    `;
    await speakText(helpText);
}

// Navigation clavier
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case '1':
                creerMessage();
                break;
            case '2':
                joindreFichier();
                break;
            case '3':
                envoyerMessage();
                break;
            case 'h':
            case 'H':
                toggleHelp();
                break;
            case 'Escape':
                closeModal();
                closeSendModal();
                break;
            case ' ':
                if (e.ctrlKey) {
                    e.preventDefault();
                    startListening();
                }
                break;
        }
    });
}

// Fonctionnalités d'accessibilité
function setupAccessibilityFeatures() {
    // Focus visible pour navigation clavier
    const focusableElements = document.querySelectorAll('button, [tabindex], input');
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '3px solid #667eea';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
    
    // Support lecteurs d'écran
    document.querySelectorAll('.big-button').forEach(button => {
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Mise à jour du statut
function updateStatus(message) {
    const statusElement = document.getElementById('statusText');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    speakText("Une erreur s'est produite. Veuillez réessayer.");
});

// Auto-lecture au chargement (optionnel)
window.addEventListener('load', function() {
    setTimeout(() => {
        if (document.querySelector('.header h1')) {
            speakPage();
        }
    }, 2000);
});