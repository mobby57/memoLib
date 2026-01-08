'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [] });
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const availableEvents = [
    'dossier.created',
    'dossier.updated', 
    'payment.completed',
    'document.uploaded'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    const response = await fetch('/api/webhooks/manage');
    const data = await response.json();
    setWebhooks(data);
  };

  const createWebhook = async () => {
    if (!newWebhook.url) return;

    const response = await fetch('/api/webhooks/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: newWebhook.url,
        events: selectedEvents
      })
    });

    if (response.ok) {
      setNewWebhook({ url: '', events: [] });
      setSelectedEvents([]);
      fetchWebhooks();
    }
  };

  const deleteWebhook = async (id: string) => {
    const response = await fetch(`/api/webhooks/manage?id=${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      fetchWebhooks();
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Webhook Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Webhook URL"
            value={newWebhook.url}
            onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
          />
          
          <div>
            <p className="font-medium mb-2">Select Events:</p>
            <div className="space-y-2">
              {availableEvents.map(event => (
                <label key={event} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                  <span>{event}</span>
                </label>
              ))}
            </div>
          </div>
          
          <Button onClick={createWebhook}>Create Webhook</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p>No webhooks configured</p>
          ) : (
            <div className="space-y-4">
              {webhooks.map(webhook => (
                <div key={webhook.id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{webhook.url}</p>
                      <p className="text-sm text-gray-600">
                        Events: {webhook.events.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Secret: {webhook.secret.substring(0, 8)}...
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
