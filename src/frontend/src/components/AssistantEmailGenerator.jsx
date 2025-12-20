import React, { useState, useEffect } from 'react';
import { assistantsAPI, threadsAPI, messagesAPI, runsAPI } from '../services/api';

function AssistantEmailGenerator() {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [currentThread, setCurrentThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);

  useEffect(() => {
    loadEmailAssistants();
  }, []);

  const loadEmailAssistants = async () => {
    try {
      const emailAssistants = await assistantsAPI.getByPurpose('email_generation');
      
      if (emailAssistants.length === 0) {
        // Créer un assistant par défaut
        const defaultAssistant = await assistantsAPI.createEmailAssistant(
          'Assistant Email IAPosteManager',
          { language: 'fr', tone: 'professional' }
        );
        setAssistants([defaultAssistant]);
        setSelectedAssistant(defaultAssistant);
      } else {
        setAssistants(emailAssistants);
        setSelectedAssistant(emailAssistants[0]);
      }
    } catch (error) {
      console.error('Erreur chargement assistants:', error);
    }
  };

  const createNewThread = async () => {
    try {
      const thread = await threadsAPI.createEmailThread(null, {
        metadata: { session_id: Date.now().toString() }
      });
      setCurrentThread(thread);
      setMessages([]);
      return thread;
    } catch (error) {
      console.error('Erreur création thread:', error);
    }
  };

  const loadMessages = async (threadId) => {
    try {
      const history = await messagesAPI.getConversationHistory(threadId);
      setMessages(history);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const generateEmail = async () => {
    if (!prompt.trim() || !selectedAssistant || isGenerating) return;

    setIsGenerating(true);
    
    try {
      let thread = currentThread;
      if (!thread) {
        thread = await createNewThread();
      }

      // Ajouter le message utilisateur
      await messagesAPI.createUserMessage(thread.id, prompt);
      
      // Créer et exécuter le run
      const run = await runsAPI.createEmailRun(
        thread.id,
        selectedAssistant.id,
        prompt,
        { tone: 'professional', language: 'fr' }
      );
      
      setCurrentRun(run);
      
      // Attendre la complétion
      const completedRun = await runsAPI.waitForCompletion(thread.id, run.id);
      
      if (completedRun.status === 'completed') {
        await loadMessages(thread.id);
        setPrompt('');
      } else if (completedRun.status === 'requires_action') {
        // Gérer les appels d'outils si nécessaire
        const toolCalls = completedRun.required_action?.submit_tool_outputs?.tool_calls || [];
        if (toolCalls.length > 0) {
          await runsAPI.handleToolCalls(thread.id, run.id, toolCalls);
          await runsAPI.waitForCompletion(thread.id, run.id);
          await loadMessages(thread.id);
        }
      }
      
    } catch (error) {
      console.error('Erreur génération email:', error);
    } finally {
      setIsGenerating(false);
      setCurrentRun(null);
    }
  };

  const cancelGeneration = async () => {
    if (currentRun && currentThread) {
      try {
        await runsAPI.cancel(currentThread.id, currentRun.id);
        setIsGenerating(false);
        setCurrentRun(null);
      } catch (error) {
        console.error('Erreur annulation:', error);
      }
    }
  };

  const copyLastEmail = () => {
    const lastAssistantMessage = messages
      .filter(msg => msg.role === 'assistant')
      .pop();
    
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content);
    }
  };

  return (
    <div className="assistant-email-generator">
      <div className="header">
        <h2>🤖 Génération Email avec Assistant IA</h2>
        
        <div className="assistant-selector">
          <label>Assistant:</label>
          <select
            value={selectedAssistant?.id || ''}
            onChange={(e) => {
              const assistant = assistants.find(a => a.id === e.target.value);
              setSelectedAssistant(assistant);
            }}
            disabled={isGenerating}
          >
            {assistants.map(assistant => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name}
              </option>
            ))}
          </select>
        </div>
        
        <button onClick={createNewThread} disabled={isGenerating}>
          🆕 Nouvelle Conversation
        </button>
      </div>

      <div className="conversation">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Commencez une nouvelle conversation avec votre assistant email</p>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-header">
                  <span className="role">
                    {message.role === 'user' ? '👤 Vous' : '🤖 Assistant'}
                  </span>
                  <span className="timestamp">
                    {new Date(message.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="input-section">
        <div className="input-group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez l'email que vous souhaitez générer..."
            rows={3}
            disabled={isGenerating}
          />
          
          <div className="controls">
            {!isGenerating ? (
              <button 
                onClick={generateEmail} 
                disabled={!prompt.trim() || !selectedAssistant}
                className="generate-btn"
              >
                🚀 Générer Email
              </button>
            ) : (
              <button onClick={cancelGeneration} className="cancel-btn">
                ⏹️ Annuler
              </button>
            )}
            
            {messages.some(m => m.role === 'assistant') && (
              <button onClick={copyLastEmail} className="copy-btn">
                📋 Copier Dernier Email
              </button>
            )}
          </div>
        </div>
        
        {isGenerating && (
          <div className="status">
            <span className="loading">⏳ Génération en cours...</span>
            {currentRun && (
              <span className="run-id">Run: {currentRun.id}</span>
            )}
          </div>
        )}
      </div>

      <div className="quick-prompts">
        <h4>Prompts rapides:</h4>
        <div className="prompt-buttons">
          <button
            onClick={() => setPrompt('Rédigez un email de relance pour un client qui n\'a pas répondu à notre proposition')}
            disabled={isGenerating}
          >
            📧 Email de relance
          </button>
          <button
            onClick={() => setPrompt('Créez un email de remerciement pour un nouveau client')}
            disabled={isGenerating}
          >
            🙏 Email de remerciement
          </button>
          <button
            onClick={() => setPrompt('Rédigez un email de présentation de nos services')}
            disabled={isGenerating}
          >
            💼 Présentation services
          </button>
          <button
            onClick={() => setPrompt('Créez un email de suivi après une réunion')}
            disabled={isGenerating}
          >
            📝 Suivi réunion
          </button>
        </div>
      </div>

      {selectedAssistant && (
        <div className="assistant-info">
          <h4>ℹ️ Informations Assistant</h4>
          <div className="info-grid">
            <div><strong>Nom:</strong> {selectedAssistant.name}</div>
            <div><strong>Modèle:</strong> {selectedAssistant.model}</div>
            <div><strong>Outils:</strong> {selectedAssistant.tools?.map(t => t.type).join(', ')}</div>
            <div><strong>Langue:</strong> {selectedAssistant.metadata?.language || 'fr'}</div>
            <div><strong>Ton:</strong> {selectedAssistant.metadata?.tone || 'professional'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssistantEmailGenerator;