import { useState, useEffect } from 'react'
import './App.css'
import EmailComposer from './components/EmailComposer'
import AIAssistant from './components/AIAssistant'
import VoiceInterface from './components/VoiceInterface'
import Header from './components/Header'

function App() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    // Check backend health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('Backend health:', data)
        setStatus('connected')
      })
      .catch(err => {
        console.error('Backend error:', err)
        setStatus('disconnected')
      })
  }, [])

  return (
    <div className="app" role="main">
      <Header status={status} />
      
      <div className="container">
        <section aria-label="Email composition section">
          <h2>Compose Email</h2>
          <EmailComposer />
        </section>
        
        <section aria-label="AI assistant section">
          <h2>AI Assistant</h2>
          <AIAssistant />
        </section>
        
        <section aria-label="Voice interface section">
          <h2>Voice Interface</h2>
          <VoiceInterface />
        </section>
      </div>
      
      <footer role="contentinfo">
        <p>IAPosteManager v2.2.0 - Production Ready</p>
        <p>
          <a href="/api/docs" target="_blank" rel="noopener noreferrer">
            API Documentation
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
