import React, { useState, useRef } from 'react';
import { streamingChatAPI } from '../services/api';

function StreamingEmailGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage, setUsage] = useState(null);
  const abortControllerRef = useRef(null);

  const handleStreamGeneration = async () => {
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setGeneratedEmail('');
    setUsage(null);
    
    abortControllerRef.current = new AbortController();

    try {
      await streamingChatAPI.streamEmailGeneration(prompt, {
        temperature: 0.7,
        max_tokens: 1500
      }, {
        onChunk: ({ delta, fullContent }) => {
          setGeneratedEmail(fullContent);
        },
        onComplete: ({ content, completion }) => {
          setGeneratedEmail(content);
          setUsage(completion?.usage);
          setIsStreaming(false);
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          setIsStreaming(false);
        }
      });
    } catch (error) {
      console.error('Generation failed:', error);
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
  };

  return (
    <div className="streaming-email-generator">
      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Décrivez l'email à générer..."
          rows={3}
          disabled={isStreaming}
        />
        <div className="controls">
          {!isStreaming ? (
            <button onClick={handleStreamGeneration} disabled={!prompt.trim()}>
              🚀 Générer Email
            </button>
          ) : (
            <button onClick={handleStop} className="stop-btn">
              ⏹️ Arrêter
            </button>
          )}
        </div>
      </div>

      {generatedEmail && (
        <div className="output-section">
          <div className="output-header">
            <h3>📧 Email Généré {isStreaming && <span className="streaming">●</span>}</h3>
            <button onClick={handleCopy}>📋 Copier</button>
          </div>
          <div className="email-content">
            {generatedEmail}
            {isStreaming && <span className="cursor">|</span>}
          </div>
          {usage && (
            <div className="usage-stats">
              Tokens: {usage.prompt_tokens} + {usage.completion_tokens} = {usage.total_tokens}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StreamingEmailGenerator;