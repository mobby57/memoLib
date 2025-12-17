import { useState } from 'react'
import axios from 'axios'
import './VoiceInterface.css'

function VoiceInterface() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [message, setMessage] = useState('')

  const startListening = () => {
    setIsListening(true)
    setMessage('🎤 Listening... (Mock mode - integrate with Web Speech API)')
    
    // Mock transcription after 2 seconds
    setTimeout(() => {
      setIsListening(false)
      handleTranscribe('Sample voice input: Please compose an email about the meeting')
    }, 2000)
  }

  const handleTranscribe = async (text) => {
    try {
      const response = await axios.post('/api/voice/transcribe', {
        audio: 'mock-audio-data'
      })
      setTranscript(text || response.data.text)
      setMessage('✓ Voice transcribed successfully!')
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.error || error.message}`)
    }
  }

  return (
    <div className="voice-interface">
      <p className="description">
        Click the button to start voice input (accessibility feature)
      </p>
      
      <button 
        onClick={startListening}
        disabled={isListening}
        className="voice-btn"
        aria-label={isListening ? 'Listening to voice input' : 'Start voice input'}
        aria-busy={isListening}
      >
        {isListening ? '🎤 Listening...' : '🎤 Start Voice Input'}
      </button>

      {transcript && (
        <div className="transcript">
          <h3>Transcript:</h3>
          <p aria-live="polite">{transcript}</p>
        </div>
      )}

      {message && (
        <div 
          className={`message ${message.startsWith('✓') ? 'success' : 'info'}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="info-box" role="note">
        <p>
          <strong>Accessibility Features:</strong>
        </p>
        <ul>
          <li>Voice input for hands-free operation</li>
          <li>Screen reader compatible</li>
          <li>Keyboard navigation support</li>
          <li>High contrast mode support</li>
          <li>WCAG 2.1 Level AA compliant</li>
        </ul>
      </div>
    </div>
  )
}

export default VoiceInterface
