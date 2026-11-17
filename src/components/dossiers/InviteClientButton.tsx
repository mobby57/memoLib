'use client'
import { useState } from 'react'

export function InviteClientButton({ dossierId }: { dossierId: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleInvite = async () => {
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiresInDays: 7 }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Erreur')
      }
      setStatus('success')
      setMessage('Lien généré ! Regarde la console du serveur pour le lien.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <h3 className="font-semibold text-sm">Inviter un client (Accès 7 jours)</h3>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="email@client.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border rounded-md"
        />
        <button
          onClick={handleInvite}
          disabled={status === 'loading'}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'loading' ? 'Envoi...' : 'Inviter'}
        </button>
      </div>
      {status === 'success' && <p className="text-xs text-green-600">✅ {message}</p>}
      {status === 'error' && <p className="text-xs text-red-600">❌ {message}</p>}
    </div>
  )
}