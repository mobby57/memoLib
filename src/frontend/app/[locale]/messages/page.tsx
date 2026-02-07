'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/dossiers/1/messages');
      const data = await response.json();
      setMessages(data.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!newMessage.trim()) return;

    try {
      await fetch('/api/v1/dossiers/1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-600 mt-1">Communiquez avec vos clients</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col gap-4 h-96">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm text-slate-900">{msg.sender}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <p className="text-sm text-slate-600 mt-1">{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écrivez un message..."
            />
            <Button onClick={handleSend}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
