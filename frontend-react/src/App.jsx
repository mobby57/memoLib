import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Composer from './pages/Composer'
import VoiceAgent from './pages/VoiceAgent'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Accessibility from './pages/Accessibility'
import VoiceTranscription from './pages/VoiceTranscription'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="composer" element={<Composer />} />
          <Route path="agent" element={<VoiceAgent />} />
          <Route path="settings" element={<Settings />} />
          <Route path="accessibility" element={<Accessibility />} />
          <Route path="voice-transcription" element={<VoiceTranscription />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App