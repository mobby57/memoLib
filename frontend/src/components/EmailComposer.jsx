import { useState } from 'react'
import axios from 'axios'
import './EmailComposer.css'

function EmailComposer() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  })
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setMessage('')

    try {
      const response = await axios.post('/api/email/send', formData)
      setMessage('✓ Email sent successfully!')
      setFormData({ to: '', subject: '', body: '' })
    } catch (error) {
      setMessage(`✗ Error: ${error.response?.data?.error || error.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="email-composer">
      <form onSubmit={handleSubmit} aria-label="Email composition form">
        <div className="form-group">
          <label htmlFor="to">
            To: <span className="required">*</span>
          </label>
          <input
            type="email"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            required
            aria-required="true"
            placeholder="recipient@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">
            Subject: <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            aria-required="true"
            placeholder="Email subject"
          />
        </div>

        <div className="form-group">
          <label htmlFor="body">
            Message: <span className="required">*</span>
          </label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            required
            aria-required="true"
            rows="6"
            placeholder="Email message"
          />
        </div>

        <button 
          type="submit" 
          disabled={sending}
          aria-busy={sending}
        >
          {sending ? 'Sending...' : 'Send Email'}
        </button>

        {message && (
          <div 
            className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}
            role="alert"
            aria-live="polite"
          >
            {message}
          </div>
        )}
      </form>
    </div>
  )
}

export default EmailComposer
