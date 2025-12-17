import { useState } from 'react'
import axios from 'axios'
import './AIAssistant.css'

function AIAssistant() {
  const [prompt, setPrompt] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setMessage('Please enter a prompt')
      return
    }

    setGenerating(true)
    setMessage('')

    try {
      const response = await axios.post('/api/ai/generate', {
        prompt,
        max_tokens: 500,
        temperature: 0.7
      })
      setGeneratedText(response.data.text)
      setMessage('✓ Text generated successfully!')
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.error || error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText)
    setMessage('✓ Copied to clipboard!')
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="ai-assistant">
      <div className="form-group">
        <label htmlFor="ai-prompt">Enter your prompt:</label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Write a professional email about project status update"
          rows="3"
          aria-label="AI prompt input"
        />
      </div>

      <button 
        onClick={handleGenerate}
        disabled={generating}
        aria-busy={generating}
      >
        {generating ? 'Generating...' : 'Generate with AI'}
      </button>

      {generatedText && (
        <div className="generated-content">
          <div className="content-header">
            <h3>Generated Text:</h3>
            <button 
              onClick={copyToClipboard}
              className="copy-btn"
              aria-label="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <div className="generated-text" aria-live="polite">
            {generatedText}
          </div>
        </div>
      )}

      {message && (
        <div 
          className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default AIAssistant
