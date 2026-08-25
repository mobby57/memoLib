'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Chat interne d'un dossier.
 *
 * Messages stockés en base via le modèle ChannelMessage (channel: INTERNAL),
 * protégé par canAccessDossier. S'appuie sur /api/chat/[dossierId]/messages.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/forms/Button';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  dossierId: string;
  senderId: string | null;
  senderName: string;
  senderRole: string | null;
  content: string;
  createdAt: string;
}

export default function DossierChatPage() {
  const params = useParams();
  const dossierId = params?.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentUserId = (session?.user as any)?.id as string | undefined;

  const fetchMessages = useCallback(async () => {
    if (!dossierId) return;
    try {
      const res = await fetch(`/api/chat/${dossierId}/messages`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error('Erreur chargement des messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les messages',
      });
    } finally {
      setLoading(false);
    }
  }, [dossierId, toast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchMessages();
    }
  }, [status, fetchMessages, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/${dossierId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur envoi du message');
      }
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setInput('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: (error as Error).message,
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 text-center">
            <p className="text-gray-700 font-medium">Dossier introuvable ou accès refusé.</p>
            <Button className="mt-4" onClick={() => router.push('/dossiers')}>
              Retour aux dossiers
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1">
        <div className="mb-4 flex items-center gap-3">
          <Button
            onClick={() => router.push(`/dossiers/${dossierId}`)}
            className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Chat du dossier</h1>
        </div>

        <Card className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[300px] max-h-[60vh]">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 mt-8">
                Aucun message pour l'instant. Démarrez la conversation.
              </p>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {!isMine && (
                      <p className="text-xs font-semibold mb-1 opacity-80">{msg.senderName}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t pt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Écrire un message..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 self-end"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
