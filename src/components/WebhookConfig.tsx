'use client';

import { useState } from 'react';

export default function WebhookConfig() {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [active, setActive] = useState(false);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-4">Webhook Configuration</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Webhook URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://your-app.com/webhook"
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">Events will POST to this URL</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Secret</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="webhook_secret_key"
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Utilise pour verifier l'authenticite du webhook.
            <a href="/docs/WEBHOOK_SECRET.md" className="text-blue-600 hover:underline">
              Lire notre documentation sur les secrets webhook
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={e => setActive(e.target.checked)}
            id="webhook-active"
          />
          <label htmlFor="webhook-active" className="text-sm">
            Active - We will deliver event details when this hook is triggered
          </label>
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={async () => {
            // Sauvegarder le webhook via API
            try {
              const response = await fetch('/api/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: (document.getElementById('webhook-url') as HTMLInputElement)?.value,
                  events: Array.from(document.querySelectorAll('input[name="events"]:checked')).map(
                    el => (el as HTMLInputElement).value
                  ),
                  active: (document.getElementById('webhook-active') as HTMLInputElement)?.checked,
                }),
              });
              if (response.ok) {
                alert('Webhook sauvegardé avec succès');
              } else {
                alert('Erreur lors de la sauvegarde');
              }
            } catch (error) {
              console.error('Erreur webhook:', error);
              alert('Erreur de connexion');
            }
          }}
        >
          Save Webhook
        </button>
      </div>
    </div>
  );
}
