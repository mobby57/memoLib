import React from 'react'
import './Header.css'

function Header({ status }) {
  const getStatusColor = () => {
    switch(status) {
      case 'connected': return '#4caf50'
      case 'disconnected': return '#f44336'
      default: return '#ff9800'
    }
  }

  return (
    <header role="banner">
      <h1>
        IAPosteManager
        <span className="version">v2.2</span>
      </h1>
      <div className="status" aria-live="polite">
        <span 
          className="status-indicator" 
          style={{ backgroundColor: getStatusColor() }}
          aria-label={`Backend status: ${status}`}
        />
        <span>Backend: {status}</span>
      </div>
    </header>
  )
}

export default Header
