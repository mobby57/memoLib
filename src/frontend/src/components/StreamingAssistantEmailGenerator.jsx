import React, { useState, useEffect } from 'react';
import { assistantsAPI, threadsAPI, messagesAPI, runsAPI } from '../services/api';

function StreamingAssistantEmailGenerator() {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [currentThread, setCurrentThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  useEffect(() => {
    loadEmailAssistants();
  }, []);

  const loadEmailAssistants = async () => {
    try {
      const emailAssistants = await assistantsAPI.getByPurpose('email_generation');
      
      if (emailAssistants.length === 0) {
        const defaultAssistant = await assistantsAPI.createEmailAssistant(
          'Assistant Email Streaming',
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
      const thread = await threadsAPI.createEmailThread(null);
      setCurrentThread(thread);
      setMessages([]);
      return thread;
    } catch (error) {
      console.error('Erreur création thread:', error);
    }
  };

  const streamEmailGeneration = async () => {
    if (!prompt.trim() || !selectedAssistant || isStreaming) return;

    setIsStreaming(true);
    setStreamingMessage('');
    
    try {
      let thread = currentThread;
      if (!thread) {
        thread = await createNewThread();
      }

      // Ajouter le message utilisateur
      await messagesAPI.createUserMessage(thread.id, prompt);
      
      // Démarrer le streaming
      await runsAPI.streamEmailGeneration(
        thread.id,
        selectedAssistant.id,
        prompt,
        {
          onProgress: ({ delta, fullText }) => {
            setStreamingMessage(fullText);
          },
          onComplete: ({ message, usage }) => {
            setMessages(prev => [
              ...prev,
              { role: 'user', content: prompt, timestamp: Date.now() },
              { role: 'assistant', content: message.message || fullText, timestamp: Date.now() }
            ]);
            setStreamingMessage('');
            setPrompt('');
            setIsStreaming(false);
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            setIsStreaming(false);
            setStreamingMessage('');
          }
        }
      );
      
    } catch (error) {
      console.error('Erreur génération streaming:', error);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="streaming-assistant-generator">
      <div className="header">
        <h2>⚡ Génération Email Streaming</h2>
        
        <div className="controls">
          <select
            value={selectedAssistant?.id || ''}
            onChange={(e) => {
              const assistant = assistants.find(a => a.id === e.target.value);
              setSelectedAssistant(assistant);
            }}
            disabled={isStreaming}
          >
            {assistants.map(assistant => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name}
              </option>
            ))}
          </select>
          
          <button onClick={createNewThread} disabled={isStreaming}>
            🆕 Nouveau
          </button>
        </div>
      </div>

      <div className="conversation">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-header">
              <span>{message.role === 'user' ? '👤' : '🤖'}</span>
              <button onClick={() => copyMessage(message.content)}>📋</button>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        
        {isStreaming && streamingMessage && (
          <div className="message assistant streaming">
            <div className="message-header">
              <span>🤖</span>
              <span className="streaming-indicator">●</span>
            </div>
            <div className="message-content">
              {streamingMessage}
              <span className="cursor">|</span>
            </div>
          </div>
        )}
      </div>

      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Décrivez l'email à générer..."
          rows={3}
          disabled={isStreaming}
        />
        
        <button
          onClick={streamEmailGeneration}
          disabled={!prompt.trim() || !selectedAssistant || isStreaming}
          className={isStreaming ? 'streaming' : ''}
        >
          {isStreaming ? '⏳ Génération...' : '🚀 Générer'}
        </button>
      </div>

      <div className="quick-actions">
        {[
          'Email de relance client professionnel',
          'Email de remerciement après achat',
          'Email de présentation de services',
          'Email de suivi de réunion'
        ].map((text, index) => (
          <button
            key={index}
            onClick={() => setPrompt(text)}
            disabled={isStreaming}
            className="quick-btn"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StreamingAssistantEmailGenerator;