// ==UserScript==
// @name         IAPosteManager - AI Assistant Pro
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Assistant IA avancé pour IAPosteManager
// @author       You
// @match        https://iapostemanager.onrender.com/*
// @match        http://localhost:5000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let aiContext = [];
    let isListening = false;
    
    function createAIAssistant() {
        const assistant = document.createElement('div');
        assistant.id = 'ai-assistant';
        assistant.style.cssText = `
            position: fixed; bottom: 80px; right: 20px; z-index: 10000;
            width: 350px; height: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: none; flex-direction: column; overflow: hidden;
        `;
        
        assistant.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 15px; color: white; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                🤖 Assistant IA Pro
                <span style="cursor: pointer;" onclick="toggleAIAssistant()">×</span>
            </div>
            
            <div id="ai-chat" style="flex: 1; padding: 15px; overflow-y: auto; color: white; font-size: 14px;">
                <div class="ai-message">👋 Salut! Je suis votre assistant IA. Comment puis-je vous aider avec vos emails?</div>
            </div>
            
            <div style="padding: 15px; background: rgba(255,255,255,0.1);">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" id="ai-input" placeholder="Tapez votre question..." 
                        style="flex: 1; padding: 8px; border: none; border-radius: 5px; background: rgba(255,255,255,0.9);">
                    <button onclick="sendAIMessage()" style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">📤</button>
                    <button onclick="toggleVoiceInput()" id="voice-btn" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">🎤</button>
                </div>
                
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button onclick="quickAIAction('compose')" class="quick-ai-btn">✍️ Rédiger</button>
                    <button onclick="quickAIAction('improve')" class="quick-ai-btn">✨ Améliorer</button>
                    <button onclick="quickAIAction('translate')" class="quick-ai-btn">🌐 Traduire</button>
                    <button onclick="quickAIAction('summarize')" class="quick-ai-btn">📝 Résumer</button>
                </div>
            </div>
        `;
        
        // Ajouter styles pour les boutons rapides
        const style = document.createElement('style');
        style.textContent = `
            .quick-ai-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                margin: 2px;
            }
            .quick-ai-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            .ai-message {
                margin: 10px 0;
                padding: 10px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                line-height: 1.4;
            }
            .user-message {
                background: rgba(255,255,255,0.2);
                text-align: right;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(assistant);
        
        // Event listener pour Enter
        document.getElementById('ai-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAIMessage();
            }
        });
    }
    
    function addAIToggleButton() {
        const button = document.createElement('button');
        button.innerHTML = '🤖';
        button.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; border-radius: 50%;
            width: 60px; height: 60px; cursor: pointer; font-size: 24px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.3s;
        `;
        button.onmouseover = () => button.style.transform = 'scale(1.1)';
        button.onmouseout = () => button.style.transform = 'scale(1)';
        button.onclick = () => toggleAIAssistant();
        document.body.appendChild(button);
    }
    
    window.toggleAIAssistant = function() {
        const assistant = document.getElementById('ai-assistant');
        assistant.style.display = assistant.style.display === 'none' ? 'flex' : 'none';
    };
    
    window.sendAIMessage = async function() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        if (!message) return;
        
        addMessageToChat(message, 'user');
        input.value = '';
        
        // Ajouter le message au contexte
        aiContext.push({ role: 'user', content: message });
        
        // Simuler une réponse IA (remplacer par vraie API)
        const response = await generateAIResponse(message);
        addMessageToChat(response, 'ai');
        
        aiContext.push({ role: 'assistant', content: response });
        
        // Garder seulement les 10 derniers messages
        if (aiContext.length > 20) {
            aiContext = aiContext.slice(-20);
        }
    };
    
    function addMessageToChat(message, sender) {
        const chat = document.getElementById('ai-chat');
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'ai-message user-message' : 'ai-message';
        messageDiv.textContent = message;
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }
    
    async function generateAIResponse(message) {
        // Analyser le contexte de la page
        const pageContext = analyzePageContext();
        
        // Réponses intelligentes basées sur le contexte
        if (message.toLowerCase().includes('rédiger') || message.toLowerCase().includes('écrire')) {
            return await handleComposeRequest(message, pageContext);
        } else if (message.toLowerCase().includes('améliorer') || message.toLowerCase().includes('corriger')) {
            return await handleImproveRequest(message, pageContext);
        } else if (message.toLowerCase().includes('traduire')) {
            return await handleTranslateRequest(message, pageContext);
        } else if (message.toLowerCase().includes('résumer')) {
            return await handleSummarizeRequest(message, pageContext);
        } else {
            return await handleGeneralQuery(message, pageContext);
        }
    }
    
    function analyzePageContext() {
        const context = {
            page: window.location.pathname,
            hasEmailForm: !!document.querySelector('.email-composer, #compose-form'),
            selectedText: window.getSelection().toString(),
            emailCount: document.querySelectorAll('.email-item, .message-item').length,
            currentSubject: document.querySelector('input[name="subject"], #subject')?.value || '',
            currentBody: document.querySelector('textarea[name="body"], #message')?.value || ''
        };
        return context;
    }
    
    async function handleComposeRequest(message, context) {
        if (context.hasEmailForm) {
            const subject = 'Email généré par IA';
            const body = `Bonjour,\n\nJe vous écris concernant ${message.replace(/rédiger|écrire/gi, '').trim()}.\n\nCordialement`;
            
            // Remplir automatiquement le formulaire
            const subjectField = document.querySelector('input[name="subject"], #subject');
            const bodyField = document.querySelector('textarea[name="body"], #message');
            
            if (subjectField) subjectField.value = subject;
            if (bodyField) bodyField.value = body;
            
            return `✅ J'ai rédigé un email pour vous! Vérifiez le formulaire et modifiez si nécessaire.`;
        } else {
            return `Pour rédiger un email, allez d'abord sur la page de composition. Je peux vous aider avec le contenu une fois là-bas.`;
        }
    }
    
    async function handleImproveRequest(message, context) {
        if (context.currentBody) {
            const improved = context.currentBody
                .replace(/salut/gi, 'Bonjour')
                .replace(/\n\n+/g, '\n\n')
                .replace(/([.!?])\s*([a-z])/g, '$1 $2'.toUpperCase());
            
            const bodyField = document.querySelector('textarea[name="body"], #message');
            if (bodyField) bodyField.value = improved;
            
            return `✨ J'ai amélioré votre email! Vérifiez les modifications dans le formulaire.`;
        } else {
            return `Écrivez d'abord votre email, puis je pourrai l'améliorer pour vous.`;
        }
    }
    
    async function handleTranslateRequest(message, context) {
        if (context.selectedText) {
            return `🌐 Traduction de "${context.selectedText}": [Traduction simulée - intégrez une vraie API de traduction]`;
        } else {
            return `Sélectionnez le texte à traduire, puis redemandez-moi.`;
        }
    }
    
    async function handleSummarizeRequest(message, context) {
        if (context.selectedText) {
            const summary = context.selectedText.substring(0, 100) + '...';
            return `📝 Résumé: ${summary}`;
        } else {
            return `Sélectionnez le texte à résumer, puis redemandez-moi.`;
        }
    }
    
    async function handleGeneralQuery(message, context) {
        const responses = [
            `Je peux vous aider avec la rédaction d'emails. Que souhaitez-vous faire?`,
            `Utilisez les boutons rapides pour des actions courantes, ou décrivez ce dont vous avez besoin.`,
            `Je suis là pour améliorer votre productivité email. Comment puis-je vous assister?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    window.quickAIAction = async function(action) {
        const context = analyzePageContext();
        let response = '';
        
        switch (action) {
            case 'compose':
                response = await handleComposeRequest('rédiger un email professionnel', context);
                break;
            case 'improve':
                response = await handleImproveRequest('améliorer', context);
                break;
            case 'translate':
                response = await handleTranslateRequest('traduire', context);
                break;
            case 'summarize':
                response = await handleSummarizeRequest('résumer', context);
                break;
        }
        
        addMessageToChat(response, 'ai');
    };
    
    window.toggleVoiceInput = function() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Reconnaissance vocale non supportée par ce navigateur');
            return;
        }
        
        const voiceBtn = document.getElementById('voice-btn');
        
        if (!isListening) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = () => {
                isListening = true;
                voiceBtn.style.background = '#28a745';
                voiceBtn.innerHTML = '🔴';
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('ai-input').value = transcript;
                sendAIMessage();
            };
            
            recognition.onend = () => {
                isListening = false;
                voiceBtn.style.background = '#dc3545';
                voiceBtn.innerHTML = '🎤';
            };
            
            recognition.start();
        }
    };
    
    // Initialiser l'assistant IA
    setTimeout(() => {
        createAIAssistant();
        addAIToggleButton();
    }, 2000);
    
    console.log('🤖 Assistant IA Pro activé');
})();